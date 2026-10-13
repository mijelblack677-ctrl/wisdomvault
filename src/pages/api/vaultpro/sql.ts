export const prerender = false;

import type { APIRoute } from 'astro';
import { client } from '@db';
import { requireVaultPro, jsonResponse, readJson } from '@lib/vaultproAuth';

/**
 * POST /api/vaultpro/sql
 * Body: { query: string, allowWrite?: boolean }
 *
 * Runs a single SQL statement. By default only read-only statements
 * (SELECT / SHOW / EXPLAIN / WITH ... SELECT) are allowed. Pass allowWrite:true
 * to run INSERT / UPDATE / DELETE / ALTER / etc. — an audit log entry is always
 * recorded.
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const admin = await requireVaultPro(request);
    const sql = client;
    const body = await readJson(request);

    const query = String(body.query || '').trim();
    if (!query) {
      return jsonResponse({ success: false, message: 'query required' }, 400);
    }

    // Reject multiple statements to prevent stacked queries
    // (naive split — enough to block `;` chaining while allowing trailing ;)
    const normalized = query.replace(/;\s*$/, '');
    if (normalized.includes(';')) {
      return jsonResponse({ success: false, message: 'Only a single statement is allowed' }, 400);
    }

    const upper = normalized.toUpperCase();
    const isReadOnly = /^(SELECT|SHOW|EXPLAIN|WITH|VALUES)\b/.test(upper);
    const allowWrite = body.allowWrite === true;

    if (!isReadOnly && !allowWrite) {
      return jsonResponse({
        success: false,
        message: 'This statement modifies data. Set allowWrite:true to confirm you want to run it.',
        isReadOnly: false,
      }, 400);
    }

    // Limit result rows for safety
    let statement = normalized;
    if (isReadOnly && /^SELECT\b/i.test(statement) && !/LIMIT\s+\d+/i.test(statement)) {
      statement = statement.replace(/;?\s*$/, '') + ' LIMIT 500';
    }

    const started = Date.now();
    const result = await sql.unsafe(statement);
    const elapsed = Date.now() - started;

    await sql`
      INSERT INTO audit_logs (admin_id, action, details)
      VALUES (${admin.id}, 'vaultpro_sql',
              ${JSON.stringify({ query: statement.slice(0, 2000), readOnly: isReadOnly })}::jsonb)
    `;

    return jsonResponse({
      success: true,
      isReadOnly,
      rows: result.length,
      elapsedMs: elapsed,
      data: result,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonResponse({ success: false, message: (error as Error).message }, 500);
  }
};