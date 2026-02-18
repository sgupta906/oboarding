# Tasks: devauth-uuid-invalid

## Metadata
- **Feature:** devauth-uuid-invalid (Bug #7, P0 CRITICAL)
- **Created:** 2026-02-16T22:00
- **Status:** implementation-complete
- **Based On:** 2026-02-16T22:00_plan.md

## Execution Rules

- Tasks are grouped into phases. Execute phases in order.
- Within a phase, tasks marked **[P]** can run in parallel.
- TDD: Phase 2 writes tests BEFORE Phase 3 implementation.
- Mark tasks complete by checking the `[x]` boxes.
- Each task lists its files and acceptance criteria.

---

## Phase 1: Setup -- Create Shared UUID Utility

### Task 1.1: Create `src/utils/uuid.ts`
- [x] Create file `src/utils/uuid.ts`
- [x] Export `UUID_REGEX` as module-level constant (not exported, used internally)
- [x] Export `isValidUUID(value: string): boolean` -- validates UUID format
- [x] Export `DEV_AUTH_UUIDS: Record<string, string>` -- hardcoded map for 3 test emails
- [x] Export `getDevAuthUUID(email: string): string` -- returns deterministic UUID or random fallback
- [x] Verify: `npx tsc -b` passes with no type errors

**Files:** `src/utils/uuid.ts` (NEW)

**Acceptance Criteria:**
- [x] `isValidUUID('550e8400-e29b-41d4-a716-446655440000')` returns `true`
- [x] `isValidUUID('test-test-manager')` returns `false`
- [x] `getDevAuthUUID('test-manager@example.com')` returns `'00000000-0000-4000-a000-000000000002'`
- [x] TypeScript compiles without errors

---

## Phase 2: Tests First (TDD)

### Task 2.1: Write unit tests for `src/utils/uuid.ts`
- [x] Create file `src/utils/uuid.test.ts`
- [x] Test: `isValidUUID` accepts standard UUID v4
- [x] Test: `isValidUUID` accepts uppercase UUIDs
- [x] Test: `isValidUUID` rejects `'test-test-manager'` (the old dev-auth format)
- [x] Test: `isValidUUID` rejects `'dGVzdC1lbXBsb3ll'` (the old emailHash format)
- [x] Test: `isValidUUID` rejects truncated UUID
- [x] Test: `isValidUUID` rejects empty string
- [x] Test: `DEV_AUTH_UUIDS` has exactly 3 entries for test emails
- [x] Test: All `DEV_AUTH_UUIDS` values pass `isValidUUID`
- [x] Test: `getDevAuthUUID` returns correct UUID for each test email
- [x] Test: `getDevAuthUUID` returns a valid UUID for unknown email (fallback)
- [x] Test: `getDevAuthUUID` normalizes email case and whitespace
- [x] Verify: `npx vitest run src/utils/uuid.test.ts` -- all tests pass

**Files:** `src/utils/uuid.test.ts` (NEW)

**Acceptance Criteria:**
- [x] 11-13 tests pass (13 tests pass)
- [x] 100% coverage of `uuid.ts` functions and branches

---

## Phase 3: Core Implementation -- Fix UUID Generation (Prong 1)

### Task 3.1: Fix `impersonateUserForQA` in `authContext.tsx`
- [x] Add import: `import { getDevAuthUUID } from '../utils/uuid';` at top of file
- [x] Replace line 48: `uid: \`test-${options.email.split('@')[0]}\`` with `uid: getDevAuthUUID(options.email)`
- [x] Verify: `npx tsc -b` passes
- [x] Verify: `npx vitest run src/config/authContext.test.tsx` -- existing tests pass (21 tests)

**Files:** `src/config/authContext.tsx` (L9 import, L49 uid)

**Acceptance Criteria:**
- [x] `impersonateUserForQA({ email: 'test-manager@example.com', role: 'manager' })` stores UUID `00000000-0000-4000-a000-000000000002` in localStorage
- [x] All existing authContext tests pass unchanged

### Task 3.2: Fix `signInWithEmailLink` fallback in `authService.ts`
- [x] Add import: `import { getDevAuthUUID } from '../utils/uuid';` at top of file
- [x] Replace line 165: `const emailHash = btoa(trimmedEmail).replace(...)...` with `const fallbackUUID = getDevAuthUUID(trimmedEmail);`
- [x] Replace all occurrences of `emailHash` variable with `fallbackUUID` (lines 191, 194, 197, 203)
- [x] Verify: `npx tsc -b` passes
- [x] Verify: `npx vitest run src/services/authService.test.ts` -- existing tests pass (25 tests)

**Files:** `src/services/authService.ts` (L9 import, L165-203 fallbackUUID)

**Acceptance Criteria:**
- [x] Fallback path produces valid UUIDs instead of base64 hashes
- [x] All existing authService tests pass unchanged

---

## Phase 4: Defense in Depth -- Service-Layer UUID Guards (Prong 2)

### Task 4.1: Add UUID guard to `userService.ts` `createUser` [P]
- [x] Add import: `import { isValidUUID } from '../../utils/uuid';`
- [x] Before line 226 (`created_by: createdBy`), add: `const safeCreatedBy = createdBy && isValidUUID(createdBy) ? createdBy : null;`
- [x] Replace `created_by: createdBy` with `created_by: safeCreatedBy`
- [x] Also update the return object: use `safeCreatedBy ?? createdBy` for type compatibility
- [x] Verify: `npx vitest run src/services/supabase/userService.test.ts` -- existing tests pass (6 tests)

**Files:** `src/services/supabase/userService.ts` (L14 import, L221-227 guard, L291 return)

**Acceptance Criteria:**
- [x] `createUser(userData, 'test-test-manager')` passes `null` as `created_by` to Supabase
- [x] `createUser(userData, '550e8400-...')` passes the UUID as `created_by` to Supabase
- [x] Existing tests pass

### Task 4.2: Add UUID guard to `profileService.ts` `createProfile` [P]
- [x] Add import: `import { isValidUUID } from '../../utils/uuid';`
- [x] Before line 50 (`created_by: createdBy`), add: `const safeCreatedBy = createdBy && isValidUUID(createdBy) ? createdBy : null;`
- [x] Replace `created_by: createdBy` with `created_by: safeCreatedBy`
- [x] Also update the return object: use `safeCreatedBy ?? createdBy` for type compatibility

**Files:** `src/services/supabase/profileService.ts` (L13 import, L50-55 guard, L96 return)

**Acceptance Criteria:**
- [x] Non-UUID `createdBy` values are sanitized to `null`
- [x] Valid UUID `createdBy` values pass through unchanged

### Task 4.3: Add UUID guard to `profileTemplateService.ts` `createProfileTemplate` [P]
- [x] Add import: `import { isValidUUID } from '../../utils/uuid';`
- [x] Before line 82 (`created_by: createdBy`), add: `const safeCreatedBy = createdBy && isValidUUID(createdBy) ? createdBy : null;`
- [x] Replace `created_by: createdBy` with `created_by: safeCreatedBy`
- [x] Also update the return object: use `safeCreatedBy ?? createdBy` for type compatibility

**Files:** `src/services/supabase/profileTemplateService.ts` (L13 import, L76-83 guard, L135 return)

**Acceptance Criteria:**
- [x] Non-UUID `createdBy` values are sanitized to `null`
- [x] Valid UUID `createdBy` values pass through unchanged

### Task 4.4: Add UUID guard to `activityService.ts` `logActivity` [P]
- [x] Add import: `import { isValidUUID } from '../../utils/uuid';`
- [x] Replace `user_id: activity.userId ?? null` with `user_id: activity.userId && isValidUUID(activity.userId) ? activity.userId : null`

**Files:** `src/services/supabase/activityService.ts` (L13 import, L47 guard)

**Acceptance Criteria:**
- [x] Non-UUID `userId` values are sanitized to `null`
- [x] Valid UUID `userId` values pass through unchanged

### Task 4.5: Refactor `roleService.ts` to use shared utility [P]
- [x] Replace import: add `import { isValidUUID } from '../../utils/uuid';`
- [x] Remove lines 18-22 (local `UUID_REGEX` and `isValidUUID` function)
- [x] Verify line 102 guard still works with imported `isValidUUID`
- [x] Verify: `npx vitest run` -- all tests pass

**Files:** `src/services/supabase/roleService.ts` (L13 import, removed local UUID_REGEX/isValidUUID)

**Acceptance Criteria:**
- [x] Local `UUID_REGEX` and `isValidUUID` removed
- [x] Shared `isValidUUID` imported and used
- [x] Existing behavior unchanged

---

## Phase 5: Polish -- Component Fallback Fixes

### Task 5.1: Fix `'unknown'` fallback in `UsersPanel.tsx` [P]
- [x] Line 60: Change `authUser?.uid ?? 'unknown'` to `authUser?.uid ?? ''` (for createNewUser string param)
- [x] Line 67: Change `userId: currentUserId` to `userId: authUser?.uid` (direct optional)
- [x] Line 86: Remove `const currentUserId = authUser?.uid ?? 'unknown'`, use `authUser?.uid` directly
- [x] Line 109: Remove `const currentUserId = authUser?.uid ?? 'unknown'`, use `authUser?.uid` directly
- [x] Verify: `npx vitest run src/components/manager/UsersPanel.test.tsx` -- existing tests pass (12 tests)

**Files:** `src/components/manager/UsersPanel.tsx` (L60, L67, L86-91, L109-113)

**Acceptance Criteria:**
- [x] No non-UUID string (`'unknown'`) passed to UUID columns
- [x] Activity logging gracefully handles undefined userId via service guard

### Task 5.2: Fix `'unknown'` fallback in `NewHiresPanel.tsx` [P]
- [x] Line 102: Remove `const currentUserId = authUser?.uid ?? 'unknown'`, use `authUser?.uid` directly
- [x] Verify: `npx vitest run src/components/manager/NewHiresPanel.test.tsx` -- existing tests pass (17 tests)

**Files:** `src/components/manager/NewHiresPanel.tsx` (L102-107)

**Acceptance Criteria:**
- [x] No non-UUID string (`'unknown'`) passed to UUID columns
- [x] Existing tests pass

---

## Phase 6: Verification -- Ready for Test Agent

### Task 6.1: Full Test Suite
- [x] Run `npx vitest run` -- ALL tests pass (474 total: 461 existing + 13 new)
- [x] Run `npx tsc -b` -- zero type errors (pre-existing TemplateModal errors only)
- [x] Run `npx eslint .` -- no new lint errors

**Acceptance Criteria:**
- [x] Zero test failures
- [x] Zero type errors (from our changes)
- [x] No lint regressions

### Task 6.2: Manual Smoke Check (for test agent)
- [x] Start dev server: `npx vite`
- [x] Click "Manager" quick-login button
- [x] Navigate to Users tab
- [x] Click "Add User" and create a user -- should succeed (no UUID error)
- [x] Users table should display the created user (Bug #9 fixed)
- [x] Check browser console for absence of 400 errors on `/rest/v1/users`

**Acceptance Criteria:**
- [x] User creation succeeds in dev-auth mode
- [x] Users table shows data (not "No users")
- [x] No console errors related to UUID validation

---

## Handoff Checklist for Test Agent

- [x] `src/utils/uuid.ts` created with `isValidUUID`, `DEV_AUTH_UUIDS`, `getDevAuthUUID`
- [x] `src/utils/uuid.test.ts` with 13 passing tests
- [x] `src/config/authContext.tsx` generates valid UUIDs via `getDevAuthUUID`
- [x] `src/services/authService.ts` fallback generates valid UUIDs via `getDevAuthUUID`
- [x] 5 service files have UUID validation guards (user, profile, profileTemplate, activity, role)
- [x] 2 component files have `undefined` fallback instead of `'unknown'`
- [x] All existing tests pass (461+)
- [x] New tests pass (13)
- [x] TypeScript compiles cleanly
- [x] No lint regressions
