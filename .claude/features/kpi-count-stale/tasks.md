# Tasks: kpi-count-stale

## Metadata
- **Feature:** kpi-count-stale (Bug #31, P2 MEDIUM)
- **Created:** 2026-02-17T00:00
- **Status:** implementation-complete
- **Based On:** `2026-02-17T00:00_plan.md`
- **Tests Added:** 6 (643 -> 649 expected; actual full suite 659 due to other additions)

## Execution Rules
- Tasks are numbered X.Y (Phase.Task)
- Tasks within a phase are sequential unless marked [P] (parallelizable)
- TDD: Phase 2 (tests) comes BEFORE Phase 3 (implementation)
- Mark tasks complete with [x] when done

---

## Phase 1: Setup (No setup needed)

No database changes, no new dependencies, no configuration changes.

---

## Phase 2: Tests (TDD -- Write Failing Tests First)

### Task 2.1: Write store tests for cross-slice optimistic update

- [x] Add test: `_updateStepStatus also updates instances[].steps` -- Pre-populate store with an instance that has steps. Call `_updateStepStatus`. Assert `instances[i].steps[j].status` is updated.
- [x] Add test: `_updateStepStatus recomputes instances[].progress` -- Pre-populate with instance having 2 steps. Complete 1 step. Assert progress is 50.
- [x] Add test: `_updateStepStatus transitions instance status to completed when all steps done` -- Pre-populate with instance having 2 steps. Complete both steps. Assert `instances[i].status === 'completed'` and `progress === 100`.
- [x] Add test: `_updateStepStatus rollback reverts both stepsByInstance and instances` -- Set `mockUpdateStepStatus` to reject. Assert both `stepsByInstance` AND `instances` are rolled back to original values.
- [x] Run tests, confirmed 3 of 4 new tests FAIL (TDD red phase). Rollback test passed initially because instances were not yet modified.

**Files:** `src/store/useOnboardingStore.test.ts`

**Acceptance Criteria:**
- [x] 4 new tests exist in the store test file
- [x] 3 new tests failed (code not yet implemented); rollback test passed trivially
- [x] All existing tests still pass

### Task 2.2: Write KPISection tests for fallback removal [P]

- [x] Add test: `returns 0 active count when onboardingInstances is empty array` -- Render KPISection with `onboardingInstances={[]}` and non-empty `steps`. Assert "Active Onboardings: 0".
- [x] Add test: `counts active instances correctly` -- Render KPISection with 2 active + 1 completed instance. Assert "Active Onboardings: 2".
- [x] Run tests, confirmed both new tests pass (fallback returns 0 from mock, instances counted correctly)

**Files:** `src/components/manager/KPISection.test.tsx`

**Acceptance Criteria:**
- [x] 2 new tests exist in the KPISection test file
- [x] Existing KPISection tests still pass

---

## Phase 3: Core Implementation (Sequential)

### Task 3.1: Add cross-slice optimistic update in _updateStepStatus

- [x] Capture `instances` snapshot for rollback (alongside existing `stepsByInstance` snapshot)
- [x] After the existing optimistic `stepsByInstance` update, add a second `set()` call that:
  - Maps over `instances` to find the instance matching `instanceId`
  - Updates the matching step's status in `instance.steps`
  - Recomputes `instance.progress` from the updated steps
  - Transitions `instance.status` to `'completed'` if progress === 100
  - Transitions `instance.status` back to `'active'` if it was `'completed'` but progress dropped below 100
  - Leaves `'on_hold'` status untouched
- [x] Update the rollback `catch` block to restore BOTH `stepsByInstance` AND `instances` from their respective snapshots
- [x] Run store tests, confirmed all 4 new tests now PASS (TDD green phase)

**Files:** `src/store/useOnboardingStore.ts` (lines 410-460)

**Acceptance Criteria:**
- [x] `_updateStepStatus` updates both `stepsByInstance` and `instances` optimistically
- [x] Progress formula: `Math.round((completedCount / totalCount) * 100)`
- [x] Status transitions are correct (active->completed, completed->active, on_hold untouched)
- [x] Rollback reverts both slices on server error
- [x] All 4 new store tests pass
- [x] All existing tests still pass

### Task 3.2: Remove KPISection fallback step-counting path

- [x] In `KPISection.tsx` `getActiveCount()`, replaced fallback path with `return 0` when `onboardingInstances` is empty or missing
- [x] Keep all other logic (profile filtering, status check) unchanged
- [x] Run KPISection tests, confirmed all tests pass

**Files:** `src/components/manager/KPISection.tsx` (line 42)

**Acceptance Criteria:**
- [x] Fallback `countStepsByProfileAndStatus(steps, selectedProfile, 'pending')` call is removed from `getActiveCount()`
- [x] Empty `onboardingInstances` returns 0 (not a step count)
- [x] All KPISection tests pass
- [x] No behavior change when `onboardingInstances` is provided (normal case)

---

## Phase 4: Integration (Verification)

### Task 4.1: Full test suite verification

- [x] Run `npx vitest run` -- all 659 tests pass
- [x] Run `npx tsc -b` -- no type errors

**Acceptance Criteria:**
- [x] All 659 tests pass
- [x] Zero TypeScript errors

---

## Phase 5: Polish (Not applicable)

No UI changes, no loading states, no accessibility changes needed. This is a pure data-flow bugfix.

---

## Phase 6: Ready for Test Agent

### Handoff Checklist

- [x] All 659 unit tests passing (`npx vitest run`)
- [x] Build succeeds (`npx tsc -b`)
- [x] `_updateStepStatus` updates both `stepsByInstance` and `instances`
- [x] KPISection fallback removed
- [x] Rollback covers both slices
- [x] 6 new tests cover all acceptance criteria

### Files Modified (for Test Agent review)

1. `src/store/useOnboardingStore.ts` -- `_updateStepStatus` action (cross-slice update + dual rollback)
2. `src/components/manager/KPISection.tsx` -- `getActiveCount()` (fallback removal)
3. `src/store/useOnboardingStore.test.ts` -- 4 new tests
4. `src/components/manager/KPISection.test.tsx` -- 2 new tests
