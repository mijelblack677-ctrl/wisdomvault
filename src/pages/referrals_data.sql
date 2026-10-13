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
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.referrals (id, referrer_id, referred_id, referral_type, registration_year, bonus_amount, is_paid, created_at) VALUES ('d441a0cd-8cd2-4391-9371-71eff4701d8c', '02d5564b-a41f-484b-a9ad-27872b1c0862', 'f2fa8ed9-0d45-445c-b095-ef8139494e2f', 'registration', 2026, 6500.00, true, '2026-07-16 12:38:27.345579+02');


--
-- PostgreSQL database dump complete
--

