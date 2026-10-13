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
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notifications (id, user_id, type, title, message, link, is_read, created_at) VALUES ('8ebcd288-0f06-4ae0-af25-62a66076ad8b', '02d5564b-a41f-484b-a9ad-27872b1c0862', 'referral_bonus', 'Referral Bonus Received!', 'Grace Kato joined using your referral link. You earned 6,500!', '/dashboard', false, '2026-07-16 17:29:07.865063+02');
INSERT INTO public.notifications (id, user_id, type, title, message, link, is_read, created_at) VALUES ('50d563da-26c0-4d32-a7b1-0c4d7d968701', '5a74064b-4b7a-42c8-b851-d28062b17bec', 'payment_approved', 'Account Activated!', 'Your payment has been verified. Welcome to Wisdom Vault!', '/dashboard', false, '2026-07-20 19:59:47.099393+02');


--
-- PostgreSQL database dump complete
--

