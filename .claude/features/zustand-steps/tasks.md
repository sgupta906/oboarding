# Tasks: zustand-steps

## Metadata
- **Feature:** zustand-steps
- **Created:** 2026-02-16T00:01
- **Status:** implementation-complete
- **Based On:** 2026-02-16T00:01_plan.md

## Execution Rules

- Tasks within a phase are **sequential** unless marked with **[P]** (parallelizable)
- Phases are sequential (complete Phase N before starting Phase N+1)
- TDD: Phase 2 writes tests that initially fail; Phase 3 makes them pass
- Mark each checkbox as you complete it
- Run `npx vitest run` after each task to verify no regressions

---

## Phase 1: Store Extension (Sequential)

### Task 1.1: Add StepsSlice interface and update OnboardingStore type

- [x] Add `import type { Step, StepStatus } from '../types'` to `src/store/useOnboardingStore.ts`
- [x] Add `import { subscribeToSteps, updateStepStatus } from '../services/supabase'` to `src/store/useOnboardingStore.ts`
- [x] Define `StepsSlice` interface with: `stepsByInstance`, `stepsLoadingByInstance`, `stepsErrorByInstance`, `_startStepsSubscription`, `_updateStepStatus`
- [x] Update `OnboardingStore` type from `InstancesSlice` to `InstancesSlice & StepsSlice`
- [x] Add TSDoc comments to all new interface members

**Files:** `src/store/useOnboardingStore.ts`

**Acceptance Criteria:**
- [x] `StepsSlice` interface has all 5 members with correct types
- [x] `OnboardingStore = InstancesSlice & StepsSlice`
- [x] TypeScript compiles without errors (`npx tsc -b`)

---

### Task 1.2: Add per-instanceId ref-counting and resetStoreInternals extension

- [x] Add module-level `const stepsRefCounts: Map<string, number> = new Map()`
- [x] Add module-level `const stepsCleanups: Map<string, () => void> = new Map()`
- [x] Extend `resetStoreInternals()` to: call each cleanup in `stepsCleanups`, clear both Maps, and reset store steps state (`stepsByInstance: {}`, `stepsLoadingByInstance: {}`, `stepsErrorByInstance: {}`)

**Files:** `src/store/useOnboardingStore.ts`

**Acceptance Criteria:**
- [x] Two module-level Maps declared
- [x] `resetStoreInternals()` clears instances AND steps ref-counting
- [x] Existing instances reset behavior preserved

---

### Task 1.3: Implement _startStepsSubscription action

- [x] Add `stepsByInstance: {}`, `stepsLoadingByInstance: {}`, `stepsErrorByInstance: {}` to `create()` initial state
- [x] Implement `_startStepsSubscription(instanceId)` action in the store:
  - Increment `stepsRefCounts` for `instanceId`
  - If refCount becomes 1: set loading state, call `subscribeToSteps(instanceId, callback)`, store cleanup in `stepsCleanups`
  - Subscription callback: set `stepsByInstance[instanceId]` and clear loading
  - Error handler: set `stepsErrorByInstance[instanceId]` and clear loading
  - Return cleanup function: guarded against double invocation, decrements refCount, at 0 calls unsubscribe, clears state for that instanceId

**Files:** `src/store/useOnboardingStore.ts`

**Acceptance Criteria:**
- [x] First call for an instanceId starts subscription
- [x] Second call for same instanceId does not create duplicate
- [x] Different instanceIds get separate subscriptions
- [x] Cleanup at refCount 0 unsubscribes and clears that instanceId's state
- [x] Double cleanup is safe

---

### Task 1.4: Implement _updateStepStatus action

- [x] Implement `_updateStepStatus(instanceId, stepId, status)` action in the store:
  - Capture snapshot: `get().stepsByInstance[instanceId] ?? []`
  - Optimistic update: `set()` to update the matching step in `stepsByInstance[instanceId]`
  - Call `updateStepStatus(instanceId, stepId, status)` from service layer
  - On error: `set()` to rollback `stepsByInstance[instanceId]` to snapshot, re-throw error

**Files:** `src/store/useOnboardingStore.ts`

**Acceptance Criteria:**
- [x] Optimistic update applies synchronously to store state
- [x] Server call made with correct arguments
- [x] On server error: state rolled back to snapshot
- [x] Error re-thrown for caller handling

---

### Task 1.5: Update store barrel export

- [x] Add `StepsSlice` to the type export line in `src/store/index.ts`

**Files:** `src/store/index.ts`

**Acceptance Criteria:**
- [x] `StepsSlice` is importable from `../store`
- [x] Existing exports unchanged

---

## Phase 2: Tests (TDD -- write before Phase 3 hook migration)

### Task 2.1: Add store tests for StepsSlice

- [x] Add `mockSubscribeToSteps` and `mockUpdateStepStatus` mock functions in the existing mock setup block of `src/store/useOnboardingStore.test.ts`
- [x] Add them to the `vi.mock('../services/supabase', ...)` return object
- [x] Add a `makeStep` helper function (same pattern as `makeInstance`)
- [x] Extend `beforeEach` to also reset steps store state via `useOnboardingStore.setState({ stepsByInstance: {}, stepsLoadingByInstance: {}, stepsErrorByInstance: {} })`
- [x] Add `describe('StepsSlice', () => { ... })` block with these tests:

**Tests to write:**
- [x] T1: Initializes with empty steps state
- [x] T2: `_startStepsSubscription` calls `subscribeToSteps` with instanceId
- [x] T3: `_startStepsSubscription` sets loading state for instanceId
- [x] T4: Subscription callback updates `stepsByInstance` and clears loading
- [x] T5: Subscription error sets error and clears loading
- [x] T6: Second start for same instanceId is no-op (subscribeToSteps called once)
- [x] T7: Different instanceIds get separate subscriptions
- [x] T8: Cleanup decrements ref count (2 consumers, first cleanup does not unsubscribe)
- [x] T9: Last cleanup unsubscribes and clears that instanceId's state
- [x] T10: Double cleanup is safe (idempotent)
- [x] T11: Re-subscribe after full cleanup works
- [x] T12: `_updateStepStatus` applies optimistic update immediately
- [x] T13: `_updateStepStatus` rolls back on server error and re-throws
- [x] T14: `resetStoreInternals` clears steps ref-counting

**Files:** `src/store/useOnboardingStore.test.ts`

**Acceptance Criteria:**
- [x] All ~14 new tests pass
- [x] All existing 9 instances slice tests still pass
- [x] `npx vitest run src/store/useOnboardingStore.test.ts` passes

---

## Phase 3: Hook Migration (Sequential)

### Task 3.1: Rewrite useSteps hook to use store

- [x] Remove `useState` imports for `data`, `isLoading`, `error`
- [x] Remove `subscribeToSteps` and `updateStepStatus` imports from services
- [x] Add `import { useOnboardingStore } from '../store'`
- [x] Add `import type { Step, StepStatus } from '../types'`
- [x] Add module-level `const EMPTY_STEPS: Step[] = []` for stable reference
- [x] Replace `useState` with store selectors:
  - `const data = useOnboardingStore(s => s.stepsByInstance[instanceId] ?? EMPTY_STEPS)`
  - `const isLoading = useOnboardingStore(s => s.stepsLoadingByInstance[instanceId] ?? false)`
  - `const error = useOnboardingStore(s => s.stepsErrorByInstance[instanceId] ?? null)`
- [x] Replace `useEffect` body: if `instanceId` truthy, call `useOnboardingStore.getState()._startStepsSubscription(instanceId)` and return its cleanup
- [x] Replace `useCallback(updateStatus)`: delegate to `useOnboardingStore.getState()._updateStepStatus(instanceId, stepId, status)` with dependency `[instanceId]` only
- [x] Return same shape: `{ data: instanceId ? data : EMPTY_STEPS, isLoading: instanceId ? isLoading : false, error: instanceId ? error : null, updateStatus }`
- [x] Preserve `UseStepsReturn` interface and TSDoc comment

**Files:** `src/hooks/useSteps.ts`

**Acceptance Criteria:**
- [x] `UseStepsReturn` type unchanged
- [x] Hook reads from store, not local state
- [x] `updateStatus` dependency is `[instanceId]` only
- [x] Empty `instanceId` returns empty data without starting subscription
- [x] TypeScript compiles without errors

---

### Task 3.2: Update useSteps.test.ts for store-backed hook

- [x] Add `import { resetStoreInternals, useOnboardingStore } from '../store'`
- [x] Add to `beforeEach`: `resetStoreInternals()` and `useOnboardingStore.setState({ stepsByInstance: {}, stepsLoadingByInstance: {}, stepsErrorByInstance: {} })`
- [x] Verify existing mock pattern (`vi.mock('../services/supabase', ...)`) still works -- the store imports from the same path, so the mock intercepts at the same level
- [x] Run existing 3 tests -- they should pass because:
  - `mockSubscribeToSteps` still captures callbacks and feeds data
  - The store receives that data and the hook reads it via selectors
  - `mockUpdateStepStatus` is still called by the store action
- [x] If any test needs adjustment, update mock setup while preserving assertions

**Files:** `src/hooks/useSteps.test.ts`

**Acceptance Criteria:**
- [x] All 3 existing tests pass
- [x] No changes to test assertions (only setup adjustments)
- [x] `npx vitest run src/hooks/useSteps.test.ts` passes

---

## Phase 4: Verification (Sequential)

### Task 4.1: Run full test suite

- [x] Run `npx vitest run` -- all 370+ tests must pass
- [x] Run `npx tsc -b` -- no type errors
- [x] Run `npx vite build` -- production build succeeds

**Acceptance Criteria:**
- [x] 370+ tests passing (370 existing + ~14 new = ~384)
- [x] Zero TypeScript errors
- [x] Clean production build

---

### Task 4.2: Manual review of store file

- [x] Verify `useOnboardingStore.ts` has correct structure:
  - `InstancesSlice` interface (unchanged)
  - `StepsSlice` interface (new)
  - `OnboardingStore = InstancesSlice & StepsSlice`
  - Module-level: `refCount`, `cleanup` (instances), `stepsRefCounts`, `stepsCleanups` (steps)
  - `resetStoreInternals()` resets both
  - `create<OnboardingStore>()` with all state fields and actions
- [x] Verify TSDoc comments on all public exports
- [x] Verify no unused imports

**Acceptance Criteria:**
- [x] File is well-structured and documented
- [x] No dead code
- [x] Consistent with slice 1 patterns

---

## Handoff Checklist (for Test Agent)

- [x] All tests pass: `npx vitest run`
- [x] TypeScript clean: `npx tsc -b`
- [x] Build clean: `npx vite build`
- [x] New test count: ~384 (370 existing + ~14 new store tests)
- [x] Files modified: 5 (`useOnboardingStore.ts`, `useOnboardingStore.test.ts`, `index.ts` (store), `useSteps.ts`, `useSteps.test.ts`)
- [x] Files NOT modified: `instanceService.ts`, `OnboardingHub.tsx`, all other hooks, all UI components
- [x] `useSteps` return type unchanged: `{ data: Step[], isLoading: boolean, error: Error | null, updateStatus: (stepId: number, status: StepStatus) => Promise<void> }`
- [x] Bug fix: `step-button-fix` -- optimistic updates and realtime callbacks write to single store field, eliminating two-source-of-truth race
