-- 0006: vacancies — job openings published by the admin, shown to all users
-- in a "Vacancies" panel in the More sheet (right after My Advert).
-- The description is unlimited (text column — no length cap by design).
-- Lifecycle: active <-> closed (admin toggle). Deleted rows remove images.

CREATE TABLE IF NOT EXISTS public.vacancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(120) NOT NULL,
  company varchar(100) NOT NULL,
  description text,
  location varchar(150),
  contact_phone varchar(40),
  whatsapp varchar(40),
  image_urls text NOT NULL DEFAULT '[]'::text,
  is_active boolean NOT NULL DEFAULT true,
  view_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vacancies_active_idx
  ON public.vacancies USING btree (created_at DESC)
  WHERE is_active = true;
