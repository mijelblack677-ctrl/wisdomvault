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
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, full_name, email, phone, password_hash, referral_code, referred_by, is_founding_member, founding_member_number, registration_year, renewal_due_date, is_active, created_at, updated_at, payment_status) VALUES ('02d5564b-a41f-484b-a9ad-27872b1c0862', 'David Mukasa', 'david@example.com', '+256700000001', '$2b$10$XdpkxkADR2xvzLdkwEkWYO.iWghsTc900RaAaF82S0NsRTuXII8gK', 'DAVIPIQ1', NULL, true, 1, 2026, '2027-07-16', true, '2026-07-16 12:37:55.236325+02', '2026-07-16 12:37:55.236325+02', 'pending');
INSERT INTO public.users (id, full_name, email, phone, password_hash, referral_code, referred_by, is_founding_member, founding_member_number, registration_year, renewal_due_date, is_active, created_at, updated_at, payment_status) VALUES ('f2fa8ed9-0d45-445c-b095-ef8139494e2f', 'Grace Kato', 'grace@example.com', '+256700000002', '$2b$10$vIy6nesCJZhiBbSYjEkW5uY5akxvmBVljo9Mt5CT1.8gEQ2CR7NfC', 'GRAC3TUU', '02d5564b-a41f-484b-a9ad-27872b1c0862', true, 2, 2026, '2027-07-16', true, '2026-07-16 12:38:27.309459+02', '2026-07-16 12:38:27.309459+02', 'pending');
INSERT INTO public.users (id, full_name, email, phone, password_hash, referral_code, referred_by, is_founding_member, founding_member_number, registration_year, renewal_due_date, is_active, created_at, updated_at, payment_status) VALUES ('6290ea5a-2b55-4358-84f5-2204970d96e4', 'miracle black', 'mijelblack677@gmail.com', '+265992382525', '$2b$10$s.nkzrPyz9zWV/JLqUlK7.hqDJyQQw5Il6HYf8gF6UZdv.uI7hD9S', 'MIRAZQ87', NULL, true, 3, 2026, '2027-07-16', true, '2026-07-16 13:02:36.431374+02', '2026-07-16 13:02:36.431374+02', 'pending');
INSERT INTO public.users (id, full_name, email, phone, password_hash, referral_code, referred_by, is_founding_member, founding_member_number, registration_year, renewal_due_date, is_active, created_at, updated_at, payment_status) VALUES ('5a74064b-4b7a-42c8-b851-d28062b17bec', 'test', 'ba-lcs-19-24@unima.ac.mw', '0992446015', '$2b$10$XWpJY5ZLmYiTemRHmNE2wuNKqx3KREwWuEs/M7q5D6CYddz/qM8Sq', 'TESTOF6Z', NULL, true, 4, 2026, '2027-07-20', true, '2026-07-20 19:39:07.009329+02', '2026-07-20 19:59:47.074024+02', 'verified');


--
-- PostgreSQL database dump complete
--

