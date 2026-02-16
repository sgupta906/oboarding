# Feature Summary: zustand-steps

**Completed:** 2026-02-16
**Pipeline Phase:** /finalize complete
**Commit:** [Pending]

---

## Overview

Migrated step state management from local `useState` in `useSteps` hook to the Zustand store as the second slice in the incremental Zustand migration roadmap. This migration eliminates the `step-button-fix` race condition between optimistic updates and realtime callbacks by consolidating all step state into a single store field per instanceId.

---

## What Was Built

### 1. Store Extensions (`src/store/useOnboardingStore.ts`)

**Added `StepsSlice` interface:**
- `stepsByInstance: Record<string, Step[]>` - Per-instanceId step data
- `stepsLoadingByInstance: Record<string, boolean>` - Per-instanceId loading states
- `stepsErrorByInstance: Record<string, Error | null>` - Per-instanceId error states
- `_startStepsSubscription(instanceId: string): () => void` - Start/ref-count subscription
- `_updateStepStatus(instanceId, stepId, status): Promise<void>` - Optimistic update action

**Module-level ref-counting:**
- `stepsRefCounts: Map<string, number>` - Track subscription consumers per instanceId
- `stepsCleanups: Map<string, () => void>` - Unsubscribe callbacks per instanceId

**Extended `resetStoreInternals()`:**
- Clears steps ref-counting Maps and resets steps state fields
- Maintains instances slice reset behavior

### 2. Hook Migration (`src/hooks/useSteps.ts`)

**Replaced local state with store selectors:**
- Removed `useState` for `data`, `isLoading`, `error`
- Added store selectors reading from `stepsByInstance[instanceId]`, etc.
- Added `EMPTY_STEPS` constant for stable empty reference

**Subscription management:**
- `useEffect` delegates to `_startStepsSubscription(instanceId)` and returns cleanup
- Cleanup automatically decrements ref count and unsubscribes at zero

**Optimistic updates:**
- `updateStatus` delegates to `_updateStepStatus` store action
- Dependency array is `[instanceId]` only (no closure over `data`)
- Action uses `get()` to read current state, avoiding stale closures

### 3. Test Coverage

**New store tests:** 14 tests in `src/store/useOnboardingStore.test.ts`
- Subscription lifecycle (start, ref-counting, cleanup)
- Per-instanceId state isolation
- Optimistic updates with rollback on error
- `resetStoreInternals` clearing steps state

**Migrated hook tests:** 3 tests in `src/hooks/useSteps.test.ts`
- All existing tests pass after migration
- Tests verify hook reads from store correctly

**Total:** 384 tests passing (370 existing + 14 new)

---

## Architecture Changes

### Before (useState pattern)
```
useSteps hook
├── Local useState: [data, setData]
├── Local useState: [isLoading, setIsLoading]
├── Local useState: [error, setError]
└── useEffect: subscribeToSteps callback → setData
                                          (separate source of truth)
└── updateStatus: optimistic setData + service call
                  (race with realtime callback)
```

### After (Zustand store pattern)
```
Zustand Store (StepsSlice)
├── stepsByInstance: Record<string, Step[]>
├── stepsLoadingByInstance: Record<string, boolean>
├── stepsErrorByInstance: Record<string, Error | null>
└── Actions:
    ├── _startStepsSubscription → writes to stepsByInstance
    └── _updateStepStatus → writes to stepsByInstance (same field)
                            (single source of truth)

useSteps hook
├── Selectors: read from store
└── Delegates: call store actions
```

---

## Bug Fix: step-button-fix

**Problem:** Employee step status buttons had glitchy/delayed updates due to race condition between:
1. Optimistic update writing to `useState` local state
2. Realtime callback writing to same `useState` local state
3. Two different code paths updating the same UI field

**Solution:** Both optimistic writes and realtime callbacks now target the same `stepsByInstance[instanceId]` field in the store. Single source of truth eliminates the race.

**Verification:** Unit tests confirm both paths write to same store field. Functional testing during `/test` phase confirmed bug is resolved.

---

## Files Changed

| File | Lines Before | Lines After | Change | Type |
|------|--------------|-------------|--------|------|
| `src/store/useOnboardingStore.ts` | 105 | 267 | +162 | Modified |
| `src/store/useOnboardingStore.test.ts` | 210 | ~400 | +190 | Modified |
| `src/store/index.ts` | 9 | 12 | +3 | Modified |
| `src/hooks/useSteps.ts` | 76 | 65 | -11 | Modified |
| `src/hooks/useSteps.test.ts` | 94 | ~104 | +10 | Modified |

**Total:** +354 lines (net gain due to 14 new tests and per-instanceId ref-counting complexity)

---

## Quality Metrics

**Tests:** 384/384 passing (100%)
**TypeScript:** Zero errors (`npx tsc -b`)
**Build:** Clean production build (486.99 kB bundle)
**Lint:** Zero errors
**Code Quality:** No TODOs, no console.log, all exports TSDoc-commented
**Test Duration:** 7.20s

---

## Migration Context

**This is slice 2 of 5 in the incremental Zustand migration:**

| # | Slice | Status |
|---|-------|--------|
| 1 | `zustand-store` (instances) | ✅ Complete |
| 2 | `zustand-steps` (steps) | ✅ Complete (this feature) |
| 3 | `zustand-users` (users) | ⏳ Next |
| 4 | `zustand-activities` (activities/suggestions) | 🔜 Queued |
| 5 | `zustand-cleanup` (remove old hooks) | 🔜 Queued |

**Bugs resolved:** `step-button-fix` (optimistic update race condition)
**Bugs remaining:** `realtime-status-sync`, `employee-dropdown-sync` (resolved by slice 1, verified in this slice's tests)

---

## Developer Notes

### Design Decisions

1. **Per-instanceId keyed state:** Supports multiple concurrent `useSteps` calls (employee's own instance + manager-selected instance)

2. **Module-level Maps for ref-counting:** Each instanceId can have multiple consumers (e.g., employee view + manager employee view). Subscription starts at refCount 1, unsubscribes at refCount 0.

3. **Optimistic update in store action:** Store action reads current state via `get()`, avoiding stale closures in the hook's `updateStatus` callback.

4. **State cleanup on last unsubscribe:** When refCount reaches 0, deletes instanceId entries from all 3 state maps to prevent memory leaks.

5. **Empty array constant:** Module-level `EMPTY_STEPS` prevents new reference on every render when `instanceId` is empty.

### Migration Pattern (Reusable for Slices 3-4)

1. Define slice interface with state fields (keyed or scalar) and actions
2. Add module-level ref-counting Maps if needed
3. Extend `resetStoreInternals()` to clear new Maps/state
4. Implement subscription action with ref-counting logic
5. Implement mutation actions (optimistic update pattern)
6. Write 10-15 tests covering lifecycle, isolation, errors
7. Migrate hook to use selectors and delegate to actions
8. Update hook tests to reset store in `beforeEach`
9. Verify all existing tests pass (no regressions)

### Technical Debt Addressed

- ✅ Eliminated isolated state silo for steps
- ✅ Single source of truth for step data per instanceId
- ✅ Stale closure bug eliminated (dependency array is `[instanceId]` only)

### Technical Debt Remaining

- Instances slice and steps slice complete, but 3 more slices to migrate (users, activities, suggestions)
- OnboardingHub god component still exists (will slim after all slices migrated)
- Prop drilling for suggestions still present (will remove in slice 4)

---

## Next Steps

1. **Immediate:** Run `/research zustand-users` to start slice 3 migration
2. **After slice 3:** Run `/research zustand-activities` for slice 4
3. **After slice 5:** Slim OnboardingHub god component and remove old hooks

---

## Handoff Artifacts

**Design Documents:**
- `.claude/features/zustand-steps/2026-02-16T00:00_research.md` - Initial research and requirements
- `.claude/features/zustand-steps/2026-02-16T00:01_plan.md` - Architecture design and implementation plan
- `.claude/features/zustand-steps/tasks.md` - Task breakdown (all complete)

**Working Files (NOT committed):**
- `.claude/active-work/zustand-steps/implementation.md` - Implementation summary for test agent
- `.claude/active-work/zustand-steps/test-success.md` - Test verification report

**Tests:**
- All new tests in `src/store/useOnboardingStore.test.ts` (StepsSlice describe block)
- All migrated tests in `src/hooks/useSteps.test.ts` (store-backed behavior)

---

**Status:** ✅ Feature complete, tested, and finalized
**Commit:** [To be created by finalize agent]
**Pull Request:** [To be created by finalize agent]
