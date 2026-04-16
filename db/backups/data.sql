SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict 4VEMlxJkHKgCJi9zP1ZdexdYa1abCD1u0ZQLOOfBjMtxp0OZYeqZoFnUESfKamK

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."custom_oauth_providers" ("id", "provider_type", "identifier", "name", "client_id", "client_secret", "acceptable_client_ids", "scopes", "pkce_enabled", "attribute_mapping", "authorization_params", "enabled", "email_optional", "issuer", "discovery_url", "skip_nonce_check", "cached_discovery", "discovery_cached_at", "authorization_url", "token_url", "userinfo_url", "jwks_uri", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") FROM stdin;
00000000-0000-0000-0000-000000000000	f817ca6e-42ba-442c-962e-8ad121686674	authenticated	authenticated	antonio.piattifadda@gmail.com	$2a$10$f7ax7Yk.zFRc.fsLDE7Xwe8RGXX2YIlw91vyUjXOmPFkbNJ8BbkLm	2026-03-28 19:20:18.205545+00	\N		\N		\N			\N	2026-04-11 12:35:20.025713+00	{"provider": "email", "providers": ["email"]}	{"sub": "f817ca6e-42ba-442c-962e-8ad121686674", "email": "antonio.piattifadda@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-03-28 19:20:18.190743+00	2026-04-11 13:33:23.755531+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	9713d8a7-addb-42bd-948e-5015042e0b36	authenticated	authenticated	milibustosm10@gmail.com	$2a$10$Dp0QqKQ84SFxE9g9Q4adduSUkh7PrzBGS0ys1Dp7xec.mpqBJILUe	2026-04-04 19:46:29.953719+00	2026-04-04 19:46:17.218944+00		\N		\N			\N	2026-04-04 19:46:29.96828+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-04 19:46:17.13427+00	2026-04-04 19:46:35.987625+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") FROM stdin;
f817ca6e-42ba-442c-962e-8ad121686674	f817ca6e-42ba-442c-962e-8ad121686674	{"sub": "f817ca6e-42ba-442c-962e-8ad121686674", "email": "antonio.piattifadda@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-03-28 19:20:18.200296+00	2026-03-28 19:20:18.200673+00	2026-03-28 19:20:18.200673+00	e9761e04-8315-4f8f-a2b2-7176672dc93e
9713d8a7-addb-42bd-948e-5015042e0b36	9713d8a7-addb-42bd-948e-5015042e0b36	{"sub": "9713d8a7-addb-42bd-948e-5015042e0b36", "email": "milibustosm10@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-04-04 19:46:17.182967+00	2026-04-04 19:46:17.183708+00	2026-04-04 19:46:17.183708+00	daf02dcd-38ab-4124-b374-1dd32753f876
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."instances" ("id", "uuid", "raw_base_config", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_clients" ("id", "client_secret_hash", "registration_type", "redirect_uris", "grant_types", "client_name", "client_uri", "logo_uri", "created_at", "updated_at", "deleted_at", "client_type", "token_endpoint_auth_method") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") FROM stdin;
573c4557-2ee7-463f-98a4-e21c66b0e2ec	9713d8a7-addb-42bd-948e-5015042e0b36	2026-04-04 19:46:29.968366+00	2026-04-04 19:46:29.968366+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	181.1.232.44	\N	\N	\N	\N	\N
033c704a-34e9-445e-bb59-10bc650245b4	f817ca6e-42ba-442c-962e-8ad121686674	2026-04-06 02:40:20.944892+00	2026-04-06 02:40:20.944892+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	181.1.232.44	\N	\N	\N	\N	\N
b7e72150-76b5-4f25-8e0e-943cd16317cc	f817ca6e-42ba-442c-962e-8ad121686674	2026-04-11 12:35:20.02581+00	2026-04-11 13:33:23.763232+00	\N	aal1	\N	2026-04-11 13:33:23.763143	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	181.1.232.44	\N	\N	\N	\N	\N
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") FROM stdin;
573c4557-2ee7-463f-98a4-e21c66b0e2ec	2026-04-04 19:46:30.015061+00	2026-04-04 19:46:30.015061+00	otp	cae5c561-8b54-47e6-9bd4-608997cb3807
033c704a-34e9-445e-bb59-10bc650245b4	2026-04-06 02:40:20.999734+00	2026-04-06 02:40:20.999734+00	password	9222785a-6329-4815-887f-e0e4014f5b97
b7e72150-76b5-4f25-8e0e-943cd16317cc	2026-04-11 12:35:20.066819+00	2026-04-11 12:35:20.066819+00	password	9f02020a-b303-4d82-bb8e-904b75d7af98
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_factors" ("id", "user_id", "friendly_name", "factor_type", "status", "created_at", "updated_at", "secret", "phone", "last_challenged_at", "web_authn_credential", "web_authn_aaguid", "last_webauthn_challenge_data") FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_challenges" ("id", "factor_id", "created_at", "verified_at", "ip_address", "otp_code", "web_authn_session_data") FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_authorizations" ("id", "authorization_id", "client_id", "user_id", "redirect_uri", "scope", "state", "resource", "code_challenge", "code_challenge_method", "response_type", "status", "authorization_code", "created_at", "expires_at", "approved_at", "nonce") FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_client_states" ("id", "provider_type", "code_verifier", "created_at") FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_consents" ("id", "user_id", "client_id", "scopes", "granted_at", "revoked_at") FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") FROM stdin;
00000000-0000-0000-0000-000000000000	52	4qca5xx2optu	9713d8a7-addb-42bd-948e-5015042e0b36	f	2026-04-04 19:46:29.983341+00	2026-04-04 19:46:29.983341+00	\N	573c4557-2ee7-463f-98a4-e21c66b0e2ec
00000000-0000-0000-0000-000000000000	57	icv2j2ymceko	f817ca6e-42ba-442c-962e-8ad121686674	f	2026-04-06 02:40:20.973685+00	2026-04-06 02:40:20.973685+00	\N	033c704a-34e9-445e-bb59-10bc650245b4
00000000-0000-0000-0000-000000000000	58	z7l66zkspsz2	f817ca6e-42ba-442c-962e-8ad121686674	t	2026-04-11 12:35:20.04437+00	2026-04-11 13:33:23.715225+00	\N	b7e72150-76b5-4f25-8e0e-943cd16317cc
00000000-0000-0000-0000-000000000000	59	2jze5to6ijrr	f817ca6e-42ba-442c-962e-8ad121686674	f	2026-04-11 13:33:23.739552+00	2026-04-11 13:33:23.739552+00	z7l66zkspsz2	b7e72150-76b5-4f25-8e0e-943cd16317cc
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_providers" ("id", "resource_id", "created_at", "updated_at", "disabled") FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_providers" ("id", "sso_provider_id", "entity_id", "metadata_xml", "metadata_url", "attribute_mapping", "created_at", "updated_at", "name_id_format") FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_relay_states" ("id", "sso_provider_id", "request_id", "for_email", "redirect_to", "created_at", "updated_at", "flow_state_id") FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_domains" ("id", "sso_provider_id", "domain", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_challenges" ("id", "user_id", "challenge_type", "session_data", "created_at", "expires_at") FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_credentials" ("id", "user_id", "credential_id", "public_key", "attestation_type", "aaguid", "sign_count", "transports", "backup_eligible", "backed_up", "friendly_name", "created_at", "updated_at", "last_used_at") FROM stdin;
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."organizations" ("organization_id", "organization_name", "created_at", "updated_at", "deleted_at") FROM stdin;
04fc3620-f577-429a-9f1d-e7cd2a5d2192	Centro Kinesiologia Toni	2026-03-29 23:20:48.517493+00	2026-03-29 23:20:48.517493+00	\N
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."locations" ("location_id", "name", "type", "organization_id", "created_at") FROM stdin;
e47582e2-6614-47d1-a4b7-009164c35037	45	GYM	04fc3620-f577-429a-9f1d-e7cd2a5d2192	2026-04-02 19:40:54.187279+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."users" ("created_at", "email", "user_id", "organization_id", "full_name", "identification_number") FROM stdin;
2026-03-28 19:20:19.371741+00	antonio.piattifadda@gmail.com	f817ca6e-42ba-442c-962e-8ad121686674	04fc3620-f577-429a-9f1d-e7cd2a5d2192		\N
2026-04-04 19:46:17.982181+00	milibustosm10@gmail.com	9713d8a7-addb-42bd-948e-5015042e0b36	04fc3620-f577-429a-9f1d-e7cd2a5d2192	Milagros Bustos Moyano	42641731
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."patients" ("patient_id", "user_id", "created_at", "organization_id") FROM stdin;
b527db45-d275-4d9f-986c-65aca380e1e1	9713d8a7-addb-42bd-948e-5015042e0b36	2026-04-04 19:46:19.180516+00	04fc3620-f577-429a-9f1d-e7cd2a5d2192
\.


--
-- Data for Name: professionals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."professionals" ("professional_id", "user_id", "specialty", "created_at", "organization_id") FROM stdin;
d3165401-5132-4230-8309-64d4e661ec6d	f817ca6e-42ba-442c-962e-8ad121686674	KINESIOLOGY	2026-04-03 15:00:55.25001+00	04fc3620-f577-429a-9f1d-e7cd2a5d2192
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."appointments" ("appointment_id", "professional_id", "location_id", "start_at", "end_at", "status", "max_capacity", "booked_by", "created_at", "patient_id", "organization_id") FROM stdin;
eb8db0e7-2bd6-4558-9f93-4d6c58ca070f	d3165401-5132-4230-8309-64d4e661ec6d	\N	2026-04-04 21:30:00+00	2026-04-04 22:00:00+00	PENDING	\N	f817ca6e-42ba-442c-962e-8ad121686674	2026-04-04 19:46:20.659587+00	b527db45-d275-4d9f-986c-65aca380e1e1	04fc3620-f577-429a-9f1d-e7cd2a5d2192
\.


--
-- Data for Name: domains; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."domains" ("domain_id", "name", "created_at") FROM stdin;
ed254455-4f90-47fe-8b9a-f521bb6803af	KINESIOLOGY	2026-04-02 02:28:32.329866+00
7aed18f5-af18-4e3e-8e87-2dcb68854c2f	NUTRITION	2026-04-02 02:28:32.329866+00
946d49f4-0d44-45c9-9368-908c20544a45	PSYCHOLOGY	2026-04-02 02:28:32.329866+00
54aaf93e-6b33-4358-9d17-d50e03b17efb	TRAINING	2026-04-02 02:28:32.329866+00
\.


--
-- Data for Name: objectives; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."objectives" ("objective_id", "name", "created_at") FROM stdin;
468a1129-a3ef-4ede-9a3d-eed777a0e8f6	REHABILITATION	2026-04-02 02:28:32.329866+00
ce196dba-1179-4a50-883f-82866fd65f1c	SPORTS_PERFORMANCE	2026-04-02 02:28:32.329866+00
5d3b1e97-70ad-48c1-aa91-1f4217641006	AESTHETIC	2026-04-02 02:28:32.329866+00
a0aa0664-d61b-4b36-b63e-039bf3b3c51b	GENERAL_HEALTH	2026-04-02 02:28:32.329866+00
cc1ddb4b-97df-41ff-8bf9-5df08ba6935a	WEIGHT_LOSS	2026-04-02 02:28:32.329866+00
\.


--
-- Data for Name: regions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."regions" ("region_id", "name", "created_at") FROM stdin;
24cf1187-acd5-4a56-83b2-a928f95724c6	CERVICAL	2026-04-02 02:28:32.329866+00
3db25a90-e4ca-4235-a806-b5aadffc9997	SHOULDER	2026-04-02 02:28:32.329866+00
949c7bb3-ae2e-43a2-960a-1aeca4aa433c	ELBOW	2026-04-02 02:28:32.329866+00
9eb69688-5d0b-47b1-be28-baa1a2807e29	WRIST	2026-04-02 02:28:32.329866+00
3ef90ae3-9034-4b36-a84d-559081a93f9c	LUMBAR	2026-04-02 02:28:32.329866+00
0d89ac59-c72b-43f9-8f60-3069593384c1	HIP	2026-04-02 02:28:32.329866+00
b1cb3165-6572-43b5-b523-70d53f4a1cda	KNEE	2026-04-02 02:28:32.329866+00
40be3a6a-f8df-4ee2-a8c5-2e0f0700bdc9	ANKLE	2026-04-02 02:28:32.329866+00
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."sessions" ("session_id", "patient_id", "professional_id", "region_id", "domain_id", "objective_id", "created_at", "organization_id", "status", "appointment_id") FROM stdin;
9bf624b8-7a13-4d19-97b3-60e14818b224	b527db45-d275-4d9f-986c-65aca380e1e1	d3165401-5132-4230-8309-64d4e661ec6d	\N	\N	\N	2026-04-06 01:42:42.07214+00	04fc3620-f577-429a-9f1d-e7cd2a5d2192	DRAFT	\N
4ce074ee-8fe5-4060-8267-e3cedad08ab8	b527db45-d275-4d9f-986c-65aca380e1e1	d3165401-5132-4230-8309-64d4e661ec6d	\N	\N	\N	2026-04-06 01:42:42.425005+00	04fc3620-f577-429a-9f1d-e7cd2a5d2192	DRAFT	\N
f846ef67-7eaa-4fee-b154-324252a800f8	b527db45-d275-4d9f-986c-65aca380e1e1	d3165401-5132-4230-8309-64d4e661ec6d	\N	\N	\N	2026-04-06 01:42:58.965077+00	04fc3620-f577-429a-9f1d-e7cd2a5d2192	DRAFT	\N
fd1af9a6-bed3-4b61-a0ac-ba8497b4abee	b527db45-d275-4d9f-986c-65aca380e1e1	d3165401-5132-4230-8309-64d4e661ec6d	24cf1187-acd5-4a56-83b2-a928f95724c6	ed254455-4f90-47fe-8b9a-f521bb6803af	\N	2026-04-06 01:44:41.496063+00	04fc3620-f577-429a-9f1d-e7cd2a5d2192	DRAFT	eb8db0e7-2bd6-4558-9f93-4d6c58ca070f
\.


--
-- Data for Name: anamnesis_answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."anamnesis_answers" ("answer_id", "session_id", "question_id", "phase", "answer", "created_at", "organization_id") FROM stdin;
7a1b3abb-b2e1-40f7-811b-28b5b002c9b3	fd1af9a6-bed3-4b61-a0ac-ba8497b4abee	3ad0d574-3d4e-4507-803b-ebe77fbaaceb	PHASE1	MORNING	2026-04-06 01:44:53.606243+00	04fc3620-f577-429a-9f1d-e7cd2a5d2192
63908ca2-db4d-4852-a4b8-795099ebb86b	fd1af9a6-bed3-4b61-a0ac-ba8497b4abee	d023273e-2548-43b8-a4df-167015c46b93	PHASE1	STABBING	2026-04-06 01:44:51.356216+00	04fc3620-f577-429a-9f1d-e7cd2a5d2192
b714a276-fe36-4745-8013-cb5ec0cf3b96	fd1af9a6-bed3-4b61-a0ac-ba8497b4abee	30c85252-c5ba-4c36-99ee-c1824eb0aff8	PHASE1	INTERMITTENT	2026-04-06 01:44:49.558674+00	04fc3620-f577-429a-9f1d-e7cd2a5d2192
2aefd30e-c0d9-4cdb-920e-acb7a4ab3012	fd1af9a6-bed3-4b61-a0ac-ba8497b4abee	c283e756-ddb6-4936-98c8-e466c9a35d96	PHASE1	SECONDS	2026-04-06 01:44:54.501459+00	04fc3620-f577-429a-9f1d-e7cd2a5d2192
\.


--
-- Data for Name: anamnesis_phase1_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."anamnesis_phase1_questions" ("question_id", "question", "options", "order_index", "created_at") FROM stdin;
30c85252-c5ba-4c36-99ee-c1824eb0aff8	How often do you experience the symptoms?	[{"label": "Always", "value": "ALWAYS"}, {"label": "Intermittent", "value": "INTERMITTENT"}, {"label": "Only with activity", "value": "WITH_ACTIVITY"}]	1	2026-04-02 02:50:55.548244+00
d023273e-2548-43b8-a4df-167015c46b93	How would you describe the pain?	[{"label": "Sharp", "value": "SHARP"}, {"label": "Dull", "value": "DULL"}, {"label": "Stabbing", "value": "STABBING"}, {"label": "Burning", "value": "BURNING"}]	2	2026-04-02 02:50:55.548244+00
c283e756-ddb6-4936-98c8-e466c9a35d96	How long does the pain last?	[{"label": "Seconds", "value": "SECONDS"}, {"label": "Minutes", "value": "MINUTES"}, {"label": "Constant", "value": "CONSTANT"}]	3	2026-04-02 02:50:55.548244+00
3ad0d574-3d4e-4507-803b-ebe77fbaaceb	When does it appear?	[{"label": "In the morning / on waking", "value": "MORNING"}, {"label": "During activity", "value": "WITH_ACTIVITY"}, {"label": "At night", "value": "NOCTURNAL"}]	4	2026-04-02 02:50:55.548244+00
\.


--
-- Data for Name: anamnesis_phase2_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."anamnesis_phase2_questions" ("question_id", "question", "options", "active_if", "domain_id", "order_index", "created_at") FROM stdin;
\.


--
-- Data for Name: anamnesis_structure_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."anamnesis_structure_profiles" ("profile_id", "session_id", "structure", "created_at", "organization_id") FROM stdin;
\.


--
-- Data for Name: appointment_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."appointment_sessions" ("appointment_id", "session_id", "organization_id") FROM stdin;
\.


--
-- Data for Name: availability_overrides; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."availability_overrides" ("id", "professional_id", "date_from", "date_until", "type", "start_time", "end_time", "location_id", "created_at", "organization_id") FROM stdin;
\.


--
-- Data for Name: location_operating_hours; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."location_operating_hours" ("id", "location_id", "day_of_week", "start_time", "end_time", "organization_id") FROM stdin;
\.


--
-- Data for Name: session_derivations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."session_derivations" ("derivation_id", "source_session_id", "derived_session_id", "triggered_by", "created_at", "organization_id") FROM stdin;
\.


--
-- Data for Name: training_exercises; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."training_exercises" ("exercise_id", "name", "description", "muscle_groups", "video_url", "execution_type", "default_tempo", "default_sets", "default_reps", "default_rest_seconds", "organization_id", "deleted_at", "created_at") FROM stdin;
\.


--
-- Data for Name: training_plans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."training_plans" ("plan_id", "name", "description", "patient_id", "organization_id", "professional_id", "start_date", "end_date", "deleted_at", "created_at") FROM stdin;
1972e7cd-a0a9-4255-9cd2-50ca33730f59	Test	\N	b527db45-d275-4d9f-986c-65aca380e1e1	04fc3620-f577-429a-9f1d-e7cd2a5d2192	d3165401-5132-4230-8309-64d4e661ec6d	2026-04-11	\N	\N	2026-04-11 13:00:43.368217+00
\.


--
-- Data for Name: training_mesocycles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."training_mesocycles" ("mesocycle_id", "plan_id", "name", "order_index", "periodization_type", "deleted_at", "organization_id", "created_at") FROM stdin;
0c9a969b-074f-4d9f-b8ea-85528ddbee7d	1972e7cd-a0a9-4255-9cd2-50ca33730f59	dbsrt	0	\N	\N	04fc3620-f577-429a-9f1d-e7cd2a5d2192	2026-04-11 13:23:47.479864+00
1cd2c887-5f1b-45b9-bff2-44a0360dfb32	1972e7cd-a0a9-4255-9cd2-50ca33730f59	Fase aguda	1	BLOCK	\N	04fc3620-f577-429a-9f1d-e7cd2a5d2192	2026-04-11 13:22:51.505348+00
\.


--
-- Data for Name: training_microcycles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."training_microcycles" ("microcycle_id", "mesocycle_id", "plan_id", "name", "order_index", "repeat_count", "duration_days", "deleted_at", "organization_id", "created_at") FROM stdin;
2c031011-cb90-46e4-a602-781dae88fd77	\N	1972e7cd-a0a9-4255-9cd2-50ca33730f59	mu	0	1	7	\N	04fc3620-f577-429a-9f1d-e7cd2a5d2192	2026-04-11 13:24:10.857426+00
06068a5a-d00e-4c92-9464-ec07f9751683	\N	1972e7cd-a0a9-4255-9cd2-50ca33730f59	Semana de carga	1	1	15	\N	04fc3620-f577-429a-9f1d-e7cd2a5d2192	2026-04-11 13:22:18.405287+00
\.


--
-- Data for Name: training_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."training_sessions" ("session_id", "microcycle_id", "mesocycle_id", "plan_id", "name", "day_of_week", "order_index", "deleted_at", "organization_id", "created_at") FROM stdin;
5b7f7cfb-9676-4032-95a9-29338b303684	\N	1cd2c887-5f1b-45b9-bff2-44a0360dfb32	\N	payment_method	{0,2,4}	0	\N	04fc3620-f577-429a-9f1d-e7cd2a5d2192	2026-04-11 13:33:38.103615+00
4b33b583-27d1-4503-b2d9-498e9ee3ea42	\N	\N	1972e7cd-a0a9-4255-9cd2-50ca33730f59	D	{0}	1	\N	04fc3620-f577-429a-9f1d-e7cd2a5d2192	2026-04-11 13:18:04.370772+00
a13b731d-94b6-47cf-9247-5438b49ef1cf	\N	\N	1972e7cd-a0a9-4255-9cd2-50ca33730f59	D2	{1}	0	\N	04fc3620-f577-429a-9f1d-e7cd2a5d2192	2026-04-11 13:24:42.847365+00
\.


--
-- Data for Name: training_session_exercises; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."training_session_exercises" ("session_exercise_id", "session_id", "exercise_id", "sets", "reps", "set_duration_seconds", "rep_duration_seconds", "load_value", "load_unit", "rest_seconds", "order_index", "group_label", "notes", "deleted_at", "organization_id", "created_at") FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."user_roles" ("user_id", "role", "created_at", "organization_id") FROM stdin;
f817ca6e-42ba-442c-962e-8ad121686674	ADMIN	2026-04-02 16:06:06.206899+00	04fc3620-f577-429a-9f1d-e7cd2a5d2192
f817ca6e-42ba-442c-962e-8ad121686674	SUPERADMIN	2026-04-02 16:06:06.206899+00	04fc3620-f577-429a-9f1d-e7cd2a5d2192
f817ca6e-42ba-442c-962e-8ad121686674	PROFESSIONAL	2026-04-02 16:06:06.206899+00	04fc3620-f577-429a-9f1d-e7cd2a5d2192
f817ca6e-42ba-442c-962e-8ad121686674	PATIENT	2026-04-02 16:35:52.220563+00	04fc3620-f577-429a-9f1d-e7cd2a5d2192
9713d8a7-addb-42bd-948e-5015042e0b36	PATIENT	2026-04-04 19:46:18.645274+00	04fc3620-f577-429a-9f1d-e7cd2a5d2192
\.


--
-- Data for Name: weekly_availability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."weekly_availability" ("id", "professional_id", "location_id", "day_of_week", "start_time", "end_time", "valid_from", "valid_until", "organization_id") FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_analytics" ("name", "type", "format", "created_at", "updated_at", "id", "deleted_at") FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_vectors" ("id", "type", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads" ("id", "in_progress_size", "upload_signature", "bucket_id", "key", "version", "owner_id", "created_at", "user_metadata", "metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads_parts" ("id", "upload_id", "size", "part_number", "bucket_id", "key", "etag", "owner_id", "version", "created_at") FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."vector_indexes" ("id", "name", "bucket_id", "data_type", "dimension", "distance_metric", "metadata_configuration", "created_at", "updated_at") FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 59, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict 4VEMlxJkHKgCJi9zP1ZdexdYa1abCD1u0ZQLOOfBjMtxp0OZYeqZoFnUESfKamK

RESET ALL;
