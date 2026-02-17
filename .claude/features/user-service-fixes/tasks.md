# Tasks: user-service-fixes

## Metadata
- **Feature:** user-service-fixes
- **Created:** 2026-02-16T23:30
- **Status:** implementation-complete
- **Based On:** `.claude/features/user-service-fixes/2026-02-16T23:30_plan.md`

## Execution Rules

- Tasks are numbered by phase (e.g., Task 1.1, Task 2.1)
- **[P]** = Can be executed in parallel with other [P] tasks in the same phase
- Complete each task's acceptance criteria before moving on
- **TDD order:** Phase 2 writes tests FIRST (they will fail), Phase 3 makes them pass
- Check the box when each subtask is done

---

## Phase 1: Setup (Sequential)

No database migrations or configuration changes needed. Both bugs are code-only fixes.

---

## Phase 2: Tests First (TDD)

### Task 2.1: Write tests for `creatorExists()` helper

- [x] Add test cases in `userService.test.ts` for `creatorExists()`
- [x] Test: returns `true` when user row exists (mock supabase returns data)
- [x] Test: returns `false` when user row does not exist (mock supabase returns empty)
- [x] Test: returns `false` on query error (fail-safe behavior)

**Files:** `src/services/supabase/userService.test.ts`

**Acceptance Criteria:**
- [x] 3 test cases written for `creatorExists()`
- [x] Tests fail because `creatorExists()` does not exist yet

### Task 2.2: Write tests for `createUser()` existence check

- [x] Add test cases for `createUser()` with creatorExists integration
- [x] Test: sets `created_by` to null when creator UUID does not exist in users table
- [x] Test: sets `created_by` to the UUID when creator exists in users table
- [x] Test: sets `created_by` to null when UUID format is invalid (preserves existing behavior)

**Files:** `src/services/supabase/userService.test.ts`

**Acceptance Criteria:**
- [x] 3 test cases written for createUser existence check
- [x] Tests fail because `creatorExists()` is not yet called in `createUser()`

### Task 2.3: Write tests for simplified `deleteUser()` (no cascade)

- [x] Remove the 6 existing cascade tests from `userService.test.ts`
- [x] Add test: `deleteUser` deletes user row and removes auth credentials without touching instances
- [x] Add test: `deleteUser` does NOT query or delete `onboarding_instances`
- [x] Keep/adapt test: returns early (idempotent) when user not found

**Files:** `src/services/supabase/userService.test.ts`

**Acceptance Criteria:**
- [x] 6 old cascade tests removed
- [x] 3 new/adapted tests written for simplified deleteUser
- [x] The "does not touch instances" test explicitly asserts no `onboarding_instances` queries

---

## Phase 3: Core Implementation (Sequential)

### Task 3.1: Add `creatorExists()` helper to userService.ts

- [x] Add `creatorExists(userId: string): Promise<boolean>` function after `userEmailExists()`
- [x] Implementation: `SELECT id FROM users WHERE id = userId LIMIT 1`
- [x] Return `false` on query error (fail-safe)
- [x] Export `creatorExists` from `userService.ts`
- [x] Add `creatorExists` to barrel export in `index.ts`
- [x] Run `creatorExists` tests from Task 2.1 -- they should pass

**Files:** `src/services/supabase/userService.ts`, `src/services/supabase/index.ts`

**Acceptance Criteria:**
- [x] `creatorExists()` function exists and is exported
- [x] All 3 tests from Task 2.1 pass
- [x] Function returns false on error (does not throw)

### Task 3.2: Update `createUser()` to use `creatorExists()`

- [x] Modify the `safeCreatedBy` logic on line 224 of `userService.ts`
- [x] After `isValidUUID()` check, call `await creatorExists(safeCreatedBy)`
- [x] If creator does not exist, set `safeCreatedBy = null`
- [x] The function is already async, so `await` is fine
- [x] Run `createUser` tests from Task 2.2 -- they should pass

**Files:** `src/services/supabase/userService.ts`

**Acceptance Criteria:**
- [x] `createUser()` calls `creatorExists()` before INSERT
- [x] All 3 tests from Task 2.2 pass
- [x] Existing `createUser` behavior preserved for invalid UUID formats

### Task 3.3: Update sibling services with `creatorExists()` check [P]

- [x] In `roleService.ts`: import `creatorExists` from `./userService`
- [x] In `roleService.ts`: update `createRole()` line 94 to add existence check after `isValidUUID()`
- [x] In `profileService.ts`: import `creatorExists` from `./userService`
- [x] In `profileService.ts`: update `createProfile()` line 52 to add existence check after `isValidUUID()`
- [x] In `profileTemplateService.ts`: import `creatorExists` from `./userService`
- [x] In `profileTemplateService.ts`: update `createProfileTemplate()` line 78 to add existence check after `isValidUUID()`

**Files:** `src/services/supabase/roleService.ts`, `src/services/supabase/profileService.ts`, `src/services/supabase/profileTemplateService.ts`

**Acceptance Criteria:**
- [x] All 3 sibling services import `creatorExists` from `./userService`
- [x] All 3 use `await creatorExists()` after `isValidUUID()` check
- [x] Pattern is identical to the userService implementation
- [x] No circular dependencies introduced

### Task 3.4: Remove instance cascade from `deleteUser()` [P]

- [x] Remove lines 386-392 (JSDoc mentioning instance cascade)
- [x] Replace with updated JSDoc: "Deletes a user. Database CASCADE handles junction table cleanup (user_roles, user_profiles). Also removes auth credentials."
- [x] Remove lines 398-418 (instance lookup and delete block)
- [x] The remaining function body: `getUser()` -> `DELETE users` -> `removeUserFromAuthCredentials()`
- [x] Run `deleteUser` tests from Task 2.3 -- they should pass

**Files:** `src/services/supabase/userService.ts`

**Acceptance Criteria:**
- [x] No code references `onboarding_instances` in `deleteUser()`
- [x] JSDoc is updated to remove cascade mention
- [x] All 3 tests from Task 2.3 pass
- [x] Function still fetches user for email (needed for auth credential cleanup)

### Task 3.5: Update UsersPanel.tsx delete confirmation message [P]

- [x] Change line 336 from:
  `"Are you sure you want to delete \"${userToDelete.name}\"? This will also delete any associated onboarding data. This action cannot be undone."`
  to:
  `"Are you sure you want to delete \"${userToDelete.name}\"? This action cannot be undone."`
- [x] The message no longer mentions onboarding data since instances are not deleted

**Files:** `src/components/manager/UsersPanel.tsx`

**Acceptance Criteria:**
- [x] Delete confirmation message does not mention "onboarding data"
- [x] Message still includes the user's name and "cannot be undone" warning

---

## Phase 4: Integration (Sequential)

### Task 4.1: Verify all existing tests pass

- [x] Run `npx vitest run` to execute the full test suite
- [x] Verify all ~513 tests pass (510 existing + 3 net new)
- [x] Fix any test failures caused by the changes
- [x] Verify no TypeScript errors: `npx tsc -b`

**Files:** (none -- verification only)

**Acceptance Criteria:**
- [x] `npx vitest run` passes with 0 failures
- [x] `npx tsc -b` completes with 0 errors
- [x] Test count is 513 (510 baseline + 3 net new)

---

## Phase 5: Polish (Parallel OK)

### Task 5.1: Code review and cleanup [P]

- [x] Verify JSDoc comments are accurate on all modified functions
- [x] Verify no leftover TODO or FIXME comments from this work
- [x] Verify the `safeCreatedBy` comment in all 4 services is updated to mention existence check

**Files:** All modified service files

**Acceptance Criteria:**
- [x] JSDoc on `deleteUser()` reflects no-cascade behavior
- [x] JSDoc on `creatorExists()` is clear about fail-safe behavior
- [x] Comments in `createUser()`/`createRole()`/`createProfile()`/`createProfileTemplate()` mention both format AND existence checks

---

## Phase 6: Ready for Test Agent

### Handoff Checklist

- [x] All unit tests pass (`npx vitest run`)
- [x] TypeScript compiles clean (`npx tsc -b`)
- [x] `creatorExists()` helper added and exported
- [x] `createUser()` uses existence check (Bug #40 fix)
- [x] 3 sibling services updated with same fix
- [x] `deleteUser()` no longer cascades to instances (Bug #44 fix)
- [x] UsersPanel delete confirmation message updated
- [x] Test file rewritten with 9 new tests replacing 6 old cascade tests
- [x] Net test count: 513

### Verification Points for Test Agent

1. **Bug #40 verification:** Launch app with dev-auth, sign in as Manager, go to Users tab, create a new user. Should succeed without FK violation error.
2. **Bug #44 verification:** Create a user whose email matches an existing onboarding instance. Delete the user. Verify the onboarding instance still appears in the New Hires table.
3. **Regression:** All existing features (user CRUD, role CRUD, template CRUD, onboarding flow) continue to work.
