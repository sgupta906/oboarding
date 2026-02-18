# Tasks: employee-header-cleanup (Bug #30)

**Feature:** employee-header-cleanup
**Created:** 2026-02-17T05:30
**Status:** complete
**Based On:** 2026-02-17T05:30_plan.md

---

## Execution Rules

- Tasks execute sequentially (no parallel tasks in this small fix)
- TDD: write regression tests first (Phase 1), then implement deletions (Phase 2)
- Completion: mark each checkbox when done
- All 15 existing EmployeeView tests must continue to pass

---

## Phase 1: Tests (TDD - tests fail initially)

### Task 1.1: Add regression tests to EmployeeView.test.tsx
- [x] Add test: "does NOT render a sign-out button" -- query for sign-out button, expect null
- [x] Add test: "does NOT render Active Onboarding label" -- query for "Active Onboarding" text, expect null
- [x] Run `npx vitest run src/views/EmployeeView.test.tsx` -- new tests should FAIL (EmployeeHeader still exists)

**Files:** `src/views/EmployeeView.test.tsx`

**Acceptance Criteria:**
- [x] 2 new tests exist and fail (because EmployeeHeader still renders sign-out and "Active Onboarding")
- [x] 13 existing tests still pass

---

## Phase 2: Core Implementation (deletions)

### Task 2.1: Remove EmployeeHeader from EmployeeView.tsx
- [x] Remove `LogOut, Shield` from lucide-react import (line 7) -- keep only `useMemo` from react
- [x] Delete `EmployeeHeader` function component (lines 29-68)
- [x] Remove `<EmployeeHeader />` usage from JSX (line 106)
- [x] Remove the comment `{/* Header with Employee Status and Sign Out */}` (line 105)
- [x] Run `npx vitest run src/views/EmployeeView.test.tsx` -- all 15 tests should PASS

**Files:** `src/views/EmployeeView.tsx`

**Acceptance Criteria:**
- [x] No `EmployeeHeader` references remain in file
- [x] No `LogOut` or `Shield` imports remain
- [x] All 15 EmployeeView tests pass (13 existing + 2 new regression)

### Task 2.2: Remove redundant Sign Out from OnboardingHub.tsx
- [x] Change import from `import { User, LogOut } from 'lucide-react'` to `import { User } from 'lucide-react'`
- [x] Delete the Sign Out `<button>` block (lines 217-223)
- [x] Verify `User` icon is still imported and used (line 209)
- [x] Run `npx vitest run` -- full test suite should pass

**Files:** `src/components/OnboardingHub.tsx`

**Acceptance Criteria:**
- [x] No `LogOut` import remains in OnboardingHub.tsx
- [x] Sign Out button removed from "no onboarding assigned" card
- [x] `User` import still present and used
- [x] Full test suite passes

---

## Phase 3: Verification

### Task 3.1: Run full test suite and type check
- [x] Run `npx vitest run` -- all tests pass
- [x] Run `npx tsc -b` -- no type errors
- [x] Run `npx vite build` -- production build succeeds

**Acceptance Criteria:**
- [x] 0 test failures
- [x] 0 type errors
- [x] Build succeeds

---

## Handoff Checklist (for Test Agent)

- [x] All unit tests pass (`npx vitest run`)
- [x] TypeScript compiles (`npx tsc -b`)
- [x] Production build succeeds (`npx vite build`)
- [x] No `EmployeeHeader` references in codebase
- [x] No duplicate Sign Out buttons visible in employee view
- [x] "No onboarding assigned" card renders without Sign Out button
- [x] Net lines changed: ~-50 deleted, ~+16 added (test cases)
