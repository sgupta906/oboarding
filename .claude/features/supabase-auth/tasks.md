# Tasks: supabase-auth

## Metadata
- **Feature:** supabase-auth
- **Created:** 2026-02-14T05:51
- **Status:** implement-in-progress
- **Based on:** 2026-02-14T05:51_plan.md

## Execution Rules

1. Tasks are numbered by phase (e.g., Task 1.1, Task 2.1)
2. Tasks within a phase are sequential unless marked **[P]** (parallelizable)
3. TDD: write/update tests BEFORE implementation where noted
4. After each task, run the relevant test file(s) to verify
5. Mark tasks complete with `[x]` when done
6. A task is "done" when all its acceptance criteria checkboxes are checked

---

## Phase 1: Setup (Sequential)

Low-risk foundational changes. No logic changes, just type cleanup and env var renames.

### Task 1.1: Clean up authTypes.ts

Remove deprecated types that will not be needed after the migration.

- [x] Remove `FirestoreUser` interface (lines 28-34)
- [x] Remove `SignInRequest` interface (lines 42-44)
- [x] Remove `SignInResponse` interface (lines 49-53)
- [x] Verify `UserRole`, `AuthUser`, `AuthContextValue` are UNCHANGED
- [ ] Run `npx tsc -b --noEmit` to check for type errors from removal (BLOCKED: Bash tool denied)

**Files:** `src/config/authTypes.ts`

**Acceptance Criteria:**
- [x] `FirestoreUser`, `SignInRequest`, `SignInResponse` types no longer exist
- [x] `UserRole`, `AuthUser`, `AuthContextValue` unchanged
- [ ] No TypeScript errors (`tsc -b`) -- pending verification

---

### Task 1.2: Rename env var VITE_USE_FIREBASE_EMULATOR -> VITE_USE_DEV_AUTH

Update all references to the Firebase-specific env var name.

- [x] In `src/test/setup.ts` line 71: change `VITE_USE_FIREBASE_EMULATOR` to `VITE_USE_DEV_AUTH`
- [x] In `src/views/SignInView.tsx` line 80: change `VITE_USE_FIREBASE_EMULATOR` to `VITE_USE_DEV_AUTH`
- [x] In `src/config/authContext.tsx` line 44: change `VITE_USE_FIREBASE_EMULATOR` to `VITE_USE_DEV_AUTH` in `impersonateUserForQA`
- [x] In `src/views/AuthFlow.integration.test.tsx` line 36: change `VITE_USE_FIREBASE_EMULATOR` to `VITE_USE_DEV_AUTH`
- [x] Search entire codebase for any remaining `VITE_USE_FIREBASE_EMULATOR` references (grep) -- only firebase.ts remains (intentional)
- [ ] Run `npx vitest run src/views/AuthFlow.integration.test.tsx` to verify (BLOCKED: Bash tool denied)

**Files:** `src/test/setup.ts`, `src/views/SignInView.tsx`, `src/config/authContext.tsx`, `src/views/AuthFlow.integration.test.tsx`

**Acceptance Criteria:**
- [x] Zero occurrences of `VITE_USE_FIREBASE_EMULATOR` in source files (excluding firebase.ts itself and .md docs)
- [x] `VITE_USE_DEV_AUTH` used consistently
- [ ] AuthFlow integration tests still pass -- pending verification

---

## Phase 2: Core Implementation (Sequential -- authService depends on types, authContext depends on authService)

### Task 2.1: Rewrite authService.ts -- Replace Firebase with Supabase

This is the highest-complexity change. The function signatures stay the same; only the internals change.

- [x] Remove all Firebase imports (`firebase/auth`, `firebase/firestore`, `../config/firebase`)
- [x] Remove `import type { FirestoreUser }` (already removed in Task 1.1)
- [x] Add `import { supabase } from '../config/supabase'`
- [x] Keep `import { getAuthCredential } from './supabase'` (already correct)
- [x] Removed unused `AuthUser` import (only `UserRole` needed after removing `getCurrentUser`)
- [x] Rewrite `setUserRole()` -> `upsertUserRole()`:
  - Upsert user row via `supabase.from('users').upsert({ id, email, name, updated_at })`
  - Delete existing roles: `supabase.from('user_roles').delete().eq('user_id', uid)`
  - Insert new role: `supabase.from('user_roles').insert({ user_id: uid, role_name: role })`
  - Keep same function signature: `(uid: string, email: string, role: UserRole) => Promise<void>`
- [x] Rewrite `getUserRole()`:
  - Query: `supabase.from('users').select('*, user_roles(role_name)').eq('id', uid).single()`
  - Extract role: `data?.user_roles?.[0]?.role_name ?? null`
  - Keep same function signature: `(uid: string) => Promise<UserRole | null>`
  - Keep same error handling: return null on error
- [x] Remove `getCurrentUser()` function entirely (only used internally, replaced by `supabase.auth.getUser()`)
- [x] Rewrite `signInWithEmailLink()` internals:
  - Keep email validation (unchanged)
  - Keep `getAuthCredential()` check (unchanged)
  - Keep `MOCK_EMAIL_ROLES` lookup (unchanged)
  - Replace `createUserWithEmailAndPassword(auth, email, password)` with `supabase.auth.signUp({ email, password })`
  - Handle "user already exists" case: if signUp returns error or `user.identities` is empty, try `supabase.auth.signInWithPassword({ email, password })`
  - Replace Supabase-unavailable detection: catch errors and fall back to localStorage
  - `setUserRole` call preserved (same export name, internal logic changed)
  - Keep localStorage fallback path (mockAuthUser)
  - Keep `authStorageChange` custom event dispatch
- [x] Rewrite `signOut()`:
  - Keep localStorage clear + custom event dispatch (unchanged)
  - Replace `firebaseSignOut(auth)` with `supabase.auth.signOut()`
  - Keep graceful error handling (warn, don't throw)
- [x] Verify no remaining `firebase` imports in the file

**Files:** `src/services/authService.ts`

**Acceptance Criteria:**
- [x] Zero Firebase imports in authService.ts
- [x] `getUserRole(uid)` returns role from Supabase `users` + `user_roles` tables
- [x] `setUserRole(uid, email, role)` upserts to Supabase `users` + `user_roles` tables (exported name stays `setUserRole` for authContext compatibility)
- [x] `signInWithEmailLink(email)` uses Supabase Auth for sign-up/sign-in
- [x] `signOut()` calls `supabase.auth.signOut()`
- [x] `getCurrentUser()` is removed
- [x] localStorage fallback path preserved
- [x] `getAuthCredential()` integration preserved
- [ ] TypeScript compiles without errors -- pending verification

---

### Task 2.2: Rewrite authContext.tsx -- Replace Firebase listener with Supabase listener

Depends on Task 2.1 (authService exports must be stable).

- [x] Remove Firebase imports:
  - Remove `import { onAuthStateChanged } from 'firebase/auth'`
  - Remove `import { auth } from './firebase'`
- [x] Add Supabase import:
  - Add `import { supabase } from './supabase'`
- [x] Rewrite Effect 1 (auth state listener):
  - Replace `onAuthStateChanged(auth, async (firebaseUser) => { ... })` with `supabase.auth.onAuthStateChange(async (_event, session) => { ... })`
  - Map `session?.user` to same internal logic
  - Handle the `onAuthStateChange` return value: `{ data: { subscription } }`, cleanup via `subscription.unsubscribe()`
- [x] Keep Effect 2 UNCHANGED (storage + authStorageChange event listeners)
- [x] Keep `loadMockAuthFromStorage()` helper UNCHANGED
- [x] Keep `impersonateUserForQA()` UNCHANGED (env var already renamed in Task 1.2)
- [x] Keep `useAuth()` hook UNCHANGED
- [x] Verify no remaining `firebase` imports -- all comments updated too

**Files:** `src/config/authContext.tsx`

**Acceptance Criteria:**
- [x] Zero Firebase imports in authContext.tsx
- [x] `supabase.auth.onAuthStateChange` is used for auth state listening
- [x] Cleanup function calls `subscription.unsubscribe()` on unmount
- [x] localStorage mock auth path still works (Effect 1 checks localStorage first)
- [x] Storage event listeners still work (Effect 2 unchanged)
- [x] `AuthContextValue` interface is unchanged
- [ ] TypeScript compiles without errors -- pending verification

---

## Phase 3: Test Rewrites (Sequential -- tests verify Phase 2 changes)

### Task 3.1: Rewrite authService.test.ts

Update all mocks from Firebase to Supabase.

- [ ] Remove all Firebase mocks:
  - Remove `vi.mock('firebase/auth')`
  - Remove `vi.mock('firebase/firestore')`
  - Remove `vi.mock('../config/firebase', ...)`
  - Remove `import * as firebaseAuth from 'firebase/auth'`
  - Remove `import * as firestore from 'firebase/firestore'`
- [ ] Add Supabase mock:
  ```typescript
  const mockSupabaseAuth = {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
  };
  const mockFrom = vi.fn();
  vi.mock('../config/supabase', () => ({
    supabase: {
      auth: mockSupabaseAuth,
      from: mockFrom,
    },
  }));
  ```
- [ ] Mock `getAuthCredential` from `./supabase`:
  ```typescript
  vi.mock('./supabase', () => ({
    getAuthCredential: vi.fn().mockReturnValue(null),
  }));
  ```
- [ ] Rewrite `signInWithEmailLink` error tests:
  - Invalid email format (unchanged logic, just verify)
  - Unrecognized email (unchanged logic, just verify)
  - Email with whitespace (mock `supabase.auth.signUp` instead of Firebase)
- [ ] Rewrite `signInWithEmailLink` success tests:
  - Test email accepted -> `supabase.auth.signUp()` called
  - Existing user -> `supabase.auth.signInWithPassword()` called
  - Supabase unavailable -> localStorage fallback
  - Users panel credential -> `getAuthCredential()` path
- [ ] Rewrite `setUserRole` / `upsertUserRole` tests:
  - Mock `supabase.from('users').upsert(...)` and `supabase.from('user_roles')...`
  - Verify correct params passed
- [ ] Rewrite `getUserRole` tests:
  - Mock `supabase.from('users').select(...).eq(...).single()`
  - Test: returns role when found
  - Test: returns null when not found
  - Test: returns null on error
  - Test: returns different roles correctly
- [ ] Remove `getCurrentUser` tests (function removed)
- [ ] Rewrite `signOut` tests:
  - Mock `supabase.auth.signOut()` instead of `firebaseAuth.signOut`
  - Verify localStorage cleared
  - Verify graceful failure handling
- [ ] Run `npx vitest run src/services/authService.test.ts`

**Files:** `src/services/authService.test.ts`

**Acceptance Criteria:**
- [ ] Zero Firebase imports in test file
- [ ] All tests use Supabase mocks
- [ ] All tests pass
- [ ] No `getCurrentUser` tests (function removed)

---

### Task 3.2: Rewrite authContext.test.tsx

Update auth listener mocks from Firebase to Supabase.

- [ ] Remove Firebase mocks:
  - Remove `vi.mock('firebase/auth', ...)`
  - Remove `vi.mock('./firebase', ...)`
  - Remove `import { onAuthStateChanged } from 'firebase/auth'`
- [ ] Add Supabase mock:
  ```typescript
  const mockOnAuthStateChange = vi.fn();
  vi.mock('./supabase', () => ({
    supabase: {
      auth: {
        onAuthStateChange: mockOnAuthStateChange,
      },
    },
  }));
  ```
- [ ] Update mock pattern:
  - Old: `vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => { callback(user); return () => {}; })`
  - New: `mockOnAuthStateChange.mockImplementation((callback) => { callback('SIGNED_IN', { user: { id, email } }); return { data: { subscription: { unsubscribe: vi.fn() } } }; })`
- [ ] Rewrite all test cases that mock `onAuthStateChanged`:
  - Loading state: listener doesn't call back yet
  - Unauthenticated: callback with `(event, null)` session
  - Authenticated with role: callback with session, mock `getUserRole` to return role
  - Role fetch failure: mock `getUserRole` to return null
  - User without email: session.user.email is null
  - Cleanup on unmount: verify `subscription.unsubscribe()` called
- [ ] Keep localStorage mock auth tests UNCHANGED (they don't use Firebase listener)
- [ ] Keep storage event listener tests UNCHANGED
- [ ] Update `getUserRole` mock to use new import path if changed
- [ ] Run `npx vitest run src/config/authContext.test.tsx`

**Files:** `src/config/authContext.test.tsx`

**Acceptance Criteria:**
- [ ] Zero Firebase imports in test file
- [ ] All tests use Supabase `onAuthStateChange` mock pattern
- [ ] Unsubscribe cleanup verified
- [ ] All tests pass

---

### Task 3.3: Update SignInView.integration.test.tsx [P]

Minimal changes -- authService is still mocked at the module level, so the mock interface is unchanged.

- [ ] Remove Firebase mocks:
  - Remove `vi.mock('firebase/auth', ...)`
  - Remove `vi.mock('../config/firebase', ...)`
- [ ] Add Supabase mock for authContext's dependency:
  ```typescript
  vi.mock('../config/supabase', () => ({
    supabase: {
      auth: {
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } }
        })),
      },
    },
  }));
  ```
- [ ] Verify all existing tests still pass (no test logic changes needed since authService is mocked)
- [ ] Run `npx vitest run src/views/SignInView.integration.test.tsx`

**Files:** `src/views/SignInView.integration.test.tsx`

**Acceptance Criteria:**
- [ ] Zero Firebase imports in test file
- [ ] All existing tests pass without logic changes
- [ ] AuthProvider works with Supabase mock

---

### Task 3.4: Update AuthFlow.integration.test.tsx [P]

Minimal changes -- env var rename already done in Task 1.2.

- [ ] Remove Firebase mocks:
  - Remove `vi.mock('firebase/auth', ...)`
  - Remove `vi.mock('../config/firebase', ...)`
- [ ] Add Supabase mock for authContext's dependency:
  ```typescript
  vi.mock('../config/supabase', () => ({
    supabase: {
      auth: {
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } }
        })),
      },
    },
  }));
  ```
- [ ] Verify env var is `VITE_USE_DEV_AUTH` (should already be from Task 1.2)
- [ ] Verify all existing tests still pass
- [ ] Run `npx vitest run src/views/AuthFlow.integration.test.tsx`

**Files:** `src/views/AuthFlow.integration.test.tsx`

**Acceptance Criteria:**
- [ ] Zero Firebase imports in test file
- [ ] `VITE_USE_DEV_AUTH` used (not `VITE_USE_FIREBASE_EMULATOR`)
- [ ] All existing tests pass

---

## Phase 4: Integration Verification (Sequential)

### Task 4.1: Full test suite run

Run the complete test suite to verify no regressions.

- [ ] Run `npx vitest run` (all tests)
- [ ] Verify all 651+ tests pass
- [ ] If failures, identify and fix (likely mock import path issues in unrelated tests)
- [ ] Run `npx tsc -b --noEmit` to verify TypeScript compiles
- [ ] Verify no Firebase imports remain in modified files:
  ```bash
  grep -r "firebase/auth\|firebase/firestore\|from.*firebase" src/services/authService.ts src/config/authContext.tsx src/config/authTypes.ts
  ```
  (should return zero results)

**Files:** All modified files from Phases 1-3

**Acceptance Criteria:**
- [ ] All tests pass (651+)
- [ ] TypeScript compiles without errors
- [ ] No Firebase auth/firestore imports in modified source files
- [ ] `firebase.ts` and `firebase.test.ts` are UNTOUCHED (deferred to cleanup)

---

### Task 4.2: Manual smoke test verification

Verify the app starts and basic auth flow works.

- [ ] Run `npm run dev` (or `npx vite`)
- [ ] Verify app loads without console errors
- [ ] Verify SignInView renders correctly
- [ ] Verify test account reference section displays
- [ ] Verify sign-in with `test-employee@example.com` works (localStorage fallback)
- [ ] Verify sign-out clears state
- [ ] Verify quick-login buttons appear when `VITE_USE_DEV_AUTH=true`

**Files:** N/A (manual verification)

**Acceptance Criteria:**
- [ ] App loads without errors
- [ ] Sign-in flow works end-to-end with localStorage fallback
- [ ] Sign-out clears auth state

---

## Phase 5: Ready for Test Agent

### Handoff Checklist

- [ ] All source files modified per plan (5 source + 4 test files)
- [ ] Zero Firebase auth/firestore imports in modified files
- [ ] `FirestoreUser` type removed
- [ ] `VITE_USE_DEV_AUTH` env var used everywhere
- [ ] All unit tests pass (`authService.test.ts`)
- [ ] All integration tests pass (`authContext.test.tsx`, `SignInView.integration.test.tsx`, `AuthFlow.integration.test.tsx`)
- [ ] Full test suite passes (651+)
- [ ] TypeScript compiles (`tsc -b`)
- [ ] `firebase.ts` NOT modified (deferred to cleanup step)
- [ ] No new files created (only modifications)
- [ ] `AuthContextValue` interface unchanged -- zero consumer changes needed

### Files Modified (Summary)

**Source (5):**
1. `src/config/authTypes.ts` -- removed `FirestoreUser`, `SignInRequest`, `SignInResponse`
2. `src/services/authService.ts` -- Firebase -> Supabase Auth + DB
3. `src/config/authContext.tsx` -- Firebase listener -> Supabase listener
4. `src/views/SignInView.tsx` -- env var rename
5. `src/test/setup.ts` -- env var rename

**Tests (4):**
6. `src/services/authService.test.ts` -- Supabase mocks
7. `src/config/authContext.test.tsx` -- Supabase mocks
8. `src/views/SignInView.integration.test.tsx` -- removed Firebase mocks
9. `src/views/AuthFlow.integration.test.tsx` -- removed Firebase mocks, env var rename

### Risk Notes for Test Agent

- `EditRoleModal.test.tsx` has pre-existing flaky timeouts (userEvent typing 500+ chars). This is NOT a regression from this feature.
- If any unrelated tests fail due to Firebase mock resolution changes, the fix is to add `vi.mock('../config/supabase', ...)` to those specific test files.
- The `onAuthStateChange` callback shape (`(event, session)` vs `(user)`) is the most likely source of bugs in authContext tests.
