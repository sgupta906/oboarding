# Tasks: suggestion-improvements

## Metadata
- **Feature:** suggestion-improvements
- **Created:** 2026-02-16T23:30
- **Status:** implementation-complete
- **Based on:** 2026-02-16T23:30_plan.md
- **Bugs covered:** #41, #42, #43

## Execution Rules
- Tasks are numbered `Phase.Task` (e.g., 1.1, 2.1)
- `[P]` = parallelizable with other `[P]` tasks in same phase
- TDD: Phase 2 writes failing tests, Phase 3 makes them pass
- Check off items as completed: `- [x]`

---

## Phase 1: Setup (Sequential)

### Task 1.1: Update SuggestionsSectionProps type
- [x] Open `src/types/index.ts`
- [x] Add `onboardingInstances?: OnboardingInstance[]` to `SuggestionsSectionProps` (after `loadingSuggestionIds`)
- [x] Verify TypeScript compiles: `npx tsc -b`

**Files:** `src/types/index.ts` (line 369-375)

**Acceptance Criteria:**
- [x] `SuggestionsSectionProps` has optional `onboardingInstances` field
- [x] No type errors introduced

---

## Phase 2: Tests First (TDD)

### Task 2.1: Update existing ManagerView test assertions
- [x] Add `instanceId` to mock suggestions in `mockSuggestions` array (suggestion 1 gets `instanceId: 'inst-1'`, suggestion 2 gets `instanceId: 'inst-1'`)
- [x] Update approve test assertion: change `action: 'approved a documentation suggestion'` to `action: expect.stringContaining('approved suggestion from Alice on')`
- [x] Update reject test assertion: change `action: 'rejected a documentation suggestion'` to `action: expect.stringContaining('rejected suggestion from Alice on')`
- [x] Run tests to confirm the updated assertions FAIL (implementation not done yet)

**Files:** `src/views/ManagerView.test.tsx`

**Acceptance Criteria:**
- [x] Mock suggestions have `instanceId` values
- [x] Approve test expects message containing employee name and step context
- [x] Reject test expects message containing employee name and step context
- [x] Tests fail (red) because implementation still uses old generic messages

### Task 2.2: Add new ManagerView tests for step title resolution [P]
- [x] Add test: "approve activity message includes employee name and step title from instance"
- [x] Add test: "reject activity message includes employee name and step title from instance"
- [x] Add test: "approve falls back to flat step lookup when instanceId is missing"
- [x] Add test: "approve falls back to Step N when step not found"
- [x] Run tests to confirm all new tests FAIL

**Files:** `src/views/ManagerView.test.tsx`

**Acceptance Criteria:**
- [x] 4 new test cases added
- [x] All new tests fail (red) -- implementation not done yet

### Task 2.3: Add SuggestionsSection step title resolution tests [P]
- [x] Add test: "renders correct step title when instanceId matches an instance"
- [x] Add test: "falls back to flat steps lookup when instanceId is not provided"
- [x] Add test: "falls back to flat steps when instanceId points to unknown instance"
- [x] Run tests to confirm SuggestionsSection fallback tests PASS (existing behavior preserved)

**Files:** `src/views/ManagerView.test.tsx` (test SuggestionsSection indirectly via ManagerView render)

**Acceptance Criteria:**
- [x] 3 new test cases added
- [x] SuggestionsSection fallback tests pass (flat-steps fallback already works)

---

## Phase 3: Core Implementation (Sequential)

### Task 3.1: Update SuggestionsSection with instance-scoped lookup
- [x] Destructure `onboardingInstances` from props in function signature
- [x] Update `getStepTitle` to accept `(stepId: number, instanceId?: string)`
- [x] Update call site: `stepTitle={getStepTitle(sugg.stepId, sugg.instanceId)}`
- [x] Run `npx tsc -b` to verify no type errors

**Files:** `src/components/manager/SuggestionsSection.tsx`

**Acceptance Criteria:**
- [x] `getStepTitle` prefers instance-scoped lookup when `instanceId` available
- [x] Falls back to flat `steps.find()` when no instanceId or instance not found
- [x] No type errors

### Task 3.2: Update ManagerView with resolveStepTitle and contextual messages
- [x] Add `resolveStepTitle` helper inside component
- [x] Update `handleApproveSuggestion` with suggestion lookup and contextual message
- [x] Update `handleRejectSuggestion` similarly
- [x] Pass `onboardingInstances` prop to `SuggestionsSection`
- [x] Run `npx tsc -b` to verify no type errors

**Files:** `src/views/ManagerView.tsx`

**Acceptance Criteria:**
- [x] `resolveStepTitle` helper resolves titles via instance-scoped lookup with fallback
- [x] Approve message includes employee name and step title
- [x] Reject message includes employee name and step title
- [x] `onboardingInstances` passed to SuggestionsSection
- [x] No type errors

### Task 3.3: Update OnboardingHub with step title resolution in activity messages
- [x] Add `getStepTitle` helper inside component
- [x] Update `handleStatusChange` logActivity with step title
- [x] Update `handleSuggestEdit` logActivity with step title
- [x] Update `handleReportStuck` logActivity with step title
- [x] Run `npx tsc -b` to verify no type errors

**Files:** `src/components/OnboardingHub.tsx`

**Acceptance Criteria:**
- [x] All 4 `logActivity` calls use step titles instead of numeric IDs
- [x] Step titles are wrapped in double quotes for visual clarity
- [x] Falls back to `Step ${id}` when title not found
- [x] No type errors

---

## Phase 4: Verification (Sequential)

### Task 4.1: Run all tests
- [x] Run `npx vitest run`
- [x] Verify all updated assertions pass (approve/reject messages)
- [x] Verify all new tests pass (step title resolution)
- [x] Verify all pre-existing tests still pass (no regressions)
- [x] Run `npx tsc -b` for final type check

**Acceptance Criteria:**
- [x] All tests pass (513 existing + 7 new = 520 total)
- [x] No type errors
- [x] No console warnings during test run

### Task 4.2: Build verification
- [x] Run `npx vite build`
- [x] Verify production build succeeds with no errors

**Acceptance Criteria:**
- [x] Build completes successfully

---

## Handoff Checklist (for Test Agent)

- [x] All unit tests pass (`npx vitest run`)
- [x] TypeScript compiles (`npx tsc -b`)
- [x] Production build succeeds (`npx vite build`)
- [x] Bug #41 fixed: SuggestionsSection resolves step titles via instance-scoped lookup
- [x] Bug #42 fixed: OnboardingHub activity messages include step titles (4 locations)
- [x] Bug #43 fixed: ManagerView approve/reject messages include employee name + step title
- [x] ActivityFeed icons still work correctly with new message formats
- [x] Backward compatibility: suggestions without instanceId fall back gracefully
- [x] No changes to database schema, services, or store

## Summary

| Metric | Count |
|--------|-------|
| Files modified | 4 |
| New files | 0 |
| Tests updated | 2 assertions |
| Tests added | 7 |
| Lines changed | ~55 |
| Bugs fixed | 3 (#41, #42, #43) |
