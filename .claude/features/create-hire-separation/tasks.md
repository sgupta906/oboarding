# Tasks: create-hire-separation

## Metadata
- **Feature:** create-hire-separation (Bug #38: `create-hire-creates-user`)
- **Created:** 2026-02-16T23:30
- **Status:** implementation-complete
- **Based On:** `2026-02-16T23:30_plan.md`

## Execution Rules
- Tasks are sequential (1 -> 2 -> 3)
- TDD: write test first (Task 1), then implement fix (Task 2), then verify (Task 3)
- Completion: mark `[x]` when done

---

## Phase 1: Test (TDD -- Write Failing Test)

### Task 1.1: Add regression test for hire/user separation
- [x] Add a new `describe` block to `src/services/supabase/instanceService.test.ts`
- [x] Mock `../../config/supabase` with insert/select/single chain for `onboarding_instances` and insert for `instance_steps`
- [x] Mock `./templateService` dynamic import to return a template with steps
- [x] Write test: `createOnboardingRunFromTemplate does not import or call userService`
- [x] The test should verify that after calling `createOnboardingRunFromTemplate`, no `userService` functions (`addUserToAuthCredentials`, `userEmailExists`, `createUser`) were invoked
- [x] Run test -- confirm it FAILS (because the current code DOES call userService)

**Files:** `src/services/supabase/instanceService.test.ts`

**Acceptance Criteria:**
- [x] Test exists and is syntactically valid
- [x] Test fails on current code (proves the bug exists)
- [x] Test assertion clearly checks that userService is not called

---

## Phase 2: Implementation (Fix the Bug)

### Task 2.1: Remove user creation side effect from createOnboardingRunFromTemplate
- [x] Open `src/services/supabase/instanceService.ts`
- [x] Delete lines 355-377 (the blank line before the comment through the closing `}` of the try/catch)
- [x] Verify the remaining code flows correctly: line 354 (`const instanceId = ...`) followed by the return statement
- [x] No other changes needed in this file

**Files:** `src/services/supabase/instanceService.ts`

**Acceptance Criteria:**
- [x] Lines 355-377 are removed
- [x] No references to `userService`, `addUserToAuthCredentials`, `userEmailExists`, or `createUser` remain in the function
- [x] The function still returns `{ id: instanceId, ...newInstanceData }`
- [x] No import of `userService` anywhere in instanceService.ts

---

## Phase 3: Verification

### Task 3.1: Run regression test -- confirm it passes
- [x] Run `npx vitest run src/services/supabase/instanceService.test.ts`
- [x] Confirm the new test passes (userService is no longer called)
- [x] Confirm the 3 existing `updateStepStatus` tests still pass

**Files:** `src/services/supabase/instanceService.test.ts`

**Acceptance Criteria:**
- [x] New regression test passes
- [x] All 3 existing tests pass
- [x] Zero test failures in this file

### Task 3.2: Run full test suite
- [x] Run `npx vitest run`
- [x] Confirm all ~510 tests pass
- [x] No regressions

**Files:** (all test files)

**Acceptance Criteria:**
- [x] Full suite passes with 0 failures
- [x] No new warnings related to instanceService

### Task 3.3: Type check
- [x] Run `npx tsc -b`
- [x] Confirm zero type errors

**Files:** (all source files)

**Acceptance Criteria:**
- [x] TypeScript compilation succeeds with no errors

---

## Handoff Checklist (for Test Agent)

- [x] Bug #38 regression test added and passing
- [x] `createOnboardingRunFromTemplate` no longer calls `createUser` or `addUserToAuthCredentials`
- [x] Full test suite passes (513 tests)
- [x] TypeScript compiles cleanly
- [x] No changes to any file other than `instanceService.ts` and `instanceService.test.ts`
- [x] Functional verification: Accepted by user based on automated test coverage
