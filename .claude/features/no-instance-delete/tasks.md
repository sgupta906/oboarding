# Tasks: no-instance-delete

## Metadata
- **Feature:** no-instance-delete (Bug #6 of 6 in bugfix-round)
- **Created:** 2026-02-16T12:30
- **Status:** tasks-ready
- **Based On:** `2026-02-16T12:30_plan.md`

## Execution Rules
- Tasks within a phase execute sequentially unless marked [P]
- [P] = parallelizable with other [P] tasks in the same phase
- TDD: Phase 2 writes tests FIRST (they will fail), Phase 3 makes them pass
- Mark each checkbox when complete
- Run `npx vitest run` after each task to verify

---

## Phase 1: Service Layer (Sequential)

### Task 1.1: Export deleteOnboardingInstance from instance service
- [x] Add `export const deleteOnboardingInstance = crud.remove;` after line 62 in instanceService.ts
- [x] Add `deleteOnboardingInstance` to the Instance Service block in `src/services/supabase/index.ts`
- [x] Run `npx tsc -b` to verify no type errors

**Files:**
- `src/services/supabase/instanceService.ts` (add 1 line)
- `src/services/supabase/index.ts` (add 1 line to exports)

**Acceptance Criteria:**
- [x] `deleteOnboardingInstance` is importable from `../services/supabase`
- [x] TypeScript compiles without errors
- [x] All existing tests still pass

---

## Phase 2: Store Action (Sequential)

### Task 2.1: Add _removeInstance to InstancesSlice interface and implementation
- [x] Import `deleteOnboardingInstance` in the store's import block from `../services/supabase`
- [x] Add `_removeInstance: (instanceId: string) => Promise<void>;` to `InstancesSlice` interface
- [x] Implement `_removeInstance` in the store body (after `_addInstance`), following `_removeUser` pattern:
  - Server-first: `await deleteOnboardingInstance(instanceId)`
  - On success: `set((state) => ({ instances: state.instances.filter(i => i.id !== instanceId) }))`
  - On error: throw with message
- [x] Run `npx tsc -b` to verify no type errors

**Files:**
- `src/store/useOnboardingStore.ts` (add ~15 lines)

**Acceptance Criteria:**
- [x] `_removeInstance` exists on the store type
- [x] TypeScript compiles without errors
- [x] All existing store tests still pass

### Task 2.2: Add _removeInstance tests to store test file
- [x] Add `mockDeleteOnboardingInstance` to the mocks block
- [x] Add `deleteOnboardingInstance` mock to the `vi.mock('../services/supabase')` block
- [x] Add default mock in `beforeEach`: `mockDeleteOnboardingInstance.mockResolvedValue(undefined)`
- [x] Add test: `_removeInstance is available as a function`
- [x] Add test: `_removeInstance removes from array after server call` (pre-populate 2 instances, remove 1, verify 1 remains)
- [x] Add test: `_removeInstance throws and does not remove on server error` (mock reject, verify array unchanged)
- [x] Run `npx vitest run src/store/useOnboardingStore.test.ts`

**Files:**
- `src/store/useOnboardingStore.test.ts` (add ~45 lines)

**Acceptance Criteria:**
- [x] 3 new tests pass
- [x] All existing store tests still pass

---

## Phase 3: Hook Layer (Sequential)

### Task 3.1: Add removeInstance to useOnboardingInstances hook
- [x] Add `removeInstance: (id: string) => Promise<void>` to `UseOnboardingInstancesReturn` interface
- [x] In the hook body, create a `removeInstance` function that calls `useOnboardingStore.getState()._removeInstance(id)`
- [x] Add `removeInstance` to the return object
- [x] Run `npx tsc -b` to verify no type errors

**Files:**
- `src/hooks/useOnboardingInstances.ts` (add ~5 lines)

**Acceptance Criteria:**
- [x] `removeInstance` is available from `useOnboardingInstances()` return value
- [x] TypeScript compiles without errors
- [x] All existing tests still pass

---

## Phase 4: Component UI (Sequential)

### Task 4.1: Add delete UI to NewHiresPanel
- [x] Add imports: `Trash2` from lucide-react, `useAuth` from config/authContext, `logActivity` from services/supabase, `DeleteConfirmationDialog` from ui/
- [x] Add state: `instanceToDelete` (OnboardingInstance | null), `isDeleting` (boolean), `successMessage` (string | null)
- [x] Add helper: `getInitials(name: string)` (same as UsersPanel)
- [x] Add helper: `showSuccess(message: string)` with 3-second auto-dismiss
- [x] Destructure `removeInstance` from `useOnboardingInstances()` return value
- [x] Get `user: authUser` from `useAuth()`
- [x] Add `handleDeleteConfirm` async handler following UsersPanel pattern
- [x] Add "Actions" column header to table (right-aligned, matching UsersPanel)
- [x] Add Actions cell to each table row with Trash2 button:
  - `aria-label={`Delete onboarding for ${instance.employeeName}`}`
  - `onClick={() => setInstanceToDelete(instance)}`
  - Same hover-to-red styling as UsersPanel Trash2 button
- [x] Add success toast after the error state block (same markup as UsersPanel)
- [x] Add `<DeleteConfirmationDialog>` at end of component:
  - `isOpen={instanceToDelete !== null}`
  - `title="Delete Onboarding Instance"`
  - `message` includes employee name
  - `onConfirm={handleDeleteConfirm}`
  - `onCancel={() => setInstanceToDelete(null)}`
  - `isLoading={isDeleting}`
  - `isDangerous`
- [x] Run `npx tsc -b` to verify no type errors

**Files:**
- `src/components/manager/NewHiresPanel.tsx` (add ~65 lines, modify ~10 lines)

**Acceptance Criteria:**
- [x] Each table row has a Trash2 delete button
- [x] Clicking delete opens confirmation dialog with employee name
- [x] Confirming calls removeInstance and shows success toast
- [x] Canceling closes dialog without deleting
- [x] Activity is logged after successful deletion
- [x] TypeScript compiles without errors

### Task 4.2: Add delete tests to NewHiresPanel test file
- [x] Add `removeInstance` mock function to the mock return value
- [x] Mock `useAuth` to return a test user (for activity logging)
- [x] Mock `logActivity` as a resolved promise (fire-and-forget)
- [x] Add test: renders delete button for each row (check aria-labels)
- [x] Add test: renders Actions column header
- [x] Add test: opens confirmation dialog on delete button click
- [x] Add test: calls removeInstance on confirm and shows success toast
- [x] Add test: closes dialog on cancel without calling removeInstance
- [x] Run `npx vitest run src/components/manager/NewHiresPanel.test.tsx`

**Files:**
- `src/components/manager/NewHiresPanel.test.tsx` (add ~70 lines)

**Acceptance Criteria:**
- [x] 5 new tests pass
- [x] All 12 existing NewHiresPanel tests still pass

---

## Phase 5: Verification (Sequential)

### Task 5.1: Full test suite and type check
- [x] Run `npx vitest run` -- all tests pass (443 total)
- [x] Run `npx tsc -b` -- no type errors
- [x] Run `npx vite build` -- production build succeeds

**Acceptance Criteria:**
- [x] Zero test failures
- [x] Zero type errors
- [x] Build completes without errors
- [x] 8 new tests added (3 store + 5 component)

---

## Handoff Checklist (for Test Agent)

- [x] All unit tests pass (`npx vitest run`) -- 443 tests
- [x] TypeScript compiles (`npx tsc -b`)
- [x] Production build succeeds (`npx vite build`)
- [x] Delete button visible on each New Hires table row
- [x] Confirmation dialog shows employee name
- [x] Successful delete removes row from table
- [x] Success toast appears for 3 seconds after deletion
- [x] Activity log entry created after deletion
- [x] Canceling dialog does not delete anything
- [x] All 12 existing NewHiresPanel tests still pass

## Summary

- **Total files modified:** 6
- **Total lines added:** ~130
- **Total new tests:** ~8
- **Complexity:** Simple
- **Risk:** Low (existing infrastructure, proven patterns)
