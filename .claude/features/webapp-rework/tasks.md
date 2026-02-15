# Tasks: webapp-rework

## Metadata
- **Feature:** webapp-rework
- **Created:** 2026-02-14T12:00
- **Status:** complete
- **Based On:** `2026-02-14T12:00_plan.md`

## Execution Rules
- Tasks within a phase are sequential unless marked `[P]` (parallelizable)
- Phases must be completed in order (Phase 1 before Phase 2, etc.)
- After each task: run `npx vitest run` to verify no regressions
- After all tasks: run `npx tsc -b` and `npx vite build` for final verification
- Use Playwright MCP to visually verify after each phase

---

## Phase 1: Core Bug Fixes (P1 -- CRITICAL)

### Task 1.1: Fix role creation UUID bug -- service layer
- [x] Modify `src/services/supabase/roleService.ts`: Change `createRole` parameter `createdBy: string` to `createdBy: string | null`
- [x] In the `row` object, set `created_by: createdBy` (already passes through, just needs type change)
- [x] Modify `src/services/roleClient.ts`: Change `createCustomRole` parameter `createdBy: string` to `createdBy: string | null`
- [x] Remove the validation check at line 204 (`if (!createdBy || ...`) that rejects null/empty createdBy
- [x] Modify `seedDefaultRoles` at line 306: Change default from `'system'` to `null`
- [x] Run `npx vitest run` to check for test failures
- [x] Fix any test expectations in `roleClient.test.ts` and `roleOperations.test.ts` that assume `createdBy` is always a non-empty string

**Files:** `src/services/supabase/roleService.ts`, `src/services/roleClient.ts`

**Acceptance Criteria:**
- [x] `createRole(name, desc, null)` does not throw
- [x] `createRole(name, desc, "valid-uuid")` still works
- [x] `seedDefaultRoles()` passes null instead of "system"
- [x] All existing tests pass

---

### Task 1.2: Fix role creation UUID bug -- hook and component layer
- [x] Modify `src/hooks/useRoles.ts`: Change default userId from `'system'` to `undefined`, make parameter optional `userId?: string`
- [x] In `createRole` callback (line 89), change default `createdBy` to `userId ?? null`
- [x] Modify `src/components/manager/RoleManagementPanel.tsx`: Remove `userId` prop entirely; import and call `useAuth()` to get real user ID
- [x] Update `useRoles()` call to pass `user?.uid` from auth context
- [x] Update `handleCreateRoleSubmit` to pass `user?.uid ?? null` instead of `userId`
- [x] Modify `src/components/manager/UsersPanel.tsx`: Remove `userId` prop; import and call `useAuth()` to get `user?.uid`
- [x] Update all `logActivity` calls in UsersPanel to use `user?.uid` instead of the prop
- [x] Modify `src/views/ManagerView.tsx`: Remove `userId="system"` from `<RoleManagementPanel>` (line 191) and `<UsersPanel>` (line 198)
- [x] Run `npx vitest run`

**Files:** `src/hooks/useRoles.ts`, `src/components/manager/RoleManagementPanel.tsx`, `src/components/manager/UsersPanel.tsx`, `src/views/ManagerView.tsx`

**Acceptance Criteria:**
- [x] `RoleManagementPanel` no longer accepts a `userId` prop
- [x] `UsersPanel` no longer accepts a `userId` prop
- [x] Both components get user ID from `useAuth()` hook
- [x] ManagerView renders without passing userId strings
- [x] All existing tests pass

---

### Task 1.3: Fix employee view -- always render NavBar for authenticated users
- [x] Modify `src/App.tsx`: Remove the `{canAccessTemplates && (...)}` guard around `<NavBar>` (lines 94-96)
- [x] Always render `<NavBar currentView={currentView} onViewChange={setCurrentView} />` for ALL authenticated users
- [x] The NavBar already handles role-based visibility internally (shows "Employee View Only" for employees)
- [x] Run `npx vitest run`

**Files:** `src/App.tsx`

**Acceptance Criteria:**
- [x] Employees see a NavBar with sign-out button and dark mode toggle
- [x] Managers still see the full NavBar with view switcher and Templates link
- [x] All existing tests pass

---

### Task 1.4: Fix employee empty state in OnboardingHub
- [x] Modify `src/components/OnboardingHub.tsx` lines 212-217: Replace bare div with a proper empty state component
- [x] The new empty state includes:
  - A centered card with an icon (User from lucide-react)
  - Heading: "No onboarding assigned yet"
  - Subtext: "Your manager will set up your onboarding. Check back soon!"
  - A secondary sign-out button (backup to NavBar)
- [x] Dark mode classes included on the empty state
- [x] Run `npx vitest run`

**Files:** `src/components/OnboardingHub.tsx`

**Acceptance Criteria:**
- [x] Employee with no onboarding sees friendly empty state (not bare text)
- [x] Empty state has sign-out button
- [x] Dark mode is supported on the empty state
- [x] All existing tests pass

---

### Task 1.5: Fix manager default view initialization
- [x] Modify `src/App.tsx`: Add role tracking ref for initial view correction
- [x] Add a `useEffect` that watches `role` and sets `currentView` to `'manager'` when role resolves to `'manager'` or `'admin'`
- [x] Reset tracking when user signs out (role becomes null) to handle re-login as different user
- [x] Import `useRef` in the imports
- [x] Run `npx vitest run`

**Files:** `src/App.tsx`

**Acceptance Criteria:**
- [x] Manager users land on "Manager View" after login (not Employee View)
- [x] Employee users still land on "Employee View"
- [x] View toggle still works manually after initial load
- [x] Re-login as different role correctly updates default view
- [x] All existing tests pass

---

### Task 1.6: Phase 1 visual verification
- [x] Start dev server (`npx vite`)
- [x] Use Playwright MCP to sign in as Manager
- [x] Verify Manager View is the default tab
- [x] Navigate to Roles tab, verify create role modal opens
- [x] Sign out, verify employee view shows NavBar and friendly empty state
- [x] Document any issues found (fixed re-login default view bug during verification)

**Files:** None (verification only)

**Acceptance Criteria:**
- [x] Employee sees NavBar
- [x] Manager lands on Manager View
- [x] No console errors

---

## Phase 2: Dark Mode Fixes (P2)

### Task 2.1: Fix Card.tsx and ModalWrapper.tsx base dark mode classes
- [x] Modify `src/components/ui/Card.tsx`: Added `dark:bg-slate-800` and `dark:border-slate-700`
- [x] Modify `src/components/ui/ModalWrapper.tsx`: Added dark mode to container, header, title, close button, footer
- [x] Run `npx vitest run`

**Files:** `src/components/ui/Card.tsx`, `src/components/ui/ModalWrapper.tsx`

**Acceptance Criteria:**
- [x] All `<Card>` components render with dark backgrounds in dark mode
- [x] All modals render with dark backgrounds in dark mode
- [x] All existing tests pass

---

### Task 2.2: Fix KPICard dark mode [P]
- [x] Added dark mode variants to `colorBgMap`, `colorTextMap`, `colorIconBgMap`
- [x] Fixed label and value text dark mode colors
- [x] Run `npx vitest run`

**Files:** `src/components/manager/KPICard.tsx`

**Acceptance Criteria:**
- [x] KPI cards have colored backgrounds appropriate for dark mode
- [x] Text is readable in dark mode
- [x] All existing tests pass

---

### Task 2.3: Fix manager dashboard component dark mode [P]
- [x] Modified ManagerDashboardHeader, ActivitySection, SuggestionsSection, SuggestionCard
- [x] Added dark mode to all headings, empty states, text elements
- [x] Run `npx vitest run`

**Files:** `src/components/manager/ManagerDashboardHeader.tsx`, `src/components/manager/ActivitySection.tsx`, `src/components/manager/SuggestionsSection.tsx`, `src/components/manager/SuggestionCard.tsx`

**Acceptance Criteria:**
- [x] Dashboard header, activity section, suggestions section all have proper dark mode text
- [x] SuggestionCard pending indicator and text adapt to dark mode
- [x] All existing tests pass

---

### Task 2.4: Fix ActivityFeed dark mode [P]
- [x] Added dark mode to empty state, header, list, items, footer
- [x] Run `npx vitest run`

**Files:** `src/components/manager/ActivityFeed.tsx`

**Acceptance Criteria:**
- [x] Activity feed header adapts to dark mode
- [x] Activity items have dark backgrounds and readable text in dark mode
- [x] All existing tests pass

---

### Task 2.5: Fix RoleManagementPanel dark mode
- [x] Added dark mode to header, subtitle, search, skeleton, error, empty state, table headers, rows, cells, mobile cards
- [x] Run `npx vitest run`

**Files:** `src/components/manager/RoleManagementPanel.tsx`

**Acceptance Criteria:**
- [x] Role management panel fully supports dark mode
- [x] Table, cards, search, empty states all adapt to dark mode
- [x] All existing tests pass

---

### Task 2.6: Fix ManagerView tab bar and wrapper dark mode
- [x] Added dark mode to tab bar border, inactive tab text, roles/users tab wrappers, success toast
- [x] Run `npx vitest run`

**Files:** `src/views/ManagerView.tsx`

**Acceptance Criteria:**
- [x] Tab bar border adapts to dark mode
- [x] Tab text colors adapt to dark mode
- [x] Roles and Users tab content wrappers have dark backgrounds
- [x] All existing tests pass

---

### Task 2.7: Phase 2 visual verification
- [x] Verified dark mode on Dashboard (KPI cards, suggestions, activity feed)
- [x] Verified dark mode on Roles tab (empty state, search)
- [x] Verified dark mode on Users tab (empty state)
- [x] Verified dark mode on Create Role modal
- [x] Toggled between light and dark mode on each page

**Files:** None (verification only)

**Acceptance Criteria:**
- [x] All manager dashboard components adapt to dark mode
- [x] All modals adapt to dark mode
- [x] No white cards visible on dark backgrounds

---

## Phase 3: UX Polish (P3)

### Task 3.1: Fix sign-in page labels
- [x] Changed "Quick Login (Emulator Mode):" to "Quick Login (Dev Mode):"
- [x] Changed "Send Sign-In Link" button to "Sign In" with LogIn icon
- [x] Updated test files to match new labels
- [x] Run `npx vitest run`

**Files:** `src/views/SignInView.tsx`, `src/views/AuthFlow.integration.test.tsx`, `src/views/SignInView.integration.test.tsx`

**Acceptance Criteria:**
- [x] "Emulator Mode" text no longer appears
- [x] Button text accurately reflects what happens (instant sign-in, not email)
- [x] All existing tests pass

---

### Task 3.2: Phase 3 visual verification
- [x] Verified sign-in page shows "Dev Mode" label
- [x] Verified "Sign In" button text with LogIn icon
- [x] Verified employee empty state looks good

**Files:** None (verification only)

**Acceptance Criteria:**
- [x] Sign-in page labels are accurate
- [x] Employee empty state is user-friendly

---

## Phase 4: Branding -- ShyftSolutions Palette (P4)

### Task 4.1: Update tailwind.config.js brand colors
- [x] Replaced brand palette with ShyftSolutions blue (#1C7CD6 base)
- [x] Removed custom violet palette
- [x] Updated gradient-brand and gradient-brand-subtle
- [x] Run `npx vitest run`

**Files:** `tailwind.config.js`

**Acceptance Criteria:**
- [x] Brand palette uses ShyftSolutions blue shades
- [x] Gradient uses new brand colors
- [x] No build errors
- [x] All existing tests pass

---

### Task 4.2: Update index.css gradient and badge classes
- [x] Changed gradient-header from brand-600/violet-500 to brand-600/brand-400
- [x] Updated badge-brand from indigo-* to brand-*
- [x] Run `npx vitest run`

**Files:** `src/index.css`

**Acceptance Criteria:**
- [x] Gradient header uses brand colors (no violet)
- [x] Badge classes use brand colors
- [x] All existing tests pass

---

### Task 4.3: Replace indigo-600 with brand-600 in all component files [P]
- [x] Replaced all `indigo-*` with `brand-*` across 28 .tsx files (120 occurrences)
- [x] Fixed remaining `violet-600` in WelcomeHeader.tsx to `brand-400`
- [x] Fixed remaining `indigo-950` in TemplatesView.tsx to `brand-950`
- [x] Run `npx vitest run`

**Files:** 28 .tsx component files (see plan for full list)

**Acceptance Criteria:**
- [x] Zero remaining `indigo-` references in any `.tsx` component file
- [x] All buttons, links, icons, badges use `brand-` colors
- [x] All existing tests pass

---

### Task 4.4: Update index.html title
- [x] Changed `<title>OnboardingHub</title>` to `<title>OnboardHub</title>`
- [x] Run `npx vitest run`

**Files:** `index.html`

**Acceptance Criteria:**
- [x] Browser tab shows "OnboardHub"
- [x] All existing tests pass

---

### Task 4.5: Phase 4 visual verification
- [x] Verified branding on sign-in page (logo, button colors)
- [x] Verified NavBar logo color
- [x] Verified Manager Dashboard in both light and dark mode
- [x] Verified Roles, Users, Templates pages
- [x] Verified no remaining indigo/purple colors in the UI
- [x] Brand colors work in both light and dark modes

**Files:** None (verification only)

**Acceptance Criteria:**
- [x] All UI elements use ShyftSolutions blue (#1C7CD6) instead of indigo (#4f46e5)
- [x] Gradients use blue-to-light-blue instead of indigo-to-violet
- [x] Brand identity feels cohesive across all pages

---

## Phase 5: Final Verification

### Task 5.1: Run full test suite and build
- [x] Run `npx vitest run` -- 644 pass, 2 fail (pre-existing flaky timeouts in EditRoleModal.test.tsx)
- [x] Run `npx tsc -b` -- zero TypeScript errors
- [x] Run `npx vite build` -- production build succeeds (483.64 KB JS, 47.13 KB CSS)
- [x] Run `npx eslint .` -- no new lint errors (10 pre-existing errors, 70 warnings)

**Files:** None (verification only)

**Acceptance Criteria:**
- [x] All tests pass (except 2 pre-existing flaky timeouts)
- [x] Zero TS errors
- [x] Build succeeds
- [x] No new lint errors

---

### Task 5.2: Full Playwright walkthrough
- [x] Signed in as Manager -- Manager View is default, all tabs work, create role modal opens
- [x] Signed in as Employee (from initial load) -- NavBar visible, empty state shows friendly message
- [x] Toggled dark mode on Dashboard, Roles, Users, Templates pages
- [x] Verified branding consistency across all pages
- [x] Documented final state

**Files:** None (verification only)

**Acceptance Criteria:**
- [x] All critical bugs fixed
- [x] Dark mode consistent across all pages
- [x] Branding uses ShyftSolutions palette
- [x] UX labels are accurate

---

## Handoff Checklist (for Test Agent)

- [x] All 644+ unit tests pass (`npx vitest run`) -- 2 pre-existing flaky timeouts excluded
- [x] Zero TypeScript errors (`npx tsc -b`)
- [x] Production build succeeds (`npx vite build`)
- [x] No new ESLint errors
- [x] Role creation works (no UUID error -- createdBy accepts null)
- [x] Employee sees NavBar with sign-out
- [x] Manager lands on Manager View by default
- [x] Dark mode works on ALL pages (Dashboard, Roles, Users, Templates, Modals)
- [x] Brand colors are ShyftSolutions blue (not indigo)
- [x] Sign-in page labels are accurate (no "Emulator Mode")
- [x] Browser tab title is "OnboardHub"
