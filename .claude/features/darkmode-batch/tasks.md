# Tasks: darkmode-batch (Bugs #22-27)

## Metadata
- **Feature:** darkmode-batch
- **Created:** 2026-02-16T23:00
- **Status:** implementation-complete
- **Based on:** 2026-02-16T23:00_plan.md

## Execution Rules
- **TDD order:** Write tests FIRST (Task X.1), then implement (Task X.2) for each component
- **[P] marker:** Tasks marked [P] can run in parallel with other [P] tasks
- **Completion:** Check boxes as subtasks complete
- **Dependencies:** Phase 1 must complete before Phase 2. Within Phase 2, all 6 component groups are independent and marked [P].

---

## Phase 1: Verify Baseline

### Task 1.1: Confirm All Existing Tests Pass
- [x] Run `npx vitest run` and confirm 474 tests pass
- [x] Confirm zero `dark:` classes exist in any of the 6 target files

**Acceptance Criteria:**
- [x] 474 tests passing (actually 480 -- with pre-existing readOnly tests)
- [x] Baseline confirmed clean

---

## Phase 2: TDD Per Component (Tests First, Then Implementation)

Each component follows the same two-step pattern: write failing tests, then add dark: classes to make them pass.

---

### Task 2.1: [P] ActionBar (Bug #25) -- Most Visible

#### Task 2.1.1: Write Tests
- [x] Open `src/components/onboarding/ActionBar.test.tsx` (exists -- extend it)
- [x] Add `describe('ActionBar dark mode')` block with:
  - Test 1: "border separator has dark:border-slate-700" -- render pending step, check border container
  - Test 2: "completed badge has dark mode classes" -- render completed step, check `dark:bg-emerald-900/20` and `dark:text-emerald-400` on Completed badge
  - Test 3: "light mode classes still present (regression)" -- render pending step, verify `border-slate-100`, `text-rose-600` on I'm Stuck, `text-slate-500` on Suggest Edit
- [x] Run tests -- all 3 new tests should FAIL (dark: classes not present yet)

**Files:** `src/components/onboarding/ActionBar.test.tsx`

#### Task 2.1.2: Add Dark Mode Classes
- [x] Line 31: Add `dark:border-slate-700` to border separator
- [x] Line 39: Add `dark:bg-slate-700 dark:text-slate-500` to disabled Mark as Done
- [x] Line 55: Add `dark:text-emerald-400 dark:bg-emerald-900/20` to completed badge
- [x] Line 63: Add `dark:text-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:hover:text-slate-200` to Mark as Incomplete
- [x] Line 80: Add `dark:text-emerald-400 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300` to Resume Work
- [x] Line 91: Add `dark:text-rose-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-300` to I'm Stuck
- [x] Line 102: Add `dark:text-slate-400 dark:hover:text-brand-400 dark:hover:bg-brand-900/20` to Suggest Edit
- [x] Run tests -- all 3 new dark mode tests should PASS

**Files:** `src/components/onboarding/ActionBar.tsx`

**Acceptance Criteria:**
- [x] 3 new tests pass
- [x] All 5 existing ActionBar tests still pass
- [x] 8 elements have dark: variants

---

### Task 2.2: [P] StepTimeline (Bug #26)

#### Task 2.2.1: Write Tests
- [x] Create `src/components/onboarding/StepTimeline.test.tsx` (new file)
- [x] Mock StepCard as a simple div (avoids deep dependency tree)
- [x] Add `describe('StepTimeline dark mode')` block with:
  - Test 1: "renders step cards" -- basic rendering test, verify step titles present
  - Test 2: "completion footer has dark mode classes" -- render all-completed steps, check footer div for `dark:bg-emerald-900/20` and `dark:border-emerald-700`, text for `dark:text-emerald-300`
  - Test 3: "light mode classes still present (regression)" -- render all-completed steps, verify `bg-emerald-50`, `border-emerald-200`, `text-emerald-700` on footer
- [x] Run tests -- dark mode tests should FAIL

**Files:** `src/components/onboarding/StepTimeline.test.tsx`

#### Task 2.2.2: Add Dark Mode Classes
- [x] Line 57: Add `dark:from-slate-700 dark:via-slate-600 dark:to-slate-700` to main gradient line
- [x] Line 93: Add `dark:bg-emerald-600` to completed connector
- [x] Line 94: Add `dark:bg-slate-700` to pending connector
- [x] Line 110: Add `dark:bg-emerald-900/20 dark:border-emerald-700` to completion footer
- [x] Line 112: Add `dark:text-emerald-300` to completion text
- [x] Run tests -- all new tests should PASS

**Files:** `src/components/onboarding/StepTimeline.tsx`

**Acceptance Criteria:**
- [x] 3 new tests pass
- [x] 5 elements have dark: variants

---

### Task 2.3: [P] ReportStuckModal (Bug #23) -- Most Elements

#### Task 2.3.1: Write Tests
- [x] Create `src/components/modals/ReportStuckModal.test.tsx` (new file)
- [x] Add `describe('ReportStuckModal dark mode')` block with:
  - Test 1: "renders modal content" -- basic rendering test, verify "Report Blocker" title, step title, expert name visible
  - Test 2: "cancel button has dark mode classes" -- check `dark:text-slate-300` and `dark:hover:bg-slate-600`
  - Test 3: "rose alert has dark mode classes" -- check alert container for `dark:bg-rose-900/20`, `dark:border-rose-800`; text for `dark:text-rose-200`
  - Test 4: "blue info box has dark mode classes" -- check info container for `dark:bg-blue-900/20`, `dark:border-blue-800`; text for `dark:text-blue-300`
  - Test 5: "light mode classes still present (regression)" -- verify `bg-rose-50`, `text-slate-600` on cancel button
- [x] Run tests -- dark mode tests should FAIL

**Files:** `src/components/modals/ReportStuckModal.test.tsx`

#### Task 2.3.2: Add Dark Mode Classes
- [x] Line 36: Add `dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-600` to cancel button
- [x] Line 74: Add `dark:bg-rose-900/20 dark:border-rose-800` to rose alert bg
- [x] Line 77: Add `dark:text-rose-400` to alert icon
- [x] Line 81: Add `dark:text-rose-200` to alert title
- [x] Line 82: Add `dark:text-rose-300` to alert text
- [x] Line 88: Add `dark:border-slate-600` to step info border
- [x] Line 90: Add `dark:text-slate-400` to step label
- [x] Line 93: Add `dark:text-white` to step title
- [x] Line 96: Add `dark:border-slate-600` to expert section border
- [x] Line 97: Add `dark:text-slate-400` to expert label
- [x] Line 105: Add `dark:text-white` to expert name
- [x] Line 106: Add `dark:text-slate-400` to expert role
- [x] Line 112: Add `dark:bg-blue-900/20 dark:border-blue-800` to blue info bg
- [x] Line 115: Add `dark:text-blue-400` to clock icon
- [x] Line 118: Add `dark:text-blue-300` to info text
- [x] Line 124: Add `dark:text-slate-400` to footer disclaimer
- [x] Run tests -- all new tests should PASS

**Files:** `src/components/modals/ReportStuckModal.tsx`

**Acceptance Criteria:**
- [x] 5 new tests pass
- [x] 16 elements have dark: variants

---

### Task 2.4: [P] DeleteConfirmDialog (Bug #24)

#### Task 2.4.1: Write Tests
- [x] Open `src/components/templates/DeleteConfirmDialog.test.tsx` (exists -- extend it)
- [x] Add `describe('DeleteConfirmDialog dark mode')` block with:
  - Test 1: "cancel button has dark mode classes" -- check `dark:text-slate-300` and `dark:hover:bg-slate-600`
  - Test 2: "message text has dark:text-slate-200" -- check main message paragraph
  - Test 3: "light mode classes still present (regression)" -- verify `text-slate-700`, `text-slate-500`
- [x] Run tests -- dark mode tests should FAIL

**Files:** `src/components/templates/DeleteConfirmDialog.test.tsx`

#### Task 2.4.2: Add Dark Mode Classes
- [x] Line 44: Add `dark:text-slate-300 dark:hover:bg-slate-600` to cancel button
- [x] Line 72: Add `dark:text-slate-200` to message text
- [x] Line 75: Add `dark:text-slate-400` to sub-text
- [x] Run tests -- all new tests should PASS

**Files:** `src/components/templates/DeleteConfirmDialog.tsx`

**Acceptance Criteria:**
- [x] 3 new tests pass
- [x] All 4 existing tests still pass
- [x] 3 elements have dark: variants

---

### Task 2.5: [P] KPISection (Bug #22)

#### Task 2.5.1: Write Tests
- [x] Create `src/components/manager/KPISection.test.tsx` (new file)
- [x] Mock KPICard and filterUtils to avoid deep dependencies
- [x] Provide profiles + onProfileChange props so the filter dropdown renders
- [x] Add `describe('KPISection dark mode')` block with:
  - Test 1: "renders profile filter dropdown when profiles provided" -- verify select and label appear
  - Test 2: "label has dark:text-slate-200 and uses slate not gray" -- check label className
  - Test 3: "select has dark mode classes and uses slate not gray" -- check `dark:border-slate-600`, `dark:bg-slate-700`, `dark:text-white`, and `border-slate-300` (not `gray-300`)
  - Test 4: "light mode classes still present (regression)" -- verify `text-slate-700` on label, `border` on select
- [x] Run tests -- dark mode tests should FAIL

**Files:** `src/components/manager/KPISection.test.tsx`

#### Task 2.5.2: Add Dark Mode Classes + Normalize gray to slate
- [x] Line 89: Change `text-gray-700` to `text-slate-700 dark:text-slate-200`
- [x] Line 100: Change `border-gray-300` to `border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white`
- [x] Run tests -- all new tests should PASS

**Files:** `src/components/manager/KPISection.tsx`

**Acceptance Criteria:**
- [x] 4 new tests pass
- [x] gray- normalized to slate-
- [x] 2 elements have dark: variants

---

### Task 2.6: [P] WelcomeHeader (Bug #27)

#### Task 2.6.1: Write Tests
- [x] Create `src/components/onboarding/WelcomeHeader.test.tsx` (new file)
- [x] Provide profiles + onProfileChange props so the select dropdown renders
- [x] Add tests:
  - Test 1: "renders welcome message and progress" -- basic rendering test
  - Test 2: "option elements have explicit text-slate-900 bg-white" -- query option elements, verify className
  - Test 3: "select element retains text-white for gradient background (regression)" -- verify select still has `text-white`
- [x] Run tests -- option styling test should FAIL

**Files:** `src/components/onboarding/WelcomeHeader.test.tsx`

#### Task 2.6.2: Add Option Styling
- [x] Line 68: Add `className="text-slate-900 bg-white"` to "All Roles" option
- [x] Lines 70-72: Add `className="text-slate-900 bg-white"` to mapped option elements
- [x] Run tests -- all new tests should PASS

**Files:** `src/components/onboarding/WelcomeHeader.tsx`

**Acceptance Criteria:**
- [x] 3 new tests pass
- [x] All option elements have explicit text/bg colors
- [x] Select element text-white is unchanged

---

## Phase 3: Final Validation

### Task 3.1: Run Full Test Suite
- [x] Run `npx vitest run`
- [x] Confirm all 508 tests pass (480 existing + 19 new dark mode + 9 from concurrent readOnly feature)
- [x] Confirm zero test failures

### Task 3.2: Run Type Check
- [x] Run `npx tsc -b`
- [x] Confirm zero type errors

### Task 3.3: Verify Dark Class Counts
- [x] Grep each of the 6 files for `dark:` and confirm expected counts:
  - ActionBar.tsx: 9 lines with dark: (8 original elements + 1 readOnly View Only section)
  - StepTimeline.tsx: 5 lines with dark:
  - ReportStuckModal.tsx: 16 lines with dark:
  - DeleteConfirmDialog.tsx: 3 lines with dark:
  - KPISection.tsx: 2 lines with dark: (and zero `gray-` occurrences)
  - WelcomeHeader.tsx: 0 dark: (uses `text-slate-900 bg-white` on options instead)

**Acceptance Criteria:**
- [x] All tests pass
- [x] Type check clean
- [x] Expected dark: class counts confirmed

---

## Handoff Checklist (for Test Agent)

- [x] All 508 unit tests pass
- [x] `npx tsc -b` passes with no errors
- [x] 6 component files modified with dark mode classes
- [x] 4 new test files created + 2 existing test files extended
- [x] No logic changes -- all modifications are CSS className additions
- [x] KPISection gray-> slate normalization complete
- [x] WelcomeHeader option elements have explicit text/bg colors
- [ ] Build succeeds: `npx vite build` (to be verified by Test Agent)
