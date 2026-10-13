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
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.admin_users (id, username, email, password_hash, role, is_active, last_login, created_at) VALUES ('889b4d3c-39cd-4656-b91d-92b648815f2c', 'admin', 'admin@wisdomvault.com', '$2b$10$u9xS4TFkvVGr7kb9eaXtH.xGTzjIccCffRkG6.2qplTSQIqV0INaK', 'super_admin', true, NULL, '2026-07-16 16:29:51.213613+02');


--
-- Data for Name: admin_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.admin_sessions (id, admin_id, token, expires_at, created_at) VALUES ('0d47af66-9f63-47eb-9674-e8b2e0188c52', '889b4d3c-39cd-4656-b91d-92b648815f2c', 'f6f78f80-3ad9-4e84-9ae2-d33a354e7c48', '2026-07-17 16:34:37.857+02', '2026-07-16 16:34:37.857652+02');
INSERT INTO public.admin_sessions (id, admin_id, token, expires_at, created_at) VALUES ('113edfe9-6d26-4590-a587-279b4f05bb80', '889b4d3c-39cd-4656-b91d-92b648815f2c', '23d20e2a-2453-48b4-8815-7812173b4777', '2026-07-17 16:34:49.02+02', '2026-07-16 16:34:49.021034+02');
INSERT INTO public.admin_sessions (id, admin_id, token, expires_at, created_at) VALUES ('6257b9b4-d3c6-4a5a-971a-a5f757aaaac9', '889b4d3c-39cd-4656-b91d-92b648815f2c', 'b352ec35-90ae-4592-a067-03ba1d4f1655', '2026-07-17 17:56:09.499+02', '2026-07-16 17:56:09.500171+02');
INSERT INTO public.admin_sessions (id, admin_id, token, expires_at, created_at) VALUES ('3fb48217-86ca-474d-a700-92addcf07714', '889b4d3c-39cd-4656-b91d-92b648815f2c', '45a69ffb-a278-4b32-a5cf-ba1ac16291db', '2026-07-17 18:11:52.297+02', '2026-07-16 18:11:52.297781+02');
INSERT INTO public.admin_sessions (id, admin_id, token, expires_at, created_at) VALUES ('7cd288cc-4185-45da-aae1-cbfc725882cd', '889b4d3c-39cd-4656-b91d-92b648815f2c', '9ee5b7cd-63ab-486f-a851-024a3a1a49f3', '2026-07-17 18:34:19.436+02', '2026-07-16 18:34:19.43674+02');
INSERT INTO public.admin_sessions (id, admin_id, token, expires_at, created_at) VALUES ('368fbd63-bf38-4cf1-9e16-1977b1f46880', '889b4d3c-39cd-4656-b91d-92b648815f2c', '6c7088fd-99b5-4f26-8ecb-90daddfd159c', '2026-07-20 06:16:52.577+02', '2026-07-19 06:16:52.578311+02');
INSERT INTO public.admin_sessions (id, admin_id, token, expires_at, created_at) VALUES ('fd45a698-7bd2-43ff-91c8-0a4fb47fe606', '889b4d3c-39cd-4656-b91d-92b648815f2c', 'a37daa7b-6625-48df-819e-673e2816d562', '2026-07-21 18:17:43.723+02', '2026-07-20 18:17:43.724007+02');
INSERT INTO public.admin_sessions (id, admin_id, token, expires_at, created_at) VALUES ('88899913-52da-4baa-a706-5de8c9fe1b56', '889b4d3c-39cd-4656-b91d-92b648815f2c', '24d2b060-ba98-4e7e-99fb-1b39cadd9a0d', '2026-07-21 19:52:30.324+02', '2026-07-20 19:52:30.324722+02');


--
-- Data for Name: content_categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.content_categories (id, name, slug, description, icon_svg, display_order, is_active, created_at) VALUES ('8919f67b-6a4e-47ee-8db6-6467667180f8', 'Books for the Wise', 'books-for-the-wise', 'Curated books on wisdom, philosophy, and personal growth', NULL, 1, true, '2026-07-16 12:20:39.759852+02');
INSERT INTO public.content_categories (id, name, slug, description, icon_svg, display_order, is_active, created_at) VALUES ('e1689ee8-af8f-48fc-a1ef-c81dece6e717', 'Life Teachings', 'life-teachings', 'Bible studies, spiritual growth, and practical faith', NULL, 2, true, '2026-07-16 12:20:39.759852+02');
INSERT INTO public.content_categories (id, name, slug, description, icon_svg, display_order, is_active, created_at) VALUES ('a91f1252-9313-437a-a3b9-ac65725ba7a3', 'Practical Guides', 'practical-guides', 'Step-by-step instructions for everyday skills', NULL, 3, true, '2026-07-16 12:20:39.759852+02');
INSERT INTO public.content_categories (id, name, slug, description, icon_svg, display_order, is_active, created_at) VALUES ('c71078ce-a36d-4a16-bc97-a3d966a7ed54', 'Wise Sayings & Counsel', 'wise-sayings', 'Wisdom advisory, life decisions, and relationship guidance', NULL, 4, true, '2026-07-16 12:20:39.759852+02');
INSERT INTO public.content_categories (id, name, slug, description, icon_svg, display_order, is_active, created_at) VALUES ('78797b1e-57b0-4ba7-864b-0d2d9ed754ec', 'Kitchen & Nourishment', 'kitchen-nourishment', 'Recipes, meal plans, and healthy eating guides', NULL, 5, true, '2026-07-16 12:20:39.759852+02');
INSERT INTO public.content_categories (id, name, slug, description, icon_svg, display_order, is_active, created_at) VALUES ('19e7925f-60d0-4431-808c-12cd46b2fb38', 'Foundation Courses', 'foundation-courses', 'Essential courses included with your membership', NULL, 6, true, '2026-07-16 12:20:39.759852+02');


--
-- Data for Name: content_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('80cdb8b4-99bd-4165-aeae-f4df3da7cd88', '8919f67b-6a4e-47ee-8db6-6467667180f8', 'Meditations - Marcus Aurelius', 'meditations', 'The personal reflections of a Roman emperor on Stoic philosophy — finding peace in chaos.', 'book', NULL, NULL, 'Marcus Aurelius', false, true, 0, '2026-07-16 14:47:01.347675+02', '2026-07-16 14:47:01.347675+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('f1f36be0-f86d-413c-9c41-d67f419b43d0', '8919f67b-6a4e-47ee-8db6-6467667180f8', 'The Prophet - Kahlil Gibran', 'the-prophet', 'Poetic wisdom on love, marriage, work, freedom, and the depths of the human spirit.', 'book', NULL, NULL, 'Kahlil Gibran', false, true, 0, '2026-07-16 14:47:01.358888+02', '2026-07-16 14:47:01.358888+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('a1a6bdab-b68a-4204-8edc-27dd012aa38b', 'e1689ee8-af8f-48fc-a1ef-c81dece6e717', 'The Book of Proverbs - Study Guide', 'proverbs-study', 'Verse-by-verse exploration of Solomon''s wisdom with practical daily applications.', 'teaching', NULL, NULL, 'Wisdom Vault', true, true, 0, '2026-07-16 14:47:01.381021+02', '2026-07-16 14:47:01.381021+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('b55bb89f-fad6-4b13-8196-8a0d60efa003', 'e1689ee8-af8f-48fc-a1ef-c81dece6e717', 'Understanding the Psalms', 'psalms-study', 'Deep dive into the poetry, structure, and spiritual depth of the Psalms for prayer and worship.', 'teaching', NULL, NULL, 'Wisdom Vault', false, true, 0, '2026-07-16 14:47:01.391604+02', '2026-07-16 14:47:01.391604+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('bdad8ca4-5927-4cf8-a6f2-5c366add9f73', 'e1689ee8-af8f-48fc-a1ef-c81dece6e717', 'The Life of Christ - Chronological Journey', 'life-of-christ', 'Walk through Jesus'' life in order, understanding every major event in its historical context.', 'teaching', NULL, NULL, 'Wisdom Vault', false, true, 0, '2026-07-16 14:47:01.402805+02', '2026-07-16 14:47:01.402805+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('652d283a-caf6-42fe-9844-bb444d53a31f', 'e1689ee8-af8f-48fc-a1ef-c81dece6e717', 'Spiritual Disciplines for Modern Life', 'spiritual-disciplines', 'Practical guidance on prayer, fasting, meditation, and solitude for today''s busy world.', 'teaching', NULL, NULL, 'Wisdom Vault', false, true, 0, '2026-07-16 14:47:01.413921+02', '2026-07-16 14:47:01.413921+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('03f1630f-3527-4dcb-939e-1684122e52bd', 'a91f1252-9313-437a-a3b9-ac65725ba7a3', 'Starting a Small Business - Complete Blueprint', 'small-business-blueprint', 'From idea validation to first sale. Launch a profitable small business with minimal capital.', 'guide', NULL, NULL, NULL, true, true, 0, '2026-07-16 14:47:01.425019+02', '2026-07-16 14:47:01.425019+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('07c10079-fbcb-4baf-b884-7657d0001720', 'a91f1252-9313-437a-a3b9-ac65725ba7a3', 'Personal Budgeting That Works', 'personal-budgeting', 'The 50-30-20 rule and beyond. Practical templates to take control of your finances in 30 days.', 'guide', NULL, NULL, NULL, false, true, 0, '2026-07-16 14:47:01.435806+02', '2026-07-16 14:47:01.435806+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('406f7ade-e1e5-4c13-babd-bc28eab3c729', 'a91f1252-9313-437a-a3b9-ac65725ba7a3', 'Public Speaking & Confidence', 'public-speaking', 'Overcome fear, structure compelling talks, and speak with confidence in any setting.', 'guide', NULL, NULL, NULL, false, true, 0, '2026-07-16 14:47:01.446953+02', '2026-07-16 14:47:01.446953+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('94ee72da-741f-4822-8d62-505fdf574276', 'a91f1252-9313-437a-a3b9-ac65725ba7a3', 'Digital Literacy & Smartphone Mastery', 'digital-literacy', 'Master your smartphone, mobile money, online safety, and essential apps for daily life.', 'guide', NULL, NULL, NULL, false, true, 0, '2026-07-16 14:47:01.457959+02', '2026-07-16 14:47:01.457959+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('1a6fe9cf-3773-4443-966e-bdf2faa64c6f', 'c71078ce-a36d-4a16-bc97-a3d966a7ed54', 'Navigating Major Life Decisions', 'life-decisions', 'A framework for making wise choices about career, relocation, relationships, and purpose.', 'counsel', NULL, NULL, NULL, true, true, 0, '2026-07-16 14:47:01.468916+02', '2026-07-16 14:47:01.468916+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('183e244e-38f2-4fec-82c8-c60898a26e80', 'c71078ce-a36d-4a16-bc97-a3d966a7ed54', 'Conflict Resolution in Relationships', 'conflict-resolution', 'Proven strategies for resolving disagreements, rebuilding trust, and strengthening bonds.', 'counsel', NULL, NULL, NULL, false, true, 0, '2026-07-16 14:47:01.479695+02', '2026-07-16 14:47:01.479695+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('c7a9685e-2904-483b-937f-6a2933c06e74', 'c71078ce-a36d-4a16-bc97-a3d966a7ed54', 'Finding Your Purpose & Calling', 'finding-purpose', 'Step-by-step exercises and reflections to discover what you were truly meant to do.', 'counsel', NULL, NULL, NULL, false, true, 0, '2026-07-16 14:47:01.490655+02', '2026-07-16 14:47:01.490655+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('36ffb2d2-b82e-4633-84b3-2fd1e451b1b5', 'c71078ce-a36d-4a16-bc97-a3d966a7ed54', 'Parenting with Wisdom', 'parenting-wisdom', 'Timeless principles for raising confident, respectful, and resilient children.', 'counsel', NULL, NULL, NULL, false, true, 0, '2026-07-16 14:47:01.501689+02', '2026-07-16 14:47:01.501689+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('bd3e26f4-fa37-4c5c-a860-de4c5bd7f220', '78797b1e-57b0-4ba7-864b-0d2d9ed754ec', 'Modern Malawian Cuisine', 'malawian-cuisine', 'Elevating traditional dishes with modern techniques. Nsima, Ndiwo, Mandasi, and beyond.', 'recipe', NULL, NULL, NULL, true, true, 0, '2026-07-16 14:47:01.512974+02', '2026-07-16 14:47:01.512974+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('1ea2d640-54c0-4fb8-a33a-8b33cf474974', '78797b1e-57b0-4ba7-864b-0d2d9ed754ec', 'Healthy Eating on a Budget', 'healthy-eating-budget', 'Nutritious meal plans that prove healthy food is affordable for every family.', 'recipe', NULL, NULL, NULL, false, true, 0, '2026-07-16 14:47:01.523741+02', '2026-07-16 14:47:01.523741+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('2523098b-565b-4509-aebc-6e387719701c', '78797b1e-57b0-4ba7-864b-0d2d9ed754ec', '30-Day Family Meal Planner', 'family-meal-planner', 'A complete month of breakfast, lunch, and dinner with shopping lists included.', 'recipe', NULL, NULL, NULL, false, true, 0, '2026-07-16 14:47:01.535064+02', '2026-07-16 14:47:01.535064+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('04f23ca8-de86-4978-b0b0-29dea68a60e7', '19e7925f-60d0-4431-808c-12cd46b2fb38', 'Personal Finance for Beginners', 'personal-finance-beginners', 'Master budgeting, saving, and debt management. The essential money skills for everyone.', 'course', NULL, NULL, NULL, true, true, 0, '2026-07-16 14:47:01.546098+02', '2026-07-16 14:47:01.546098+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('4b0e8216-b492-4287-962c-8896c96c7f42', '19e7925f-60d0-4431-808c-12cd46b2fb38', 'Goal Setting & Achievement Systems', 'goal-setting', 'A framework for setting meaningful goals and building systems that make success inevitable.', 'course', NULL, NULL, NULL, false, true, 0, '2026-07-16 14:47:01.556786+02', '2026-07-16 14:47:01.556786+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('db45e347-e25c-4fce-be86-04ffb5819a8d', '19e7925f-60d0-4431-808c-12cd46b2fb38', 'Effective Communication Mastery', 'communication-mastery', 'Speak clearly, listen deeply, and influence positively in personal and professional settings.', 'course', NULL, NULL, NULL, false, true, 0, '2026-07-16 14:47:01.568083+02', '2026-07-16 14:47:01.568083+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('bed73763-a270-4726-a68f-8b9f4521f28f', '19e7925f-60d0-4431-808c-12cd46b2fb38', 'Affiliate Marketing Mastery', 'affiliate-marketing-mastery', 'Learn how to build a profitable affiliate marketing business from scratch. Master traffic generation, conversion optimization, and passive income strategies used by top affiliates worldwide.', 'course', '/uploads/1784435436894_brotherskaramaz00dost.epub', NULL, 'Wisdom Vault', true, true, 0, '2026-07-19 06:04:06.755271+02', '2026-07-19 06:30:36.910504+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('ddf28d6e-36e2-4248-92c1-d27bf47f12cd', '19e7925f-60d0-4431-808c-12cd46b2fb38', 'Social Media Monetization', 'social-media-monetization', 'Turn your social media presence into a revenue stream. Learn content strategy, audience growth, brand deals, and platform-specific monetization techniques.', 'course', NULL, NULL, 'Wisdom Vault', false, true, 0, '2026-07-19 06:04:07.667228+02', '2026-07-19 06:04:07.667228+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('8f43d6c6-3585-473b-b69c-ac63a11d462f', '8919f67b-6a4e-47ee-8db6-6467667180f8', 'The Art of War - Annotated Edition', 'art-of-war', 'Sun Tzu''s timeless strategy classic with modern commentary for business, leadership, and daily life.', 'book', '/uploads/test_document.txt', NULL, 'Sun Tzu', true, true, 0, '2026-07-16 14:47:01.336483+02', '2026-07-19 06:47:11.882763+02');
INSERT INTO public.content_items (id, category_id, title, slug, description, content_type, file_url, thumbnail_url, author, is_featured, is_published, view_count, created_at, updated_at) VALUES ('7168242e-bb94-454b-a74d-4f286a1e3439', '8919f67b-6a4e-47ee-8db6-6467667180f8', 'African Proverbs & Philosophy', 'african-proverbs', 'A curated treasury of profound proverbs and philosophical insights from across the African continent.', 'book', '/uploads/1784435250344_brotherskaramaz00dost.epub', NULL, 'Various', false, true, 0, '2026-07-16 14:47:01.369961+02', '2026-07-19 06:27:30.359707+02');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, full_name, email, phone, password_hash, referral_code, referred_by, is_founding_member, founding_member_number, registration_year, renewal_due_date, is_active, created_at, updated_at, payment_status) VALUES ('02d5564b-a41f-484b-a9ad-27872b1c0862', 'David Mukasa', 'david@example.com', '+256700000001', '$2b$10$XdpkxkADR2xvzLdkwEkWYO.iWghsTc900RaAaF82S0NsRTuXII8gK', 'DAVIPIQ1', NULL, true, 1, 2026, '2027-07-16', true, '2026-07-16 12:37:55.236325+02', '2026-07-16 12:37:55.236325+02', 'pending');
INSERT INTO public.users (id, full_name, email, phone, password_hash, referral_code, referred_by, is_founding_member, founding_member_number, registration_year, renewal_due_date, is_active, created_at, updated_at, payment_status) VALUES ('f2fa8ed9-0d45-445c-b095-ef8139494e2f', 'Grace Kato', 'grace@example.com', '+256700000002', '$2b$10$vIy6nesCJZhiBbSYjEkW5uY5akxvmBVljo9Mt5CT1.8gEQ2CR7NfC', 'GRAC3TUU', '02d5564b-a41f-484b-a9ad-27872b1c0862', true, 2, 2026, '2027-07-16', true, '2026-07-16 12:38:27.309459+02', '2026-07-16 12:38:27.309459+02', 'pending');
INSERT INTO public.users (id, full_name, email, phone, password_hash, referral_code, referred_by, is_founding_member, founding_member_number, registration_year, renewal_due_date, is_active, created_at, updated_at, payment_status) VALUES ('6290ea5a-2b55-4358-84f5-2204970d96e4', 'miracle black', 'mijelblack677@gmail.com', '+265992382525', '$2b$10$s.nkzrPyz9zWV/JLqUlK7.hqDJyQQw5Il6HYf8gF6UZdv.uI7hD9S', 'MIRAZQ87', NULL, true, 3, 2026, '2027-07-16', true, '2026-07-16 13:02:36.431374+02', '2026-07-16 13:02:36.431374+02', 'pending');
INSERT INTO public.users (id, full_name, email, phone, password_hash, referral_code, referred_by, is_founding_member, founding_member_number, registration_year, renewal_due_date, is_active, created_at, updated_at, payment_status) VALUES ('5a74064b-4b7a-42c8-b851-d28062b17bec', 'test', 'ba-lcs-19-24@unima.ac.mw', '0992446015', '$2b$10$XWpJY5ZLmYiTemRHmNE2wuNKqx3KREwWuEs/M7q5D6CYddz/qM8Sq', 'TESTOF6Z', NULL, true, 4, 2026, '2027-07-20', true, '2026-07-20 19:39:07.009329+02', '2026-07-20 19:59:47.074024+02', 'verified');


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notifications (id, user_id, type, title, message, link, is_read, created_at) VALUES ('8ebcd288-0f06-4ae0-af25-62a66076ad8b', '02d5564b-a41f-484b-a9ad-27872b1c0862', 'referral_bonus', 'Referral Bonus Received!', 'Grace Kato joined using your referral link. You earned 6,500!', '/dashboard', false, '2026-07-16 17:29:07.865063+02');
INSERT INTO public.notifications (id, user_id, type, title, message, link, is_read, created_at) VALUES ('50d563da-26c0-4d32-a7b1-0c4d7d968701', '5a74064b-4b7a-42c8-b851-d28062b17bec', 'payment_approved', 'Account Activated!', 'Your payment has been verified. Welcome to Wisdom Vault!', '/dashboard', false, '2026-07-20 19:59:47.099393+02');


--
-- Data for Name: premium_packs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.premium_packs (id, name, slug, description, long_description, price, icon_svg, thumbnail_url, category, is_active, display_order, created_at) VALUES ('2583b6ca-695b-43c5-8d3d-247457b6802e', 'Cybersecurity & Tech Mastery', 'cybersecurity-mastery', 'Complete pentesting, network security, and professional digital skills training.', 'From beginner reconnaissance to advanced exploitation. Includes ethical hacking labs, network defense blueprints, and paths to globally recognized certifications from Microsoft, Cisco, and CompTIA.', 25000.00, NULL, 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop&auto=format', 'Technology', true, 2, '2026-07-16 13:08:14.477039+02');
INSERT INTO public.premium_packs (id, name, slug, description, long_description, price, icon_svg, thumbnail_url, category, is_active, display_order, created_at) VALUES ('7b1443ef-89be-45f7-96ba-5f9519a4c53e', 'Wealth Architecture', 'wealth-architecture', 'Advanced investment strategies, stock market mastery, and generational wealth building.', 'Go beyond basic budgeting. Learn Malawi Stock Exchange investing, tax optimization, passive income systems, and the exact frameworks used by the financially independent. Includes retirement planning and estate management.', 20000.00, NULL, 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop&auto=format', 'Finance', true, 3, '2026-07-16 13:08:14.477039+02');
INSERT INTO public.premium_packs (id, name, slug, description, long_description, price, icon_svg, thumbnail_url, category, is_active, display_order, created_at) VALUES ('8c85eb04-419d-4bfe-8afa-c240c7d59cc6', 'Secret Library', 'secret-library', 'Rare manuscripts, suppressed histories, esoteric philosophy, and forbidden knowledge.', 'Unlock a vault within the Vault. Digitized works from hidden archives, ancient wisdom traditions, and texts that have been kept from public view for centuries. Each manuscript carefully restored and annotated.', 15000.00, NULL, 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=400&fit=crop&auto=format', 'Knowledge', true, 1, '2026-07-16 13:08:14.477039+02');
INSERT INTO public.premium_packs (id, name, slug, description, long_description, price, icon_svg, thumbnail_url, category, is_active, display_order, created_at) VALUES ('81d98f4b-1f99-43b9-a3b7-e165755a1549', 'Relationship Mastery', 'relationship-mastery', 'Deep psychological insights into human connection, communication, and lasting love.', 'Understand attachment styles, conflict resolution patterns, and the science behind unshakeable bonds. Combines research-backed strategies with timeless wisdom on marriage, family, and meaningful relationships.', 12000.00, NULL, 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=400&fit=crop&auto=format', 'Life', true, 4, '2026-07-16 13:08:14.477039+02');
INSERT INTO public.premium_packs (id, name, slug, description, long_description, price, icon_svg, thumbnail_url, category, is_active, display_order, created_at) VALUES ('3c959999-019e-456f-854d-5c14c065b7cd', 'Survival & Self-Reliance', 'survival-self-reliance', 'Crisis preparedness, off-grid living, and complete self-sufficiency skills.', 'From emergency medicine to food preservation, water purification to self-defense. Equip yourself with the knowledge to protect your family in any situation. Includes sustainable agriculture and natural resource management.', 18000.00, NULL, 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=800&h=400&fit=crop&auto=format', 'Skills', true, 5, '2026-07-16 13:08:14.477039+02');


--
-- Data for Name: payment_proofs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: platform_config; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.platform_config (id, config_key, config_value, description, updated_at) VALUES ('fb9a0b5e-e8b1-4705-9821-863fb624a8b4', 'registration_fee_year1', '13000', 'First year registration fee in local currency', '2026-07-16 12:20:39.716264+02');
INSERT INTO public.platform_config (id, config_key, config_value, description, updated_at) VALUES ('e2bdb6b6-17a7-48f2-85b0-18f6d4392bd6', 'registration_fee_renewal', '5000', 'Annual renewal fee in local currency', '2026-07-16 12:20:39.716264+02');
INSERT INTO public.platform_config (id, config_key, config_value, description, updated_at) VALUES ('b963e7e9-04d0-4d1d-b45d-69edd61a5485', 'referral_bonus_standard', '5200', 'Standard referral bonus per new member', '2026-07-16 12:20:39.716264+02');
INSERT INTO public.platform_config (id, config_key, config_value, description, updated_at) VALUES ('39e2350b-f246-4590-aaab-b0385636ecbb', 'referral_bonus_founding', '6500', 'Founding member referral bonus (first 100)', '2026-07-16 12:20:39.716264+02');
INSERT INTO public.platform_config (id, config_key, config_value, description, updated_at) VALUES ('f560814f-af56-4b2e-8c5b-334659147bff', 'referral_bonus_renewal', '1000', 'Bonus when a referred member renews', '2026-07-16 12:20:39.716264+02');
INSERT INTO public.platform_config (id, config_key, config_value, description, updated_at) VALUES ('d9637788-7f9a-49a8-bc30-204963952b57', 'withdrawal_fee_percent', '20', 'Platform withdrawal fee percentage', '2026-07-16 12:20:39.716264+02');
INSERT INTO public.platform_config (id, config_key, config_value, description, updated_at) VALUES ('ddfb6381-4fd7-40da-ae62-08801e458609', 'withdrawal_min_amount', '5200', 'Minimum withdrawal amount', '2026-07-16 12:20:39.716264+02');
INSERT INTO public.platform_config (id, config_key, config_value, description, updated_at) VALUES ('b25cf75e-ded7-4d8b-b190-6145ed1b64bc', 'founding_member_limit', '100', 'Maximum number of founding members', '2026-07-16 12:20:39.716264+02');
INSERT INTO public.platform_config (id, config_key, config_value, description, updated_at) VALUES ('afb0d944-cc47-4d66-ae68-ef8973c8c386', 'refund_days', '7', 'Number of days for no-questions-asked refund', '2026-07-16 12:20:39.716264+02');
INSERT INTO public.platform_config (id, config_key, config_value, description, updated_at) VALUES ('873310c3-4efa-4fcb-abc2-84e72d98b13f', 'registration_fee_mwk', '13000', 'Registration fee in MWK', '2026-07-20 19:37:08.832034+02');
INSERT INTO public.platform_config (id, config_key, config_value, description, updated_at) VALUES ('ec43465d-0fc1-4124-aa2d-864ba1c94927', 'registration_fee_usd', '8', 'Registration fee in USD', '2026-07-20 19:37:08.832034+02');
INSERT INTO public.platform_config (id, config_key, config_value, description, updated_at) VALUES ('b6d31d27-2013-436a-a159-e7ac44ef2d64', 'whatsapp_number', '+265888000000', 'Admin WhatsApp number for support', '2026-07-20 19:37:08.832034+02');
INSERT INTO public.platform_config (id, config_key, config_value, description, updated_at) VALUES ('f725cb26-7479-4be1-bf30-e2c789583043', 'agent_code_1', '*405*123456#', 'Primary agent code for payments', '2026-07-20 19:37:08.832034+02');
INSERT INTO public.platform_config (id, config_key, config_value, description, updated_at) VALUES ('7852712d-979f-43cd-b124-6180d5da938d', 'agent_code_2', '*405*789012#', 'Secondary agent code for payments', '2026-07-20 19:37:08.832034+02');
INSERT INTO public.platform_config (id, config_key, config_value, description, updated_at) VALUES ('446793ac-c03c-4eb2-9c94-d3c853a4023b', 'agent_name_1', 'Agent Wongani', 'Primary agent name', '2026-07-20 19:37:08.832034+02');
INSERT INTO public.platform_config (id, config_key, config_value, description, updated_at) VALUES ('624d911f-9162-48f2-b179-1b3f745c89d2', 'agent_name_2', 'Agent Chimwemwe', 'Secondary agent name', '2026-07-20 19:37:08.832034+02');


--
-- Data for Name: premium_content_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.premium_content_items (id, pack_id, title, description, content_type, file_url, display_order, created_at) VALUES ('642d8949-cca5-413c-8fb5-f7360cbf2c32', '8c85eb04-419d-4bfe-8afa-c240c7d59cc6', 'The Kybalion - Hermetic Philosophy', 'The seven hermetic principles explained. The foundation of ancient esoteric wisdom.', 'pdf', NULL, 1, '2026-07-16 17:10:28.940766+02');
INSERT INTO public.premium_content_items (id, pack_id, title, description, content_type, file_url, display_order, created_at) VALUES ('c1b930d3-e98a-40b5-ac7c-7f9e26b2b26f', '8c85eb04-419d-4bfe-8afa-c240c7d59cc6', 'The Emerald Tablets of Thoth', 'Translated and annotated. Ancient Atlantean wisdom for the modern seeker.', 'pdf', NULL, 2, '2026-07-16 17:10:28.95583+02');
INSERT INTO public.premium_content_items (id, pack_id, title, description, content_type, file_url, display_order, created_at) VALUES ('f8f48faa-9541-4b2b-a209-79a4da317ff5', '2583b6ca-695b-43c5-8d3d-247457b6802e', 'Network Penetration Testing - Lab Guide', 'Hands-on labs covering reconnaissance, scanning, exploitation, and reporting.', 'guide', NULL, 1, '2026-07-16 17:10:28.966993+02');
INSERT INTO public.premium_content_items (id, pack_id, title, description, content_type, file_url, display_order, created_at) VALUES ('8653aac2-421a-48c5-8e2a-a6d33de0497f', '2583b6ca-695b-43c5-8d3d-247457b6802e', 'Web Application Security - OWASP Top 10', 'Complete guide to the most critical web application security risks with mitigation strategies.', 'guide', NULL, 2, '2026-07-16 17:10:28.977999+02');
INSERT INTO public.premium_content_items (id, pack_id, title, description, content_type, file_url, display_order, created_at) VALUES ('ded5f1a0-2510-4c11-affa-13a385c032e5', '7b1443ef-89be-45f7-96ba-5f9519a4c53e', 'Investment Portfolio Template', 'Ready-to-use spreadsheet for tracking and optimizing your investment portfolio.', 'tool', NULL, 1, '2026-07-16 17:10:28.989031+02');
INSERT INTO public.premium_content_items (id, pack_id, title, description, content_type, file_url, display_order, created_at) VALUES ('aa99bc06-5d2a-445b-b594-8a8a089a4862', '7b1443ef-89be-45f7-96ba-5f9519a4c53e', 'Tax Optimization Strategies', 'Legal frameworks for minimizing tax liability and maximizing retained earnings.', 'guide', NULL, 2, '2026-07-16 17:10:28.999839+02');
INSERT INTO public.premium_content_items (id, pack_id, title, description, content_type, file_url, display_order, created_at) VALUES ('846f35b2-e319-4cc0-9560-6eae003a2482', '81d98f4b-1f99-43b9-a3b7-e165755a1549', 'Attachment Styles - Complete Assessment', 'Understand your attachment style and how it affects every relationship in your life.', 'guide', NULL, 1, '2026-07-16 17:10:29.010892+02');
INSERT INTO public.premium_content_items (id, pack_id, title, description, content_type, file_url, display_order, created_at) VALUES ('fa8a6938-7fcd-48af-8be4-09ce79c8cfa8', '3c959999-019e-456f-854d-5c14c065b7cd', 'Emergency First Aid - Field Manual', 'Essential medical knowledge for crisis situations when professional help is unavailable.', 'guide', NULL, 1, '2026-07-16 17:10:29.021934+02');
INSERT INTO public.premium_content_items (id, pack_id, title, description, content_type, file_url, display_order, created_at) VALUES ('756aef1b-3f70-4250-97ec-1ac80b1d41d3', '7b1443ef-89be-45f7-96ba-5f9519a4c53e', 'Affiliate Network Blueprint', 'Complete guide to joining and profiting from top affiliate networks like Jumia, Amazon, ClickBank, and local programs.', 'guide', NULL, 3, '2026-07-19 06:04:50.7606+02');
INSERT INTO public.premium_content_items (id, pack_id, title, description, content_type, file_url, display_order, created_at) VALUES ('6228edc5-dd94-4be0-b8c0-e6ca07e57a3f', '7b1443ef-89be-45f7-96ba-5f9519a4c53e', 'Traffic Generation Mastery', 'Advanced strategies for driving targeted traffic using SEO, social media, paid ads, and email marketing for affiliate offers.', 'course', NULL, 4, '2026-07-19 06:04:50.865247+02');
INSERT INTO public.premium_content_items (id, pack_id, title, description, content_type, file_url, display_order, created_at) VALUES ('c0333588-5f01-4815-bebc-835368545720', '7b1443ef-89be-45f7-96ba-5f9519a4c53e', 'Conversion Rate Optimization', 'Proven techniques to increase your affiliate conversion rates. Landing page design, copywriting, and A/B testing frameworks.', 'guide', NULL, 5, '2026-07-19 06:04:50.876372+02');


--
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.referrals (id, referrer_id, referred_id, referral_type, registration_year, bonus_amount, is_paid, created_at) VALUES ('d441a0cd-8cd2-4391-9371-71eff4701d8c', '02d5564b-a41f-484b-a9ad-27872b1c0862', 'f2fa8ed9-0d45-445c-b095-ef8139494e2f', 'registration', 2026, 6500.00, true, '2026-07-16 12:38:27.345579+02');


--
-- Data for Name: sponsored_content; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sponsored_content (id, title, description, content_type, file_url, thumbnail_url, sponsor_name, reward_amount, duration_seconds, is_active, display_order, created_at, external_link) VALUES ('d61bd8a9-7799-4acb-b4dd-dbbc05499094', 'Future of AI Technology', 'Watch this short clip about artificial intelligence advancements.', 'video', '/uploads/sponsored/default-video.mp4', NULL, 'TechHub Africa', 50.00, 45, true, 1, '2026-07-20 18:02:30.346305+02', NULL);
INSERT INTO public.sponsored_content (id, title, description, content_type, file_url, thumbnail_url, sponsor_name, reward_amount, duration_seconds, is_active, display_order, created_at, external_link) VALUES ('39850b20-6cfc-4ecd-a078-49386395e788', 'Afrobeat Vibes Mix', 'Listen to this sponsored Afrobeat track and earn.', 'audio', '/uploads/sponsored/default-video.mp4', NULL, 'MusicWave', 30.00, 30, true, 2, '2026-07-20 18:02:30.346305+02', NULL);
INSERT INTO public.sponsored_content (id, title, description, content_type, file_url, thumbnail_url, sponsor_name, reward_amount, duration_seconds, is_active, display_order, created_at, external_link) VALUES ('5c7a1f05-fe1d-45e5-b936-b9e3628ef3fb', 'Smart Investing Tips', 'Quick video on smart investment strategies for beginners.', 'video', '/uploads/sponsored/default-video.mp4', NULL, 'InvestSmart', 75.00, 60, true, 3, '2026-07-20 18:02:30.346305+02', NULL);
INSERT INTO public.sponsored_content (id, title, description, content_type, file_url, thumbnail_url, sponsor_name, reward_amount, duration_seconds, is_active, display_order, created_at, external_link) VALUES ('60054eb5-ce57-47a8-8a91-e74906baa019', 'Wellness & Meditation', 'Calming audio session sponsored by Wellness Malawi.', 'audio', '/uploads/sponsored/default-video.mp4', NULL, 'Wellness Malawi', 40.00, 35, true, 4, '2026-07-20 18:02:30.346305+02', NULL);
INSERT INTO public.sponsored_content (id, title, description, content_type, file_url, thumbnail_url, sponsor_name, reward_amount, duration_seconds, is_active, display_order, created_at, external_link) VALUES ('aeb0d6a9-7daf-46c5-8102-283c14208429', 'Digital Skills for 2026', 'Learn about in-demand digital skills.', 'video', '/uploads/sponsored/default-video.mp4', NULL, 'SkillUp Africa', 60.00, 50, true, 5, '2026-07-20 18:02:30.346305+02', NULL);
INSERT INTO public.sponsored_content (id, title, description, content_type, file_url, thumbnail_url, sponsor_name, reward_amount, duration_seconds, is_active, display_order, created_at, external_link) VALUES ('62a038bc-f3a1-432e-aa95-c06b90cd425d', 'test1', 'testing', 'video', NULL, NULL, 'test', 51.00, 30, true, 0, '2026-07-20 18:35:07.748751+02', 'https://youtube.com/');


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.wallets (id, user_id, gross_earnings, total_withdrawn, balance_available, updated_at) VALUES ('ea2b4b4d-0ac0-4396-833f-02920d0636eb', 'f2fa8ed9-0d45-445c-b095-ef8139494e2f', 0.00, 0.00, 0.00, '2026-07-16 12:38:27.309459+02');
INSERT INTO public.wallets (id, user_id, gross_earnings, total_withdrawn, balance_available, updated_at) VALUES ('0f4bfeb7-02c6-4ca7-9061-461d6ac69b26', '02d5564b-a41f-484b-a9ad-27872b1c0862', 6500.00, 5200.00, 1300.00, '2026-07-16 12:51:32.379434+02');
INSERT INTO public.wallets (id, user_id, gross_earnings, total_withdrawn, balance_available, updated_at) VALUES ('9b74bd9e-66ca-4148-8cef-c0789afb1e85', '6290ea5a-2b55-4358-84f5-2204970d96e4', 306.00, 0.00, 306.00, '2026-07-20 18:42:22.567112+02');
INSERT INTO public.wallets (id, user_id, gross_earnings, total_withdrawn, balance_available, updated_at) VALUES ('71808b83-16fd-4801-be03-510749ffe34c', '5a74064b-4b7a-42c8-b851-d28062b17bec', 51.00, 0.00, 51.00, '2026-07-21 05:59:22.172765+02');


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
-- Data for Name: user_premium_packs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_premium_packs (id, user_id, pack_id, purchased_at, amount_paid, transaction_ref) VALUES ('ffcaee1d-4dfd-4218-9ac7-e82814e22424', '02d5564b-a41f-484b-a9ad-27872b1c0862', '2583b6ca-695b-43c5-8d3d-247457b6802e', '2026-07-19 06:40:40.287212+02', 25000.00, 'admin-grant-test');


--
-- Data for Name: user_sponsored_views; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_sponsored_views (id, user_id, content_id, watched_at, reward_earned, watched_date) VALUES ('a0dcf6c0-837f-4c70-aad1-7dd4bd807b48', '6290ea5a-2b55-4358-84f5-2204970d96e4', 'd61bd8a9-7799-4acb-b4dd-dbbc05499094', '2026-07-20 18:15:44.020443+02', 50.00, '2026-07-20');
INSERT INTO public.user_sponsored_views (id, user_id, content_id, watched_at, reward_earned, watched_date) VALUES ('9cdb937c-7a52-4e6c-ad0b-28300989994a', '6290ea5a-2b55-4358-84f5-2204970d96e4', '62a038bc-f3a1-432e-aa95-c06b90cd425d', '2026-07-20 18:35:41.121207+02', 51.00, '2026-07-20');
INSERT INTO public.user_sponsored_views (id, user_id, content_id, watched_at, reward_earned, watched_date) VALUES ('a8959e12-bfb8-4307-8075-1900f1b1d411', '6290ea5a-2b55-4358-84f5-2204970d96e4', '39850b20-6cfc-4ecd-a078-49386395e788', '2026-07-20 18:38:11.567036+02', 30.00, '2026-07-20');
INSERT INTO public.user_sponsored_views (id, user_id, content_id, watched_at, reward_earned, watched_date) VALUES ('09adb9f9-cfda-4785-be28-42569f45b252', '6290ea5a-2b55-4358-84f5-2204970d96e4', '5c7a1f05-fe1d-45e5-b936-b9e3628ef3fb', '2026-07-20 18:41:34.529472+02', 75.00, '2026-07-20');
INSERT INTO public.user_sponsored_views (id, user_id, content_id, watched_at, reward_earned, watched_date) VALUES ('09cfa329-6031-4b7a-9b68-47df384f1ce5', '6290ea5a-2b55-4358-84f5-2204970d96e4', '60054eb5-ce57-47a8-8a91-e74906baa019', '2026-07-20 18:42:04.043799+02', 40.00, '2026-07-20');
INSERT INTO public.user_sponsored_views (id, user_id, content_id, watched_at, reward_earned, watched_date) VALUES ('c9f16d3d-06bf-410d-ad1f-aee16d9da711', '6290ea5a-2b55-4358-84f5-2204970d96e4', 'aeb0d6a9-7daf-46c5-8102-283c14208429', '2026-07-20 18:42:22.550995+02', 60.00, '2026-07-20');
INSERT INTO public.user_sponsored_views (id, user_id, content_id, watched_at, reward_earned, watched_date) VALUES ('14d91159-4094-49d4-899d-f8e74c0ea136', '5a74064b-4b7a-42c8-b851-d28062b17bec', '62a038bc-f3a1-432e-aa95-c06b90cd425d', '2026-07-21 05:59:22.060979+02', 51.00, '2026-07-21');


--
-- Data for Name: withdrawals; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.withdrawals (id, wallet_id, amount_requested, withdrawal_fee, amount_paid, status, payment_method, payment_reference, processed_by, notes, requested_at, processed_at) VALUES ('1de3b294-7d9f-4493-af96-bd362d954f20', '0f4bfeb7-02c6-4ca7-9061-461d6ac69b26', 5200.00, 1040.00, 4160.00, 'pending', 'mobile_money', NULL, NULL, NULL, '2026-07-16 12:51:32.351325+02', NULL);


--
-- PostgreSQL database dump complete
--

