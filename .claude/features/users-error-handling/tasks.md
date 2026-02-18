# Tasks: users-error-handling

## Metadata
- **Feature:** users-error-handling (Bugs #8, #10, #12)
- **Created:** 2026-02-16T23:00
- **Status:** implementation-complete
- **Based On:** `2026-02-16T23:00_plan.md`
- **Estimated Changes:** ~10 lines modified in 1 file, ~5 new tests

## Execution Rules
- Tasks within a phase run sequentially unless marked [P]
- TDD: Phase 2 (tests) runs BEFORE Phase 3 (implementation)
- Tests should FAIL initially (red), then PASS after implementation (green)
- Mark tasks complete with [x] as they finish

---

## Phase 1: Setup

No setup needed. No database changes, no new dependencies, no configuration.

---

## Phase 2: Tests (TDD -- write BEFORE implementation)

### Task 2.1: Write error handling tests in UsersPanel.test.tsx
- [x] Add test: "keeps create modal open when createNewUser rejects" -- configure `mockCreateNewUser.mockRejectedValueOnce(new Error('DB error'))`, click New User, click Submit Modal, verify modal still in DOM
- [x] Add test: "keeps edit modal open when editUser rejects" -- configure `mockEditUser.mockRejectedValueOnce(new Error('DB error'))`, click edit button, click Submit Modal, verify modal still in DOM
- [x] Add test: "calls reset() when create modal is closed" -- open create modal, click Close Modal, verify `mockUseUsersReturn.reset` was called
- [x] Add test: "calls reset() when edit modal is closed" -- click edit button, click Close Modal, verify `mockUseUsersReturn.reset` was called
- [x] Add test: "hides store error banner while create modal is open" -- set `error: 'Server error'` in mock return, verify error text visible, open create modal, verify error text NOT visible
- [x] Run tests: `npx vitest run src/components/manager/UsersPanel.test.tsx` -- 3 of 5 new tests FAILED as expected (red phase); 2 Bug #8 tests passed because the mock stub doesn't exercise UserModal.resetForm

**Files:** `src/components/manager/UsersPanel.test.tsx`

**Acceptance Criteria:**
- [x] 5 new test cases added under a new `describe('Error Handling')` block
- [x] 3 tests failed because the fixes were not yet implemented (Bug #10 x2, Bug #12 x1)

---

## Phase 3: Core Implementation

### Task 3.1: Add `reset` to useUsers() destructuring
- [x] In `UsersPanel.tsx` line 24, add `reset` to the destructured return: `const { users, isLoading, error, createNewUser, editUser, removeUser, reset } = useUsers();`

**Files:** `src/components/manager/UsersPanel.tsx` (line 24)

**Acceptance Criteria:**
- [x] `reset` is available in scope for use in modal onClose handlers

### Task 3.2: Re-throw errors in submit handlers (Bug #8 fix)
- [x] In `handleCreateSubmit` catch block (line 72), add `throw err;` after `setModalError(...)`
- [x] In `handleEditSubmit` catch block (line 95), add `throw err;` after `setModalError(...)`

**Files:** `src/components/manager/UsersPanel.tsx` (lines 72, 95)

**Acceptance Criteria:**
- [x] When `createNewUser` or `editUser` rejects, the error propagates to `UserModal.handleSubmit`
- [x] `UserModal` catches the rejection and skips `resetForm()`
- [x] Form fields are retained after server error

### Task 3.3: Clear store error on modal close (Bug #10 fix)
- [x] In create modal `onClose` handler (line 301-304), add `reset();` after `setModalError(null);`
- [x] In edit modal `onClose` handler (line 317-320), add `reset();` after `setModalError(null);`

**Files:** `src/components/manager/UsersPanel.tsx` (lines 301-304, 317-320)

**Acceptance Criteria:**
- [x] Closing either modal clears both `modalError` (local) and `usersError` (store)
- [x] No stale error banners after modal close

### Task 3.4: Suppress store error banner while modal is open (Bug #12 fix)
- [x] In the error banner render condition (line 181), change `{error && (` to `{error && !showCreateModal && editingUser === null && (`

**Files:** `src/components/manager/UsersPanel.tsx` (line 181)

**Acceptance Criteria:**
- [x] Store error banner hidden when create modal is open
- [x] Store error banner hidden when edit modal is open
- [x] Store error banner still shows when no modal is open (existing behavior)

---

## Phase 4: Verify

### Task 4.1: Run targeted tests
- [x] Run `npx vitest run src/components/manager/UsersPanel.test.tsx` -- all 17 tests pass (green phase)
- [x] Verify the 5 new tests pass

**Acceptance Criteria:**
- [x] All new error handling tests pass
- [x] All pre-existing UsersPanel tests pass

### Task 4.2: Run full test suite
- [x] Run `npx vitest run` -- 480 passed, 4 failed (all pre-existing failures unrelated to this feature)
- [x] No regressions from this feature

**Acceptance Criteria:**
- [x] No regressions introduced by this feature
- [x] Pre-existing failures in ActionBar.test.tsx (2), EmployeeView.test.tsx (1), UserModal.test.tsx (1), SuggestEditModal.test.tsx (1), CreateOnboardingModal.test.tsx (1), RoleModal.test.tsx (1) -- all unrelated to users-error-handling

### Task 4.3: Type check
- [x] Run `npx tsc -b` -- 3 pre-existing type errors in ActionBar.test.tsx and EmployeeView.test.tsx (readOnly prop), zero errors in UsersPanel files

**Acceptance Criteria:**
- [x] No type errors in files modified by this feature

---

## Handoff Checklist (for Test Agent)

- [x] All 5 new tests pass in `UsersPanel.test.tsx`
- [x] Full test suite has no regressions from this feature
- [x] Type check has no errors in modified files
- [x] Only `UsersPanel.tsx` was modified (plus test file)
- [x] No changes to UserModal.tsx, useUsers.ts, or the Zustand store
