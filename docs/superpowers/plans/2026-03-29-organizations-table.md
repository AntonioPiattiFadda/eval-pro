# Organizations Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `organizations` table with soft delete, auto `updated_at` trigger, and RLS; add `organization_id` FK to `users`.

**Architecture:** Three sequential Supabase migrations — (1) table + trigger, (2) RLS + policy, (3) FK on users. Each migration is atomic and verifiable with a SQL check query before moving on.

**Tech Stack:** Supabase MCP (`mcp__supabase__apply_migration`, `mcp__supabase__execute_sql`), PostgreSQL 15.

---

### Task 1: Create `organizations` table and `updated_at` trigger

**Files:**
- Migration applied via `mcp__supabase__apply_migration` (name: `create_organizations`)

- [ ] **Step 1: Apply migration**

Use `mcp__supabase__apply_migration` with name `create_organizations` and the following SQL:

```sql
-- Reusable trigger function (can be shared by future tables)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY INVOKER
   SET search_path = '';

-- Organizations table
CREATE TABLE public.organizations (
  organization_id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ NULL
);

-- Auto-update updated_at on every row update
CREATE TRIGGER organizations_set_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

- [ ] **Step 2: Verify table exists with correct columns**

Use `mcp__supabase__execute_sql` with:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organizations'
ORDER BY ordinal_position;
```

Expected: 5 rows — `organization_id` (uuid, NO), `organization_name` (text, NO), `created_at` (timestamptz, NO), `updated_at` (timestamptz, NO), `deleted_at` (timestamptz, YES).

- [ ] **Step 3: Verify trigger exists**

Use `mcp__supabase__execute_sql` with:

```sql
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'organizations'
  AND trigger_schema = 'public';
```

Expected: row with `organizations_set_updated_at`, `UPDATE`, `BEFORE`.

- [ ] **Step 4: Smoke test trigger**

Use `mcp__supabase__execute_sql` with:

```sql
-- Insert a test org
INSERT INTO public.organizations (organization_name)
VALUES ('Test Org')
RETURNING organization_id, organization_name, created_at, updated_at;
```

Note the `organization_id` returned — use it in the next query.

```sql
-- Update and confirm updated_at changed
UPDATE public.organizations
SET organization_name = 'Test Org Updated'
WHERE organization_name = 'Test Org Updated' OR organization_name = 'Test Org'
RETURNING organization_id, organization_name, updated_at;
```

Expected: `updated_at` is a recent timestamp (different from the original `created_at` value if you compare).

- [ ] **Step 5: Clean up test row**

Use `mcp__supabase__execute_sql` with:

```sql
DELETE FROM public.organizations WHERE organization_name IN ('Test Org', 'Test Org Updated');
```

---

### Task 2: Enable RLS and add SELECT policy

**Files:**
- Migration applied via `mcp__supabase__apply_migration` (name: `organizations_rls`)

- [ ] **Step 1: Apply migration**

Use `mcp__supabase__apply_migration` with name `organizations_rls` and the following SQL:

```sql
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can only see the org they belong to
CREATE POLICY organizations_select_own
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.users
      WHERE user_id = auth.uid()
        AND organization_id IS NOT NULL
    )
  );
```

- [ ] **Step 2: Verify RLS is enabled**

Use `mcp__supabase__execute_sql` with:

```sql
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'organizations'
  AND relnamespace = 'public'::regnamespace;
```

Expected: `relrowsecurity = true`.

- [ ] **Step 3: Verify policy exists**

Use `mcp__supabase__execute_sql` with:

```sql
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'organizations'
  AND schemaname = 'public';
```

Expected: one row — `organizations_select_own`, `SELECT`, `{authenticated}`.

---

### Task 3: Add `organization_id` FK to `users`

**Files:**
- Migration applied via `mcp__supabase__apply_migration` (name: `users_add_organization_fk`)

- [ ] **Step 1: Apply migration**

Use `mcp__supabase__apply_migration` with name `users_add_organization_fk` and the following SQL:

```sql
-- ON DELETE NO ACTION is intentional: organizations use soft delete (deleted_at),
-- so hard deletes should never happen. NO ACTION acts as a safety net.
ALTER TABLE public.users
  ADD COLUMN organization_id UUID NULL
    REFERENCES public.organizations(organization_id);
```

Then apply a second migration `users_organization_fk_index`:

```sql
-- Index required for FK enforcement performance and org-based queries
CREATE INDEX IF NOT EXISTS users_organization_id_idx
  ON public.users (organization_id);
```

- [ ] **Step 2: Verify column and FK constraint exist**

Use `mcp__supabase__execute_sql` with:

```sql
SELECT
  c.column_name,
  c.data_type,
  c.is_nullable,
  tc.constraint_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu
  ON kcu.table_name = c.table_name
  AND kcu.column_name = c.column_name
  AND kcu.table_schema = 'public'
LEFT JOIN information_schema.table_constraints tc
  ON tc.constraint_name = kcu.constraint_name
  AND tc.constraint_type = 'FOREIGN KEY'
LEFT JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE c.table_schema = 'public'
  AND c.table_name = 'users'
  AND c.column_name = 'organization_id';
```

Expected: column `organization_id`, type `uuid`, nullable `YES`, FK pointing to `organizations.organization_id`.

- [ ] **Step 3: Verify existing user row is unaffected**

Use `mcp__supabase__execute_sql` with:

```sql
SELECT user_id, email, role, organization_id FROM public.users;
```

Expected: existing row present with `organization_id = NULL` (no data loss).

---

### Task 4: Generate updated TypeScript types

- [ ] **Step 1: Generate types**

Use `mcp__supabase__generate_typescript_types` to regenerate the TypeScript types from the updated schema.

- [ ] **Step 2: Save to `src/types/database.ts`**

Write the generated output to `src/types/database.ts` (create file if it doesn't exist).

