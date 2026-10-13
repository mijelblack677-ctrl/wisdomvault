// One-off reconciliation: find PayChangu checkouts that settled but whose
// account is still unverified (webhook/callback lost), then activate them.
//
// Reuses the EXACT production helpers (paychanguVerifyPayment +
// markTransactionVerified + autoVerifyUser from src/lib/paychangu.ts) so the
// DB writes are byte-for-byte what the webhook path would have done.
//
// Usage: DATABASE_URL=... PAYCHANGU_SECRET_KEY=... node scripts/reconcile-paid.mjs

import { readFileSync } from 'node:fs';
import dns from 'node:dns';
// Neon pooler host resolves to both A and AAAA records; force IPv4 like the
// Python/psycopg2 path that already works from this machine.
dns.setDefaultResultOrder('ipv4first');

// ---- load .env (DATABASE_URL / PAYCHANGU_SECRET_KEY may live there) ----
function loadDotEnv(file) {
  try {
    const txt = readFileSync(file, 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) {
        let v = m[2].trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        process.env[m[1]] = v;
      }
    }
  } catch { /* missing file is fine */ }
}
loadDotEnv('.env');
loadDotEnv('.env.local');

import postgres from 'postgres';
import {
  paychanguVerifyPayment,
  markTransactionVerified,
  autoVerifyUser,
} from '../src/lib/paychangu.ts';

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 15,
  ssl: { rejectUnauthorized: false },
});

const DAYS = parseInt(process.env.RECONCILE_DAYS || '30', 10);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`Reconciling unverified users' pending PayChangu tx (last ${DAYS}d)`);

  const rows = await sql`
    SELECT pt.id AS tx_id, pt.tx_ref, pt.amount, pt.user_id, u.payment_status,
           u.full_name, u.email
    FROM paychangu_transactions pt
    JOIN users u ON u.id = pt.user_id
    WHERE u.payment_status <> 'verified'
      AND pt.status IN ('pending','processing','unknown')
      AND pt.created_at >= NOW() - (${DAYS} || ' days')::interval
    ORDER BY pt.created_at ASC
  `;

  console.log(`Candidate rows: ${rows.length}`);

  // Dedupe by tx_ref (a user often has several identical checkout rows).
  const seen = new Set();
  const unique = rows.filter((r) => {
    if (seen.has(r.tx_ref)) return false;
    seen.add(r.tx_ref);
    return true;
  });
  console.log(`Unique tx_refs to verify: ${unique.length}`);

  let confirmed = 0;
  let failed = 0;
  let pendingStill = 0;
  const activated = [];

  for (const row of unique) {
    const { tx_ref } = row;
    let res;
    try {
      res = await paychanguVerifyPayment(tx_ref);
    } catch (err) {
      console.log(`  ⚠️  verify error ${tx_ref}: ${err.message}`);
      continue;
    }
    const { confirmedPaid, paymentData, stillPending, explicitlyFailed } = res;

    if (confirmedPaid && paymentData) {
      const expected = parseFloat(row.amount || 10800);
      const paid = parseFloat(paymentData.amount || expected);
      if (paid < expected) {
        console.log(`  ⚠️  amount mismatch ${tx_ref}: expected ${expected}, got ${paid}`);
        continue;
      }
      // Production flow: mark tx success, then activate account (idempotent).
      await markTransactionVerified(sql, tx_ref, paymentData);
      await autoVerifyUser(sql, row.user_id, tx_ref, paid);
      confirmed += 1;
      activated.push({ tx_ref, user_id: row.user_id, full_name: row.full_name, email: row.email });
      console.log(`  ✅ ACTIVATED ${row.full_name} <${row.email}> (${tx_ref})`);
    } else if (explicitlyFailed) {
      failed += 1;
    } else if (stillPending) {
      pendingStill += 1;
    }
    await sleep(150); // be polite to PayChangu
  }

  console.log(`\nDone. confirmed+activated=${confirmed} explicitlyFailed=${failed} stillPending=${pendingStill}`);
  if (activated.length) {
    console.log('Activated:');
    for (const a of activated) console.log(`  - ${a.full_name} <${a.email}> ${a.tx_ref}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Reconcile failed:', err);
    process.exit(1);
  });
