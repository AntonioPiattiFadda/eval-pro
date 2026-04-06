


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."ANAMNESIS_PHASE" AS ENUM (
    'PHASE1',
    'PHASE2'
);


ALTER TYPE "public"."ANAMNESIS_PHASE" OWNER TO "postgres";


CREATE TYPE "public"."SPECIALTY" AS ENUM (
    'KINESIOLOGY',
    'NUTRITION'
);


ALTER TYPE "public"."SPECIALTY" OWNER TO "postgres";


CREATE TYPE "public"."STRUCTURE_TYPE" AS ENUM (
    'TENDON',
    'MUSCLE',
    'LIGAMENT',
    'BONE'
);


ALTER TYPE "public"."STRUCTURE_TYPE" OWNER TO "postgres";


CREATE TYPE "public"."USER_ROLE" AS ENUM (
    'PROFESSIONAL',
    'PATIENT',
    'ADMIN',
    'SUPERADMIN'
);


ALTER TYPE "public"."USER_ROLE" OWNER TO "postgres";


CREATE TYPE "public"."appointment_status" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'COMPLETED'
);


ALTER TYPE "public"."appointment_status" OWNER TO "postgres";


CREATE TYPE "public"."location_type" AS ENUM (
    'GYM',
    'REHAB_CENTER',
    'CLINIC'
);


ALTER TYPE "public"."location_type" OWNER TO "postgres";


CREATE TYPE "public"."override_type" AS ENUM (
    'BLOCKED',
    'EXTRA'
);


ALTER TYPE "public"."override_type" OWNER TO "postgres";


CREATE TYPE "public"."session_status" AS ENUM (
    'DRAFT',
    'IN_PROGRESS',
    'COMPLETED'
);


ALTER TYPE "public"."session_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_organization_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT organization_id FROM public.users WHERE user_id = auth.uid()
$$;


ALTER FUNCTION "public"."current_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT role FROM users WHERE user_id = auth.uid()
  $$;


ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_patients"("p_org_id" "uuid", "p_query" "text", "p_limit" integer DEFAULT 10, "p_offset" integer DEFAULT 0) RETURNS TABLE("patient_id" "uuid", "user_id" "uuid", "organization_id" "uuid", "created_at" timestamp with time zone, "full_name" "text", "email" "text", "identification_number" "text")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT
    p.patient_id,
    p.user_id,
    p.organization_id,
    p.created_at,
    u.full_name,
    u.email,
    u.identification_number
  FROM patients p
  JOIN users u ON u.user_id = p.user_id
  WHERE p.organization_id = p_org_id
    AND (
      u.full_name               ILIKE '%' || p_query || '%'
      OR u.email                ILIKE '%' || p_query || '%'
      OR u.identification_number ILIKE '%' || p_query || '%'
    )
  ORDER BY u.full_name
  LIMIT p_limit OFFSET p_offset;
$$;


ALTER FUNCTION "public"."search_patients"("p_org_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."anamnesis_answers" (
    "answer_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "question_id" "uuid" NOT NULL,
    "phase" "public"."ANAMNESIS_PHASE" NOT NULL,
    "answer" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."anamnesis_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."anamnesis_phase1_questions" (
    "question_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "options" "jsonb" NOT NULL,
    "order_index" smallint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."anamnesis_phase1_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."anamnesis_phase2_questions" (
    "question_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "options" "jsonb" NOT NULL,
    "active_if" "public"."STRUCTURE_TYPE" NOT NULL,
    "domain_id" "uuid",
    "order_index" smallint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."anamnesis_phase2_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."anamnesis_structure_profiles" (
    "profile_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "structure" "public"."STRUCTURE_TYPE" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."anamnesis_structure_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointment_sessions" (
    "appointment_id" "uuid" NOT NULL,
    "session_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."appointment_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "appointment_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "professional_id" "uuid",
    "location_id" "uuid",
    "start_at" timestamp with time zone NOT NULL,
    "end_at" timestamp with time zone NOT NULL,
    "status" "public"."appointment_status" DEFAULT 'PENDING'::"public"."appointment_status" NOT NULL,
    "max_capacity" integer,
    "booked_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "patient_id" "uuid",
    "organization_id" "uuid" NOT NULL,
    CONSTRAINT "appointments_check" CHECK (("start_at" < "end_at")),
    CONSTRAINT "appointments_check1" CHECK ((("professional_id" IS NOT NULL) OR ("location_id" IS NOT NULL)))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."availability_overrides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "professional_id" "uuid" NOT NULL,
    "date_from" "date" NOT NULL,
    "date_until" "date" NOT NULL,
    "type" "public"."override_type" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "location_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    CONSTRAINT "availability_overrides_check" CHECK (("date_from" <= "date_until")),
    CONSTRAINT "availability_overrides_check1" CHECK ((("type" = 'BLOCKED'::"public"."override_type") OR (("start_time" IS NOT NULL) AND ("end_time" IS NOT NULL)))),
    CONSTRAINT "availability_overrides_check2" CHECK ((("start_time" IS NULL) OR ("start_time" < "end_time")))
);


ALTER TABLE "public"."availability_overrides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."domains" (
    "domain_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."domains" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."location_operating_hours" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "location_id" "uuid" NOT NULL,
    "day_of_week" smallint NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "organization_id" "uuid" NOT NULL,
    CONSTRAINT "location_operating_hours_check" CHECK (("start_time" < "end_time")),
    CONSTRAINT "location_operating_hours_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."location_operating_hours" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "location_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "public"."location_type" NOT NULL,
    "organization_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."objectives" (
    "objective_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."objectives" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "organization_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patients" (
    "patient_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."patients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."professionals" (
    "professional_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "specialty" "public"."SPECIALTY" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."professionals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."regions" (
    "region_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."regions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_derivations" (
    "derivation_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_session_id" "uuid" NOT NULL,
    "derived_session_id" "uuid" NOT NULL,
    "triggered_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."session_derivations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "session_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "professional_id" "uuid" NOT NULL,
    "region_id" "uuid",
    "domain_id" "uuid",
    "objective_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "status" "public"."session_status" DEFAULT 'DRAFT'::"public"."session_status" NOT NULL,
    "appointment_id" "uuid"
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role" "public"."USER_ROLE" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid"
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text",
    "user_id" "uuid" NOT NULL,
    "organization_id" "uuid",
    "full_name" "text",
    "identification_number" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."weekly_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "professional_id" "uuid" NOT NULL,
    "location_id" "uuid",
    "day_of_week" smallint NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "valid_from" "date" DEFAULT CURRENT_DATE NOT NULL,
    "valid_until" "date",
    "organization_id" "uuid" NOT NULL,
    CONSTRAINT "valid_range_check" CHECK ((("valid_until" IS NULL) OR ("valid_from" <= "valid_until"))),
    CONSTRAINT "weekly_availability_check" CHECK (("start_time" < "end_time")),
    CONSTRAINT "weekly_availability_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."weekly_availability" OWNER TO "postgres";


ALTER TABLE ONLY "public"."anamnesis_answers"
    ADD CONSTRAINT "anamnesis_answers_evaluation_id_question_id_key" UNIQUE ("session_id", "question_id");



ALTER TABLE ONLY "public"."anamnesis_answers"
    ADD CONSTRAINT "anamnesis_answers_pkey" PRIMARY KEY ("answer_id");



ALTER TABLE ONLY "public"."appointment_sessions"
    ADD CONSTRAINT "appointment_sessions_pkey" PRIMARY KEY ("appointment_id", "session_id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("appointment_id");



ALTER TABLE ONLY "public"."availability_overrides"
    ADD CONSTRAINT "availability_overrides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."domains"
    ADD CONSTRAINT "domains_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."domains"
    ADD CONSTRAINT "domains_pkey" PRIMARY KEY ("domain_id");



ALTER TABLE ONLY "public"."location_operating_hours"
    ADD CONSTRAINT "location_operating_hours_location_id_day_of_week_key" UNIQUE ("location_id", "day_of_week");



ALTER TABLE ONLY "public"."location_operating_hours"
    ADD CONSTRAINT "location_operating_hours_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("location_id");



ALTER TABLE ONLY "public"."objectives"
    ADD CONSTRAINT "objectives_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."objectives"
    ADD CONSTRAINT "objectives_pkey" PRIMARY KEY ("objective_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("organization_id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("patient_id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."anamnesis_phase1_questions"
    ADD CONSTRAINT "phase1_questions_pkey" PRIMARY KEY ("question_id");



ALTER TABLE ONLY "public"."anamnesis_phase2_questions"
    ADD CONSTRAINT "phase2_questions_pkey" PRIMARY KEY ("question_id");



ALTER TABLE ONLY "public"."professionals"
    ADD CONSTRAINT "professionals_pkey" PRIMARY KEY ("professional_id");



ALTER TABLE ONLY "public"."professionals"
    ADD CONSTRAINT "professionals_user_id_specialty_key" UNIQUE ("user_id", "specialty");



ALTER TABLE ONLY "public"."regions"
    ADD CONSTRAINT "regions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."regions"
    ADD CONSTRAINT "regions_pkey" PRIMARY KEY ("region_id");



ALTER TABLE ONLY "public"."session_derivations"
    ADD CONSTRAINT "session_derivations_pkey" PRIMARY KEY ("derivation_id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("session_id");



ALTER TABLE ONLY "public"."anamnesis_structure_profiles"
    ADD CONSTRAINT "structure_profiles_evaluation_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."anamnesis_structure_profiles"
    ADD CONSTRAINT "structure_profiles_pkey" PRIMARY KEY ("profile_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."weekly_availability"
    ADD CONSTRAINT "weekly_availability_pkey" PRIMARY KEY ("id");



CREATE INDEX "users_organization_id_idx" ON "public"."users" USING "btree" ("organization_id");



CREATE OR REPLACE TRIGGER "organizations_set_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."anamnesis_answers"
    ADD CONSTRAINT "anamnesis_answers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."anamnesis_answers"
    ADD CONSTRAINT "anamnesis_answers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("session_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."anamnesis_structure_profiles"
    ADD CONSTRAINT "anamnesis_structure_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."appointment_sessions"
    ADD CONSTRAINT "appointment_sessions_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("appointment_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointment_sessions"
    ADD CONSTRAINT "appointment_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."appointment_sessions"
    ADD CONSTRAINT "appointment_sessions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("session_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_booked_by_fkey" FOREIGN KEY ("booked_by") REFERENCES "public"."users"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("professional_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."availability_overrides"
    ADD CONSTRAINT "availability_overrides_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."availability_overrides"
    ADD CONSTRAINT "availability_overrides_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."availability_overrides"
    ADD CONSTRAINT "availability_overrides_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("professional_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "evaluations_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("domain_id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "evaluations_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "public"."objectives"("objective_id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "evaluations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("patient_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "evaluations_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("professional_id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "evaluations_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("region_id");



ALTER TABLE ONLY "public"."location_operating_hours"
    ADD CONSTRAINT "location_operating_hours_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."location_operating_hours"
    ADD CONSTRAINT "location_operating_hours_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."anamnesis_phase2_questions"
    ADD CONSTRAINT "phase2_questions_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("domain_id");



ALTER TABLE ONLY "public"."professionals"
    ADD CONSTRAINT "professionals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."professionals"
    ADD CONSTRAINT "professionals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_derivations"
    ADD CONSTRAINT "session_derivations_derived_session_id_fkey" FOREIGN KEY ("derived_session_id") REFERENCES "public"."sessions"("session_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_derivations"
    ADD CONSTRAINT "session_derivations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."session_derivations"
    ADD CONSTRAINT "session_derivations_source_session_id_fkey" FOREIGN KEY ("source_session_id") REFERENCES "public"."sessions"("session_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("appointment_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."anamnesis_structure_profiles"
    ADD CONSTRAINT "structure_profiles_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("session_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."weekly_availability"
    ADD CONSTRAINT "weekly_availability_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."weekly_availability"
    ADD CONSTRAINT "weekly_availability_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("organization_id");



ALTER TABLE ONLY "public"."weekly_availability"
    ADD CONSTRAINT "weekly_availability_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("professional_id") ON DELETE CASCADE;



CREATE POLICY "admin_select_all" ON "public"."users" FOR SELECT TO "authenticated" USING (("public"."get_my_role"() = 'SUPERADMIN'::"text"));



ALTER TABLE "public"."anamnesis_answers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anamnesis_answers_delete" ON "public"."anamnesis_answers" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "anamnesis_answers_insert" ON "public"."anamnesis_answers" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "anamnesis_answers_select" ON "public"."anamnesis_answers" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "anamnesis_answers_update" ON "public"."anamnesis_answers" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."anamnesis_phase1_questions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anamnesis_phase1_questions_select" ON "public"."anamnesis_phase1_questions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."anamnesis_phase2_questions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anamnesis_phase2_questions_select" ON "public"."anamnesis_phase2_questions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."anamnesis_structure_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anamnesis_structure_profiles_delete" ON "public"."anamnesis_structure_profiles" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "anamnesis_structure_profiles_insert" ON "public"."anamnesis_structure_profiles" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "anamnesis_structure_profiles_select" ON "public"."anamnesis_structure_profiles" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "anamnesis_structure_profiles_update" ON "public"."anamnesis_structure_profiles" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."appointment_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "appointment_sessions_delete" ON "public"."appointment_sessions" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "appointment_sessions_insert" ON "public"."appointment_sessions" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "appointment_sessions_select" ON "public"."appointment_sessions" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "appointment_sessions_update" ON "public"."appointment_sessions" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "appointments_delete" ON "public"."appointments" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "appointments_insert" ON "public"."appointments" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "appointments_select" ON "public"."appointments" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "appointments_update" ON "public"."appointments" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."availability_overrides" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "availability_overrides_delete" ON "public"."availability_overrides" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "availability_overrides_insert" ON "public"."availability_overrides" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "availability_overrides_select" ON "public"."availability_overrides" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "availability_overrides_update" ON "public"."availability_overrides" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."domains" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "domains_select" ON "public"."domains" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."location_operating_hours" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "location_operating_hours_delete" ON "public"."location_operating_hours" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "location_operating_hours_insert" ON "public"."location_operating_hours" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "location_operating_hours_select" ON "public"."location_operating_hours" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "location_operating_hours_update" ON "public"."location_operating_hours" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "locations_delete" ON "public"."locations" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "locations_insert" ON "public"."locations" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "locations_select" ON "public"."locations" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "locations_update" ON "public"."locations" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."objectives" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "objectives_select" ON "public"."objectives" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "organizations_delete" ON "public"."organizations" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "organizations_insert" ON "public"."organizations" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "organizations_select_own" ON "public"."organizations" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "users"."organization_id"
   FROM "public"."users"
  WHERE (("users"."user_id" = "auth"."uid"()) AND ("users"."organization_id" IS NOT NULL)))));



CREATE POLICY "organizations_update" ON "public"."organizations" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."patients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patients_delete" ON "public"."patients" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "patients_insert" ON "public"."patients" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "patients_select" ON "public"."patients" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "patients_update" ON "public"."patients" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."professionals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "professionals_delete" ON "public"."professionals" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "professionals_insert" ON "public"."professionals" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "professionals_select" ON "public"."professionals" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "professionals_update" ON "public"."professionals" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."regions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "regions_select" ON "public"."regions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."session_derivations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "session_derivations_delete" ON "public"."session_derivations" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "session_derivations_insert" ON "public"."session_derivations" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "session_derivations_select" ON "public"."session_derivations" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "session_derivations_update" ON "public"."session_derivations" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sessions_delete" ON "public"."sessions" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "sessions_insert" ON "public"."sessions" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "sessions_select" ON "public"."sessions" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "sessions_update" ON "public"."sessions" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));



ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_roles_admin_select_all" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("public"."get_my_role"() = 'SUPERADMIN'::"text"));



CREATE POLICY "user_roles_delete_own" ON "public"."user_roles" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_roles_insert_own" ON "public"."user_roles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "user_roles_select_own" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_roles_select_same_org" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "user_roles_update_own" ON "public"."user_roles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_select_own" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_select_same_org" ON "public"."users" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "users_update_own" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."weekly_availability" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "weekly_availability_delete" ON "public"."weekly_availability" FOR DELETE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "weekly_availability_insert" ON "public"."weekly_availability" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "weekly_availability_select" ON "public"."weekly_availability" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."current_organization_id"()));



CREATE POLICY "weekly_availability_update" ON "public"."weekly_availability" FOR UPDATE TO "authenticated" USING (("organization_id" = "public"."current_organization_id"())) WITH CHECK (("organization_id" = "public"."current_organization_id"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."current_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_patients"("p_org_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_patients"("p_org_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_patients"("p_org_id" "uuid", "p_query" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."anamnesis_answers" TO "anon";
GRANT ALL ON TABLE "public"."anamnesis_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."anamnesis_answers" TO "service_role";



GRANT ALL ON TABLE "public"."anamnesis_phase1_questions" TO "anon";
GRANT ALL ON TABLE "public"."anamnesis_phase1_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."anamnesis_phase1_questions" TO "service_role";



GRANT ALL ON TABLE "public"."anamnesis_phase2_questions" TO "anon";
GRANT ALL ON TABLE "public"."anamnesis_phase2_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."anamnesis_phase2_questions" TO "service_role";



GRANT ALL ON TABLE "public"."anamnesis_structure_profiles" TO "anon";
GRANT ALL ON TABLE "public"."anamnesis_structure_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."anamnesis_structure_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."appointment_sessions" TO "anon";
GRANT ALL ON TABLE "public"."appointment_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."appointment_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."availability_overrides" TO "anon";
GRANT ALL ON TABLE "public"."availability_overrides" TO "authenticated";
GRANT ALL ON TABLE "public"."availability_overrides" TO "service_role";



GRANT ALL ON TABLE "public"."domains" TO "anon";
GRANT ALL ON TABLE "public"."domains" TO "authenticated";
GRANT ALL ON TABLE "public"."domains" TO "service_role";



GRANT ALL ON TABLE "public"."location_operating_hours" TO "anon";
GRANT ALL ON TABLE "public"."location_operating_hours" TO "authenticated";
GRANT ALL ON TABLE "public"."location_operating_hours" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON TABLE "public"."objectives" TO "anon";
GRANT ALL ON TABLE "public"."objectives" TO "authenticated";
GRANT ALL ON TABLE "public"."objectives" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."patients" TO "anon";
GRANT ALL ON TABLE "public"."patients" TO "authenticated";
GRANT ALL ON TABLE "public"."patients" TO "service_role";



GRANT ALL ON TABLE "public"."professionals" TO "anon";
GRANT ALL ON TABLE "public"."professionals" TO "authenticated";
GRANT ALL ON TABLE "public"."professionals" TO "service_role";



GRANT ALL ON TABLE "public"."regions" TO "anon";
GRANT ALL ON TABLE "public"."regions" TO "authenticated";
GRANT ALL ON TABLE "public"."regions" TO "service_role";



GRANT ALL ON TABLE "public"."session_derivations" TO "anon";
GRANT ALL ON TABLE "public"."session_derivations" TO "authenticated";
GRANT ALL ON TABLE "public"."session_derivations" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."weekly_availability" TO "anon";
GRANT ALL ON TABLE "public"."weekly_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."weekly_availability" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































