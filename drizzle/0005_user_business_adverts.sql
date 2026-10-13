-- 0005: user_business_adverts — user-submitted business adverts ("My Advert")
-- One submission per user per day (unique index). Admin-moderated:
-- pending -> approved (appears in Earn & Watch feed) | rejected (with reason).

CREATE TABLE IF NOT EXISTS public.user_business_adverts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  template varchar(30) NOT NULL,
  headline varchar(120) NOT NULL,
  business_name varchar(100) NOT NULL,
  description text,
  contact_phone varchar(40),
  location varchar(150),
  whatsapp varchar(40),
  image_urls text NOT NULL DEFAULT '[]'::text,
  status varchar(20) NOT NULL DEFAULT 'pending'::text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  rejection_reason text,
  is_active boolean NOT NULL DEFAULT true,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  created_date date
);

CREATE INDEX IF NOT EXISTS user_adverts_user_idx ON public.user_business_adverts USING btree (user_id);
CREATE INDEX IF NOT EXISTS user_adverts_status_idx ON public.user_business_adverts USING btree (status, created_at);
-- One advert per user per day
CREATE UNIQUE INDEX IF NOT EXISTS user_adverts_one_per_day_idx ON public.user_business_adverts USING btree (user_id, created_date);
