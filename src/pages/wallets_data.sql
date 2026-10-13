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
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.wallets (id, user_id, gross_earnings, total_withdrawn, balance_available, updated_at) VALUES ('ea2b4b4d-0ac0-4396-833f-02920d0636eb', 'f2fa8ed9-0d45-445c-b095-ef8139494e2f', 0.00, 0.00, 0.00, '2026-07-16 12:38:27.309459+02');
INSERT INTO public.wallets (id, user_id, gross_earnings, total_withdrawn, balance_available, updated_at) VALUES ('0f4bfeb7-02c6-4ca7-9061-461d6ac69b26', '02d5564b-a41f-484b-a9ad-27872b1c0862', 6500.00, 5200.00, 1300.00, '2026-07-16 12:51:32.379434+02');
INSERT INTO public.wallets (id, user_id, gross_earnings, total_withdrawn, balance_available, updated_at) VALUES ('9b74bd9e-66ca-4148-8cef-c0789afb1e85', '6290ea5a-2b55-4358-84f5-2204970d96e4', 306.00, 0.00, 306.00, '2026-07-20 18:42:22.567112+02');
INSERT INTO public.wallets (id, user_id, gross_earnings, total_withdrawn, balance_available, updated_at) VALUES ('71808b83-16fd-4801-be03-510749ffe34c', '5a74064b-4b7a-42c8-b851-d28062b17bec', 51.00, 0.00, 51.00, '2026-07-21 05:59:22.172765+02');


--
-- PostgreSQL database dump complete
--

