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
-- Data for Name: user_premium_packs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_premium_packs (id, user_id, pack_id, purchased_at, amount_paid, transaction_ref) VALUES ('ffcaee1d-4dfd-4218-9ac7-e82814e22424', '02d5564b-a41f-484b-a9ad-27872b1c0862', '2583b6ca-695b-43c5-8d3d-247457b6802e', '2026-07-19 06:40:40.287212+02', 25000.00, 'admin-grant-test');


--
-- PostgreSQL database dump complete
--

