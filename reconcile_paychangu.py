#!/usr/bin/env python3
"""
Wisdom Vault - PayChangu Activation & Commission Fix Tool
===========================================================
Reconciles the database against reality and repairs what is broken:

  1) ACTIVATE  - Find users who PAID via PayChangu but are still NOT activated
                  (payment_status != 'verified'). Cross-check each payment
                  server-side with PayChangu /verify-payment/{tx_ref} (the
                  authoritative source) and activate whoever genuinely paid.

  2) COMMISSIONS - Fix referral commissions that were never paid. If a user
                  invited someone (or a verified user has an unpaid bonus row)
                  the parent never earned, this tool:
                     • pays every unpaid referral row whose referred member is
                       verified,
                     • re-asserts the parent->client link (users.referred_by)
                       where a referral row proves it but the field went null,
                     • creates missing first/second-level rows for verified
                       members and pays them,
                     • records transactions, referral_earnings and a
                       notification - exactly like the live autoVerifyUser flow
                       (full bonus, fee_deducted = 0).

  3) ASSIGN   - Manual option: tell the tool "USER was invited by PARENT".
                  It asserts the child as the parent's client and pays the
                  parent the commission (first + second level) when the child
                  is verified. Use this when the invitation was never recorded
                  anywhere, so only you know who invited whom.

Usage:
  python3 reconcile_paychangu.py                  interactive menu
  python3 reconcile_paychangu.py activate [id]    check & activate unpaid-but-verified users
  python3 reconcile_paychangu.py commissions [id] pay owed referral commissions
  python3 reconcile_paychangu.py assign PARENT CHILD
  python3 reconcile_paychangu.py all

Options:
  --yes          apply without asking for confirmation (cron safe)
  --ledger       also scan PayChangu's /transactions ledger for unverified users
                 who have no DB payment row at all (slower)
  --limit N      process at most N users (activate mode)

Payout rule (matches production autoVerifyUser): a referral bonus is owed once
the referred member's account is 'verified' (paid). Unverified clients keep
their rows pending - they are not mistakes.

Exit codes: 0 = done, 1 = nothing to do / error
"""

import sys
import os
import json
import time
import argparse
import datetime
import urllib.request
import urllib.error
import psycopg2
import psycopg2.extras

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db_config import (
    get_db_connection, Colors, print_success, print_error, print_warning,
    print_info, print_header, display_table, input_prompt, input_confirm,
)

# ── PayChangu API ──────────────────────────────────────────────────────────
API_BASE = "https://api.paychangu.com"
VERIFY_PATH = "/verify-payment/"
LIST_PATH = "/transactions"
PAID_STATES = {"success", "successful", "completed", "paid"}
PENDING_STATES = {"pending", "processing"}


def get_secret_key():
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
    secret = get_secret_key()
    if not secret:
        print_error("PAYCHANGU_SECRET_KEY not found in .env or environment")
        sys.exit(1)
    req = urllib.request.Request(
        f"{API_BASE}{path}",
        headers={"Accept": "application/json", "Authorization": f"Bearer {secret}"},
    )
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


def pc_verify_payment(tx_ref):
    """Ask PayChangu for the authoritative state of one payment."""
    status, data = pc_request(f"{VERIFY_PATH}{tx_ref}")
    top = (data or {}).get("status", "") if isinstance(data, dict) else ""
    inner = (data or {}).get("data") or {}
    inner_state = inner.get("status", "") if isinstance(inner, dict) else ""
    top_ok = str(top).lower() in {"success", "successful"}
    paid = top_ok and str(inner_state).lower() in PAID_STATES
    still_pending = top_ok and not paid and str(inner_state).lower() in PENDING_STATES
    return {
        "http": status,
        "data": data,
        "paid": paid,
        "pending": still_pending,
        "failed": str(top).lower() in {"failed", "cancelled"}
                  or str(inner_state).lower() in {"failed", "cancelled", "expired"},
    }


def pc_search_transactions(email=None, phone=None, max_pages=30):
    """Scan PayChangu /transactions ledger for settled payments by email/phone."""
    matches = []
    page = 1
    while page <= max_pages:
        status, data = pc_request(f"{LIST_PATH}?page={page}")
        if status != 200:
            break
        meta = (data or {}).get("data") or {}
        items = meta.get("data") or []
        if not items:
            break
        for t in items:
            rec_email = str(t.get("email") or "").strip().lower()
            rec_phone = _norm_phone(t.get("mobile") or (t.get("customer") or {}).get("phone") or "")
            if email and rec_email == email.lower():
                matches.append(t)
            elif phone and rec_phone == _norm_phone(phone):
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


def _ledger_paid(tx):
    st = str(tx.get("status") or "").lower()
    return st in PAID_STATES


# ── Shared DB helpers ──────────────────────────────────────────────────────

_columns_cache = {}


def _column_exists(cursor, table, column):
    key = (table, column)
    if key not in _columns_cache:
        cursor.execute(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_schema = 'public' AND table_name = %s AND column_name = %s",
            (table, column),
        )
        _columns_cache[key] = cursor.fetchone() is not None
    return _columns_cache[key]


def _table_exists(cursor, table):
    cursor.execute(
        "SELECT 1 FROM information_schema.tables "
        "WHERE table_schema = 'public' AND table_name = %s",
        (table,),
    )
    return cursor.fetchone() is not None


def load_bonus_config(conn):
    """Read referral bonus amounts from platform_config (production source of truth)."""
    cfg = {"standard": 7000.0, "founding": 7000.0, "second_level": 1000.0, "renewal": 0.0}
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        cur.execute("SELECT config_key, config_value FROM platform_config")
        for row in cur.fetchall():
            key = row["config_key"]
            try:
                val = float(row["config_value"])
            except (TypeError, ValueError):
                continue
            if key == "referral_bonus_standard":
                cfg["standard"] = val
            elif key == "referral_bonus_founding":
                cfg["founding"] = val
            elif key == "referral_bonus_second_level":
                cfg["second_level"] = val
            elif key == "referral_bonus_renewal":
                cfg["renewal"] = val
    finally:
        cur.close()
    return cfg


def first_level_bonus_for(conn, referrer_id):
    """Standard vs founding bonus for a referrer - mirrors register.ts / create.ts."""
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        cur.execute("SELECT is_founding_member FROM users WHERE id = %s", (referrer_id,))
        row = cur.fetchone()
        founding = bool(row and row["is_founding_member"])
    finally:
        cur.close()
    cfg = load_bonus_config(conn)
    return cfg["founding"] if founding else cfg["standard"]


USER_COLS = ("id, full_name, email, phone, payment_status, is_active, "
             "referred_by, registration_year, referral_code, is_founding_member")


def find_users(conn, identifier):
    """Find users by uuid / referral code / email / phone / name / tx_ref."""
    ident = (identifier or "").strip()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        if not ident:
            return []
        ident_l = ident.lower()

        # Exact UUID match (users.id)
        if len(ident) >= 32:
            cur.execute(f"SELECT {USER_COLS} FROM users WHERE id = %s", (ident,))
            rows = cur.fetchall()
            if rows:
                return rows

        # Exact referral code match (e.g. AB12CD34)
        cur.execute(f"SELECT {USER_COLS} FROM users WHERE LOWER(referral_code) = %s", (ident_l,))
        rows = cur.fetchall()
        if rows:
            return rows

        # tx_ref match - find the owning user via paychangu_transactions
        cur.execute(f"""
            SELECT u.{USER_COLS}
            FROM users u
            JOIN paychangu_transactions pt ON pt.user_id = u.id
            WHERE LOWER(pt.tx_ref) = %s
        """, (ident_l,))
        rows = cur.fetchall()
        if rows:
            return rows

        # Exact email / phone
        cur.execute(f"""
            SELECT {USER_COLS}
            FROM users
            WHERE LOWER(email) = %s OR LOWER(phone) = %s
            ORDER BY created_at
        """, (ident_l, ident_l))
        rows = cur.fetchall()
        if rows:
            return rows

        # Partial name / email
        cur.execute(f"""
            SELECT {USER_COLS}
            FROM users
            WHERE full_name ILIKE %s OR email ILIKE %s
            ORDER BY created_at
            LIMIT 20
        """, (f"%{ident}%", f"%{ident}%"))
        return cur.fetchall()
    finally:
        cur.close()


def _registration_year(conn, uid):
    """The referral year used for a member's rows (registration year, current as fallback)."""
    cur = conn.cursor()
    try:
        cur.execute("SELECT registration_year FROM users WHERE id = %s", (uid,))
        row = cur.fetchone()
        if row and row[0]:
            return int(row[0])
    finally:
        cur.close()
    return datetime.now().year


def _find_one(conn, identifier, purpose):
    """Resolve an identifier to a single user dict or exit."""
    users = find_users(conn, identifier)
    if not users:
        print_error(f"No user matched: {identifier}")
        sys.exit(1)
    if len(users) > 1:
        print_warning(f"{len(users)} users matched; choose one:")
        display_table(
            [[str(u["id"]), u["full_name"], u["email"], u["phone"], u["payment_status"]]
             for u in users],
            ["id", "name", "email", "phone", "status"],
        )
        uid = input_prompt("User id", str(users[0]["id"]))
        for u in users:
            if str(u["id"]) == uid:
                return u
        print_error("Invalid user id")
        sys.exit(1)
    return users[0]


def get_wallet_row(cur, user_id):
    cur.execute(
        "SELECT id, balance_available, gross_earnings, gross_earnings_total "
        "FROM wallets WHERE user_id = %s",
        (user_id,),
    )
    return cur.fetchone()


def ensure_wallet(cur, user_id):
    """Wallet is normally auto-created by a trigger; guard against it missing."""
    wallet = get_wallet_row(cur, user_id)
    if wallet:
        return wallet
    cur.execute(
        "INSERT INTO wallets (user_id, balance_available, gross_earnings, "
        "gross_earnings_total, total_withdrawn, fees_paid, store_credit) "
        "VALUES (%s, 0, 0, 0, 0, 0, 0) ON CONFLICT (user_id) DO NOTHING",
        (user_id,),
    )
    return get_wallet_row(cur, user_id)


def insert_transaction(cur, wallet_id, referral_id, tx_type, amount,
                       balance_before, balance_after, description):
    """Record a wallet transaction (matches autoVerifyUser, minus net_amount if missing)."""
    has_net = _column_exists(cur, "transactions", "net_amount")
    has_fee = _column_exists(cur, "transactions", "fee_deducted")
    if has_net and has_fee:
        cur.execute(
            "INSERT INTO transactions (wallet_id, referral_id, transaction_type, "
            "amount, fee_deducted, net_amount, balance_before, balance_after, description) "
            "VALUES (%s, %s, %s, %s, 0, %s, %s, %s, %s)",
            (wallet_id, referral_id, tx_type, amount, amount, balance_before, balance_after, description),
        )
    elif has_fee:
        cur.execute(
            "INSERT INTO transactions (wallet_id, referral_id, transaction_type, "
            "amount, fee_deducted, balance_before, balance_after, description) "
            "VALUES (%s, %s, %s, %s, 0, %s, %s, %s)",
            (wallet_id, referral_id, tx_type, amount, balance_before, balance_after, description),
        )
    else:
        cur.execute(
            "INSERT INTO transactions (wallet_id, referral_id, transaction_type, "
            "amount, balance_before, balance_after, description) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (wallet_id, referral_id, tx_type, amount, balance_before, balance_after, description),
        )


def insert_referral_earnings(cur, referrer_id, referral_id, amount):
    if not _table_exists(cur, "referral_earnings"):
        return
    cur.execute(
        "INSERT INTO referral_earnings (user_id, referral_id, gross_amount, "
        "fee_deducted, net_amount, chunk_count_before, chunk_count_after) "
        "VALUES (%s, %s, %s, 0, %s, 0, 0)",
        (referrer_id, referral_id, amount, amount),
    )


# ── Referral row helpers ───────────────────────────────────────────────────

def fetch_referral_row(cur, referrer_id, referred_id, ref_type, reg_year):
    cur.execute(
        "SELECT id, bonus_amount, is_paid, referral_type "
        "FROM referrals WHERE referrer_id = %s AND referred_id = %s "
        "AND referral_type = %s AND registration_year = %s LIMIT 1",
        (referrer_id, referred_id, ref_type, reg_year),
    )
    return cur.fetchone()


def create_referral_row(conn, cur, referrer_id, referred_id, ref_type, bonus_amount, reg_year):
    """Create a referral row if absent (unique per referrer/referred/type/year)."""
    existing = fetch_referral_row(cur, referrer_id, referred_id, ref_type, reg_year)
    if existing:
        return existing, False
    cur.execute(
        "INSERT INTO referrals (referrer_id, referred_id, referral_type, bonus_amount, "
        "fee_deducted, net_amount, registration_year, is_paid, created_at) "
        "VALUES (%s, %s, %s, %s, 0, %s, %s, false, NOW())",
        (referrer_id, referred_id, ref_type, bonus_amount, bonus_amount, reg_year),
    )
    conn.commit()
    row = fetch_referral_row(cur, referrer_id, referred_id, ref_type, reg_year)
    return row, True


def credit_referral_bonus(conn, cur, row):
    """
    Pay one referral row to its referrer (idempotent guard: skip already-paid).
    Mirrors production autoVerifyUser: full bonus, fee_deducted = 0.
    Referrer must exist and have a wallet; a fresh wallet is created if missing.
    """
    if row["is_paid"]:
        return False, "already paid"
    if str(row["referrer_id"]) == str(row["referred_id"]):
        return False, "self-referral"

    referrer_id = row["referrer_id"]
    referral_id = row["id"]
    bonus = float(row["bonus_amount"] or 0)
    ref_type = row["referral_type"]
    is_first = ref_type == "first_level"
    tx_type = "referral_bonus" if is_first else "second_level_referral"

    wallet = ensure_wallet(cur, referrer_id)
    if not wallet:
        return False, "could not create wallet"

    cur.execute(
        "SELECT id, full_name FROM users WHERE id = %s", (referrer_id,)
    )
    referrer_row = cur.fetchone()
    if not referrer_row:
        return False, "referrer user missing"

    # Lock the row: if it got paid between the outer read and now, skip.
    cur.execute("SELECT is_paid FROM referrals WHERE id = %s FOR UPDATE", (referral_id,))
    locked = cur.fetchone()
    if locked and locked["is_paid"]:
        return False, "already paid (race)"

    balance_before = float(wallet["balance_available"] or 0)
    gross_before = float(wallet["gross_earnings"] or 0)
    gross_total_before = float(wallet["gross_earnings_total"] or 0)
    balance_after = balance_before + bonus

    cur.execute(
        "UPDATE wallets SET balance_available = %s, gross_earnings = %s, "
        "gross_earnings_total = %s, updated_at = NOW() WHERE id = %s",
        (balance_after, gross_before + bonus, gross_total_before + bonus, wallet["id"]),
    )

    if _column_exists(cur, "users", "total_gross_earnings"):
        cur.execute(
            "UPDATE users SET total_gross_earnings = COALESCE(total_gross_earnings, 0) + %s, "
            "total_net_earnings = COALESCE(total_net_earnings, 0) + %s WHERE id = %s",
            (bonus, bonus, referrer_id),
        )

    cur.execute(
        "UPDATE referrals SET is_paid = true, fee_deducted = 0, net_amount = %s "
        "WHERE id = %s",
        (bonus, referral_id),
    )

    insert_transaction(
        cur, wallet["id"], referral_id, tx_type, bonus, balance_before, balance_after,
        ("First-level referral bonus - MWK %s" % format(int(bonus), ","))
        if is_first
        else ("Second-level referral bonus - MWK %s" % format(int(bonus), ",")),
    )
    insert_referral_earnings(cur, referrer_id, referral_id, bonus)

    if is_first:
        cur.execute(
            "INSERT INTO notifications (user_id, type, title, message, link) "
            "VALUES (%s, %s, %s, %s, %s)",
            (referrer_id, "referral_approved", "🎉 Referral Bonus Earned!",
             f"🎉 Referral bonus! MWK {bonus:,.0f} credited to your wallet.",
             "/dashboard/invites"),
        )
    else:
        cur.execute(
            "INSERT INTO notifications (user_id, type, title, message, link) "
            "VALUES (%s, %s, %s, %s, %s)",
            (referrer_id, "second_level_referral_approved", "🌟 Network Bonus Earned!",
             f"🌟 Network bonus! MWK {bonus:,.0f} credited to your wallet.",
             "/dashboard/invites"),
        )

    conn.commit()
    return True, f"paid MWK {bonus:,.0f} to {referrer_row['full_name']}"


# ── Feature 2: fix commissions ─────────────────────────────────────────────

def fix_user_commissions(conn, user, opts):
    """
    Repair one user's referral tree:
      • assert referred_by where a referral row proves the parent,
      • create missing first/second-level rows so the tree matches referred_by,
      • pay every row that is due (the referred member is 'verified' and the
        bonus was never credited). Rows for still-unverified clients stay
        pending - they are paid automatically when the client activates.
    """
    fixed = []
    skipped = []
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        uid = user["id"]
        reg_year = _registration_year(conn, uid)

        verified = user.get("payment_status") == "verified"

        # 1) Unpaid rows where this member was the referred (the core "no commission" case)
        cur.execute(
            "SELECT r.id, r.referrer_id, r.bonus_amount, r.referral_type, r.is_paid "
            "FROM referrals r WHERE r.referred_id = %s AND r.is_paid = false "
            "ORDER BY r.referral_type, r.created_at",
            (uid,),
        )
        unpaid = cur.fetchall()

        # Assert the parent link from evidence if it went missing (row proves it)
        if not user.get("referred_by"):
            first_parent = next((r["referrer_id"] for r in unpaid if r["referral_type"] == "first_level"), None)
            if first_parent:
                cur.execute("UPDATE users SET referred_by = %s, updated_at = NOW() WHERE id = %s",
                            (first_parent, uid))
                conn.commit()
                fixed.append(f"asserted referred_by = {first_parent} for {user['full_name']} (from referral row)")
                user["referred_by"] = first_parent

        for row in unpaid:
            if verified:
                try:
                    ok, msg = credit_referral_bonus(conn, cur, row)
                    fixed.append(f"{row['referral_type']}: {msg}" if ok else f"{row['referral_type']}: skipped ({msg})")
                    if not ok:
                        skipped.append(msg)
                except Exception as e:
                    conn.rollback()
                    skipped.append(f"{row['referral_type']} row {row['id']}: error {e}")
            else:
                skipped.append(f"unpaid {row['referral_type']} kept pending (client not verified yet)")

        # 2) Make sure the tree matches referred_by: create missing first/second
        #    level rows. Payment only happens when this member is verified.
        parent_id = user.get("referred_by")
        if parent_id:
            try:
                row, created = create_referral_row(
                    conn, cur, parent_id, uid, "first_level",
                    first_level_bonus_for(conn, parent_id), reg_year,
                )
                if created:
                    fixed.append("created missing first_level row for parent")
                if verified and not row["is_paid"]:
                    ok, msg = credit_referral_bonus(conn, cur, row)
                    fixed.append(f"first_level: {msg}" if ok else f"first_level: skipped ({msg})")
            except Exception as e:
                conn.rollback()
                skipped.append(f"first_level tree fix: {e}")

            # Second level: the grandparent of this user is in the tree when the
            # parent was itself referred by someone.
            try:
                cur.execute("SELECT referred_by FROM users WHERE id = %s", (parent_id,))
                parent_row = cur.fetchone()
                if parent_row and parent_row["referred_by"]:
                    gp_id = parent_row["referred_by"]
                    cfg = load_bonus_config(conn)
                    row2, created2 = create_referral_row(
                        conn, cur, gp_id, uid, "second_level", cfg["second_level"], reg_year,
                    )
                    if created2:
                        fixed.append("created missing second_level row for grandparent")
                    if verified and not row2["is_paid"]:
                        ok, msg = credit_referral_bonus(conn, cur, row2)
                        fixed.append(f"second_level: {msg}" if ok else f"second_level: skipped ({msg})")
            except Exception as e:
                conn.rollback()
                skipped.append(f"second_level tree fix: {e}")

        return fixed, skipped
    finally:
        cur.close()


def run_commissions_fix(opts):
    """Feature 2 entry point - scan all users (or one) and repair commissions."""
    print_header("💼 COMMISSION FIX", "Verified clients whose parents never earned their bonus")
    conn = get_db_connection()
    try:
        scope = None
        if opts.user_id:
            scope = _find_one(conn, opts.user_id, "commission fix")
            print_info(f"Scoped to user: {scope['full_name']} ({scope['email']})")
            users = [scope]
        else:
            cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
            cur.execute("""
                SELECT id, full_name, email, phone, payment_status, is_active,
                       referred_by, registration_year, referral_code, is_founding_member
                FROM users WHERE payment_status = 'verified'
                ORDER BY created_at
            """)
            users = cur.fetchall()
            cur.close()
            print_info(f"Scanning {len(users)} verified users for unpaid/missing commissions...")

        all_fixed = []
        all_skipped = []

        if not opts.yes:
            print()
            if not input_confirm("This will PAY referral bonuses to parents and edit referral links. Continue?"):
                print_info("Aborted - nothing changed.")
                sys.exit(0)

        for u in users:
            try:
                fixed, skipped = fix_user_commissions(conn, u, opts)
            except Exception as e:
                conn.rollback()
                print_error(f"  [{u['full_name']}] failed: {e}")
                continue
            for f in fixed:
                print_success(f"  [{u['full_name']}] {f}")
                all_fixed.append(f)
            all_skipped.extend(skipped)

        print_header("COMMISSION FIX SUMMARY")
        print_success(f"Fixed/paid: {len(all_fixed)} action(s)")
        if all_skipped:
            for s in dict.fromkeys(all_skipped):
                print_info(f"  - {s}")
        if not all_fixed and not all_skipped:
            print_success("Nothing to fix - all verified clients have paid commissions.")
        sys.exit(0)
    finally:
        conn.close()


# ── Feature 1: activation ──────────────────────────────────────────────────

def load_activation_candidates(conn, opts):
    """Users not yet activated, with their payment attempts."""
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        if opts.user_id:
            users = _find_one(conn, opts.user_id, "activation")
            return [users]

        cur.execute("""
            SELECT id, full_name, email, phone, payment_status, is_active,
                   referred_by, registration_year, referral_code, is_founding_member
            FROM users
            WHERE payment_status != 'verified'
            ORDER BY created_at
        """)
        rows = cur.fetchall()
        if opts.limit and len(rows) > opts.limit:
            print_info(f"Only checking the {opts.limit} oldest unverified users (--limit).")
            rows = rows[:opts.limit]
        return rows
    finally:
        cur.close()


def check_user_against_paychangu(conn, user, opts):
    """
    Returns a dict: {paid: bool, tx: dict or None, channel, note}
    Verifies every DB tx_ref against PayChangu; then optionally the ledger.
    """
    result = {"paid": False, "paid_tx": None, "channel": None, "note": ""}
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        cur.execute("""
            SELECT id, tx_ref, amount, currency, status, payment_channel,
                   payment_reference, verified_at
            FROM paychangu_transactions
            WHERE user_id = %s
            ORDER BY created_at ASC
        """, (user["id"],))
        tx_rows = cur.fetchall()

        # A 'success' DB row means the webhook/callback already confirmed it.
        for tx in tx_rows:
            if tx["status"] == "success":
                result["paid"] = True
                result["paid_tx"] = tx
                result["note"] = "DB already has a confirmed success payment"
                return result

        # Ask PayChangu about each pending/failed attempt.
        for tx in tx_rows:
            verdict = pc_verify_payment(tx["tx_ref"])
            if verdict["paid"]:
                result["paid"] = True
                result["paid_tx"] = tx
                result["channel"] = None
                result["note"] = "PayChangu confirms payment on tx_ref " + str(tx["tx_ref"])
                return result
            if verdict["http"] is not None:
                time.sleep(0.3)

        if opts.ledger:
            matches = pc_search_transactions(user["email"], user["phone"])
            paid = [t for t in matches if _ledger_paid(t)]
            if paid:
                best = paid[0]
                result["paid"] = True
                result["paid_tx"] = None
                result["channel"] = (best.get("authorization") or {}).get("channel")
                result["note"] = f"Found settled payment in PayChangu ledger (ref {best.get('reference') or best.get('tx_ref')})"
                return result
        result["note"] = "No confirmed payment found"
        return result
    finally:
        cur.close()


def activate_user(conn, user, check):
    """Mark the user verified, record the successful transaction, welcome them,
    then pay any referral commissions now owed because of this activation."""
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    try:
        cur.execute(
            "UPDATE users SET payment_status = 'verified', updated_at = NOW() "
            "WHERE id = %s AND payment_status != 'verified'",
            (user["id"],),
        )

        tx = check["paid_tx"]
        if tx and tx["status"] != "success":
            cur.execute(
                "UPDATE paychangu_transactions SET status = 'success', "
                "payment_channel = %s, verified_at = NOW() WHERE id = %s",
                (check["channel"] or "unknown", tx["id"]),
            )
        elif tx is None:
            # Paid in the ledger but no DB row - record it for the audit trail.
            has_amount = _column_exists(cur, "paychangu_transactions", "amount")
            has_raw = _column_exists(cur, "paychangu_transactions", "raw_response")
            cols = ["user_id", "tx_ref", "status", "currency", "payment_channel", "verified_at"]
            placeholders = ["%s", "%s", "%s", "%s", "%s", "NOW()"]
            params = [user["id"], f"ledger-{user['id']}-{int(time.time())}",
                      "success", "MWK", check["channel"] or "unknown"]
            if has_amount:
                cols.append("amount")
                placeholders.append("%s")
                params.append(0)
            if has_raw:
                cols.append("raw_response")
                placeholders.append("%s::jsonb")
                params.append("{}")
            cur.execute(
                f"INSERT INTO paychangu_transactions ({', '.join(cols)}) "
                f"VALUES ({', '.join(placeholders)})",
                params,
            )
        conn.commit()

        # Welcome notification (best-effort, like production)
        try:
            cur.execute(
                "INSERT INTO notifications (user_id, type, title, message, link) "
                "VALUES (%s, %s, %s, %s, %s)",
                (user["id"], "payment_approved", "✅ Account Activated!",
                 "Your payment has been verified automatically via PayChangu. "
                 "Welcome to Wisdom Vault! You can now access your dashboard and start earning.",
                 "/dashboard"),
            )
            conn.commit()
        except Exception:
            conn.rollback()
    finally:
        cur.close()

    # Activation means the client is now verified -> parents are owed their bonus.
    try:
        fixed, skipped = fix_user_commissions(conn, user, None)
    except Exception as e:
        conn.rollback()
        print_warning(f"Referral commissions for {user['full_name']} could not be processed: {e}")
        fixed, skipped = [], []
    return fixed, skipped


def run_activation(opts):
    """Feature 1 entry point."""
    print_header("✅ ACTIVATION RECONCILIATION",
                 "Check unverified accounts against PayChangu and activate those who paid")
    conn = get_db_connection()
    try:
        candidates = load_activation_candidates(conn, opts)
        if not candidates:
            print_success("No unverified users to check.")
            sys.exit(0)

        print_info(f"Checking {len(candidates)} unverified user(s) against PayChangu...")
        to_activate = []
        not_paid = []
        for u in candidates:
            check = check_user_against_paychangu(conn, u, opts)
            if check["paid"]:
                to_activate.append((u, check))
            else:
                not_paid.append((u, check))

        if to_activate:
            display_table(
                [[u["full_name"], u["email"], u["phone"], c["note"]] for u, c in to_activate],
                ["Name", "Email", "Phone", "Evidence"],
                "USERS TO ACTIVATE",
            )
        else:
            print_info("No users found who have paid but are still unactivated.")

        if not_paid:
            print_info(f"{len(not_paid)} user(s) have no confirmed payment - left untouched.")

        if not to_activate:
            sys.exit(0)

        if not opts.yes:
            if not input_confirm(f"Activate {len(to_activate)} user(s) now? This also pays their referrers where due."):
                print_info("Aborted - nothing changed.")
                sys.exit(0)

        activated = 0
        for u, check in to_activate:
            fixed, skipped = activate_user(conn, u, check)
            print_success(f"Activated: {u['full_name']} ({u['email']})")
            for f in fixed:
                print_success(f"    {f}")
            activated += 1

        print_header("ACTIVATION SUMMARY")
        print_success(f"{activated} user(s) activated.")
        sys.exit(0)
    finally:
        conn.close()


# ── Feature 3: manual assign ───────────────────────────────────────────────

def run_assign(opts):
    """Feature 3 entry point - manually assert a parent->child link & pay."""
    print_header("🔗 MANUAL ASSIGN", "Assert a client to a parent and pay the commission")
    conn = get_db_connection()
    try:
        parent = _find_one(conn, opts.parent_id, "parent")
        child = _find_one(conn, opts.child_id, "child")

        if str(parent["id"]) == str(child["id"]):
            print_error("Parent and child cannot be the same user.")
            sys.exit(1)
        if child["referred_by"] and str(child["referred_by"]) != str(parent["id"]):
            print_warning(f"{child['full_name']} already has referred_by={child['referred_by']} "
                          f"(different from chosen parent {parent['id']}).")
            if not input_confirm("Re-assign to the chosen parent anyway?"):
                sys.exit(0)

        print()
        display_table(
            [
                ["Parent", f"{parent['full_name']}  <{parent['email']}>  ({parent['referral_code']})"],
                ["Child", f"{child['full_name']}  <{child['email']}>"],
                ["Child status", child["payment_status"]],
            ],
            ["Field", "Value"],
            "PLAN",
        )

        reg_year = _registration_year(conn, child["id"])

        if not opts.yes:
            if not input_confirm("Assert this relationship and pay any commission now due?"):
                sys.exit(0)

        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        try:
            if not child["referred_by"] or str(child["referred_by"]) != str(parent["id"]):
                cur.execute("UPDATE users SET referred_by = %s, updated_at = NOW() WHERE id = %s",
                            (parent["id"], child["id"]))
                conn.commit()
                print_success(f"✅ {child['full_name']} is now linked as {parent['full_name']}'s client.")

            row, created = create_referral_row(
                conn, cur, parent["id"], child["id"], "first_level",
                first_level_bonus_for(conn, parent["id"]), reg_year,
            )
            if child["payment_status"] == "verified":
                ok, msg = credit_referral_bonus(conn, cur, row)
                if ok:
                    print_success(f"First-level commission paid: {msg}")
                else:
                    print_info(f"First-level: {msg}")
            else:
                print_info(f"First-level row recorded (is_paid=false). It will be paid when "
                           f"{child['full_name']} verifies. Parent: {parent['full_name']}.")

            # Second level to the parent's own parent, if the child is verified
            cur.execute("SELECT referred_by FROM users WHERE id = %s", (parent["id"],))
            gp = cur.fetchone()
            if gp and gp["referred_by"] and child["payment_status"] == "verified":
                cfg = load_bonus_config(conn)
                row2, created2 = create_referral_row(
                    conn, cur, gp["referred_by"], child["id"], "second_level",
                    cfg["second_level"], reg_year,
                )
                ok, msg = credit_referral_bonus(conn, cur, row2)
                if ok:
                    print_success(f"Second-level commission paid: {msg}")
                elif not created2:
                    print_info(f"Second-level: {msg}")

            conn.commit()
            print_success("Assignment complete.")
            sys.exit(0)
        except Exception as e:
            conn.rollback()
            print_error(f"Assignment failed (rolled back): {e}")
            sys.exit(1)
        finally:
            cur.close()
    finally:
        conn.close()


# ── Menu & main ────────────────────────────────────────────────────────────

def run_menu():
    print_header("🔧 WISDOM VAULT RECONCILIATION TOOL",
                 "PayChangu activation + referral commission repair")
    while True:
        print(f"{Colors.BOLD}Choose an action:{Colors.END}")
        print("  1)  Activate users verified via PayChangu (check & activate)")
        print("  2)  Fix referral commissions (unpaid / missing client links)")
        print("  3)  Assign a client to a parent manually & pay commission")
        print("  4)  Run everything (1 then 2)")
        print("  0)  Exit")
        choice = input_prompt("Choice", "1")

        if choice == "0":
            print_info("Goodbye.")
            sys.exit(0)
        elif choice == "1":
            run_activation(_opts(yes=False, ledger=True, limit=300))
        elif choice == "2":
            run_commissions_fix(_opts(yes=False, ledger=True))
        elif choice == "3":
            opts = _opts(yes=False, ledger=True)
            opts.parent_id = input_prompt("Parent (email/phone/name/id)")
            opts.child_id = input_prompt("Client (email/phone/name/id)")
            run_assign(opts)
        elif choice == "4":
            run_activation(_opts(yes=False, ledger=True, limit=300))
            run_commissions_fix(_opts(yes=False, ledger=True))
        else:
            print_error("Invalid choice.")


def _opts(yes=False, ledger=False, limit=0):
    return argparse.Namespace(
        yes=yes, ledger=ledger, limit=limit,
        user_id=None, parent_id=None, child_id=None,
    )


def parse_args(argv):
    # Shared options must be accepted both before AND after the subcommand,
    # e.g. `reconcile_paychangu.py activate --yes`.
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--yes", action="store_true", help="apply without confirmation")
    common.add_argument("--ledger", action="store_true",
                        help="also scan PayChangu ledger for users with no DB payment row")
    common.add_argument("--limit", type=int, default=0, help="max users to process (activate)")

    p = argparse.ArgumentParser(description="PayChangu activation & commission fix tool",
                                parents=[common])
    sub = p.add_subparsers(dest="cmd")
    for name in ("activate", "commissions"):
        sp = sub.add_parser(name, parents=[common])
        sp.add_argument("user_id", nargs="?", default=None,
                        help="restrict to one user (email/phone/name/id)")
    sp = sub.add_parser("assign", parents=[common])
    sp.add_argument("parent_id")
    sp.add_argument("child_id")
    sub.add_parser("all", parents=[common])
    return p.parse_args(argv)


def main():
    args = parse_args(sys.argv[1:])
    if not args.cmd:
        run_menu()
        return
    opts = _opts(yes=getattr(args, "yes", False), ledger=getattr(args, "ledger", False),
                 limit=getattr(args, "limit", 0))

    if args.cmd == "activate":
        opts.user_id = getattr(args, "user_id", None)
        run_activation(opts)
    elif args.cmd == "commissions":
        opts.user_id = getattr(args, "user_id", None)
        run_commissions_fix(opts)
    elif args.cmd == "assign":
        opts.parent_id = args.parent_id
        opts.child_id = args.child_id
        run_assign(opts)
    elif args.cmd == "all":
        run_activation(opts)
        run_commissions_fix(opts)


if __name__ == "__main__":
    main()
