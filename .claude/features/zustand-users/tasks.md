# Tasks: zustand-users

## Metadata
- **Feature:** zustand-users
- **Created:** 2026-02-16T00:01
- **Status:** implementation-complete
- **Based on:** 2026-02-16T00:01_plan.md

## Execution Rules
- Tasks within the same phase are **sequential** unless marked **[P]** (parallelizable)
- TDD: Phase 2 writes tests BEFORE Phase 3 implementation (tests fail initially)
- Mark each subtask `[x]` as completed during implementation
- Each task has acceptance criteria that must ALL pass before moving to the next task

---

## Phase 1: Setup (Sequential)

### Task 1.1: Add UsersSlice interface and type exports

- [x] Add `UsersSlice` interface to `src/store/useOnboardingStore.ts` (after `StepsSlice` interface)
- [x] Add TSDoc comments on every field and action
- [x] Update `OnboardingStore` type: `InstancesSlice & StepsSlice & UsersSlice`
- [x] Import `User` and `UserFormData` types from `../types`
- [x] Import service functions: `subscribeToUsers`, `createUser`, `updateUser`, `deleteUser`, `getUser` from `../services/supabase`
- [x] Export `UsersSlice` from `src/store/index.ts`

**Files:**
- `src/store/useOnboardingStore.ts` (lines 12-14 imports, lines 40-64 interface, line 70 type)
- `src/store/index.ts` (add to type exports)

**Acceptance Criteria:**
- [x] `UsersSlice` interface has 3 state fields + 6 actions with correct types
- [x] `usersError` is `string | null` (NOT `Error | null`)
- [x] `OnboardingStore` intersects all three slices
- [x] `UsersSlice` is exported from barrel
- [x] TypeScript compiles with `npx tsc -b` (store actions can be stubs initially)

---

### Task 1.2: Add module-level ref-counting variables for users

- [x] Add `let usersRefCount = 0;` after existing instances ref-counting variables
- [x] Add `let usersCleanup: (() => void) | null = null;` after `usersRefCount`
- [x] Extend `resetStoreInternals()` to reset users ref-count and cleanup

**Files:**
- `src/store/useOnboardingStore.ts` (lines 76-102)

**Acceptance Criteria:**
- [x] `usersRefCount` and `usersCleanup` declared at module level
- [x] `resetStoreInternals()` resets `usersRefCount = 0`, calls + nullifies `usersCleanup`
- [x] Existing instances and steps reset logic unchanged
- [x] TypeScript compiles

---

## Phase 2: Tests First (TDD)

### Task 2.1: Write store tests for UsersSlice

- [x] Add mock variables: `mockUsersUnsubscribe`, `mockSubscribeToUsers`, `mockCreateUser`, `mockUpdateUser`, `mockDeleteUser`, `mockGetUser`
- [x] Extend the `vi.mock('../services/supabase', ...)` block with the 5 user service mocks
- [x] Add `makeUser` helper function (similar to `makeInstance`)
- [x] Extend `beforeEach` to reset users state: `users: [], usersLoading: false, usersError: null`
- [x] Add default mock implementations in `beforeEach` for all user service functions
- [x] Add `describe('UsersSlice', ...)` block with 14 tests:
  1. `initializes with empty users state`
  2. `_startUsersSubscription calls subscribeToUsers`
  3. `subscription callback updates users and clears loading`
  4. `subscription error sets error string and clears loading`
  5. `second start is no-op (subscribeToUsers called once)`
  6. `cleanup decrements ref count`
  7. `last cleanup unsubscribes and resets state`
  8. `double cleanup is safe (idempotent)`
  9. `re-subscribe after full cleanup works`
  10. `_createUser appends to array and returns user`
  11. `_createUser sets error string on failure`
  12. `_editUser applies optimistic update and rolls back on error`
  13. `_removeUser removes from array after server call`
  14. `_resetUsersError clears error`

**Files:**
- `src/store/useOnboardingStore.test.ts`

**Acceptance Criteria:**
- [x] All 14 new tests compile (TypeScript)
- [x] All 14 new tests PASS (TDD green phase -- actions implemented in Phase 1)
- [x] All 23 existing tests still PASS (instances + steps unchanged)

---

### Task 2.2: Update useUsers.test.ts for store-backed hook

- [x] Import `resetStoreInternals` from store
- [x] Add `resetStoreInternals()` call in `beforeEach` (before `vi.clearAllMocks()`)
- [x] Import `useOnboardingStore` and add store state reset in `beforeEach`
- [x] Verify all 10 existing tests still pass without changes to test assertions

**Files:**
- `src/hooks/useUsers.test.ts`

**Acceptance Criteria:**
- [x] `resetStoreInternals` imported and called in `beforeEach`
- [x] Store state reset added in `beforeEach`
- [x] All 10 existing tests still PASS (hook not yet rewritten -- they pass against old implementation)

---

## Phase 3: Core Implementation (Sequential)

### Task 3.1: Implement UsersSlice state and actions in the store

- [x] Add initial state fields to `create<OnboardingStore>(...)`: `users: []`, `usersLoading: false`, `usersError: null`
- [x] Implement `_startUsersSubscription` action:
  - Increment `usersRefCount`
  - If first consumer: `set({ usersLoading: true, usersError: null })`, call `subscribeToUsers(callback)`, store cleanup
  - Callback: `set({ users, usersLoading: false })`
  - Error handling: `set({ usersError: err.message, usersLoading: false })`
  - Return cleanup function with `let cleaned = false` guard
  - On last consumer cleanup: call stored unsubscribe, nullify, reset state
- [x] Implement `_createUser` action:
  - Clear error, call `createUser({ ...data, createdBy }, createdBy)`, append to `users[]`, return user
  - On error: set error string, re-throw
- [x] Implement `_editUser` action:
  - Clear error, snapshot `get().users`, optimistic `set(state => users.map(...))`, call `updateUser(userId, data)`
  - On error: rollback `set({ users: snapshot })`, set error string, re-throw
- [x] Implement `_removeUser` action:
  - Clear error, call `deleteUser(userId)`, then `set(state => users.filter(...))`
  - On error: set error string, re-throw
- [x] Implement `_fetchUser` action:
  - Clear error, call `getUser(userId)`, return result
  - On error: set error string, re-throw
- [x] Implement `_resetUsersError` action:
  - `set({ usersError: null })`

**Files:**
- `src/store/useOnboardingStore.ts`

**Acceptance Criteria:**
- [x] All 14 new store tests PASS (TDD green phase)
- [x] All 23 existing store tests still PASS
- [x] TypeScript compiles cleanly

---

### Task 3.2: Rewrite useUsers hook as store wrapper

- [x] Remove `useState` imports (keep `useEffect`, `useCallback`)
- [x] Remove direct service imports (`subscribeToUsers`, `createUser`, `updateUser`, `deleteUser`, `getUser`)
- [x] Import `useOnboardingStore` from store
- [x] Preserve `UseUsersReturn` interface exactly (no changes)
- [x] Rewrite hook body:
  - `users` from `useOnboardingStore(s => s.users)`
  - `isLoading` from `useOnboardingStore(s => s.usersLoading)`
  - `error` from `useOnboardingStore(s => s.usersError)`
  - `useEffect` calls `_startUsersSubscription()` and returns cleanup
  - `createNewUser` via `useCallback` calling `_createUser`
  - `editUser` via `useCallback` calling `_editUser`
  - `removeUser` via `useCallback` calling `_removeUser`
  - `fetchUser` via `useCallback` calling `_fetchUser`
  - `reset` via `useCallback` calling `_resetUsersError`
- [x] All `useCallback` deps are `[]` (stable references via `getState()`)
- [x] Return object shape unchanged

**Files:**
- `src/hooks/useUsers.ts`

**Acceptance Criteria:**
- [x] All 10 hook tests PASS
- [x] Return type matches `UseUsersReturn` exactly
- [x] No direct Supabase service imports in the hook file
- [x] `editUser` callback deps are `[]` (not `[users]` -- fixed stale closure)
- [x] TypeScript compiles cleanly

---

## Phase 4: Integration (Sequential)

### Task 4.1: Run full test suite and verify no regressions

- [x] Run `npx vitest run` -- all tests must pass
- [x] Verify test count is 398 (384 existing + 14 new store tests)
- [x] Run `npx tsc -b` -- no type errors
- [x] Run `npx vite build` -- production build succeeds

**Files:** None modified

**Acceptance Criteria:**
- [x] All 398 tests pass
- [x] Zero TypeScript errors
- [x] Production build succeeds
- [x] No console warnings related to Zustand or store

---

## Phase 5: Polish [P] (Parallelizable)

### Task 5.1: [P] Verify TSDoc comments on all exports

- [x] `UsersSlice` interface has TSDoc on every field and action
- [x] `usersRefCount` and `usersCleanup` have brief comments
- [x] `resetStoreInternals()` comment mentions users alongside instances and steps
- [x] Updated module-level JSDoc at top of store file mentions users slice

**Files:**
- `src/store/useOnboardingStore.ts`

**Acceptance Criteria:**
- [x] Every exported member of `UsersSlice` has a TSDoc comment
- [x] Module-level doc updated

---

### Task 5.2: [P] Verify barrel exports are complete

- [x] `src/store/index.ts` exports `UsersSlice` type
- [x] `src/hooks/index.ts` still exports `useUsers` (unchanged, but verify)

**Files:**
- `src/store/index.ts`
- `src/hooks/index.ts`

**Acceptance Criteria:**
- [x] `import { UsersSlice } from '../store'` compiles
- [x] `import { useUsers } from '../hooks'` compiles

---

## Phase 6: Ready for Test Agent

### Handoff Checklist

- [x] All unit tests passing (`npx vitest run`)
- [x] TypeScript compiles cleanly (`npx tsc -b`)
- [x] Production build succeeds (`npx vite build`)
- [x] `UsersPanel` works via `useUsers()` with unchanged API
- [x] `editUser` has stable callback reference (deps `[]`)
- [x] Optimistic update on edit: immediate UI patch, rollback on error
- [x] Non-optimistic delete: server first, then local removal
- [x] Error displayed as string (not Error object)
- [x] Ref-counting: subscription created once, shared across consumers, cleaned up when all unmount
- [x] `resetStoreInternals()` clears users state for test isolation
- [x] No changes to: `UsersPanel.tsx`, `userService.ts`, non-migrated hooks, other components

### Test Counts (Actual)

| File | Tests |
|------|-------|
| `src/store/useOnboardingStore.test.ts` | 37 (23 existing + 14 new) |
| `src/hooks/useUsers.test.ts` | 10 (unchanged) |
| `src/components/manager/UsersPanel.test.tsx` | 12 (unchanged) |
| **All other test files** | ~339 (unchanged) |
| **Total** | **398** |
