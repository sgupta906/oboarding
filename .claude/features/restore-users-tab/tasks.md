# Tasks: restore-users-tab

## Metadata
- **Feature:** restore-users-tab
- **Created:** 2026-02-15T03:00
- **Status:** implementation-complete
- **Based On:** 2026-02-15T03:00_plan.md

## Execution Rules
- Tasks are numbered by phase (e.g., Task 1.1 = Phase 1, Task 1)
- `[P]` marks tasks that can run in parallel with other `[P]` tasks in the same phase
- TDD: Phase 2 writes tests BEFORE Phase 3 implementation (tests will fail initially)
- Mark each checkbox as you complete it
- Run `npx vitest run` after each phase to verify

---

## Phase 1: Setup (Sequential)

### Task 1.1: Update barrel export
- [x] Add `export { UsersPanel } from './UsersPanel'` to `src/components/manager/index.ts`

**Files:** `src/components/manager/index.ts`

**Acceptance Criteria:**
- [x] Export line added at end of file
- [x] No TypeScript errors (this will show an error until the component is created in Phase 3 -- that is expected)

---

## Phase 2: Tests First (TDD)

### Task 2.1: Write UsersPanel unit tests
- [x] Create `src/components/manager/UsersPanel.test.tsx`
- [x] Set up mocks: `useUsers` hook, `useRoles` hook, `useAuth` context, `logActivity` service
- [x] Mock `UserModal` and `DeleteConfirmationDialog` as simple stubs
- [x] Create mock user data (3 users with different roles/profiles)
- [x] Write rendering tests:
  - [x] Test: renders table with user data (names, emails in document)
  - [x] Test: renders column headers (Name, Email, Roles, Profiles, Actions)
  - [x] Test: renders role badges for each user
  - [x] Test: renders "New User" button
- [x] Write state tests:
  - [x] Test: shows loading spinner when isLoading is true
  - [x] Test: shows error message when error is present
  - [x] Test: shows empty state when no users exist
- [x] Write CRUD interaction tests:
  - [x] Test: clicking "New User" opens create modal
  - [x] Test: clicking edit button opens edit modal with user data
  - [x] Test: clicking delete button opens delete confirmation dialog
  - [x] Test: confirming delete calls removeUser with correct user ID
  - [x] Test: shows success toast after successful create operation

**Files:** `src/components/manager/UsersPanel.test.tsx`

**Acceptance Criteria:**
- [x] ~12 test cases written
- [x] All tests fail (component does not exist yet) -- this is correct TDD behavior
- [x] Mock patterns match existing test files (NewHiresPanel.test.tsx, RoleManagementPanel.test.tsx)

---

## Phase 3: Core Implementation (Sequential)

### Task 3.1: Create UsersPanel component
- [x] Create `src/components/manager/UsersPanel.tsx`
- [x] Import hooks: `useUsers` from `../../hooks`, `useRoles` from `../../hooks`, `useAuth` from `../../config/authContext`
- [x] Import services: `logActivity` from `../../services/supabase`
- [x] Import components: `UserModal` from `../modals/UserModal`, `DeleteConfirmationDialog` from `../ui/DeleteConfirmationDialog`
- [x] Import icons: `UserCog`, `Plus`, `Edit2`, `Trash2` from `lucide-react`
- [x] Import types: `User`, `UserFormData` from `../../types`
- [x] Set up hook calls: `useUsers()`, `useRoles()`, `useAuth()`
- [x] Implement modal state: `showCreateModal`, `editingUser`, `userToDelete`, `isSubmitting`, `isDeleting`, `modalError`, `successMessage`
- [x] Implement `handleCreateSubmit`:
  - [x] Call `createNewUser(data, user.uid)`
  - [x] Fire-and-forget `logActivity({ userInitials, action: 'Created user ...', timeAgo: 'just now', userId: user.uid })`
  - [x] Set success message, close modal, auto-dismiss toast after 3s
  - [x] Catch errors and set `modalError`
- [x] Implement `handleEditSubmit`:
  - [x] Call `editUser(editingUser.id, data)`
  - [x] Fire-and-forget `logActivity({ ... action: 'Updated user ...' })`
  - [x] Set success message, close modal, auto-dismiss toast after 3s
  - [x] Catch errors and set `modalError`
- [x] Implement `handleDeleteConfirm`:
  - [x] Call `removeUser(userToDelete.id)`
  - [x] Fire-and-forget `logActivity({ ... action: 'Deleted user ...' })`
  - [x] Set success message, close dialog, auto-dismiss toast after 3s
  - [x] Catch errors and set `modalError`
- [x] Render header section: icon in colored box + "Users" title + "Manage system users" subtitle + "New User" button
- [x] Render info banner: "New User creates a system account (manager/admin/contractor). To start an employee's onboarding journey, use New Hire on the Dashboard tab."
- [x] Render success toast (conditional on `successMessage`)
- [x] Render loading state (spinner + "Loading users..." text)
- [x] Render error state (red banner with error message)
- [x] Render empty state (icon + "No users" + hint text)
- [x] Render users table:
  - [x] thead: Name, Email, Roles, Profiles, Actions
  - [x] tbody: map over users with hover rows
  - [x] Name column: bold font-medium
  - [x] Email column: mono text-xs
  - [x] Roles column: mapped to inline badge pills
  - [x] Profiles column: mapped to inline badge pills or dash if empty
  - [x] Actions column: Edit button (Edit2 icon) + Delete button (Trash2 icon)
- [x] Render UserModal (create mode when `showCreateModal`, edit mode when `editingUser`)
- [x] Render DeleteConfirmationDialog (when `userToDelete` is set)
- [x] Add JSDoc comment at top of file

**Files:** `src/components/manager/UsersPanel.tsx`

**Acceptance Criteria:**
- [x] Component renders without errors
- [x] All 12 unit tests from Task 2.1 pass
- [x] Component follows existing patterns (NewHiresPanel for layout, RoleManagementPanel for CRUD)
- [x] Dark mode classes included on all elements
- [x] Estimated ~250-300 lines (actual: 346 lines / 322 non-blank)
- [x] No TypeScript errors (`npx tsc -b`)

---

## Phase 4: Integration (Sequential)

### Task 4.1: Wire UsersPanel into ManagerView
- [x] Import `UsersPanel` in ManagerView.tsx (add to existing manager barrel import on line 18)
- [x] Extend `activeTab` union type from `'dashboard' | 'roles' | 'new-hires'` to `'dashboard' | 'roles' | 'new-hires' | 'users'` (line 68)
- [x] Add Users tab button after New Hires button in tab bar (after line 151):
  - [x] `onClick={() => setActiveTab('users')}`
  - [x] Same `className` pattern as other tab buttons (active/inactive ternary)
  - [x] `aria-label="Show users management view"`
  - [x] `aria-current={activeTab === 'users' ? 'page' : undefined}`
  - [x] Button text: "Users"
- [x] Add Users tab content block after New Hires block (after line 205):
  - [x] Wrap in same `<div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">`
  - [x] Conditional: `{activeTab === 'users' && (...)}`
  - [x] Render `<UsersPanel />`

**Files:** `src/views/ManagerView.tsx`

**Acceptance Criteria:**
- [x] Users tab button appears in tab bar
- [x] Clicking Users tab shows UsersPanel
- [x] Other tabs still work correctly
- [x] No TypeScript errors

---

## Phase 5: Validation (Sequential)

### Task 5.1: Run full test suite
- [x] Run `npx vitest run` -- all tests must pass
- [x] Run `npx tsc -b` -- no type errors
- [x] Verify test count increased from 338 to ~350

**Acceptance Criteria:**
- [x] All existing 338 tests still pass (no regressions)
- [x] All ~12 new UsersPanel tests pass (total: 350)
- [x] Zero TypeScript errors
- [x] Build succeeds

### Task 5.2: [P] Visual verification checklist
- [ ] Verify tab bar shows all 4 tabs: Dashboard, Roles, New Hires, Users
- [ ] Verify Users tab renders the users table
- [ ] Verify "New User" button is visible
- [ ] Verify dark mode styling is correct
- [ ] Verify loading, error, and empty states render properly

**Acceptance Criteria:**
- [ ] All visual checks pass (verified via Playwright in /test phase)

---

## Phase 6: Handoff to Test Agent

### Pre-handoff Checklist
- [x] All unit tests pass (`npx vitest run`)
- [x] Build succeeds (`npx vite build`)
- [x] No TypeScript errors (`npx tsc -b`)
- [x] New files created:
  - [x] `src/components/manager/UsersPanel.tsx`
  - [x] `src/components/manager/UsersPanel.test.tsx`
- [x] Modified files:
  - [x] `src/views/ManagerView.tsx` (tab + content block added)
  - [x] `src/components/manager/index.ts` (barrel export added)
- [x] No other files modified
- [x] Feature does not duplicate NewHiresPanel functionality

### Test Agent Instructions
The test agent should:
1. Run `npx vitest run` to confirm all tests pass
2. Run `npx vite build` to confirm build succeeds
3. Launch app with `npx vite` and use Playwright to:
   - Navigate to manager view
   - Verify all 4 tabs are visible and clickable
   - Click Users tab, verify table renders
   - Click "New User" button, verify modal opens
   - Fill out user creation form, submit, verify user appears in table
   - Click edit button on a user, verify modal pre-fills
   - Click delete button on a user, verify confirmation dialog appears
   - Confirm delete, verify user is removed from table
4. Verify no console errors during all interactions
