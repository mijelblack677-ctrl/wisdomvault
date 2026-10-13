-- ─────────────────────────────────────────────────────────────────────────────
--  fix-content-order.sql — restore upload order for courses and their modules
--
--  SYMPTOM
--    Modules inside a course appeared in a scrambled order instead of the order
--    they were uploaded (first video first, second second, …).
--
--  CAUSE
--    POST /api/admin/packs/items hard-coded `display_order = 0` on every insert.
--    Every module therefore carried the same value, so the read queries'
--    `ORDER BY display_order` degenerated into a no-op tie and Postgres was free
--    to return rows in any physical order it liked — which drifts as rows are
--    updated, deleted and vacuumed. `premium_packs` had the identical problem.
--
--  FIX
--    Renumber from `created_at` (the order the admin actually added the rows).
--    The application side now inserts `MAX(display_order) + 1` and orders by
--    `display_order, created_at, id`, so this only has to run once.
--
--  SAFETY
--    A pack is renumbered ONLY when every one of its modules currently shares a
--    single display_order value — i.e. only when there is no real ordering to
--    lose. Any pack that already has a meaningful, hand-made ordering is left
--    completely untouched. Safe to run repeatedly; a no-op once fixed.
--
--  USAGE
--    psql "$DATABASE_URL" -f scripts/fix-content-order.sql
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. Modules: renumber within each course, by upload order ────────────────
WITH degenerate_packs AS (
    SELECT pack_id
    FROM premium_content_items
    GROUP BY pack_id
    HAVING COUNT(DISTINCT display_order) = 1
),
renumbered AS (
    SELECT
        i.id,
        ROW_NUMBER() OVER (PARTITION BY i.pack_id ORDER BY i.created_at, i.id) - 1 AS new_order
    FROM premium_content_items i
    JOIN degenerate_packs d ON d.pack_id = i.pack_id
)
UPDATE premium_content_items i
SET display_order = r.new_order
FROM renumbered r
WHERE i.id = r.id
  AND i.display_order IS DISTINCT FROM r.new_order;

-- ── 2. Courses: same treatment, but only if ALL packs share one value ───────
WITH renumbered AS (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY created_at, id) - 1 AS new_order
    FROM premium_packs
)
UPDATE premium_packs p
SET display_order = r.new_order
FROM renumbered r
WHERE p.id = r.id
  AND p.display_order IS DISTINCT FROM r.new_order
  AND (SELECT COUNT(DISTINCT display_order) FROM premium_packs) = 1;

COMMIT;

-- ── 3. Report ────────────────────────────────────────────────────────────────
SELECT
    p.name                                     AS course,
    COUNT(i.id)                                AS modules,
    COUNT(DISTINCT i.display_order)            AS distinct_orders,
    string_agg(i.title, ' → ' ORDER BY i.display_order, i.created_at) AS order_preview
FROM premium_packs p
JOIN premium_content_items i ON i.pack_id = p.id
GROUP BY p.id, p.name
HAVING COUNT(i.id) > 1
ORDER BY p.display_order, p.created_at
LIMIT 10;
