# Tasks: profiles-cleanup

## Metadata
- **Feature:** profiles-cleanup (Bug #39)
- **Created:** 2026-02-17T21:00
- **Status:** implementation-complete
- **Based on:** 2026-02-17T21:00_plan.md
- **Estimated tasks:** 6 (all sequential)

## Execution Rules
- All tasks are sequential (each depends on the prior)
- No TDD phase -- this is pure deletion, not new code
- Completion: mark `[x]` when done
- Verify TypeScript and tests after all edits, not after each individual edit

---

## Phase 1: Delete Service Files

### Task 1.1: Delete profileService.ts
- [x] Delete `src/services/supabase/profileService.ts`

**Files:** `src/services/supabase/profileService.ts` (DELETE)

**Acceptance Criteria:**
- [x] File no longer exists on disk

### Task 1.2: Delete profileTemplateService.ts
- [x] Delete `src/services/supabase/profileTemplateService.ts`

**Files:** `src/services/supabase/profileTemplateService.ts` (DELETE)

**Acceptance Criteria:**
- [x] File no longer exists on disk

---

## Phase 2: Clean Barrel Export

### Task 2.1: Remove profile exports from index.ts
- [x] Remove "Profile Service" export block (lines 49-57)
- [x] Remove "Profile Template Service" export block (lines 59-67)

**Files:** `src/services/supabase/index.ts`

**Acceptance Criteria:**
- [x] No imports from `./profileService` or `./profileTemplateService` remain
- [x] All other export blocks unchanged

---

## Phase 3: Clean Mappers

### Task 3.1: Clean mappers.ts
- [x] Remove `Profile` and `ProfileTemplate` from the type import (line 15-16)
- [x] Remove 4 row type aliases: `ProfileRow`, `ProfileRoleTagRow`, `ProfileTemplateRow`, `ProfileTemplateStepRow` (lines 35-38)
- [x] Remove 4 re-exports from the export block: `ProfileRow`, `ProfileRoleTagRow`, `ProfileTemplateRow`, `ProfileTemplateStepRow` (lines 52-55)
- [x] Remove 2 joined types: `ProfileWithTags` (line 72), `ProfileTemplateWithSteps` (line 75)
- [x] Update `toStep` signature: remove `ProfileTemplateStepRow` from union type (line 116)
- [x] Remove `toProfile()` mapper function including JSDoc (lines 220-232)
- [x] Remove `toProfileTemplate()` mapper function including JSDoc (lines 234-256)
- [x] Verify: `UserProfileRow` (line 41), `UserWithJunctions` (line 78), and `toUser` (lines 262-277) are UNTOUCHED

**Files:** `src/services/supabase/mappers.ts`

**Acceptance Criteria:**
- [x] No references to `ProfileRow`, `ProfileRoleTagRow`, `ProfileTemplateRow`, `ProfileTemplateStepRow`, `ProfileWithTags`, `ProfileTemplateWithSteps`, `toProfile`, or `toProfileTemplate` remain in the file
- [x] `UserProfileRow`, `UserWithJunctions`, and `toUser` are intact
- [x] `toStep` signature is `(row: TemplateStepRow | InstanceStepRow): Step`

### Task 3.2: Clean mappers.test.ts
- [x] Remove `toProfile` from import line
- [x] Remove `toProfileTemplate` from import line
- [x] Remove `describe('toProfile', ...)` test block (lines 285-306)
- [x] Remove `describe('toProfileTemplate', ...)` test block (lines 308-334)

**Files:** `src/services/supabase/mappers.test.ts`

**Acceptance Criteria:**
- [x] No references to `toProfile` or `toProfileTemplate` remain in the file
- [x] All other test blocks unchanged
- [x] `toUser` tests intact

---

## Phase 4: Validate

### Task 4.1: Verify TypeScript compilation and tests
- [x] Run `npx tsc -b` -- expect zero errors
- [x] Run `npx vitest run` -- expect all tests pass (638 tests passed)
- [x] Verify no grep hits for `profileService` or `profileTemplateService` in `src/` (excluding `database.types.ts`)

**Acceptance Criteria:**
- [x] `tsc -b` exits with code 0
- [x] `vitest run` exits with code 0 and all tests pass
- [x] No dangling imports or references to deleted files

---

## Handoff Checklist (for Test Agent)
- [x] 2 files deleted (profileService.ts, profileTemplateService.ts)
- [x] 3 files modified (index.ts, mappers.ts, mappers.test.ts)
- [x] TypeScript compiles cleanly
- [x] All unit tests pass
- [x] No runtime behavior changes
- [x] `UserProfileRow` and user-profiles code untouched
