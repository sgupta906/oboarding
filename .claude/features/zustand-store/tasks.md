# Tasks: zustand-store

## Metadata
- **Feature:** zustand-store
- **Created:** 2026-02-15T00:01
- **Status:** implementation-complete
- **Based on:** 2026-02-15T00:01_plan.md

## Execution Rules

1. Tasks are organized into phases. Complete phases in order (1, 2, 3, ...).
2. Within a phase, tasks are sequential unless marked with **[P]** (parallelizable).
3. TDD: Where noted, write tests BEFORE implementation.
4. Mark each checkbox when the subtask is done.
5. A task is complete only when ALL its acceptance criteria are checked.
6. Run `npx vitest run` after every task to verify no regressions.

---

## Phase 1: Setup

### Task 1.1: Install Zustand
- [x] Run `npm install zustand`
- [x] Verify `zustand` appears in `package.json` dependencies
- [x] Verify `npm ls zustand` shows the installed version (5.x)
- [x] Run `npx vitest run` -- all 350 tests still pass

**Files:** `package.json`, `package-lock.json`

**Acceptance Criteria:**
- [x] `zustand` is listed in `dependencies` (not devDependencies) in `package.json`
- [x] Version is `^5.x`
- [x] All 350 existing tests pass

---

### Task 1.2: Create store directory and barrel export
- [x] Create `src/store/` directory
- [x] Create `src/store/index.ts` with barrel export (initially exports nothing, placeholder)
- [x] Verify `npx tsc -b` compiles without errors

**Files:** `src/store/index.ts`

**Acceptance Criteria:**
- [x] `src/store/index.ts` exists and compiles
- [x] TypeScript build succeeds

---

## Phase 2: Store Implementation (TDD)

### Task 2.1: Write store unit tests
- [x] Create `src/store/useOnboardingStore.test.ts`
- [x] Mock `../services/supabase` module (same pattern as existing hook tests)
- [x] Write test: "initializes with empty state"
  - `instances` is `[]`, `instancesLoading` is `false`, `instancesError` is `null`
- [x] Write test: "_startInstancesSubscription calls subscribeToOnboardingInstances"
  - Verify mock is called when first consumer starts
- [x] Write test: "subscription callback updates instances and clears loading"
  - Simulate callback firing with mock data, verify store state
- [x] Write test: "subscription error sets error and clears loading"
  - Make subscribeToOnboardingInstances throw, verify error state
- [x] Write test: "second _startInstancesSubscription does not create duplicate subscription"
  - Call start twice, verify mock called only once
- [x] Write test: "cleanup decrements ref count"
  - Start, get cleanup, call it, verify state is NOT reset (refCount > 0 if another consumer)
- [x] Write test: "last cleanup unsubscribes and resets state"
  - Start once, get cleanup, call cleanup, verify mock unsubscribe called and state reset
- [x] Write test: "double cleanup is safe (idempotent)"
  - Call cleanup twice, verify no errors
- [x] Write test: "re-subscribe after full cleanup works"
  - Start, cleanup, start again -- verify subscription restarts
- [x] Run tests -- they should FAIL (store not implemented yet)

**Files:** `src/store/useOnboardingStore.test.ts`

**Acceptance Criteria:**
- [x] Test file exists with 9 test cases
- [x] Tests fail because `useOnboardingStore` does not exist yet (expected)
- [x] Test mocking pattern matches project conventions

---

### Task 2.2: Implement Zustand store
- [x] Create `src/store/useOnboardingStore.ts`
- [x] Define `InstancesSlice` interface with:
  - `instances: OnboardingInstance[]`
  - `instancesLoading: boolean`
  - `instancesError: Error | null`
  - `_startInstancesSubscription: () => () => void`
- [x] Define `OnboardingStore` type as `InstancesSlice` (extensible for future slices)
- [x] Implement module-level ref-counting variables (`refCount`, `cleanup`)
- [x] Implement `create<OnboardingStore>()` with:
  - Initial state: `instances: [], instancesLoading: false, instancesError: null`
  - `_startInstancesSubscription` action with ref-counting logic
- [x] Export `useOnboardingStore` from the file
- [x] Export `resetStoreInternals()` test helper (resets module-level refCount and cleanup for test isolation)
- [x] Add TSDoc comments to all exports
- [x] Update `src/store/index.ts` barrel export to re-export `useOnboardingStore`
- [x] Run `npx tsc -b` -- compiles
- [x] Run store tests -- all 9 pass
- [x] Run `npx vitest run` -- all existing tests still pass (350 + 9 = 359)

**Files:** `src/store/useOnboardingStore.ts`, `src/store/index.ts`

**Acceptance Criteria:**
- [x] Store compiles with TypeScript
- [x] All 9 store tests pass
- [x] All 350 existing tests still pass
- [x] TSDoc comments on all exports
- [x] Barrel export updated

---

## Phase 3: Hook Migration (TDD)

### Task 3.1: Write useOnboardingInstances migration tests
- [x] Create `src/hooks/useOnboardingInstances.test.ts`
- [x] Mock `../services/supabase` module (for subscribeToOnboardingInstances)
- [x] Write test: "returns { data, isLoading, error } shape"
- [x] Write test: "enabled=true starts subscription and populates data from store"
  - renderHook with enabled=true, simulate subscription callback, verify data
- [x] Write test: "enabled=false returns empty data without starting subscription"
  - renderHook with enabled=false, verify `{ data: [], isLoading: false, error: null }`
- [x] Write test: "cleans up subscription on unmount"
  - renderHook, unmount, verify cleanup was called
- [x] Write test: "switching enabled from true to false clears data"
  - renderHook with enabled=true, re-render with enabled=false, verify data clears
- [x] Run tests -- they should fail or pass depending on current implementation state

**Files:** `src/hooks/useOnboardingInstances.test.ts`

**Acceptance Criteria:**
- [x] Test file exists with 5 test cases
- [x] Tests validate the return type contract

---

### Task 3.2: Migrate useOnboardingInstances hook
- [x] Rewrite `src/hooks/useOnboardingInstances.ts` to:
  - Import `useOnboardingStore` from `../store`
  - Read `instances`, `instancesLoading`, `instancesError` from store via selectors
  - Use `useEffect` to call `_startInstancesSubscription()` when `enabled=true`
  - Return cleanup function from `useEffect`
  - Preserve return type: `{ data: OnboardingInstance[], isLoading: boolean, error: Error | null }`
  - Remove import of `subscribeToOnboardingInstances` from services
  - Remove local `useState` calls
- [x] Preserve the `UseOnboardingInstancesReturn` interface (same as before)
- [x] Preserve the TSDoc comments
- [x] Run `npx tsc -b` -- compiles
- [x] Run useOnboardingInstances tests -- all pass
- [x] Run `npx vitest run` -- verify total test count and no regressions

**Files:** `src/hooks/useOnboardingInstances.ts`

**Acceptance Criteria:**
- [x] Hook reads from Zustand store, not local state
- [x] No direct import of `subscribeToOnboardingInstances` in the hook
- [x] Return type identical to pre-migration
- [x] All useOnboardingInstances tests pass
- [x] All NewHiresPanel tests still pass (12 tests)
- [x] All other existing tests still pass

---

### Task 3.3: Write useEmployeeOnboarding migration tests
- [x] Create `src/hooks/useEmployeeOnboarding.test.ts`
- [x] Mock `../services/supabase` module (for subscribeToOnboardingInstances)
- [x] Write test: "returns { instance, isLoading, error } shape"
- [x] Write test: "email=null returns null instance"
  - renderHook with null email, verify `{ instance: null, isLoading: false, error: null }`
- [x] Write test: "finds correct instance by email (case-insensitive)"
  - Populate store with instances, verify correct one returned for matching email
- [x] Write test: "returns most recent instance when multiple exist for same email"
  - Populate store with two instances for same email, different createdAt, verify latest returned
- [x] Write test: "cleans up subscription on unmount"
  - renderHook, unmount, verify cleanup
- [x] Write test: "changing email re-evaluates the selector"
  - Start with email A, re-render with email B, verify instance changes

**Files:** `src/hooks/useEmployeeOnboarding.test.ts`

**Acceptance Criteria:**
- [x] Test file exists with 6 test cases
- [x] Tests validate the return type contract and derivation logic

---

### Task 3.4: Migrate useEmployeeOnboarding hook
- [x] Rewrite `src/hooks/useEmployeeOnboarding.ts` to:
  - Import `useOnboardingStore` from `../store`
  - Use selector to derive employee instance from store's `instances` array
  - Case-insensitive email matching
  - Sort by `createdAt` descending, take first (most recent)
  - Use `useEffect` to call `_startInstancesSubscription()` when email is non-null
  - Return cleanup function from `useEffect`
  - Preserve return type: `{ instance: OnboardingInstance | null, isLoading: boolean, error: Error | null }`
  - Remove import of `subscribeToEmployeeInstance` from services
  - Remove local `useState` calls
- [x] Preserve the `UseEmployeeOnboardingReturn` interface
- [x] Preserve TSDoc comments
- [x] Run `npx tsc -b` -- compiles
- [x] Run useEmployeeOnboarding tests -- all pass
- [x] Run `npx vitest run` -- verify total test count and no regressions

**Files:** `src/hooks/useEmployeeOnboarding.ts`

**Acceptance Criteria:**
- [x] Hook reads from Zustand store, not local state
- [x] No direct import of `subscribeToEmployeeInstance` in the hook
- [x] Return type identical to pre-migration
- [x] All useEmployeeOnboarding tests pass
- [x] All existing tests still pass

---

## Phase 4: Integration Verification

### Task 4.1: Verify useManagerData still works
- [x] Read `src/hooks/useManagerData.ts` and confirm it calls `useOnboardingInstances(enableInstances)`
- [x] Verify no code changes needed (it uses the same return type API)
- [x] Run `npx vitest run` -- confirm all tests pass
- [x] Verify `useManagerData` is exercised transitively through existing component tests

**Files:** None (verification only)

**Acceptance Criteria:**
- [x] `useManagerData` requires zero code changes
- [x] All tests pass

---

### Task 4.2: Full regression test suite
- [x] Run `npx vitest run --reporter=verbose` and capture output
- [x] Verify total test count is 350 + new tests (expected ~370)
- [x] Verify 0 failures
- [x] Run `npx tsc -b` -- clean TypeScript compilation
- [x] Run `npx vite build` -- production build succeeds

**Files:** None (verification only)

**Acceptance Criteria:**
- [x] All tests pass (0 failures)
- [x] TypeScript compiles cleanly
- [x] Production build succeeds
- [x] Test count documented: 370 total (350 existing + 9 store + 5 useOnboardingInstances + 6 useEmployeeOnboarding)

---

## Phase 5: Polish

### Task 5.1: [P] Verify code quality
- [x] Run `npx eslint src/store/` -- no lint errors
- [x] Run `npx eslint src/hooks/useOnboardingInstances.ts src/hooks/useEmployeeOnboarding.ts` -- no lint errors
- [x] Verify all new files have TSDoc comments on exports
- [x] Verify no `console.log` debug statements left in code

**Files:** All new/modified files

**Acceptance Criteria:**
- [x] Zero lint errors in new/modified files
- [x] TSDoc on all exports
- [x] No debug artifacts

---

### Task 5.2: [P] Verify store is extensible for future slices
- [x] Confirm `OnboardingStore` type uses intersection pattern (`InstancesSlice`) ready for `& StepsSlice & UsersSlice` etc.
- [x] Confirm store creation uses spread pattern or Zustand slice pattern that allows adding slices
- [x] Document in a brief code comment that future slices extend here

**Files:** `src/store/useOnboardingStore.ts`

**Acceptance Criteria:**
- [x] Store type is extensible
- [x] Comment documents extensibility point

---

## Phase 6: Ready for Test Agent

### Handoff Checklist

- [x] All new tests pass (store: 9, useOnboardingInstances: 5, useEmployeeOnboarding: 6)
- [x] All 350 existing tests pass (0 regressions)
- [x] TypeScript compiles (`npx tsc -b`)
- [x] Production build succeeds (`npx vite build`)
- [x] ESLint clean on new/modified files
- [x] `src/store/useOnboardingStore.ts` created and exports `useOnboardingStore`
- [x] `src/store/index.ts` barrel exports the store
- [x] `src/hooks/useOnboardingInstances.ts` reads from store (no local state)
- [x] `src/hooks/useEmployeeOnboarding.ts` derives from store (no separate subscription)
- [x] `src/hooks/useManagerData.ts` unchanged and working
- [x] `src/components/manager/NewHiresPanel.tsx` unchanged and tests pass
- [x] `src/components/OnboardingHub.tsx` unchanged and working
- [x] No changes to service layer files

### Bug Verification (for Test Agent)

The Test Agent should verify these bugs are fixed:

1. **realtime-status-sync**: After migration, `NewHiresPanel` and `useManagerData` both read from the same store. When the subscription fires, both update simultaneously. No more timing gaps.

2. **employee-dropdown-sync**: After migration, `EmployeeSelector` (via `OnboardingHub` -> `useManagerData` -> `useOnboardingInstances`) reads from the same store as everything else. New instances appear in the dropdown immediately when the subscription fires.

### What the Test Agent Should Verify

1. Run `npx vitest run` -- all tests pass
2. Run `npx tsc -b` -- clean compile
3. Run `npx vite build` -- build succeeds
4. Playwright functional tests:
   - Manager dashboard loads and shows New Hires table
   - Employee view loads and shows onboarding steps
   - Manager Employee View dropdown lists employees
   - All existing functionality works as before
