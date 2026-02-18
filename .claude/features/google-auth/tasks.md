# Tasks: google-auth

## Metadata
- **Feature:** google-auth
- **Created:** 2026-02-17T19:00
- **Status:** implementation-complete
- **Based-on:** 2026-02-17T19:00_plan.md

## Execution Rules

- Tasks within a phase are **sequential** unless marked with **[P]** (parallelizable)
- TDD: Phase 2 writes tests BEFORE Phase 3 implementation (tests fail initially)
- Each task ends with running relevant tests to verify
- Completion marker: `[x]` when done
- All 638 existing tests must continue passing after every task

---

## Phase 1: Setup -- Type Changes and Auth Infrastructure

### Task 1.1: Make AuthUser.role optional (nullable)
- [x] In `src/config/authTypes.ts`, change `AuthUser.role` from `UserRole` to `UserRole | null`
- [x] Verify `hasManagerAccess(null)` already returns `false` (line 17-19) -- no change needed
- [x] Run `npx vitest run src/config/authTypes.test.ts` to verify existing tests pass
- [x] Run `npx tsc -b` to verify no type errors across codebase (the change may surface places that assume role is non-null)
- [x] Fix any type errors surfaced by the change (audit usages of `user.role` where non-null is assumed)

**Files:** `src/config/authTypes.ts`

**Acceptance Criteria:**
- [x] `AuthUser.role` type is `UserRole | null`
- [x] `hasManagerAccess(null)` returns `false`
- [x] TypeScript compilation passes with zero errors
- [x] All 638 existing tests pass

---

### Task 1.2: Add signInWithGoogle() to authService
- [x] Add `signInWithGoogle()` function to `src/services/authService.ts`
- [x] Function calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`
- [x] Function throws on error (matches existing `signInWithEmailLink` pattern)
- [x] No session handling needed -- OAuth is a redirect flow, onAuthStateChange handles the callback

**Files:** `src/services/authService.ts`

**Acceptance Criteria:**
- [x] `signInWithGoogle()` exported from `authService.ts`
- [x] Calls `supabase.auth.signInWithOAuth` with correct params
- [x] Throws on error

---

### Task 1.3: Add ensureUserExists() to authService
- [x] Add `ensureUserExists(uid, email, displayName)` function to `src/services/authService.ts`
- [x] Uses `supabase.from('users').upsert()` to create or update user row
- [x] Does NOT create `user_roles` entry (user has no role until manager assigns)
- [x] Uses the Supabase Auth UUID as the user `id`
- [x] Extracts display name from Google profile (or falls back to email prefix)

**Files:** `src/services/authService.ts`

**Acceptance Criteria:**
- [x] `ensureUserExists()` exported from `authService.ts`
- [x] Uses upsert (idempotent -- safe to call multiple times)
- [x] Does not create user_roles entry
- [x] Handles errors

---

### Task 1.4: Update authContext to handle Google OAuth users with no role
- [x] In `src/config/authContext.tsx`, modify the `onAuthStateChange` handler
- [x] When `getUserRole()` returns `null` AND session exists AND no mockAuthUser:
  - Call `ensureUserExists(session.user.id, session.user.email, session.user.user_metadata?.full_name)`
  - Set user with `role: null` (authenticated but unassigned)
  - Set `loading: false`
- [x] Import `ensureUserExists` from `authService`
- [x] Ensure the user is considered "authenticated" even with `role: null` (because `isAuthenticated: user !== null`)

**Files:** `src/config/authContext.tsx`

**Acceptance Criteria:**
- [x] Google OAuth user with no role becomes `{ uid, email, role: null }` -- not null user
- [x] `isAuthenticated` is `true` for role=null users (because user is not null)
- [x] `ensureUserExists()` is called to create user row in database
- [x] Mock auth users are unaffected (guard against overwriting mockAuthUser still works)
- [x] All 638 existing tests pass

---

## Phase 2: Tests First (TDD)

### Task 2.1: [P] Write authService tests for signInWithGoogle and ensureUserExists
- [x] Add test block `describe('signInWithGoogle')` to `src/services/authService.test.ts`
- [x] Test: calls `supabase.auth.signInWithOAuth` with `{ provider: 'google', options: { redirectTo } }`
- [x] Test: throws on OAuth error
- [x] Test: does not throw when OAuth succeeds
- [x] Add test block `describe('ensureUserExists')` to `src/services/authService.test.ts`
- [x] Test: upserts user row with correct fields (id, email, name, updated_at)
- [x] Test: uses email prefix as name when displayName not provided
- [x] Test: throws on upsert error
- [x] Add `signInWithOAuth` to the mocked `mockSupabaseAuth` object

**Files:** `src/services/authService.test.ts`

**Acceptance Criteria:**
- [x] 6 new tests for signInWithGoogle + ensureUserExists
- [x] All existing auth service tests still pass

---

### Task 2.2: [P] Write authContext tests for Google OAuth user handling
- [x] Add test block `describe('AuthProvider - Google OAuth User (No Role)')` to `src/config/authContext.test.tsx`
- [x] Test: user with no role is authenticated with `role: null`
- [x] Test: `isAuthenticated` is `true` when user has `role: null`
- [x] Test: `ensureUserExists` is called when getUserRole returns null
- [x] Test: Google user_metadata.full_name is passed to ensureUserExists
- [x] Mock `ensureUserExists` in the auth service mock

**Files:** `src/config/authContext.test.tsx`

**Acceptance Criteria:**
- [x] 4 new tests for Google OAuth handling
- [x] All existing authContext tests still pass

---

### Task 2.3: [P] Write SignInView tests
- [x] Create `src/views/SignInView.test.tsx`
- [x] Test: "Sign in with Google" button renders
- [x] Test: clicking Google button calls `signInWithGoogle()`
- [x] Test: email form still renders and works
- [x] Test: dev-auth quick-login buttons hidden when VITE_USE_DEV_AUTH is not true
- [x] Mock `signInWithGoogle` and `signInWithEmailLink` from authService
- [x] Mock `useAuth` to return unauthenticated state

**Files:** `src/views/SignInView.test.tsx`

**Acceptance Criteria:**
- [x] 4 new tests for SignInView
- [x] Tests verify Google sign-in button and coexistence with email form

---

### Task 2.4: [P] Write UnassignedUsersSection tests
- [x] Create `src/components/manager/UnassignedUsersSection.test.tsx`
- [x] Test: renders table of unassigned users (users with empty roles[])
- [x] Test: renders nothing when no unassigned users exist
- [x] Test: "Assign Role" button renders for each unassigned user
- [x] Test: clicking "Assign Role" calls onAssign with the user

**Files:** `src/components/manager/UnassignedUsersSection.test.tsx`

**Acceptance Criteria:**
- [x] 4 new tests for UnassignedUsersSection
- [x] Tests cover empty state, populated state, and button interaction

---

### Task 2.5: [P] Write AssignRoleModal tests
- [x] Create `src/components/modals/AssignRoleModal.test.tsx`
- [x] Test: renders name and email as read-only fields
- [x] Test: role selector populates from roles prop
- [x] Test: template selector populates from templates prop
- [x] Test: validates required fields (role, department, template)
- [x] Test: submit calls onSubmit with correct data
- [x] Test: displays error on submit failure

**Files:** `src/components/modals/AssignRoleModal.test.tsx`

**Acceptance Criteria:**
- [x] 6 new tests for AssignRoleModal
- [x] Tests cover form rendering, validation, submit success, submit error

---

## Phase 3: Core Implementation

### Task 3.1: Update SignInView with Google sign-in button
- [x] Import `signInWithGoogle` from authService
- [x] Add "Sign in with Google" button above the email form
- [x] Style with prominent Tailwind classes (full-width, white background, Google brand colors border)
- [x] Add Google "G" icon (SVG inline)
- [x] Button calls `signInWithGoogle()` on click with loading state
- [x] Handle errors (set error state)
- [x] Add an "or" divider between Google button and email form
- [x] Keep existing email form, dev-auth buttons, and test account reference unchanged
- [x] Dark mode support for new elements

**Files:** `src/views/SignInView.tsx`

**Acceptance Criteria:**
- [x] "Sign in with Google" button visible on sign-in page
- [x] Clicking button calls `signInWithGoogle()`
- [x] Email form still works
- [x] Dev-auth quick-login buttons still work
- [x] Dark mode styling correct
- [x] All SignInView tests pass

---

### Task 3.2: Create UnassignedUsersSection component
- [x] Create `src/components/manager/UnassignedUsersSection.tsx`
- [x] Props: `users: User[]`, `onAssign: (user: User) => void`
- [x] Filter users to only those with `roles.length === 0`
- [x] If no unassigned users, render nothing (return null)
- [x] Render a section with heading "Unassigned Users" and a table
- [x] Tailwind styling matching NewHiresPanel patterns + dark mode
- [x] "Assign Role" button calls `onAssign(user)`

**Files:** `src/components/manager/UnassignedUsersSection.tsx`

**Acceptance Criteria:**
- [x] Component renders unassigned users in a table
- [x] Returns null when no unassigned users exist
- [x] "Assign Role" button triggers onAssign callback
- [x] Dark mode styled
- [x] All UnassignedUsersSection tests pass

---

### Task 3.3: Create AssignRoleModal component
- [x] Create `src/components/modals/AssignRoleModal.tsx`
- [x] Props: `isOpen`, `onClose`, `onSubmit`, `user: User | null`, `isSubmitting`, `error`, `roles`, `rolesLoading`, `templates`, `templatesLoading`
- [x] Show Name and Email as read-only fields (pre-filled from user)
- [x] Role dropdown, Department text input, Template dropdown
- [x] Template preview section (match EditHireModal pattern)
- [x] Validation: role, department (min 2 chars), and template are required
- [x] Use ModalWrapper with "Assign" submit button and Cancel button
- [x] Follow EditHireModal patterns: useEffect form reset, fieldErrors, hasAttemptedSubmit
- [x] Dark mode support

**Files:** `src/components/modals/AssignRoleModal.tsx`

**Acceptance Criteria:**
- [x] Modal shows read-only name/email
- [x] Role, department, template selectors work
- [x] Form validation works
- [x] Submit callback receives correct data
- [x] All AssignRoleModal tests pass

---

### Task 3.4: Export AssignRoleModal from modals barrel
- [x] Add export for `AssignRoleModal` in `src/components/modals/index.ts`

**Files:** `src/components/modals/index.ts`

**Acceptance Criteria:**
- [x] `AssignRoleModal` importable from `'../components/modals'`

---

## Phase 4: Integration

### Task 4.1: Wire UnassignedUsersSection into NewHiresPanel
- [x] Import `UnassignedUsersSection` in `src/components/manager/NewHiresPanel.tsx`
- [x] Import `AssignRoleModal` from modals
- [x] Import `useUsers` hook
- [x] Add state: `assigningUser: User | null`, `isAssigning: boolean`, `assignError: string | null`
- [x] Render `UnassignedUsersSection` ABOVE the existing filter/table
- [x] When "Assign Role" is clicked, set `assigningUser` to open the modal
- [x] `handleAssignSubmit` calls `setUserRole` then `createOnboardingRunFromTemplate`
- [x] Render `AssignRoleModal` at the bottom of the component

**Files:** `src/components/manager/NewHiresPanel.tsx`

**Acceptance Criteria:**
- [x] UnassignedUsersSection appears above the existing table in New Hires tab
- [x] Clicking "Assign Role" opens AssignRoleModal
- [x] Submitting the modal creates user role + onboarding instance
- [x] Success: modal closes, toast shows
- [x] Error: error shown in modal, form stays open
- [x] All NewHiresPanel tests pass

---

### Task 4.2: Wire NewHiresPanel tests for unassigned users integration
- [x] Add tests to `src/components/manager/NewHiresPanel.test.tsx`
- [x] Test: UnassignedUsersSection renders when unassigned users exist
- [x] Test: UnassignedUsersSection hidden when all users have roles
- [x] Mock `useUsers` to return users with and without roles

**Files:** `src/components/manager/NewHiresPanel.test.tsx`

**Acceptance Criteria:**
- [x] 2 new integration tests for NewHiresPanel
- [x] All existing NewHiresPanel tests pass

---

## Phase 5: Polish

### Task 5.1: [P] Update footer text in SignInView
- [x] Change footer from "This is a mock sign-in for demonstration purposes. No email will be sent." to context-appropriate text
- [x] When dev-auth mode: "Development mode. Quick-login buttons and test accounts available."
- [x] When production mode: "Sign in with your company Google account."

**Files:** `src/views/SignInView.tsx`

**Acceptance Criteria:**
- [x] Footer text matches the current mode
- [x] Dark mode styling preserved

---

### Task 5.2: [P] Accessibility pass on new components
- [x] Verify `aria-label` on Google sign-in button
- [x] Verify `aria-label` on "Assign Role" buttons in UnassignedUsersSection
- [x] Verify form labels in AssignRoleModal have `htmlFor` matching input `id`
- [x] Verify `role="alert"` on error messages
- [x] Verify `aria-required="true"` on required fields

**Files:** `src/views/SignInView.tsx`, `src/components/manager/UnassignedUsersSection.tsx`, `src/components/modals/AssignRoleModal.tsx`

**Acceptance Criteria:**
- [x] All interactive elements have accessible labels
- [x] Form validation errors announced to screen readers

---

## Phase 6: Ready for Test Agent

### Task 6.1: Run full test suite
- [x] Run `npx vitest run` -- all 675 tests pass
- [x] Run `npx tsc -b` -- no type errors
- [x] Run `npx eslint .` -- no new lint errors (pre-existing errors only)
- [x] Total test count: 638 existing + 37 new = 675

**Acceptance Criteria:**
- [x] All unit tests pass
- [x] TypeScript compilation clean
- [x] ESLint clean (no new errors)
- [x] Build succeeds (`npx vite build`)

---

## Handoff Checklist for Test Agent

- [x] All tasks in Phases 1-6 completed
- [x] Plan document created at `.claude/features/google-auth/2026-02-17T19:00_plan.md`
- [x] Tasks document created at `.claude/features/google-auth/tasks.md`
- [x] New files created: AssignRoleModal, UnassignedUsersSection, SignInView.test.tsx, plus test files
- [x] Modified files: authTypes.ts, authContext.tsx, authService.ts, SignInView.tsx, NewHiresPanel.tsx
- [x] All 675 tests passing
- [x] TypeScript compilation clean
- [x] ESLint clean (no new errors)

### What the Test Agent should verify:
1. **Unit tests pass:** `npx vitest run`
2. **Build succeeds:** `npx vite build`
3. **Playwright functional tests:**
   - Sign-in page shows Google button and email form
   - Dev-auth mode shows all three option types (Google, email, quick-login)
   - Manager view > New Hires tab renders (even if no unassigned users in dev mode)
   - Existing flows unbroken: employee onboarding, manager dashboard, template management

### Server-side setup needed for full E2E testing:
- Enable Google provider in Supabase Dashboard (Authentication > Providers > Google)
- Configure Google Cloud Console OAuth credentials
- Set redirect URL: `https://ecnshfhpgwjxvuybewth.supabase.co/auth/v1/callback`
- Disable email confirmation in Supabase Auth settings
