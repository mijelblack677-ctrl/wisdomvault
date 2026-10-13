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
-- Data for Name: premium_packs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.premium_packs (id, name, slug, description, long_description, price, icon_svg, thumbnail_url, category, is_active, display_order, created_at) VALUES ('2583b6ca-695b-43c5-8d3d-247457b6802e', 'Cybersecurity & Tech Mastery', 'cybersecurity-mastery', 'Complete pentesting, network security, and professional digital skills training.', 'From beginner reconnaissance to advanced exploitation. Includes ethical hacking labs, network defense blueprints, and paths to globally recognized certifications from Microsoft, Cisco, and CompTIA.', 25000.00, NULL, 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop&auto=format', 'Technology', true, 2, '2026-07-16 13:08:14.477039+02');
INSERT INTO public.premium_packs (id, name, slug, description, long_description, price, icon_svg, thumbnail_url, category, is_active, display_order, created_at) VALUES ('7b1443ef-89be-45f7-96ba-5f9519a4c53e', 'Wealth Architecture', 'wealth-architecture', 'Advanced investment strategies, stock market mastery, and generational wealth building.', 'Go beyond basic budgeting. Learn Malawi Stock Exchange investing, tax optimization, passive income systems, and the exact frameworks used by the financially independent. Includes retirement planning and estate management.', 20000.00, NULL, 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop&auto=format', 'Finance', true, 3, '2026-07-16 13:08:14.477039+02');
INSERT INTO public.premium_packs (id, name, slug, description, long_description, price, icon_svg, thumbnail_url, category, is_active, display_order, created_at) VALUES ('8c85eb04-419d-4bfe-8afa-c240c7d59cc6', 'Secret Library', 'secret-library', 'Rare manuscripts, suppressed histories, esoteric philosophy, and forbidden knowledge.', 'Unlock a vault within the Vault. Digitized works from hidden archives, ancient wisdom traditions, and texts that have been kept from public view for centuries. Each manuscript carefully restored and annotated.', 15000.00, NULL, 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=400&fit=crop&auto=format', 'Knowledge', true, 1, '2026-07-16 13:08:14.477039+02');
INSERT INTO public.premium_packs (id, name, slug, description, long_description, price, icon_svg, thumbnail_url, category, is_active, display_order, created_at) VALUES ('81d98f4b-1f99-43b9-a3b7-e165755a1549', 'Relationship Mastery', 'relationship-mastery', 'Deep psychological insights into human connection, communication, and lasting love.', 'Understand attachment styles, conflict resolution patterns, and the science behind unshakeable bonds. Combines research-backed strategies with timeless wisdom on marriage, family, and meaningful relationships.', 12000.00, NULL, 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=400&fit=crop&auto=format', 'Life', true, 4, '2026-07-16 13:08:14.477039+02');
INSERT INTO public.premium_packs (id, name, slug, description, long_description, price, icon_svg, thumbnail_url, category, is_active, display_order, created_at) VALUES ('3c959999-019e-456f-854d-5c14c065b7cd', 'Survival & Self-Reliance', 'survival-self-reliance', 'Crisis preparedness, off-grid living, and complete self-sufficiency skills.', 'From emergency medicine to food preservation, water purification to self-defense. Equip yourself with the knowledge to protect your family in any situation. Includes sustainable agriculture and natural resource management.', 18000.00, NULL, 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=800&h=400&fit=crop&auto=format', 'Skills', true, 5, '2026-07-16 13:08:14.477039+02');


--
-- PostgreSQL database dump complete
--

