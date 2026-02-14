# Tasks: supabase-setup

## Metadata
- **Feature:** supabase-setup
- **Created:** 2026-02-14T03:15
- **Status:** implement-complete
- **Based On:** 2026-02-14T03:15_plan.md

## Execution Rules

- Tasks MUST be executed in phase order (Phase 1 before Phase 2, etc.)
- Within a phase, tasks are sequential unless marked with **[P]** (parallelizable)
- TDD: Write tests (Phase 2) BEFORE implementation (Phase 3) -- tests will fail initially
- Mark tasks complete with `[x]` as they are finished
- Each task lists its files and acceptance criteria

---

## Phase 1: Setup (Sequential)

### Task 1.1: Install Supabase JS Client
- [x] Run `npm install @supabase/supabase-js`
- [x] Verify package appears in `package.json` dependencies
- [x] Verify `node_modules/@supabase/supabase-js` exists
- [x] Run existing tests to confirm no regressions: `npm test`

**Files:**
- `package.json` (modified by npm)
- `package-lock.json` (modified by npm)

**Acceptance Criteria:**
- [x] `@supabase/supabase-js` listed in `dependencies` (not devDependencies)
- [x] `npm test` passes (all existing tests green)
- [x] `npm run build` still succeeds

---

### Task 1.2: Update Environment Template
- [x] Append Supabase environment variables to `.env.template`
- [x] Add comment block separating Firebase and Supabase sections
- [x] Include `VITE_SUPABASE_URL` with placeholder value
- [x] Include `VITE_SUPABASE_ANON_KEY` with placeholder value

**Files:**
- `.env.template` (append at end)

**Content to append:**
```
# Supabase Configuration
# Get these values from your Supabase project settings (Settings > API)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Acceptance Criteria:**
- [x] Existing Firebase vars are unchanged
- [x] Supabase vars use `VITE_` prefix
- [x] Clear comments explain where to find values

---

## Phase 2: Tests First (TDD)

### Task 2.1: Write Supabase Config Tests
- [x] Create `src/config/supabase.test.ts`
- [x] Test: Supabase SDK package is importable
- [x] Test: `createClient` function exists in SDK
- [x] Test: Config module exports `supabase` client
- [x] Test: Client has expected methods (`from`, `auth`, `storage`, `channel`)
- [x] Test: Throws error when `VITE_SUPABASE_URL` is missing
- [x] Test: Throws error when `VITE_SUPABASE_ANON_KEY` is missing
- [x] Test: Database types file is importable
- [x] Test: Database types have expected table names in the type structure

**Files:**
- `src/config/supabase.test.ts` (new)

**Pattern:** Follow `src/config/firebase.test.ts` structure:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
// ...
describe('Supabase Configuration', () => {
  // ...
});
```

**Acceptance Criteria:**
- [x] Tests fail initially (implementation not yet created) -- this is expected for TDD
- [x] Test file follows project conventions (colocated with source, `.test.ts` suffix)
- [x] Tests cover: import validation, export validation, env var validation, type validation

---

## Phase 3: Core Implementation (Sequential)

### Task 3.1: Create Database Types File
- [x] Create `src/types/database.types.ts`
- [x] Define `Database` interface with `public.Tables` structure
- [x] Define `Row`, `Insert`, `Update` types for all 16 tables
- [x] Ensure types match the SQL schema exactly (column names, types, nullability)
- [x] Export the `Database` type

**Files:**
- `src/types/database.types.ts` (new, ~350 lines)

**Type mapping (SQL to TypeScript):**
| SQL Type | TypeScript Type |
|----------|----------------|
| UUID | string |
| TEXT | string |
| TEXT (nullable) | string \| null |
| INTEGER | number |
| BOOLEAN | boolean |
| TIMESTAMPTZ | string (ISO format) |
| TIMESTAMPTZ (nullable) | string \| null |
| JSONB | Json (generic) |

**Acceptance Criteria:**
- [x] All 16 tables represented (8 core + 3 step + 5 junction)
- [x] Each table has Row, Insert, and Update type variants
- [x] Insert types make columns with defaults optional
- [x] Update types make all columns optional (Partial)
- [x] File compiles without TypeScript errors: `npx tsc --noEmit src/types/database.types.ts`

---

### Task 3.2: Create Supabase Config File
- [x] Create `src/config/supabase.ts`
- [x] Import `createClient` from `@supabase/supabase-js`
- [x] Import `Database` type from `../types/database.types`
- [x] Read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `import.meta.env`
- [x] Add runtime validation: throw descriptive error if either env var is missing
- [x] Create typed client: `createClient<Database>(url, key)`
- [x] Export `supabase` client

**Files:**
- `src/config/supabase.ts` (new, ~20 lines)

**Pattern:** Mirror `src/config/firebase.ts` structure.

**Acceptance Criteria:**
- [x] Exports a single `supabase` client instance
- [x] Client is typed with `Database` generic
- [x] Throws descriptive error if env vars are missing
- [x] No imports from any existing application code (only from npm packages and local types)
- [x] TDD tests from Task 2.1 now pass

---

### Task 3.3: Create SQL Migration -- Core Tables
- [x] Create `supabase/migrations/00001_create_core_tables.sql`
- [x] Define `users` table with email uniqueness constraint (case-insensitive)
- [x] Define `roles` table with name uniqueness constraint (case-insensitive)
- [x] Define `profiles` table
- [x] Define `templates` table
- [x] Define `profile_templates` table with FK to profiles
- [x] Define `onboarding_instances` table with CHECK constraints for status and progress
- [x] Define `suggestions` table with CHECK constraint for status
- [x] Define `activities` table

**Files:**
- `supabase/migrations/00001_create_core_tables.sql` (new, ~120 lines)

**Table order (respects FK dependencies):**
1. `users` (no FKs)
2. `roles` (FK to users)
3. `profiles` (FK to users)
4. `templates` (no FKs -- role is name string, not FK)
5. `profile_templates` (FK to profiles, users)
6. `onboarding_instances` (FK to templates)
7. `suggestions` (FK to onboarding_instances)
8. `activities` (FK to users)

**Acceptance Criteria:**
- [x] All 8 tables created with correct column types
- [x] UUID primary keys with `gen_random_uuid()` defaults
- [x] `TIMESTAMPTZ` used for all timestamp columns
- [x] CHECK constraints on `onboarding_instances.status`, `onboarding_instances.progress`, `suggestions.status`
- [x] UNIQUE constraints on `users.email` (case-insensitive) and `roles.name` (case-insensitive)
- [x] FK relationships with appropriate ON DELETE behavior
- [x] SQL is syntactically valid

---

### Task 3.4: Create SQL Migration -- Step Child Tables
- [x] Create `supabase/migrations/00002_create_step_tables.sql`
- [x] Define `template_steps` table (FK to templates, CASCADE delete)
- [x] Define `instance_steps` table (FK to onboarding_instances, CASCADE delete)
- [x] Define `profile_template_steps` table (FK to profile_templates, CASCADE delete)
- [x] Each table has: position, title, description, role, owner, expert, status, link
- [x] UNIQUE constraint on (parent_id, position) for each table
- [x] CHECK constraint on status column

**Files:**
- `supabase/migrations/00002_create_step_tables.sql` (new, ~70 lines)

**Acceptance Criteria:**
- [x] All 3 step tables created with identical column structures (different parent FK)
- [x] CASCADE delete on parent FK (deleting template deletes its steps)
- [x] Position uniqueness enforced per parent
- [x] Status CHECK: `('pending', 'completed', 'stuck')`

---

### Task 3.5: Create SQL Migration -- Junction Tables
- [x] Create `supabase/migrations/00003_create_junction_tables.sql`
- [x] Define `user_roles` (PK: user_id + role_name)
- [x] Define `user_profiles` (PK: user_id + profile_name)
- [x] Define `profile_role_tags` (PK: profile_id + role_tag)
- [x] Define `instance_profiles` (PK: instance_id + profile_id)
- [x] Define `instance_template_refs` (PK: instance_id + template_id)
- [x] All FKs with CASCADE delete on parent

**Files:**
- `supabase/migrations/00003_create_junction_tables.sql` (new, ~50 lines)

**Acceptance Criteria:**
- [x] All 5 junction tables created
- [x] Composite primary keys (no separate UUID PK)
- [x] CASCADE delete: removing a user deletes their user_roles entries, etc.
- [x] Text-based junction tables (user_roles, user_profiles, profile_role_tags) store name strings
- [x] ID-based junction tables (instance_profiles, instance_template_refs) use UUID FKs

---

### Task 3.6: Create SQL Migration -- Indexes [P]
- [x] Create `supabase/migrations/00004_create_indexes.sql`
- [x] Create all 13 performance indexes documented in the plan
- [x] Use `IF NOT EXISTS` for idempotency where supported

**Files:**
- `supabase/migrations/00004_create_indexes.sql` (new, ~25 lines)

**Indexes to create:**
1. `idx_onboarding_instances_employee_email` -- lower(employee_email)
2. `idx_onboarding_instances_template_id` -- template_id
3. `idx_onboarding_instances_status` -- status
4. `idx_suggestions_instance_id` -- instance_id
5. `idx_activities_timestamp` -- timestamp DESC
6. `idx_activities_user_id` -- user_id
7. `idx_template_steps_template_id` -- template_id
8. `idx_instance_steps_instance_id` -- instance_id
9. `idx_instance_steps_status` -- status
10. `idx_profile_templates_profile_id` -- profile_id
11. `idx_profile_template_steps_template_id` -- profile_template_id
12. `idx_user_roles_user_id` -- user_id
13. `idx_user_profiles_user_id` -- user_id

**Acceptance Criteria:**
- [x] All 13 indexes created
- [x] Index names follow `idx_<table>_<column>` convention
- [x] Functional index on `lower(employee_email)` for case-insensitive lookups

---

### Task 3.7: Create SQL Migration -- RLS Policies [P]
- [x] Create `supabase/migrations/00005_enable_rls.sql`
- [x] Enable RLS on all 16 tables
- [x] Create permissive "allow all" policy on each table
- [x] Policy applies to ALL operations (SELECT, INSERT, UPDATE, DELETE)

**Files:**
- `supabase/migrations/00005_enable_rls.sql` (new, ~70 lines)

**Acceptance Criteria:**
- [x] RLS enabled on every table (16 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statements)
- [x] One policy per table: `FOR ALL USING (true) WITH CHECK (true)`
- [x] Comment noting these are temporary and will be tightened in supabase-auth step

---

### Task 3.8: Create SQL Migration -- Triggers [P]
- [x] Create `supabase/migrations/00006_create_triggers.sql`
- [x] Create `update_updated_at()` function (CREATE OR REPLACE)
- [x] Attach trigger to `users` table
- [x] Attach trigger to `roles` table
- [x] Attach trigger to `templates` table
- [x] Attach trigger to `profile_templates` table
- [x] Attach trigger to `onboarding_instances` table

**Files:**
- `supabase/migrations/00006_create_triggers.sql` (new, ~30 lines)

**Acceptance Criteria:**
- [x] Function uses `CREATE OR REPLACE` for idempotency
- [x] Trigger fires `BEFORE UPDATE` on each row
- [x] Applied only to tables with `updated_at` column (5 tables)
- [x] Sets `NEW.updated_at = now()`

---

## Phase 4: Integration Verification (Sequential)

### Task 4.1: Run All Tests and Verify No Regressions
- [x] Run `npm test` -- all existing tests pass
- [x] Run `npm run build` -- TypeScript compilation succeeds, Vite build succeeds
- [x] Verify new Supabase config tests pass
- [x] Verify no new TypeScript errors in the project

**Commands:**
```bash
npm test
npm run build
```

**Acceptance Criteria:**
- [x] Zero test failures
- [x] Zero build errors (note: pre-existing TS6133 unused-variable warnings in existing files are not regressions)
- [x] New test file (`supabase.test.ts`) included in test run and passing
- [x] No changes to any existing `.ts` or `.tsx` files

---

### Task 4.2: Validate SQL Migration Files
- [x] Review all 6 migration files for syntax correctness
- [x] Verify table creation order respects FK dependencies
- [x] Verify all column names use snake_case
- [x] Verify all table names use snake_case
- [x] Count tables: must be exactly 16
- [x] Count indexes: must be exactly 13
- [x] Count RLS policies: must be exactly 16
- [x] Count triggers: must be exactly 5

**Files reviewed:**
- `supabase/migrations/00001_create_core_tables.sql`
- `supabase/migrations/00002_create_step_tables.sql`
- `supabase/migrations/00003_create_junction_tables.sql`
- `supabase/migrations/00004_create_indexes.sql`
- `supabase/migrations/00005_enable_rls.sql`
- `supabase/migrations/00006_create_triggers.sql`

**Acceptance Criteria:**
- [x] All SQL files present and non-empty
- [x] FK references are valid (no references to non-existent tables)
- [x] CHECK constraint values match TypeScript enum/union types
- [x] Migration execution order is correct (tables before indexes before RLS)

---

## Phase 5: Polish (Parallel OK)

### Task 5.1: Add Inline Documentation [P]
- [x] SQL migration files have header comments explaining purpose
- [x] Each table in SQL has a comment noting its Firestore collection equivalent
- [x] `supabase.ts` has JSDoc comments on exports
- [x] `database.types.ts` has header comment explaining generation/maintenance

**Acceptance Criteria:**
- [x] Each SQL file starts with a comment block (file purpose, table count)
- [x] Config file has clear documentation
- [x] Types file documents its relationship to the SQL schema

---

### Task 5.2: Verify File Structure [P]
- [x] Verify directory structure matches plan
- [x] Verify no unintended file modifications (`git diff` shows only expected changes)
- [x] Verify `.env.template` has both Firebase and Supabase sections

**Expected new files:**
```
supabase/migrations/00001_create_core_tables.sql
supabase/migrations/00002_create_step_tables.sql
supabase/migrations/00003_create_junction_tables.sql
supabase/migrations/00004_create_indexes.sql
supabase/migrations/00005_enable_rls.sql
supabase/migrations/00006_create_triggers.sql
src/config/supabase.ts
src/config/supabase.test.ts
src/types/database.types.ts
```

**Expected modified files:**
```
.env.template (Supabase vars appended)
package.json (supabase-js dependency added)
package-lock.json (updated by npm)
```

**Acceptance Criteria:**
- [x] Exactly 9 new files created
- [x] Exactly 3 files modified (by npm install and env template update)
- [x] No existing `.ts` or `.tsx` application files modified

---

## Phase 6: Ready for Test Agent

### Handoff Checklist
- [x] All unit tests passing (`npm test`)
- [x] Build succeeds (`npm run build`)
- [x] No TypeScript errors (pre-existing warnings in other files are documented)
- [x] 9 new files created
- [x] 3 files modified (package.json, package-lock.json, .env.template)
- [x] 0 existing application files changed
- [x] SQL schema defines exactly 16 tables
- [x] Database types cover all 16 tables with Row/Insert/Update variants
- [x] Supabase client exports typed `supabase` instance
- [x] RLS enabled on all tables with permissive policies

### Test Agent Verification Commands
```bash
# Run all tests
npm test

# Build project
npm run build

# Check for unintended changes
git diff --name-only

# Verify new files exist
ls -la supabase/migrations/
ls -la src/config/supabase.ts
ls -la src/config/supabase.test.ts
ls -la src/types/database.types.ts
```
