# Tasks: newhire-create-no-refresh

## Metadata
- **Feature:** newhire-create-no-refresh (Bug #4 of 6 in bugfix-round)
- **Created:** 2026-02-16T00:00
- **Status:** tasks-ready
- **Based On:** 2026-02-16T00:00_plan.md

## Execution Rules
- Tasks are ordered by dependency -- execute in order
- TDD: Tests are written FIRST (Phase 1), then implementation (Phase 2-3)
- `[P]` marks tasks that can run in parallel
- Mark each checkbox when complete

---

## Phase 1: Tests First (TDD)

### Task 1.1: Add unit tests for `_addInstance` action

- [ ] Add test: `_addInstance is available as a function` -- verify the action exists on the store's initial state
- [ ] Add test: `_addInstance appends instance to existing array` -- pre-populate store with one instance, call `_addInstance` with a second, verify array length is 2 and both entries are present
- [ ] Add test: `_addInstance works on empty instances array` -- start with default empty state, call `_addInstance`, verify array has the new instance
- [ ] Run tests: `npx vitest run src/store/useOnboardingStore.test.ts` -- new tests should PASS (store action does not exist yet, but tests will be written to work once it does)

**Files:** `src/store/useOnboardingStore.test.ts` (add after line 306, before StepsSlice describe block)

**Acceptance Criteria:**
- [ ] 3 new tests added to InstancesSlice section
- [ ] Tests use the existing `makeInstance` helper
- [ ] Tests follow established patterns (setState for setup, getState() for assertions)

---

## Phase 2: Store Change

### Task 2.1: Add `_addInstance` to InstancesSlice interface

- [ ] Add `_addInstance: (instance: OnboardingInstance) => void;` to the `InstancesSlice` interface (after `_startInstancesSubscription` on line 52)
- [ ] Add JSDoc comment: `/** Optimistically appends a newly created instance to the store. */`

**Files:** `src/store/useOnboardingStore.ts` (interface at ~line 52)

**Acceptance Criteria:**
- [ ] Type added to interface
- [ ] `OnboardingStore` type (which intersects all slices) now includes `_addInstance`

### Task 2.2: Implement `_addInstance` action

- [ ] Add implementation after `_startInstancesSubscription` closing brace (before `// -- StepsSlice state --`):
  ```typescript
  _addInstance: (instance: OnboardingInstance) => {
    set((state) => ({
      instances: [...state.instances, instance],
    }));
  },
  ```
- [ ] Run tests: `npx vitest run src/store/useOnboardingStore.test.ts` -- all tests (including new ones from Task 1.1) should PASS

**Files:** `src/store/useOnboardingStore.ts` (implementation at ~line 276)

**Acceptance Criteria:**
- [ ] Action appends to instances array using spread pattern
- [ ] Follows same pattern as `_createUser` (line 439)
- [ ] All store tests pass

---

## Phase 3: Hook Change

### Task 3.1: Wire `useCreateOnboarding` to call `_addInstance`

- [ ] Add import at top of file: `import { useOnboardingStore } from '../store/useOnboardingStore';`
- [ ] After `setData(result);` (line 41), add: `useOnboardingStore.getState()._addInstance(result);`
- [ ] Run full test suite: `npx vitest run` -- all tests pass

**Files:** `src/hooks/useCreateOnboarding.ts` (import at top, call at ~line 42)

**Acceptance Criteria:**
- [ ] Import added
- [ ] `_addInstance` called after successful creation, before `setIsLoading(false)`
- [ ] `_addInstance` is NOT called if `createOnboardingRunFromTemplate` throws (it's inside the try block, after the service call)
- [ ] No changes to the `useCallback` dependency array (store is accessed imperatively)

---

## Phase 4: Verification

### Task 4.1: Run full test suite [P]

- [ ] Run `npx vitest run` -- all tests pass (432 existing + 3 new = 435)
- [ ] Run `npx tsc -b` -- no type errors

**Acceptance Criteria:**
- [ ] Zero test failures
- [ ] Zero type errors
- [ ] No regressions in any slice

### Task 4.2: Manual verification checklist [P]

- [ ] `_addInstance` exists on InstancesSlice interface
- [ ] `_addInstance` implementation uses `set((state) => ...)` spread pattern
- [ ] `useCreateOnboarding.mutate` calls `_addInstance` after successful service call
- [ ] `_addInstance` is NOT called on error path

---

## Handoff Checklist (for Test Agent)

- [ ] All unit tests pass (`npx vitest run`)
- [ ] TypeScript compiles (`npx tsc -b`)
- [ ] Build succeeds (`npx vite build`)
- [ ] 3 new tests added for `_addInstance` action
- [ ] 2 files modified: `useOnboardingStore.ts`, `useCreateOnboarding.ts`
- [ ] 1 test file modified: `useOnboardingStore.test.ts`
- [ ] Functional test needed: Create new hire via modal, verify it appears in New Hires table without page reload
