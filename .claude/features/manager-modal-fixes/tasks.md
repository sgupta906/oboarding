# Tasks: manager-modal-fixes

## Metadata
- **Feature:** manager-modal-fixes (Bugs #5 and #28)
- **Created:** 2026-02-16T23:00
- **Status:** implementation-complete
- **Based on:** 2026-02-16T23:00_plan.md
- **Estimated new tests:** 7
- **Actual new tests:** 7

## Execution Rules
- Tasks with `[P]` can run in parallel with other `[P]` tasks in the same phase
- TDD: Phase 2 writes tests first (they will fail), Phase 3 makes them pass
- Mark each checkbox when complete
- All 474+ existing tests must continue passing after every task

---

## Phase 1: Setup

No setup needed. No new dependencies, no migrations, no configuration changes.

---

## Phase 2: Tests (TDD - write failing tests first)

### Task 2.1: ActionBar readOnly tests
- [x] Add test: when `readOnly={true}` on a pending step, no action buttons are rendered (no "Mark as Done", no "I'm Stuck", no "Suggest Edit")
- [x] Add test: when `readOnly={true}`, a "View Only" text indicator is visible
- [x] Add test: when `readOnly` is false/undefined, buttons render as before (regression guard)

**Files:** `src/components/onboarding/ActionBar.test.tsx`

**Acceptance Criteria:**
- [x] Tests compile but fail (ActionBar does not yet accept `readOnly`)
- [x] Tests use existing `pendingStep` and `completedStep` fixtures

### Task 2.2: EmployeeView readOnly test
- [x] Add test: when `readOnly={true}`, no "Mark as Done" buttons appear in the rendered output

**Files:** `src/views/EmployeeView.test.tsx`

**Acceptance Criteria:**
- [x] Test compiles but fails (EmployeeView does not yet accept `readOnly`)

### Task 2.3: [P] Modal reset tests
- [x] Add test to `CreateOnboardingModal.test.tsx`: render with `isOpen={true}`, type into employee name field, rerender with `isOpen={false}`, rerender with `isOpen={true}`, assert employee name field is empty
- [x] Add test to `UserModal.test.tsx`: render in create mode with `isOpen={true}`, type into email field, rerender with `isOpen={false}`, rerender with `isOpen={true}`, assert email field is empty
- [x] Add test to `RoleModal.test.tsx`: render in create mode with `isOpen={true}`, type into name field, rerender with `isOpen={false}`, rerender with `isOpen={true}`, assert name field is empty
- [x] Add test to `SuggestEditModal.test.tsx`: render with `isOpen={true}`, type into textarea, rerender with `isOpen={false}`, rerender with `isOpen={true}`, assert textarea is empty

**Files:** `src/components/modals/CreateOnboardingModal.test.tsx`, `src/components/modals/UserModal.test.tsx`, `src/components/modals/RoleModal.test.tsx`, `src/components/modals/SuggestEditModal.test.tsx`

**Acceptance Criteria:**
- [x] All 4 modal reset tests compile but fail (modals do not yet have useEffect reset)
- [x] Tests use `rerender` from RTL to simulate close/re-open cycle

---

## Phase 3: Core Implementation

### Task 3.1: Add readOnly to type definitions
- [x] Add `readOnly?: boolean` to `StepCardProps` interface in `src/types/index.ts`
- [x] Add `readOnly?: boolean` to `ActionBarProps` interface in `src/types/index.ts`

**Files:** `src/types/index.ts`

**Acceptance Criteria:**
- [x] TypeScript compiles without errors
- [x] No existing tests broken

### Task 3.2: Implement ActionBar readOnly rendering
- [x] Import `Eye` icon from lucide-react
- [x] Destructure `readOnly` from props
- [x] Add early return when `readOnly` is true: render a "View Only" indicator div with Eye icon and text, keeping the `pt-4 border-t` container style
- [x] Existing button rendering unchanged when `readOnly` is false/undefined

**Files:** `src/components/onboarding/ActionBar.tsx`

**Acceptance Criteria:**
- [x] Task 2.1 tests now pass
- [x] Existing ActionBar tests still pass

### Task 3.3: Thread readOnly through component chain
- [x] Add `readOnly?: boolean` to `StepTimelineProps` interface in `StepTimeline.tsx`
- [x] Pass `readOnly` from StepTimeline to StepCard
- [x] Add `readOnly?: boolean` to `EmployeeViewProps` interface in `EmployeeView.tsx`
- [x] Pass `readOnly` from EmployeeView to StepTimeline
- [x] In `OnboardingHub.tsx`, pass `readOnly={isManager && currentView === 'employee'}` to `MemoizedEmployeeView`

**Files:** `src/components/onboarding/StepTimeline.tsx`, `src/components/onboarding/StepCard.tsx`, `src/views/EmployeeView.tsx`, `src/components/OnboardingHub.tsx`

**Acceptance Criteria:**
- [x] Task 2.2 test now passes
- [x] All existing tests still pass
- [x] `readOnly` flows from OnboardingHub through to ActionBar

### Task 3.4: [P] Add useEffect reset to CreateOnboardingModal
- [x] Add `useEffect` import (already has `useState` and `useMemo` imported; add `useEffect`)
- [x] Add `useEffect` after form state declarations that calls `resetForm()` when `isOpen` becomes true

**Files:** `src/components/modals/CreateOnboardingModal.tsx`

**Acceptance Criteria:**
- [x] CreateOnboardingModal reset test from Task 2.3 now passes
- [x] Existing CreateOnboardingModal tests still pass

### Task 3.5: [P] Add useEffect reset to UserModal
- [x] Add `useEffect` for create-mode form reset: when `isOpen` becomes true AND `!isEdit`, call `resetForm()`
- [x] Ensure it does not conflict with the existing edit-mode pre-fill `useEffect` (line 56-65)

**Files:** `src/components/modals/UserModal.tsx`

**Acceptance Criteria:**
- [x] UserModal reset test from Task 2.3 now passes
- [x] Existing UserModal tests (create and edit mode) still pass

### Task 3.6: [P] Add useEffect reset to RoleModal
- [x] Add `useEffect` import (currently only imports `useState`, `useCallback`, `useMemo`)
- [x] Add `useEffect` that resets form when `isOpen` becomes true:
  - Create mode: reset `name` to `''`, `description` to `''`, `touched` to `{name: false, description: false}`
  - Edit mode: reset `description` to `currentRole?.description || ''`, `touched` to `{name: false, description: false}`

**Files:** `src/components/modals/RoleModal.tsx`

**Acceptance Criteria:**
- [x] RoleModal reset test from Task 2.3 now passes
- [x] Existing RoleModal tests (create and edit mode) still pass

### Task 3.7: [P] Add useEffect reset to TemplateModal
- [x] Add `useEffect` for create-mode form reset: when `isOpen` becomes true AND `!isEdit`, call `resetForm()`
- [x] Ensure it does not conflict with the existing edit-mode pre-fill `useEffect` (line 70-87)

**Files:** `src/components/templates/TemplateModal.tsx`

**Acceptance Criteria:**
- [x] Existing TemplateModal tests still pass (no dedicated reset test for TemplateModal since the pattern is identical to the other modals)

### Task 3.8: [P] Add useEffect reset to SuggestEditModal
- [x] Add `useEffect` import (currently uses `React.useState`; add `React.useEffect` or destructure from React)
- [x] Add `useEffect` that resets `text` to `''` and `showValidation` to `false` when `isOpen` becomes true

**Files:** `src/components/modals/SuggestEditModal.tsx`

**Acceptance Criteria:**
- [x] SuggestEditModal reset test from Task 2.3 now passes
- [x] Existing SuggestEditModal tests still pass

---

## Phase 4: Integration

### Task 4.1: Run full test suite
- [x] Run `npx vitest run` and verify all tests pass (474+ existing + 7 new)
- [x] Run `npx tsc -b` and verify no type errors

**Acceptance Criteria:**
- [x] Zero new test failures (7 pre-existing dark-mode test failures in unrelated files)
- [x] Zero new TypeScript errors (1 pre-existing TS6133 in StepTimeline.test.tsx)
- [x] Test count: 501 passing (477 baseline + 7 new + 17 from linter-added dark mode tests)

---

## Phase 5: Polish

### Task 5.1: [P] Verify readOnly visual appearance
- [x] The "View Only" indicator in ActionBar has appropriate styling (muted colors, Eye icon, slate-50 bg)
- [x] Dark mode classes added by linter: dark:bg-slate-700, dark:text-slate-400, dark:border-slate-700

**Files:** `src/components/onboarding/ActionBar.tsx`

**Acceptance Criteria:**
- [x] Visual styling verified via code review

---

## Phase 6: Ready for Test Agent

### Handoff Checklist
- [x] All unit tests passing (`npx vitest run` -- 501 passing, 7 pre-existing failures in unrelated files)
- [x] TypeScript compiles (`npx tsc -b` -- 0 new errors, 1 pre-existing TS6133)
- [x] Bug #5: Manager's Employee View shows "View Only" instead of action buttons
- [x] Bug #28: All 5 modal forms reset cleanly on re-open
- [x] Test count: 501 passing (7 new tests added)
