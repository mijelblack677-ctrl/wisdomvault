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
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.transactions (id, wallet_id, referral_id, transaction_type, amount, balance_before, balance_after, description, created_at) VALUES ('f3afa2fb-59f2-4e11-a5a0-f1784f6d7056', '0f4bfeb7-02c6-4ca7-9061-461d6ac69b26', 'd441a0cd-8cd2-4391-9371-71eff4701d8c', 'referral_bonus', 6500.00, 0.00, 6500.00, 'Referral bonus for new member: Grace Kato', '2026-07-16 12:38:27.387589+02');
INSERT INTO public.transactions (id, wallet_id, referral_id, transaction_type, amount, balance_before, balance_after, description, created_at) VALUES ('28167dc9-2be6-4caa-b210-51a3cf2274a0', '0f4bfeb7-02c6-4ca7-9061-461d6ac69b26', NULL, 'withdrawal', 5200.00, 6500.00, 1300.00, 'Withdrawal: 5200 - 1040 fee = 4160 net', '2026-07-16 12:51:32.397674+02');
INSERT INTO public.transactions (id, wallet_id, referral_id, transaction_type, amount, balance_before, balance_after, description, created_at) VALUES ('a90ed3c9-40b6-48be-b792-9e89765e95e4', '0f4bfeb7-02c6-4ca7-9061-461d6ac69b26', NULL, 'withdrawal_fee', 1040.00, 6500.00, 1300.00, 'Withdrawal fee (20%)', '2026-07-16 12:51:32.408713+02');
INSERT INTO public.transactions (id, wallet_id, referral_id, transaction_type, amount, balance_before, balance_after, description, created_at) VALUES ('dfe0dfcd-0430-473f-939f-b7f969e244a1', '9b74bd9e-66ca-4148-8cef-c0789afb1e85', NULL, 'referral_bonus', 50.00, 0.00, 50.00, 'Earned from watching: Future of AI Technology', '2026-07-20 18:15:44.149176+02');
INSERT INTO public.transactions (id, wallet_id, referral_id, transaction_type, amount, balance_before, balance_after, description, created_at) VALUES ('5a074630-fabe-4c84-8467-a751fd1f3a99', '9b74bd9e-66ca-4148-8cef-c0789afb1e85', NULL, 'referral_bonus', 51.00, 50.00, 101.00, 'Earned from watching: test1', '2026-07-20 18:35:41.148658+02');
INSERT INTO public.transactions (id, wallet_id, referral_id, transaction_type, amount, balance_before, balance_after, description, created_at) VALUES ('627227f2-93d1-40cd-9ccf-5978a41834a9', '9b74bd9e-66ca-4148-8cef-c0789afb1e85', NULL, 'referral_bonus', 30.00, 101.00, 131.00, 'Earned from watching: Afrobeat Vibes Mix', '2026-07-20 18:38:11.598747+02');
INSERT INTO public.transactions (id, wallet_id, referral_id, transaction_type, amount, balance_before, balance_after, description, created_at) VALUES ('2872fed9-f554-47d4-91ea-78e59d2cf6bf', '9b74bd9e-66ca-4148-8cef-c0789afb1e85', NULL, 'referral_bonus', 75.00, 131.00, 206.00, 'Earned from watching: Smart Investing Tips', '2026-07-20 18:41:34.57979+02');
INSERT INTO public.transactions (id, wallet_id, referral_id, transaction_type, amount, balance_before, balance_after, description, created_at) VALUES ('5e764c03-c9fc-42a9-83cc-485ee58e92aa', '9b74bd9e-66ca-4148-8cef-c0789afb1e85', NULL, 'referral_bonus', 40.00, 206.00, 246.00, 'Earned from watching: Wellness & Meditation', '2026-07-20 18:42:04.086553+02');
INSERT INTO public.transactions (id, wallet_id, referral_id, transaction_type, amount, balance_before, balance_after, description, created_at) VALUES ('51d2f708-cbf7-4bbc-ac3e-b440064f27b8', '9b74bd9e-66ca-4148-8cef-c0789afb1e85', NULL, 'referral_bonus', 60.00, 246.00, 306.00, 'Earned from watching: Digital Skills for 2026', '2026-07-20 18:42:22.576368+02');
INSERT INTO public.transactions (id, wallet_id, referral_id, transaction_type, amount, balance_before, balance_after, description, created_at) VALUES ('bb84bbc6-db52-4995-8c4a-9ac1becf01f7', '71808b83-16fd-4801-be03-510749ffe34c', NULL, 'referral_bonus', 51.00, 0.00, 51.00, 'Earned from watching: test1', '2026-07-21 05:59:22.268905+02');


--
-- PostgreSQL database dump complete
--

