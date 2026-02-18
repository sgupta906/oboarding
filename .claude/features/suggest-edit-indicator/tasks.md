# Tasks: suggest-edit-indicator

## Metadata
- **Feature:** suggest-edit-indicator
- **Created:** 2026-02-16T23:30
- **Status:** implementation-complete
- **Based On:** 2026-02-16T23:30_plan.md

## Execution Rules
- Tasks within a phase run sequentially unless marked `[P]`
- TDD: write tests first (Phase 2), then implement (Phase 3)
- Mark tasks done with `[x]` as they complete
- All acceptance criteria must be checked before moving to next task

---

## Phase 1: Types Setup (Sequential)

### Task 1.1: Add `hasPendingSuggestion` to StepCardProps
- [x] In `src/types/index.ts`, add `hasPendingSuggestion?: boolean` to `StepCardProps` interface (after `readOnly?: boolean` on line 186)
- [x] Run `npx tsc -b` to verify no type errors

**Files:** `src/types/index.ts`

**Acceptance Criteria:**
- [x] `StepCardProps` has `hasPendingSuggestion?: boolean` field
- [x] Type check passes

---

## Phase 2: Tests First (TDD)

### Task 2.1: Write StepCard unit tests [P]
- [x] Create `src/components/onboarding/StepCard.test.tsx`
- [x] Test: renders "Feedback Sent" badge when `hasPendingSuggestion=true` and step is pending
- [x] Test: does NOT render "Feedback Sent" badge when `hasPendingSuggestion=false`
- [x] Test: does NOT render "Feedback Sent" badge when `hasPendingSuggestion` is undefined
- [x] Test: badge contains MessageSquare icon (via accessible structure)
- [x] Test: amber ring classes present on pending step card when `hasPendingSuggestion=true`
- [x] Test: dark mode ring class (`dark:ring-amber-800`) present when `hasPendingSuggestion=true`
- [x] Run tests -- all 6 SHOULD FAIL (implementation not done yet)

**Files:** `src/components/onboarding/StepCard.test.tsx` (NEW)

**Acceptance Criteria:**
- [x] 6 tests written and failing (red phase)

### Task 2.2: Write StepTimeline prop-forwarding tests [P]
- [x] In `src/components/onboarding/StepTimeline.test.tsx`, update StepCard mock to capture `hasPendingSuggestion` prop
- [x] Test: StepCard receives `hasPendingSuggestion=true` when step.id is in `stepsWithPendingSuggestions` Set
- [x] Test: StepCard receives `hasPendingSuggestion=false/undefined` when step.id is NOT in Set
- [x] Run tests -- new tests SHOULD FAIL

**Files:** `src/components/onboarding/StepTimeline.test.tsx`

**Acceptance Criteria:**
- [x] 2 new tests written and failing
- [x] Existing 3 tests still pass

### Task 2.3: Write EmployeeView integration test [P]
- [x] In `src/views/EmployeeView.test.tsx`, add test: "Feedback Sent" badge renders when `stepsWithPendingSuggestions` contains a pending step's ID
- [x] Run test -- SHOULD FAIL

**Files:** `src/views/EmployeeView.test.tsx`

**Acceptance Criteria:**
- [x] 1 new test written and failing
- [x] Existing 10 tests still pass

---

## Phase 3: Core Implementation (Sequential)

### Task 3.1: Implement StepCard amber badge + ring
- [x] Import `MessageSquare` from lucide-react
- [x] Destructure `hasPendingSuggestion` from props
- [x] Update `borderColorMap.pending` to conditionally include `ring-2 ring-amber-200 dark:ring-amber-800` when `hasPendingSuggestion` is true
- [x] Add amber Badge with MessageSquare icon after the completed CheckCircle in the title flex container
- [x] Verify dark mode classes present on Badge (Badge component handles this internally via `amber` color)
- [x] Run StepCard tests -- all 6 should PASS

**Files:** `src/components/onboarding/StepCard.tsx`

**Acceptance Criteria:**
- [x] All 6 StepCard tests pass (green phase)
- [x] Badge renders "Feedback Sent" with MessageSquare icon
- [x] Amber ring visible only on pending steps with suggestion

### Task 3.2: Implement StepTimeline prop threading
- [x] Add `stepsWithPendingSuggestions?: Set<number>` to `StepTimelineProps` interface
- [x] Destructure in function params
- [x] Pass `hasPendingSuggestion={stepsWithPendingSuggestions?.has(step.id)}` to each StepCard
- [x] Run StepTimeline tests -- all 5 (3 existing + 2 new) should PASS

**Files:** `src/components/onboarding/StepTimeline.tsx`

**Acceptance Criteria:**
- [x] All StepTimeline tests pass
- [x] Prop correctly forwarded to StepCard

### Task 3.3: Implement EmployeeView prop threading
- [x] Add `stepsWithPendingSuggestions?: Set<number>` to `EmployeeViewProps` interface
- [x] Destructure in function params
- [x] Pass `stepsWithPendingSuggestions={stepsWithPendingSuggestions}` to StepTimeline
- [x] Run EmployeeView tests -- all 13 (12 existing + 1 new) should PASS

**Files:** `src/views/EmployeeView.tsx`

**Acceptance Criteria:**
- [x] All EmployeeView tests pass
- [x] Prop correctly forwarded to StepTimeline

---

## Phase 4: Integration (Sequential)

### Task 4.1: Wire OnboardingHub -- suggestions subscription + computed Set
- [x] Import `useSuggestions` from `../hooks`
- [x] Add `const { data: suggestions } = useSuggestions(!isManager);` after existing hook calls
- [x] Add `useMemo` to compute `stepsWithPendingSuggestions` Set, filtering by `status === 'pending'` and `instanceId === employeeInstance?.id`
- [x] Pass `stepsWithPendingSuggestions={stepsWithPendingSuggestions}` to `MemoizedEmployeeView`
- [x] Run `npx tsc -b` -- no type errors

**Files:** `src/components/OnboardingHub.tsx`

**Acceptance Criteria:**
- [x] Type check passes
- [x] `useSuggestions` called with `!isManager` (employees only)
- [x] Set computed with correct filters (pending status + matching instanceId)

### Task 4.2: Add success toast after suggestion submission
- [x] In `handleSuggestEdit`, after `setActiveModal(null)`, add `showToast('Suggestion submitted!', 'success');`
- [x] Run `npx tsc -b` -- no type errors

**Files:** `src/components/OnboardingHub.tsx`

**Acceptance Criteria:**
- [x] Success toast fires after suggestion creation
- [x] Error toast still fires on failure (existing behavior preserved)

---

## Phase 5: Verify (Sequential)

### Task 5.1: Run full test suite
- [x] Run `npx vitest run`
- [x] All existing tests pass
- [x] All new tests pass (~9 new tests)
- [x] Run `npx tsc -b` -- no type errors

**Acceptance Criteria:**
- [x] Zero test failures
- [x] Zero type errors
- [x] Test count increased by 9 (540 -> 549)

---

## Handoff Checklist (for Test Agent)

- [x] All unit tests pass (`npx vitest run`)
- [x] Type check passes (`npx tsc -b`)
- [x] Build succeeds (`npx vite build`)
- [x] New test count: 9 added (StepCard: 6, StepTimeline: 2, EmployeeView: 1)
- [x] Files modified: 5 source files, 2 test files modified, 1 test file created
- [x] No new dependencies added
