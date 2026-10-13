--
-- PostgreSQL database dump
--

-- Dumped from database version 15.10 (Debian 15.10-0+deb12u1)
-- Dumped by pg_dump version 15.10 (Debian 15.10-0+deb12u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: create_notification(uuid, character varying, character varying, text, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_notification(p_user_id uuid, p_type character varying, p_title character varying, p_message text, p_link character varying DEFAULT NULL::character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (p_user_id, p_type, p_title, p_message, p_link);
END;
$$;


ALTER FUNCTION public.create_notification(p_user_id uuid, p_type character varying, p_title character varying, p_message text, p_link character varying) 

--
-- Name: create_wallet_for_user(); Type: FUNCTION; Schema: public; Owner: wisdom_vault
--

CREATE FUNCTION public.create_wallet_for_user() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO wallets (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.create_wallet_for_user() 

--
-- Name: generate_referral_code(text); Type: FUNCTION; Schema: public; Owner: wisdom_vault
--

CREATE FUNCTION public.generate_referral_code(full_name text) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    base_code VARCHAR;
    unique_code VARCHAR;
    counter INTEGER := 0;
BEGIN
    -- Create base from name (first 4 chars, uppercase, no spaces)
    base_code := UPPER(REGEXP_REPLACE(SUBSTRING(full_name FROM 1 FOR 4), '\s', '', 'g'));
    
    -- If name is too short, pad with random chars
    IF LENGTH(base_code) < 4 THEN
        base_code := base_code || SUBSTRING(UPPER(uuid_generate_v4()::TEXT) FROM 1 FOR (4 - LENGTH(base_code)));
    END IF;
    
    -- Add random suffix
    unique_code := base_code || SUBSTRING(UPPER(uuid_generate_v4()::TEXT) FROM 1 FOR 4);
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM users WHERE referral_code = unique_code) LOOP
        unique_code := base_code || SUBSTRING(UPPER(uuid_generate_v4()::TEXT) FROM 1 FOR 4);
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Could not generate unique referral code after 100 attempts';
        END IF;
    END LOOP;
    
    RETURN unique_code;
END;
$$;


ALTER FUNCTION public.generate_referral_code(full_name text) 

--
-- Name: notify_referral_bonus(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_referral_bonus() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_referrer_name VARCHAR;
    v_referred_name VARCHAR;
BEGIN
    SELECT full_name INTO v_referrer_name FROM users WHERE id = NEW.referrer_id;
    SELECT full_name INTO v_referred_name FROM users WHERE id = NEW.referred_id;
    
    PERFORM create_notification(
        NEW.referrer_id,
        'referral_bonus',
        'Referral Bonus Received!',
        v_referred_name || ' joined using your referral link. You earned ' || NEW.bonus_amount::TEXT || '!',
        '/dashboard'
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_referral_bonus() 

--
-- Name: notify_withdrawal_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_withdrawal_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_user_id UUID;
    v_user_name VARCHAR;
BEGIN
    SELECT u.id, u.full_name INTO v_user_id, v_user_name
    FROM wallets w
    JOIN users u ON w.user_id = u.id
    WHERE w.id = NEW.wallet_id;

    IF NEW.status = 'completed' THEN
        PERFORM create_notification(
            v_user_id,
            'withdrawal_completed',
            'Withdrawal Approved',
            'Your withdrawal of ' || NEW.amount_requested::TEXT || ' has been processed. Net payout: ' || NEW.amount_paid::TEXT,
            '/dashboard'
        );
    ELSIF NEW.status = 'failed' THEN
        PERFORM create_notification(
            v_user_id,
            'withdrawal_failed',
            'Withdrawal Failed',
            'Your withdrawal of ' || NEW.amount_requested::TEXT || ' could not be processed. Please try again.',
            '/dashboard'
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.notify_withdrawal_status() 

--
-- Name: process_referral_bonus(uuid, uuid, character varying); Type: FUNCTION; Schema: public; Owner: wisdom_vault
--

CREATE FUNCTION public.process_referral_bonus(p_referrer_id uuid, p_referred_id uuid, p_type character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_bonus_amount NUMERIC(10, 2);
    v_is_founding BOOLEAN;
    v_wallet_id UUID;
    v_balance_before NUMERIC(12, 2);
    v_referral_id UUID;
    v_current_year INTEGER;
BEGIN
    v_current_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
    
    -- Check if referrer is a founding member
    SELECT is_founding_member INTO v_is_founding FROM users WHERE id = p_referrer_id;
    
    -- Determine bonus amount based on type and founding status
    IF p_type = 'registration' THEN
        IF v_is_founding THEN
            SELECT config_value::NUMERIC INTO v_bonus_amount FROM platform_config WHERE config_key = 'referral_bonus_founding';
        ELSE
            SELECT config_value::NUMERIC INTO v_bonus_amount FROM platform_config WHERE config_key = 'referral_bonus_standard';
        END IF;
    ELSIF p_type = 'renewal' THEN
        SELECT config_value::NUMERIC INTO v_bonus_amount FROM platform_config WHERE config_key = 'referral_bonus_renewal';
    END IF;
    
    -- Get wallet
    SELECT id, balance_available INTO v_wallet_id, v_balance_before FROM wallets WHERE user_id = p_referrer_id;
    
    -- Insert referral record
    INSERT INTO referrals (referrer_id, referred_id, referral_type, registration_year, bonus_amount, is_paid)
    VALUES (p_referrer_id, p_referred_id, p_type, v_current_year, v_bonus_amount, TRUE)
    RETURNING id INTO v_referral_id;
    
    -- Update wallet balance
    UPDATE wallets 
    SET gross_earnings = gross_earnings + v_bonus_amount,
        balance_available = balance_available + v_bonus_amount
    WHERE id = v_wallet_id;
    
    -- Record transaction
    INSERT INTO transactions (wallet_id, referral_id, transaction_type, amount, balance_before, balance_after, description)
    VALUES (
        v_wallet_id, 
        v_referral_id, 
        CASE WHEN p_type = 'registration' THEN 'referral_bonus' ELSE 'renewal_bonus' END,
        v_bonus_amount,
        v_balance_before,
        v_balance_before + v_bonus_amount,
        CASE WHEN p_type = 'registration' THEN 'Referral bonus for new member registration'
             ELSE 'Renewal bonus for referred member renewal' END
    );
END;
$$;


ALTER FUNCTION public.process_referral_bonus(p_referrer_id uuid, p_referred_id uuid, p_type character varying) 

--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: wisdom_vault
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp() 

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    admin_id uuid NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.admin_sessions 

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(30) DEFAULT 'admin'::character varying NOT NULL,
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT admin_users_role_check CHECK (((role)::text = ANY ((ARRAY['super_admin'::character varying, 'admin'::character varying, 'content_manager'::character varying, 'support'::character varying])::text[])))
);


ALTER TABLE public.admin_users 

--
-- Name: content_categories; Type: TABLE; Schema: public; Owner: wisdom_vault
--

CREATE TABLE public.content_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    icon_svg text,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.content_categories 

--
-- Name: content_items; Type: TABLE; Schema: public; Owner: wisdom_vault
--

CREATE TABLE public.content_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    title character varying(500) NOT NULL,
    slug character varying(500) NOT NULL,
    description text,
    content_type character varying(30) NOT NULL,
    file_url text,
    thumbnail_url text,
    author character varying(255),
    is_featured boolean DEFAULT false,
    is_published boolean DEFAULT false,
    view_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.content_items 

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text,
    link character varying(500),
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notifications 

--
-- Name: payment_proofs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_proofs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    pack_id uuid NOT NULL,
    provider_name character varying(255) NOT NULL,
    phone_number character varying(50) NOT NULL,
    card_name character varying(255),
    amount_sent numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    admin_notes text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payment_proofs_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.payment_proofs 

--
-- Name: platform_config; Type: TABLE; Schema: public; Owner: wisdom_vault
--

CREATE TABLE public.platform_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    config_key character varying(100) NOT NULL,
    config_value text NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.platform_config 

--
-- Name: premium_content_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.premium_content_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    pack_id uuid NOT NULL,
    title character varying(500) NOT NULL,
    description text,
    content_type character varying(30) NOT NULL,
    file_url text,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT premium_content_items_content_type_check CHECK (((content_type)::text = ANY ((ARRAY['pdf'::character varying, 'video'::character varying, 'audio'::character varying, 'course'::character varying, 'tool'::character varying, 'ebook'::character varying, 'guide'::character varying])::text[])))
);


ALTER TABLE public.premium_content_items 

--
-- Name: premium_packs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.premium_packs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    long_description text,
    price numeric(10,2) NOT NULL,
    icon_svg text,
    thumbnail_url text,
    category character varying(100),
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.premium_packs 

--
-- Name: referrals; Type: TABLE; Schema: public; Owner: wisdom_vault
--

CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    referred_id uuid NOT NULL,
    referral_type character varying(20) NOT NULL,
    registration_year integer NOT NULL,
    bonus_amount numeric(10,2) NOT NULL,
    is_paid boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.referrals 

--
-- Name: sponsored_content; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sponsored_content (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    content_type character varying(20) NOT NULL,
    file_url text,
    thumbnail_url text,
    sponsor_name character varying(255),
    reward_amount numeric(10,2) DEFAULT 50 NOT NULL,
    duration_seconds integer DEFAULT 30,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    external_link text,
    CONSTRAINT sponsored_content_content_type_check CHECK (((content_type)::text = ANY ((ARRAY['video'::character varying, 'audio'::character varying])::text[])))
);


ALTER TABLE public.sponsored_content 

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: wisdom_vault
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    wallet_id uuid NOT NULL,
    referral_id uuid,
    transaction_type character varying(30) NOT NULL,
    amount numeric(12,2) NOT NULL,
    balance_before numeric(12,2) NOT NULL,
    balance_after numeric(12,2) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.transactions 

--
-- Name: user_premium_packs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_premium_packs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    pack_id uuid NOT NULL,
    purchased_at timestamp with time zone DEFAULT now(),
    amount_paid numeric(10,2) NOT NULL,
    transaction_ref character varying(255)
);


ALTER TABLE public.user_premium_packs 

--
-- Name: user_sponsored_views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sponsored_views (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    content_id uuid NOT NULL,
    watched_at timestamp with time zone DEFAULT now(),
    reward_earned numeric(10,2) NOT NULL,
    watched_date date DEFAULT CURRENT_DATE
);


ALTER TABLE public.user_sponsored_views 

--
-- Name: users; Type: TABLE; Schema: public; Owner: wisdom_vault
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    referral_code character varying(50) NOT NULL,
    referred_by uuid,
    is_founding_member boolean DEFAULT false,
    founding_member_number integer,
    registration_year integer NOT NULL,
    renewal_due_date date NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    consent_given_at timestamp with time zone,
    CONSTRAINT users_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.users 

--
-- Name: wallets; Type: TABLE; Schema: public; Owner: wisdom_vault
--

CREATE TABLE public.wallets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    gross_earnings numeric(12,2) DEFAULT 0.00,
    total_withdrawn numeric(12,2) DEFAULT 0.00,
    balance_available numeric(12,2) DEFAULT 0.00,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.wallets 

--
-- Name: withdrawals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.withdrawals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    wallet_id uuid NOT NULL,
    amount_requested numeric(12,2) NOT NULL,
    withdrawal_fee numeric(10,2) NOT NULL,
    amount_paid numeric(12,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    payment_method character varying(50),
    payment_reference character varying(255),
    processed_by uuid,
    notes text,
    requested_at timestamp with time zone DEFAULT now(),
    processed_at timestamp with time zone
);


ALTER TABLE public.withdrawals 

--
-- Name: admin_sessions admin_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_pkey PRIMARY KEY (id);


--
-- Name: admin_sessions admin_sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_token_key UNIQUE (token);


--
-- Name: admin_users admin_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_email_key UNIQUE (email);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_username_key UNIQUE (username);


--
-- Name: content_categories content_categories_name_unique; Type: CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.content_categories
    ADD CONSTRAINT content_categories_name_unique UNIQUE (name);


--
-- Name: content_categories content_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.content_categories
    ADD CONSTRAINT content_categories_pkey PRIMARY KEY (id);


--
-- Name: content_categories content_categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.content_categories
    ADD CONSTRAINT content_categories_slug_unique UNIQUE (slug);


--
-- Name: content_items content_items_pkey; Type: CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT content_items_pkey PRIMARY KEY (id);


--
-- Name: content_items content_items_slug_unique; Type: CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT content_items_slug_unique UNIQUE (slug);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payment_proofs payment_proofs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_proofs
    ADD CONSTRAINT payment_proofs_pkey PRIMARY KEY (id);


--
-- Name: platform_config platform_config_config_key_unique; Type: CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.platform_config
    ADD CONSTRAINT platform_config_config_key_unique UNIQUE (config_key);


--
-- Name: platform_config platform_config_pkey; Type: CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.platform_config
    ADD CONSTRAINT platform_config_pkey PRIMARY KEY (id);


--
-- Name: premium_content_items premium_content_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.premium_content_items
    ADD CONSTRAINT premium_content_items_pkey PRIMARY KEY (id);


--
-- Name: premium_packs premium_packs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.premium_packs
    ADD CONSTRAINT premium_packs_pkey PRIMARY KEY (id);


--
-- Name: premium_packs premium_packs_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.premium_packs
    ADD CONSTRAINT premium_packs_slug_key UNIQUE (slug);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_referrer_id_referred_id_referral_type_registration_ye; Type: CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_referred_id_referral_type_registration_ye UNIQUE (referrer_id, referred_id, referral_type, registration_year);


--
-- Name: sponsored_content sponsored_content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sponsored_content
    ADD CONSTRAINT sponsored_content_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: user_premium_packs user_premium_packs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_premium_packs
    ADD CONSTRAINT user_premium_packs_pkey PRIMARY KEY (id);


--
-- Name: user_premium_packs user_premium_packs_user_id_pack_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_premium_packs
    ADD CONSTRAINT user_premium_packs_user_id_pack_id_key UNIQUE (user_id, pack_id);


--
-- Name: user_sponsored_views user_sponsored_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sponsored_views
    ADD CONSTRAINT user_sponsored_views_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_phone_unique; Type: CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_unique UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_referral_code_unique; Type: CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referral_code_unique UNIQUE (referral_code);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_unique UNIQUE (user_id);


--
-- Name: withdrawals withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (id);


--
-- Name: idx_notifications_unread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_unread ON public.notifications USING btree (user_id, is_read) WHERE (is_read = false);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_unique_daily_view; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_unique_daily_view ON public.user_sponsored_views USING btree (user_id, content_id, watched_date);


--
-- Name: content_items trigger_content_updated; Type: TRIGGER; Schema: public; Owner: wisdom_vault
--

CREATE TRIGGER trigger_content_updated BEFORE UPDATE ON public.content_items FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: users trigger_create_wallet; Type: TRIGGER; Schema: public; Owner: wisdom_vault
--

CREATE TRIGGER trigger_create_wallet AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_user();


--
-- Name: referrals trigger_notify_referral; Type: TRIGGER; Schema: public; Owner: wisdom_vault
--

CREATE TRIGGER trigger_notify_referral AFTER INSERT ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.notify_referral_bonus();


--
-- Name: withdrawals trigger_notify_withdrawal; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_notify_withdrawal AFTER UPDATE OF status ON public.withdrawals FOR EACH ROW WHEN (((old.status)::text IS DISTINCT FROM (new.status)::text)) EXECUTE FUNCTION public.notify_withdrawal_status();


--
-- Name: users trigger_users_updated; Type: TRIGGER; Schema: public; Owner: wisdom_vault
--

CREATE TRIGGER trigger_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: wallets trigger_wallets_updated; Type: TRIGGER; Schema: public; Owner: wisdom_vault
--

CREATE TRIGGER trigger_wallets_updated BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: admin_sessions admin_sessions_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_users(id) ON DELETE CASCADE;


--
-- Name: content_items content_items_category_id_content_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT content_items_category_id_content_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.content_categories(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payment_proofs payment_proofs_pack_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_proofs
    ADD CONSTRAINT payment_proofs_pack_id_fkey FOREIGN KEY (pack_id) REFERENCES public.premium_packs(id) ON DELETE CASCADE;


--
-- Name: payment_proofs payment_proofs_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_proofs
    ADD CONSTRAINT payment_proofs_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.admin_users(id);


--
-- Name: payment_proofs payment_proofs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_proofs
    ADD CONSTRAINT payment_proofs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: premium_content_items premium_content_items_pack_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.premium_content_items
    ADD CONSTRAINT premium_content_items_pack_id_fkey FOREIGN KEY (pack_id) REFERENCES public.premium_packs(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referred_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_id_users_id_fk FOREIGN KEY (referred_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referrer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_users_id_fk FOREIGN KEY (referrer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_referral_id_referrals_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_referral_id_referrals_id_fk FOREIGN KEY (referral_id) REFERENCES public.referrals(id) ON DELETE SET NULL;


--
-- Name: transactions transactions_wallet_id_wallets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_wallet_id_wallets_id_fk FOREIGN KEY (wallet_id) REFERENCES public.wallets(id) ON DELETE CASCADE;


--
-- Name: user_premium_packs user_premium_packs_pack_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_premium_packs
    ADD CONSTRAINT user_premium_packs_pack_id_fkey FOREIGN KEY (pack_id) REFERENCES public.premium_packs(id) ON DELETE CASCADE;


--
-- Name: user_premium_packs user_premium_packs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_premium_packs
    ADD CONSTRAINT user_premium_packs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_sponsored_views user_sponsored_views_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sponsored_views
    ADD CONSTRAINT user_sponsored_views_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.sponsored_content(id) ON DELETE CASCADE;


--
-- Name: user_sponsored_views user_sponsored_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sponsored_views
    ADD CONSTRAINT user_sponsored_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_referred_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referred_by_users_id_fk FOREIGN KEY (referred_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: wallets wallets_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: wisdom_vault
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO wisdom_vault;


--
-- Name: TABLE admin_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.admin_sessions TO wisdom_vault;


--
-- Name: TABLE admin_users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.admin_users TO wisdom_vault;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notifications TO wisdom_vault;


--
-- Name: TABLE payment_proofs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.payment_proofs TO wisdom_vault;


--
-- Name: TABLE premium_content_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.premium_content_items TO wisdom_vault;


--
-- Name: TABLE premium_packs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.premium_packs TO wisdom_vault;


--
-- Name: TABLE sponsored_content; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sponsored_content TO wisdom_vault;


--
-- Name: TABLE user_premium_packs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_premium_packs TO wisdom_vault;


--
-- Name: TABLE audit_logs; Type: TABLE; Schema: public
--

CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    admin_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
    action character varying(100) NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    ip character varying(64),
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: TABLE user_sponsored_views; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_sponsored_views TO wisdom_vault;


--
-- Name: TABLE withdrawals; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.withdrawals TO wisdom_vault;


--
-- PostgreSQL database dump complete
--

