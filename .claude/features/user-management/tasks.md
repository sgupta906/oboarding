# Tasks: user-management

## Metadata
- **Feature:** user-management
- **Created:** 2026-02-15T00:00
- **Status:** implementation-complete
- **Based on:** 2026-02-15T00:00_plan.md

## Execution Rules
- Tasks are executed in phase order (1, 2, 3, 4, 5)
- Within a phase, tasks execute sequentially unless marked [P] (parallelizable)
- TDD: Phase 2 writes tests FIRST (they will fail), Phase 3 makes them pass
- Mark tasks with [x] when complete

---

## Phase 1: Setup (No setup needed)

No database migrations, no new packages, no configuration changes. Skip to Phase 2.

---

## Phase 2: Tests First (TDD)

### Task 2.1: Write userService.deleteUser tests
- [x] Create `src/services/supabase/userService.test.ts`
- [x] Mock Supabase client (`supabase.from()`) following pattern from `instanceService.test.ts`
- [x] Test: `deleteUser` queries onboarding_instances by user email before deleting user
- [x] Test: `deleteUser` deletes found instances then deletes user row
- [x] Test: `deleteUser` handles user with no onboarding instances (no instance delete called)
- [x] Test: `deleteUser` handles user with multiple instances (all deleted)
- [x] Test: `deleteUser` returns early (idempotent) when user not found
- [x] Test: `deleteUser` throws when instance deletion fails

**Files:** `src/services/supabase/userService.test.ts`

**Acceptance Criteria:**
- [x] All 6 tests exist and are syntactically valid
- [x] Tests fail initially (before Phase 3 implementation)
- [x] Mocking pattern matches existing `instanceService.test.ts` style

### Task 2.2: Write UsersPanel component tests [P]
- [x] Create `src/components/manager/UsersPanel.test.tsx`
- [x] Mock `useUsers`, `useOnboardingInstances`, `useRoles`, `useAuth`, `logActivity`
- [x] Test: renders onboarding status badges in employee table
- [x] Test: renders progress percentage for onboarding users
- [x] Test: shows "No onboarding" text for users without instances
- [x] Test: filter toggle shows only users with active onboarding
- [x] Test: delete confirmation message warns about onboarding data for onboarding user
- [x] Test: delete confirmation uses standard message for non-onboarding user

**Files:** `src/components/manager/UsersPanel.test.tsx`

**Acceptance Criteria:**
- [x] All 6 tests exist and are syntactically valid
- [x] Tests fail initially (before Phase 3 implementation)
- [x] Mocking pattern matches existing `RoleManagementPanel.test.tsx` style

---

## Phase 3: Core Implementation

### Task 3.1: Enhance deleteUser() in userService.ts
- [x] In `deleteUser()`, after fetching user and before deleting user row, add instance cleanup
- [x] Query `onboarding_instances` by `employee_email` matching `user.email` (case-insensitive)
- [x] If instances found, delete them by ID using `.in('id', instanceIds)`
- [x] Keep existing user row deletion and auth credential cleanup unchanged
- [x] Ensure errors from instance deletion are propagated (not swallowed)
- [x] Run `npx vitest run src/services/supabase/userService.test.ts`

**Files:** `src/services/supabase/userService.ts` (lines 384-413)

**Acceptance Criteria:**
- [x] `deleteUser()` queries instances by email before deleting user
- [x] Instance deletion happens before user row deletion
- [x] CASCADE handles instance_steps, instance_profiles, instance_template_refs cleanup
- [x] suggestions.instance_id gets SET NULL automatically (FK behavior)
- [x] All Task 2.1 tests pass

### Task 3.2: Add onboarding data to UsersPanel
- [x] Import `useOnboardingInstances` from `../../hooks`
- [x] Import `OnboardingInstance` type from `../../types`
- [x] Call `useOnboardingInstances()` in the component
- [x] Build `instancesByEmail` lookup map using `useMemo`
- [x] Add filter state: `const [filter, setFilter] = useState<'all' | 'onboarding'>('all')`
- [x] Apply filter to `employeeUsers` list using the lookup map
- [x] Run type check: `npx tsc -b`

**Files:** `src/components/manager/UsersPanel.tsx`

**Acceptance Criteria:**
- [x] `useOnboardingInstances()` is called and data is available
- [x] Lookup map correctly maps lowercase email to instance array
- [x] Filter state works and only shows onboarding users when active
- [x] TypeScript compiles without errors

### Task 3.3: Enhance employee table with onboarding columns
- [x] Split `renderUserTable` into `renderEmployeeTable` and `renderAdminTable`
- [x] For employee table: replace Profiles column with Status, Progress, Start Date columns
- [x] Status column: show badge with instance status (active=blue, completed=green, on_hold=amber, none=slate)
- [x] Progress column: show percentage text (e.g., "45%") or dash for no instance
- [x] Start Date column: show formatted date or dash for no instance
- [x] Admin/Manager table: keep existing columns unchanged (no onboarding columns)
- [x] Run type check: `npx tsc -b`

**Files:** `src/components/manager/UsersPanel.tsx`

**Acceptance Criteria:**
- [x] Employee table shows Status, Progress, Start Date columns
- [x] Admin table remains unchanged
- [x] Status badges use correct colors per status
- [x] Formatting is consistent with existing table styling

### Task 3.4: Add filter toggle UI
- [x] Add filter button group above the employee table section
- [x] Two buttons: "All Employees" and "Currently Onboarding"
- [x] Active button gets brand styling, inactive gets slate styling
- [x] When "Currently Onboarding" selected, filter to users with active instances
- [x] Show count in button text: "Currently Onboarding (N)"
- [x] Run type check: `npx tsc -b`

**Files:** `src/components/manager/UsersPanel.tsx`

**Acceptance Criteria:**
- [x] Filter toggle renders above employee table
- [x] Clicking toggles filter state
- [x] Employee list updates to show filtered results
- [x] Count is accurate

### Task 3.5: Enhance delete confirmation message
- [x] In `getDeleteMessage`, look up instances for the user being deleted via `instancesByEmail`
- [x] If user has instances, build enhanced message: "...will also permanently delete their onboarding data (N instance(s) and all associated steps)..."
- [x] If user has no instances, use existing standard message
- [x] Pass the computed message to `DeleteConfirmationDialog`
- [x] Run `npx vitest run src/components/manager/UsersPanel.test.tsx`

**Files:** `src/components/manager/UsersPanel.tsx`

**Acceptance Criteria:**
- [x] Users with instances see enhanced warning message
- [x] Users without instances see standard message
- [x] Instance count is accurate in the message
- [x] All Task 2.2 tests pass

---

## Phase 4: Integration

### Task 4.1: Full test suite validation
- [x] Run `npx vitest run` (all tests)
- [x] Verify no regressions in existing tests
- [x] Run `npx tsc -b` (type check)
- [x] Run `npx eslint .` (lint check)
- [x] Fix any issues found

**Files:** (none -- validation only)

**Acceptance Criteria:**
- [x] All tests pass (existing + new): 332 tests across 24 files
- [x] No TypeScript errors
- [x] No ESLint errors (0 errors, only pre-existing warnings)

---

## Phase 5: Polish [P]

### Task 5.1: Loading and empty states [P]
- [x] Handle loading state when instances are still loading (show spinner or skeleton in status columns)
- [x] Handle case where both users and instances are loaded but empty
- [x] Ensure filter toggle shows "0" when no onboarding users exist

**Files:** `src/components/manager/UsersPanel.tsx`

**Acceptance Criteria:**
- [x] No blank/broken UI during loading
- [x] Empty states are informative

### Task 5.2: Accessibility audit [P]
- [x] Ensure new table columns have proper `<th>` headers
- [x] Ensure filter toggle buttons have `aria-pressed` attributes
- [x] Ensure status badges have sufficient color contrast
- [x] Ensure delete confirmation dialog message is readable by screen readers

**Files:** `src/components/manager/UsersPanel.tsx`

**Acceptance Criteria:**
- [x] Table headers are semantic
- [x] Filter buttons are accessible
- [x] Color contrast meets WCAG AA

---

## Phase 6: Ready for Test Agent

### Handoff Checklist
- [x] All unit tests pass (`npx vitest run`) - 332 tests, 0 failures
- [x] TypeScript compiles (`npx tsc -b`) - 0 errors
- [x] ESLint passes (`npx eslint .`) - 0 errors
- [x] New test files: `src/services/supabase/userService.test.ts`, `src/components/manager/UsersPanel.test.tsx`
- [x] Modified files: `src/services/supabase/userService.ts`, `src/components/manager/UsersPanel.tsx`
- [x] No other files modified
- [x] Total new tests: 12

---

## Summary

| Phase | Tasks | Key Output |
|-------|-------|-----------|
| Phase 2 | 2.1, 2.2 | Test files (failing) - TDD RED |
| Phase 3 | 3.1-3.5 | Enhanced delete, onboarding columns, filter, delete message - TDD GREEN |
| Phase 4 | 4.1 | Full validation - all 332 tests pass |
| Phase 5 | 5.1, 5.2 | Loading spinners, accessibility attributes |
| Phase 6 | Handoff | Checklist verified, implementation.md created |
