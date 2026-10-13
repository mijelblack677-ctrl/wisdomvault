#!/usr/bin/env python3
"""
Wisdom Vault - Payment Verification Tool
=========================================
Cross-checks whether a user actually paid by comparing three sources:

  1.  Production DB → users.payment_status + paychangu_transactions rows
  2.  PayChangu → GET /verify-payment/{tx_ref}  (authoritative per transaction)
  3.  PayChangu → GET /transactions?page=N       (authoritative per email/phone)

Usage:
  python3 check_payment.py <email | phone | full name | tx_ref>
  python3 check_payment.py            # interactive search

Exit codes:
  0 = found & checked
  1 = nothing matched / usage error
"""

import sys
import json
import urllib.request
import urllib.error
import psycopg2.extras

from db_config import (
    get_db_connection, Colors, print_success, print_error, print_warning,
    print_info, print_header, display_table,
)

API_BASE = "https://api.paychangu.com"
VERIFY_PATH = "/verify-payment/"
LIST_PATH = "/transactions"
PAID_STATES = {"success", "successful", "completed", "paid"}
FAILED_STATES = {"failed", "cancelled", "expired", "reversed", "refunded", "abandoned"}


# ── PAYCHANGU SECRET (from .env, never printed) ─────────────────────────────

def get_secret_key():
    """Read PAYCHANGU_SECRET_KEY from .env or environment."""
    import os
    val = os.environ.get("PAYCHANGU_SECRET_KEY")
    if val:
        return val.strip()
    try:
        with open(".env") as f:
            for line in f:
                line = line.strip()
                if line.startswith("PAYCHANGU_SECRET_KEY="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return None


def pc_request(path):
    """GET a PayChangu endpoint. Returns (http_status, json_dict)."""
    secret = get_secret_key()
    if not secret:
        print_error("PAYCHANGU_SECRET_KEY not found in .env or environment")
        sys.exit(1)
    url = f"{API_BASE}{path}"
    req = urllib.request.Request(url, headers={
        "Accept": "application/json",
        "Authorization": f"Bearer {secret}",
    })
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"raw": body[:500]}
    except Exception as e:
        return None, {"error": str(e)}


def pc_verify(tx_ref):
    """Verify a single transaction ref against PayChangu."""
    status, data = pc_request(f"{VERIFY_PATH}{tx_ref}")
    return status, data


def pc_search_transactions(email, phone=None, max_pages=30):
    """
    Scan PayChangu's /transactions list for records matching an email
    (and optionally phone). Returns a list of matching transaction dicts.
    """
    matches = []
    page = 1
    while page <= max_pages:
        status, data = pc_request(f"{LIST_PATH}?page={page}")
        if status != 200 or not data.get("success"):
            # Stop scanning if the API errors; some pages may just be empty
            print_warning(f"PayChangu /transactions page {page} returned HTTP {status}")
            if status != 200:
                break
        meta = data.get("data") or {}
        items = meta.get("data") or []
        if not items:
            break
        for t in items:
            rec_email = (t.get("email") or "").strip().lower()
            rec_phone = _norm_phone(t.get("mobile") or (t.get("customer") or {}).get("phone") or "")
            if rec_email and email and rec_email == email.lower():
                matches.append(t)
            elif phone and rec_phone and rec_phone == _norm_phone(phone):
                matches.append(t)
        last = meta.get("last_page")
        if page >= (last or page):
            break
        page += 1
    return matches


def _norm_phone(p):
    digits = "".join(ch for ch in str(p) if ch.isdigit())
    if digits.startswith("265"):
        digits = digits[3:]
    if digits.startswith("0"):
        digits = digits[1:]
    return digits


def paychangu_verdict(tx):
    """Best-effort human verdict for a PayChangu list transaction."""
    st = (tx.get("status") or "").lower()
    if st in PAID_STATES and tx.get("completed_at"):
        return "PAID", st
    if st in PAID_STATES:
        return "PAID (unconfirmed settlement)", st
    if st in FAILED_STATES:
        return "NOT PAID", st
    if st in {"pending", "processing"}:
        return "UNKNOWN / STILL PENDING", st
    return "UNKNOWN", st


def show_paychangu_record(tx):
    auth = tx.get("authorization") or {}
    return {
        "status": tx.get("status"),
        "amount": tx.get("amount"),
        "currency": tx.get("currency"),
        "created": (tx.get("created_at") or "")[:19],
        "completed": (tx.get("completed_at") or "")[:19],
        "email": tx.get("email"),
        "mobile": tx.get("mobile"),
        "provider": auth.get("provider") or (tx.get("mobile_money") or {}).get("name"),
        "trans_id": tx.get("trans_id"),
    }


# ── DB HELPERS ──────────────────────────────────────────────────────────────

def find_user(identifier):
    """Find users by exact email/phone/tx_ref or partial name/email match."""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        identifier = identifier.strip().lower()

        # 1) tx_ref search — find the owning user via paychangu_transactions
        cur.execute("""
            SELECT u.id, u.full_name, u.email, u.phone, u.payment_status,
                   u.created_at, u.referred_by, u.is_active
            FROM users u
            JOIN paychangu_transactions pt ON pt.user_id = u.id
            WHERE LOWER(pt.tx_ref) = %s
        """, (identifier,))
        rows = cur.fetchall()
        if rows:
            return rows

        # 2) exact email / phone
        cur.execute("""
            SELECT u.id, u.full_name, u.email, u.phone, u.payment_status,
                   u.created_at, u.referred_by, u.is_active
            FROM users u
            WHERE LOWER(u.email) = %s OR _norm = %s
        """.replace("_norm", "u.phone"), (identifier, identifier))
        rows = cur.fetchall()
        if rows:
            return rows

        # 3) partial name / email
        cur.execute("""
            SELECT u.id, u.full_name, u.email, u.phone, u.payment_status,
                   u.created_at, u.referred_by, u.is_active
            FROM users u
            WHERE u.full_name ILIKE %s OR u.email ILIKE %s
            ORDER BY u.created_at
            LIMIT 20
        """, (f"%{identifier}%", f"%{identifier}%"))
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()


def get_transactions(user_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        cur.execute("""
            SELECT id, tx_ref, amount, currency, status,
                   payment_channel, payment_reference,
                   verified_at, created_at
            FROM paychangu_transactions
            WHERE user_id = %s
            ORDER BY created_at ASC
        """, (user_id,))
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()


def get_wallet(user_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        cur.execute("""
            SELECT balance_available, store_credit, gross_earnings
            FROM wallets WHERE user_id = %s
        """, (user_id,))
        return cur.fetchone()
    finally:
        cur.close()
        conn.close()


# ── REPORTING ───────────────────────────────────────────────────────────────

def report_user(user, wallet):
    print_header("USER", f"{user['email']}")
    tbl = [
        ["Name", user["full_name"] or "—"],
        ["Email", user["email"]],
        ["Phone", user["phone"] or "—"],
        ["Status", user["payment_status"]],
        ["Created", str(user["created_at"])[:19]],
        ["Wallet balance", wallet["balance_available"] if wallet else "no wallet"],
    ]
    display_table(tbl, ["Field", "Value"])
    if user["payment_status"] == "verified":
        print_success("Account is VERIFIED in the DB")
    else:
        print_warning("Account is NOT verified in the DB")


def report_db_tx(tx, pc_verify_meta):
    """One row per DB transaction, plus what PayChangu verify-payment said."""
    print(f"\n  • DB transaction  {Colors.CYAN}{tx['tx_ref']}{Colors.END}")
    print(f"      DB status: {tx['status']:<10} amount: {tx['amount']} {tx['currency']}"
          f"   created: {str(tx['created_at'])[:19]}")
    if tx["verified_at"]:
        print(f"      DB verified_at: {str(tx['verified_at'])[:19]}  channel: {tx['payment_channel'] or '—'}")
    v_status, v_data = pc_verify_meta
    if v_status == 200:
        inner = (v_data.get("data") or {})
        pc_state = inner.get("status") or v_data.get("status") or "?"
        print(f"      PayChangu verify-payment: HTTP 200 → status='{pc_state}'")
        if inner:
            shown = {k: inner[k] for k in ("amount", "currency", "status", "tx_ref", "mode")
                     if k in inner}
            print(f"      PayChangu data: {json.dumps(shown)}")
    else:
        msg = v_data.get("message") or v_data.get("error") or ""
        pc_state = v_data.get("status")
        extra = f" (data.status='{pc_state}')" if pc_state and isinstance(v_data, dict) else ""
        print(f"      PayChangu verify-payment: HTTP {v_status} → {msg}{extra}")


# ── MAIN ────────────────────────────────────────────────────────────────────

def main():
    identifier = " ".join(sys.argv[1:]).strip()
    if not identifier:
        identifier = input(f"{Colors.BOLD}Search email/phone/name/tx_ref: {Colors.END}").strip()
    if not identifier:
        print_error("Nothing to search for.")
        sys.exit(1)

    users = find_user(identifier)
    if not users:
        print_error(f"No user or tx_ref matched: {identifier}")
        sys.exit(1)

    if len(users) > 1:
        print_warning(f"Multiple users matched ({len(users)}). Showing all.")
        for u in users:
            print(f"  {u['id']}  {u['full_name']}  {u['email']}  {u['phone']}  {u['payment_status']}")

    for user in users:
        print()
        wallet = get_wallet(user["id"])
        report_user(user, wallet)

        txns = get_transactions(user["id"])

        # Cross-check against PayChangu transaction list by email + phone
        pc_records = pc_search_transactions(user["email"], user["phone"])

        if txns:
            print_header("DATABASE TRANSACTIONS (paychangu_transactions)")
            for tx in txns:
                report_db_tx(tx, pc_verify(tx["tx_ref"]))
        else:
            print_info("No paychangu_transactions rows in the DB for this user.")

        if pc_records:
            print_header("PAYCHANGU TRANSACTION LEDGER (email/phone match)")
            for r in pc_records:
                verdict, raw_state = paychangu_verdict(r)
                rec = show_paychangu_record(r)
                mark = "✅" if raw_state in PAID_STATES else ("❌" if raw_state in FAILED_STATES else "⏳")
                print(f"\n  {mark} PayChangu ledger entry")
                for k, v in rec.items():
                    if v not in (None, "", "None"):
                        print(f"      {k:<11}: {v}")
        else:
            print_info("No matching records found in PayChangu's /transactions ledger "
                       f"for {user['email']}.")

        # ── Final verdict ────────────────────────────────────────────────
        print_header("VERDICT")
        pc_paid = any(
            ((r.get("status") or "").lower() in PAID_STATES) and r.get("completed_at")
            for r in pc_records
        )
        pc_pending = any(((r.get("status") or "").lower() in {"pending", "processing"}) for r in pc_records)
        db_paid = user["payment_status"] == "verified"
        db_success_rows = any(t["status"] == "success" for t in txns)

        if pc_paid and db_paid:
            print_success("PAID ✓ — PayChangu confirms a settled transaction AND the account is verified.")
        elif pc_paid and not db_paid:
            print_warning("⚠️  PAID AT PAYCHANGU BUT NOT VERIFIED IN DB — "
                          "the user paid; the account needs verification.")
        elif db_paid and not pc_paid:
            print_warning("⚠️  VERIFIED IN DB BUT NO SETTLED PAYCHANGU RECORD FOUND — "
                          "verify manually before trusting this.")
        elif pc_pending:
            print_info("⏳ Not confirmed — PayChangu shows only pending/failed transactions.")
            print_info("   The user has NOT completed a successful payment.")
        else:
            print_info("❌ NOT PAID — no settled PayChangu transaction found for this user.")
            print_info("   Do NOT verify the account.")

        if not db_paid and db_success_rows:
            # odd state: DB has success row but user not verified
            print_warning("Note: DB has a 'success' transaction row but the user is not verified.")

        if not txns and not pc_records:
            print_info("No payment activity at all for this user.")

        # ── DB ↔ PayChangu reconciliation hints ─────────────────────────
        hints = []
        led_failed = [r for r in pc_records if ((r.get("status") or "").lower() in FAILED_STATES)]
        led_success = [r for r in pc_records if ((r.get("status") or "").lower() in PAID_STATES)]
        for tx in txns:
            db_st = (tx["status"] or "").lower()
            created = tx["created_at"]
            if db_st in {"pending", "processing"}:
                if led_failed:
                    hints.append(
                        f"DB row {tx['tx_ref'][:28]}… is '{tx['status']}' but PayChangu's ledger for "
                        f"{user['email']} shows only FAILED transactions — this row can likely be "
                        f"marked 'failed' (no money arrived)."
                    )
                elif led_success:
                    hints.append(
                        f"DB row {tx['tx_ref'][:28]}… is '{tx['status']}' while PayChangu shows a settled "
                        f"payment — the user DID pay; account needs verification."
                    )
            if db_st == "success" and not led_success:
                hints.append(
                    f"DB row {tx['tx_ref'][:28]}… is 'success' but no settled PayChangu ledger entry "
                    f"exists for {user['email']} — confirm before trusting."
                )
            if db_st in {"failed", "expired", "cancelled"} and led_success:
                hints.append(
                    f"DB row {tx['tx_ref'][:28]}… is '{tx['status']}' but PayChangu shows a settled "
                    f"payment — the user likely paid; investigate and verify the account."
                )
        for h in dict.fromkeys(hints):
            print_warning(h)


if __name__ == "__main__":
    main()
