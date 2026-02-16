# Tasks: step-update-400

## Metadata
- **Feature:** step-update-400
- **Created:** 2026-02-16T00:01
- **Status:** implementation-complete
- **Based on:** 2026-02-16T00:01_plan.md

## Execution Rules
- Tasks are sequential (each depends on the previous)
- TDD: update the test (Task 2) before updating the mapper (Task 3)
- Mark each subtask with [x] when complete

---

## Phase 1: Database Migration

### Task 1.1: Create migration to add `updated_at` column
- [x] Create `supabase/migrations/00008_add_updated_at_to_instances.sql`
- [x] Add `ALTER TABLE onboarding_instances ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- [x] Add backfill: `UPDATE onboarding_instances SET updated_at = COALESCE(completed_at, created_at, now())`
- [x] Add comment header explaining the fix

**Files:** `supabase/migrations/00008_add_updated_at_to_instances.sql` (new)

**Acceptance Criteria:**
- [x] SQL is valid and idempotent-safe
- [x] Column matches pattern of other `updated_at` columns (users, roles)

---

## Phase 2: TypeScript Type Updates

### Task 2.1: Add `updated_at` to database types
- [x] Add `updated_at: string` to `onboarding_instances.Row`
- [x] Add `updated_at?: string` to `onboarding_instances.Insert`
- [x] Add `updated_at?: string` to `onboarding_instances.Update`

**Files:** `src/types/database.types.ts` (modify lines 193-237)

**Acceptance Criteria:**
- [x] Types match the new column definition (TIMESTAMPTZ NOT NULL DEFAULT now())
- [x] Row type has `updated_at: string` (non-optional, always present)
- [x] Insert/Update types have `updated_at?: string` (optional, server sets default)

### Task 2.2: Add `updatedAt` to OnboardingInstance interface
- [x] Add `updatedAt?: number` field to `OnboardingInstance` interface (after `completedAt`)
- [x] Add comment: `// Unix timestamp, set by DB trigger on every update`

**Files:** `src/types/index.ts` (modify around line 271)

**Acceptance Criteria:**
- [x] Field is optional (backward compatible)
- [x] Type is `number` (Unix ms timestamp, matches other timestamp fields)

---

## Phase 3: Mapper + Test Update (TDD)

### Task 3.1: Update `toInstance` test to include `updated_at`
- [x] Add `updated_at: '2026-01-15T00:00:00.000Z'` to the test fixture row
- [x] Add assertion: `expect(inst.updatedAt).toBe(new Date('2026-01-15T00:00:00.000Z').getTime())`
- [x] Run test -- expect it to FAIL (mapper not updated yet)

**Files:** `src/services/supabase/mappers.test.ts` (modify lines 146-176)

**Acceptance Criteria:**
- [x] Test fails with `updatedAt` being `undefined` (TDD red phase)

### Task 3.2: Update `toInstance` mapper to map `updated_at`
- [x] Add `updatedAt: toOptionalUnixMs(row.updated_at)` to the return object in `toInstance()`
- [x] Run test -- expect it to PASS

**Files:** `src/services/supabase/mappers.ts` (modify around line 165)

**Acceptance Criteria:**
- [x] `toInstance` test passes
- [x] All existing tests still pass (`npx vitest run`)
- [x] TypeScript compiles cleanly (`npx tsc -b`)

---

## Phase 4: Verification

### Task 4.1: Run full test suite and type check
- [x] Run `npx vitest run` -- all tests pass (425/425)
- [x] Run `npx tsc -b` -- no type errors
- [x] Run `npx vite build` -- build succeeds

**Acceptance Criteria:**
- [x] Zero test failures
- [x] Zero type errors
- [x] Build succeeds

---

## Handoff Checklist (for Test Agent)

- [x] Migration file created at `supabase/migrations/00008_add_updated_at_to_instances.sql`
- [x] `database.types.ts` updated with `updated_at` in Row/Insert/Update
- [x] `OnboardingInstance` interface has `updatedAt?: number`
- [x] `toInstance()` mapper maps `updated_at` to `updatedAt`
- [x] `toInstance` test updated and passing
- [x] Full test suite passes
- [x] TypeScript compiles cleanly
- [ ] To verify the actual fix: apply migration to live Supabase, then test "Mark as Done" in employee view
