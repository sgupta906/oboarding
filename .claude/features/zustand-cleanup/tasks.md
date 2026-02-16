# Tasks: zustand-cleanup

## Metadata
- **Feature:** zustand-cleanup
- **Created:** 2026-02-16T00:01
- **Status:** implementation-complete
- **Based on:** 2026-02-16T00:01_plan.md

## Execution Rules

- Tasks are organized in phases. Execute phases in order.
- Within a phase, tasks are sequential unless marked with `[P]`.
- `[P]` = parallelizable with other `[P]` tasks in the same phase.
- Mark each subtask checkbox as completed during implementation.
- After each task, run `npx vitest run` to verify no regressions.
- After all tasks, run `npx tsc -b` and `npx vite build` for final verification.

---

## Phase 1: Tests (TDD -- write before implementation)

### Task 1.1: Write ManagerView integration tests

Write tests for the self-contained ManagerView that will drive the refactor. Tests will initially fail because ManagerView still expects props.

- [x] Create `src/views/ManagerView.test.tsx`
- [x] Mock the Zustand store module (`src/store`) and supabase services
- [x] Mock `useToast` from ToastContext
- [x] Test: renders dashboard tab by default with KPI, suggestions, and activity sections
- [x] Test: calls useSuggestions() and receives suggestion data from store
- [x] Test: calls useActivities() and receives activity data from store
- [x] Test: calls useOnboardingInstances() and receives instance data from store
- [x] Test: computes managerSteps by flatMapping instance steps
- [x] Test: computes stuckEmployeeNames from instances with stuck steps
- [x] Test: handleApproveSuggestion calls optimisticUpdateStatus + updateSuggestionStatus, then clears loading state
- [x] Test: handleApproveSuggestion rolls back on server error and shows toast
- [x] Test: handleRejectSuggestion calls optimisticRemove + deleteSuggestion, then clears loading state
- [x] Test: handleRejectSuggestion rolls back on server error and shows toast

**Files:** `src/views/ManagerView.test.tsx`

**Acceptance Criteria:**
- [x] Test file compiles with no TypeScript errors
- [x] Tests are structured to validate the self-contained pattern (no data props)
- [x] Tests cover approve/reject happy paths and error rollback
- [x] Tests cover derived data computation (managerSteps, stuckEmployeeNames)

---

## Phase 2: Make ManagerView Self-Contained (core change)

### Task 2.1: Add hooks and state to ManagerView

Add direct hook calls and move state/computations from OnboardingHub into ManagerView.

- [x] Import `useSuggestions`, `useActivities`, `useOnboardingInstances` from `../hooks`
- [x] Import `useToast` from `../context/ToastContext`
- [x] Import `useMemo` from React (add to existing import)
- [x] Import `updateSuggestionStatus`, `deleteSuggestion`, `logActivity` from `../services/supabase`
- [x] Call `useSuggestions()` -- destructure `data` as suggestions, `isLoading` as suggestionsLoading, `optimisticUpdateStatus`, `optimisticRemove`, `rollback`
- [x] Call `useActivities()` -- destructure `data` as activities, `isLoading` as activitiesLoading
- [x] Call `useOnboardingInstances()` -- destructure `data` as onboardingInstances, `isLoading` as instancesLoading
- [x] Call `useToast()` -- destructure `showToast`
- [x] Add `loadingSuggestionIds` state: `useState<Set<number | string>>(new Set())`
- [x] Add `managerSteps` useMemo: `onboardingInstances.flatMap(i => i.steps)`
- [x] Add `stuckEmployeeNames` useMemo: filter instances with stuck steps, map to employeeName
- [x] Add `isDashboardLoading` derived value: `suggestionsLoading || activitiesLoading || instancesLoading`

**Files:** `src/views/ManagerView.tsx`

**Acceptance Criteria:**
- [x] All three hooks are called at the top of the component
- [x] managerSteps and stuckEmployeeNames are computed via useMemo
- [x] loadingSuggestionIds state is initialized

### Task 2.2: Move suggestion handlers into ManagerView

Move handleApproveSuggestion and handleRejectSuggestion from OnboardingHub to ManagerView.

- [x] Add `handleApproveSuggestion` async function:
  - Set loadingSuggestionIds to include the id
  - Call `optimisticUpdateStatus(id, 'reviewed')` to get snapshot
  - Call `await updateSuggestionStatus(String(id), 'reviewed')`
  - Log activity with fire-and-forget pattern
  - On error: rollback(snapshot), showToast error
  - Finally: remove id from loadingSuggestionIds
- [x] Add `handleRejectSuggestion` async function:
  - Set loadingSuggestionIds to include the id
  - Call `optimisticRemove(id)` to get snapshot
  - Call `await deleteSuggestion(String(id))`
  - Log activity with fire-and-forget pattern
  - On error: rollback(snapshot), showToast error
  - Finally: remove id from loadingSuggestionIds

**Files:** `src/views/ManagerView.tsx`

**Acceptance Criteria:**
- [x] Both handlers use optimistic update pattern with rollback
- [x] Both handlers update loadingSuggestionIds during operation
- [x] Both handlers show toast on error
- [x] Both handlers log activity with fire-and-forget

### Task 2.3: Update ManagerView props interface and rendering

Remove data props from the interface and wire internal data to child components.

- [x] Remove props from ManagerViewProps interface: `steps`, `suggestions`, `activities`, `stuckEmployeeNames`, `onboardingInstances`, `onApproveSuggestion`, `onRejectSuggestion`, `onOnboardingCreated`, `onRefreshInstances`, `loadingSuggestionIds`
- [x] If ManagerViewProps is now empty, remove the interface entirely and make the function take no params
- [x] Update KPISection call to use local `managerSteps`, `suggestions` (from useSuggestions.data), `stuckEmployeeNames`, `onboardingInstances`
- [x] Update SuggestionsSection call to use local `suggestions`, `managerSteps`, `handleApproveSuggestion`, `handleRejectSuggestion`, `loadingSuggestionIds`
- [x] Update ActivitySection call to use local `activities` (from useActivities.data)
- [x] Remove `onOnboardingCreated` and `onRefreshInstances` callback invocations from `handleSubmitOnboarding` (no-ops since realtime auto-updates)
- [x] Add loading state rendering: show "Loading dashboard..." when `isDashboardLoading` is true
- [x] Remove old JSDoc param documentation that references removed props
- [x] Run `npx vitest run src/views/ManagerView.test.tsx` to verify new tests pass

**Files:** `src/views/ManagerView.tsx`

**Acceptance Criteria:**
- [x] ManagerView takes no props (or minimal non-data props)
- [x] All child components receive data from internal hooks/computations
- [x] Loading state handled internally
- [x] ManagerView.test.tsx tests pass

---

## Phase 3: Slim OnboardingHub

### Task 3.1: Remove manager data management from OnboardingHub

Remove all manager-specific data fetching, computation, and handlers from OnboardingHub.

- [x] Remove `useManagerData` from imports (line 21)
- [x] Remove `createSuggestion` (keep it -- used by handleSuggestEdit), `deleteSuggestion`, `updateSuggestionStatus` from service imports (keep `logActivity`, `createSuggestion`)
- [x] Remove `useManagerData` hook call (lines 55-66)
- [x] Remove `managerSteps` useMemo (lines 85-88)
- [x] Remove `stuckEmployeeNames` useMemo (lines 90-95)
- [x] Remove `loadingSuggestionIds` state (line 99)
- [x] Remove `handleApproveSuggestion` function (lines 177-197)
- [x] Remove `handleRejectSuggestion` function (lines 199-219)
- [x] Remove `MemoizedManagerView = memo(ManagerView)` declaration (line 37)
- [x] Keep `useOnboardingInstances` import -- needed for EmployeeSelector. Add direct hook call: `const { data: onboardingInstances, isLoading: areInstancesLoading } = useOnboardingInstances(isManager)`
- [x] Update `selectedInstance` useMemo to use the new `onboardingInstances` variable
- [x] Simplify ManagerView rendering: replace `MemoizedManagerView` with `ManagerView`, remove all data props, remove isDashboardLoading conditional
- [x] Remove unused import of `memo` from React if no longer used (MemoizedEmployeeView still uses it, so keep `memo`)
- [x] Remove `Step` from the type import if no longer used (check: `managerSteps` was `Step[]`)
- [x] Clean up unused imports: `deleteSuggestion`, `updateSuggestionStatus` from services/supabase

**Files:** `src/components/OnboardingHub.tsx`

**Acceptance Criteria:**
- [x] OnboardingHub no longer imports or calls useManagerData
- [x] OnboardingHub no longer computes managerSteps or stuckEmployeeNames
- [x] OnboardingHub no longer has suggestion approve/reject handlers
- [x] ManagerView rendered with no data props
- [x] EmployeeSelector still receives instances as props (from direct useOnboardingInstances call)
- [x] Run `npx vitest run` -- all tests pass

---

## Phase 4: Cleanup

### Task 4.1: Delete useManagerData and update barrel export

Remove the now-unused aggregator hook.

- [x] Delete file `src/hooks/useManagerData.ts`
- [x] Remove `export { useManagerData } from './useManagerData';` from `src/hooks/index.ts`

**Files:** `src/hooks/useManagerData.ts` (DELETE), `src/hooks/index.ts`

**Acceptance Criteria:**
- [x] `useManagerData.ts` no longer exists
- [x] `hooks/index.ts` no longer exports `useManagerData`
- [x] No remaining imports of `useManagerData` anywhere in the codebase

### Task 4.2: [P] Verify types cleanup

Check if any types in `src/types/index.ts` are now unused due to the refactor.

- [x] Verify `ManagerViewProps` is NOT in `src/types/index.ts` (it was defined locally in ManagerView.tsx)
- [x] Verify `OnboardingHubState` interface -- still referenced or can be removed? (pre-existing unused type, left as-is)
- [x] Remove any dead types if found
- [x] If no changes needed, mark as done

**Files:** `src/types/index.ts` (no changes needed)

**Acceptance Criteria:**
- [x] No unused types remain from the refactor
- [x] TypeScript compilation succeeds

---

## Phase 5: Verification

### Task 5.1: Full test suite verification

Run the complete test suite and verify all tests pass.

- [x] Run `npx vitest run` -- all tests pass (412 existing + new ManagerView tests)
- [x] Run `npx tsc -b` -- no TypeScript errors
- [x] Run `npx vite build` -- production build succeeds
- [x] Verify no console warnings about unused imports or missing dependencies

**Files:** (none -- verification only)

**Acceptance Criteria:**
- [x] All tests pass (expected: ~424+ tests across 29+ test files) -- actual: 425 tests, 29 files
- [x] TypeScript compilation clean
- [x] Production build succeeds
- [x] No dead imports or unused code remaining

### Task 5.2: [P] Code quality review

Review the final state of modified files for quality.

- [x] OnboardingHub is under 260 lines (actual: 256 lines, down from 343)
- [x] OnboardingHub no longer manages any manager-specific data
- [x] ManagerView is self-contained (calls hooks, owns handlers)
- [x] No dead code or commented-out code remains
- [x] Import lists are clean (no unused imports)
- [x] JSDoc comments are accurate for modified functions

**Files:** `src/components/OnboardingHub.tsx`, `src/views/ManagerView.tsx`

**Acceptance Criteria:**
- [x] OnboardingHub is a thin router (256 lines)
- [x] ManagerView follows the self-contained pattern (like NewHiresPanel, UsersPanel)
- [x] Code is clean and well-documented

---

## Handoff Checklist (for Test Agent)

Before marking implementation complete:

- [x] All existing 412 tests still pass
- [x] New ManagerView tests pass (13 tests)
- [x] `npx tsc -b` passes
- [x] `npx vite build` succeeds
- [x] `useManagerData.ts` is deleted
- [x] `hooks/index.ts` no longer exports `useManagerData`
- [x] OnboardingHub is under 260 lines (256 lines)
- [x] ManagerView is self-contained (no data props from parent)
- [x] EmployeeSelector still works (receives instances from OnboardingHub)
- [x] Suggestion approve/reject works (handlers in ManagerView with optimistic updates)
- [x] Dashboard loading state shows correctly
- [x] All manager dashboard tabs render correctly (Dashboard, Roles, New Hires, Users)
