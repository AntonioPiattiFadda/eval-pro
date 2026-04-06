# Organizations Table — Design Spec

**Date:** 2026-03-29
**Status:** Approved

---

## Overview

Introduce multi-tenancy by adding an `organizations` table. Every other domain table (Pacientes, Evaluaciones, etc.) will eventually link to an organization via `organization_id`. Users belong to exactly one organization.

---

## Schema

### `organizations`

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| `organization_id` | `UUID` | PRIMARY KEY | `gen_random_uuid()` |
| `organization_name` | `TEXT` | NOT NULL | — |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `now()` |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `now()` |
| `deleted_at` | `TIMESTAMPTZ` | NULL | — |

`deleted_at IS NULL` indicates an active organization (soft delete pattern).

### `users` — new column

| Column | Type | Constraints |
|--------|------|-------------|
| `organization_id` | `UUID` | NULL, FK → `organizations(organization_id)` |

Nullable to preserve compatibility with the existing user row.

---

## Trigger: `updated_at`

A reusable function `set_updated_at()` is created in the `public` schema and attached as a `BEFORE UPDATE` trigger on `organizations`. It sets `NEW.updated_at = now()` automatically on every row update.

---

## Row Level Security

RLS is enabled on `organizations`. One SELECT policy is created:

- **Name:** `organizations_select_own`
- **Command:** `SELECT`
- **Using expression:** user must exist in `users` with matching `organization_id`
  ```sql
  organization_id IN (
    SELECT organization_id FROM users
    WHERE user_id = auth.uid()
  )
  ```

INSERT/UPDATE/DELETE operations are intentionally left without policies for now — they will be handled via Supabase service role or a future admin flow.

---

## Decisions

- **UUID over BIGINT:** Consistent with `users.user_id`, opaque to clients.
- **Nullable FK in users:** Avoids breaking the existing user row; will be backfilled when org creation flow is built.
- **No INSERT/UPDATE/DELETE RLS now:** Premature — org management UI/API doesn't exist yet. Service role handles writes.
- **Soft delete:** `deleted_at` allows recovery and preserves referential integrity; hard deletes would cascade through all future linked tables.
