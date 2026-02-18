# Tasks: hire-email-signin

**Feature:** Hire Email Sign-In Bug Fix
**Date:** 2026-02-17T05:30
**Status:** complete
**Based-on:** 2026-02-17T05:30_plan.md

---

## Execution Rules

- Tasks are ordered by dependency -- complete in sequence unless marked [P]
- [P] = parallelizable with other [P] tasks in the same phase
- TDD: Write tests BEFORE implementation where indicated
- Mark tasks complete with [x] as you go

---

## Phase 1: Setup

### Task 1.1: Verify Prerequisites
- [x] Confirm `onboarding_instances` table has `employee_email` column (check `src/types/database.types.ts`)
- [x] Confirm `getDevAuthUUID` is importable from `src/utils/uuid.ts`
- [x] Confirm existing tests pass: `npx vitest run src/services/authService.test.ts`

**Files:** (read-only verification)
- `src/types/database.types.ts`
- `src/utils/uuid.ts`
- `src/services/authService.test.ts`

**Acceptance Criteria:**
- [x] All existing authService tests pass
- [x] Required imports are available

---

## Phase 2: Tests (TDD -- write tests first)

### Task 2.1: Add Tests for getInstanceByEmployeeEmail
- [x] Add test cases in `src/services/supabase/instanceService.test.ts` (or create new describe block)
- [x] Test: returns instance when email matches
- [x] Test: returns null when no instance found
- [x] Test: returns null on Supabase error (graceful failure)
- [x] Test: normalizes email to lowercase

**Files:** `src/services/supabase/instanceService.test.ts`

**Acceptance Criteria:**
- [x] Tests exist and pass

### Task 2.2: Add Tests for Hire Email Sign-In Path
- [x] Add describe block "signInWithEmailLink - Hire Email" in `src/services/authService.test.ts`
- [x] Test: hire email signs in as employee (mockAuthUser written with role='employee')
- [x] Test: hire email dispatches authStorageChange CustomEvent
- [x] Test: hire email does NOT call Supabase Auth (signUp/signInWithPassword)
- [x] Test: unknown email with no instance still throws "Email not recognized"
- [x] Test: instance lookup failure falls through to MOCK_EMAIL_ROLES
- [x] Test: hire email is case-insensitive
- [x] Update `vi.mock('./supabase')` to include `getInstanceByEmployeeEmail` mock

**Files:** `src/services/authService.test.ts`

**Acceptance Criteria:**
- [x] Tests exist and pass

---

## Phase 3: Core Implementation

### Task 3.1: Add getInstanceByEmployeeEmail to instanceService.ts
- [x] Add function after the factory-generated exports (after line 63)
- [x] Query `onboarding_instances` by `employee_email` with `order('created_at', { ascending: false }).limit(1)`
- [x] Return lightweight `{ instanceId, employeeName }` or null
- [x] Handle errors gracefully (log + return null)
- [x] Run Task 2.1 tests -- they now PASS

**Files:** `src/services/supabase/instanceService.ts`

**Acceptance Criteria:**
- [x] Function is exported
- [x] Task 2.1 tests pass
- [x] No TypeScript errors

### Task 3.2: Export from Barrel File
- [x] Add `getInstanceByEmployeeEmail` to the Instance Service export block in `src/services/supabase/index.ts`
- [x] Verify TypeScript compilation: `npx tsc -b`

**Files:** `src/services/supabase/index.ts`

**Acceptance Criteria:**
- [x] Function is importable via `import { getInstanceByEmployeeEmail } from './supabase'`
- [x] No TypeScript errors

### Task 3.3: Add Hire Email Check to signInWithEmailLink
- [x] Add `getInstanceByEmployeeEmail` to the import from `'./supabase'` (line 8)
- [x] Insert hire email check block between localStorage credential check and MOCK_EMAIL_ROLES check
- [x] Use try/catch around instance lookup for resilience
- [x] Follow same pattern as dynamicCredential check: localStorage write + CustomEvent + return
- [x] Use `getDevAuthUUID(trimmedEmail)` for the UID
- [x] Set role to `'employee'`
- [x] Run Task 2.2 tests -- they now PASS

**Files:** `src/services/authService.ts`

**Acceptance Criteria:**
- [x] Task 2.2 tests pass
- [x] Hire emails with onboarding instances can sign in
- [x] Unknown emails still get "Email not recognized" error
- [x] Test account emails still work via MOCK_EMAIL_ROLES path

---

## Phase 4: Integration

### Task 4.1: Run Full Test Suite
- [x] Run `npx vitest run` to verify all tests pass (563 tests, 38 files)
- [x] Fix any regressions

**Files:** All test files

**Acceptance Criteria:**
- [x] All existing tests still pass
- [x] New tests pass (10 new tests: 4 instanceService + 6 authService)
- [x] No TypeScript errors (`npx tsc -b`)

### Task 4.2: Build Verification
- [x] Run `npx vite build` to verify production build succeeds
- [x] No build warnings related to the changed files

**Files:** N/A (build check)

**Acceptance Criteria:**
- [x] Build succeeds without errors

---

## Phase 5: Polish

### Task 5.1: [P] Code Quality Check
- [x] Run `npx eslint src/services/authService.ts src/services/supabase/instanceService.ts src/services/supabase/index.ts`
- [x] No lint errors (11 warnings, all pre-existing from other code in those files)

**Files:** Modified source files

**Acceptance Criteria:**
- [x] No lint errors

---

## Phase 6: Ready for Test Agent

### Handoff Checklist
- [x] All unit tests pass (`npx vitest run`) -- 563 tests, 38 files
- [x] TypeScript compiles (`npx tsc -b`) -- zero errors
- [x] Build succeeds (`npx vite build`) -- clean build
- [x] No lint errors -- 0 errors, 11 pre-existing warnings
- [x] New function `getInstanceByEmployeeEmail` is tested and exported
- [x] `signInWithEmailLink` handles hire emails, Users panel emails, and test account emails
- [x] Unknown emails still produce clear error message
