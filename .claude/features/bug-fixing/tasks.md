# Tasks: bug-fixing

## Metadata
- **Feature:** bug-fixing
- **Created:** 2026-02-14T21:00
- **Status:** implement-complete
- **Based-on:** 2026-02-14T21:00_plan.md

## Execution Rules
- Tasks within a phase execute sequentially unless marked with **[P]**
- **[P]** = parallelizable (no dependency on sibling tasks)
- TDD: Write tests FIRST in Phase 2, then implement in Phase 3+
- After each phase: run `npx vitest run` to verify no regressions
- After each phase: verify with Playwright MCP in browser
- Mark tasks complete with `[x]`

---

## Phase 1: Setup + Tests

### Task 1.1: Create timeUtils utility with tests (TDD)
- [x] Create `src/utils/timeUtils.ts` with `formatTimeAgo(timestamp: number | undefined): string`
- [x] Implement: < 60s = "just now", < 3600s = "Xm ago", < 86400s = "Xh ago", < 172800s = "yesterday", else "Xd ago"
- [x] Handle edge cases: undefined input returns '', 0 returns '', future timestamps return 'just now'
- [x] Create `src/utils/timeUtils.test.ts` with unit tests
- [x] Run `npx vitest run src/utils/timeUtils.test.ts` -- all pass

**Files:** `src/utils/timeUtils.ts`, `src/utils/timeUtils.test.ts`

**Acceptance Criteria:**
- [x] formatTimeAgo(undefined) returns ''
- [x] formatTimeAgo(Date.now()) returns 'just now'
- [x] formatTimeAgo(Date.now() - 300000) returns '5m ago'
- [x] formatTimeAgo(Date.now() - 7200000) returns '2h ago'
- [x] formatTimeAgo(Date.now() - 90000000) returns 'yesterday'
- [x] formatTimeAgo(Date.now() - 259200000) returns '3d ago'
- [x] All tests pass

---

## Phase 2: Core Performance -- Optimistic Updates (Highest User Impact)

### Task 2.1: Add optimistic updates to useRoles hook
- [x] In `createRole`: after `await createCustomRole()`, call `setRoles(prev => [...prev, newRole])`
- [x] In `updateRole`: after `await updateCustomRole()`, call `setRoles(prev => prev.map(r => r.id === roleId ? { ...r, ...updates, updatedAt: Date.now() } : r))`
- [x] In `deleteRole`: after `await deleteCustomRole()`, call `setRoles(prev => prev.filter(r => r.id !== roleId))`
- [x] Run `npx vitest run` -- verify no regressions

**Files:** `src/hooks/useRoles.ts`

**Acceptance Criteria:**
- [x] After createRole: new role appears in `roles` array immediately (no page reload)
- [x] After updateRole: role description updates in `roles` array immediately
- [x] After deleteRole: role disappears from `roles` array immediately
- [x] Existing tests still pass

### Task 2.2: Add CRUD wrappers to useTemplates hook with optimistic updates
- [x] Import `createTemplate`, `updateTemplate`, `deleteTemplate` from services
- [x] Add `create` function: calls service, constructs optimistic Template object with returned ID, updates local state via `setData(prev => [...prev, optimistic])`
- [x] Add `update` function: calls service, updates local state via `setData(prev => prev.map(...))`
- [x] Add `remove` function: calls service, updates local state via `setData(prev => prev.filter(...))`
- [x] Export new functions in the hook return value (additive -- does not break existing destructuring)
- [x] Keep `refetch` for backward compat
- [x] Run `npx vitest run` -- verify no regressions

**Files:** `src/hooks/useTemplates.ts`

**Acceptance Criteria:**
- [x] Hook returns `create`, `update`, `remove` functions
- [x] After create: new template appears in `data` array immediately
- [x] After update: template changes appear immediately
- [x] After remove: template disappears immediately
- [x] Existing tests still pass

### Task 2.3: Update TemplatesView to use hook CRUD wrappers + fix delete button
- [x] Replace direct `createTemplate` / `updateTemplate` / `deleteTemplate` service calls with hook functions
- [x] Remove all `refetch()` calls in handleCreateTemplate, handleEditTemplate, handleDeleteTemplate
- [x] Fix line 294: change `handleEditClick(template)` to `handleDeleteTemplate(template.id, template.name)` on the Trash2 button
- [x] Fix `handleDuplicateTemplate`: remove `createdAt: undefined` spread, pass clean object
- [x] Run `npx vitest run` -- verify no regressions

**Files:** `src/views/TemplatesView.tsx`

**Acceptance Criteria:**
- [x] Templates appear/update/disappear immediately after CRUD operations
- [x] No `refetch()` calls remain in CRUD handlers
- [x] Trash2 button triggers delete, not edit
- [x] Duplicate template creates a clean copy without `createdAt: undefined`
- [x] Existing tests still pass

### Task 2.4: Rewrite updateStepStatus to use direct UPDATE queries
- [x] Replace the current 4-query pattern with 3 direct queries
- [x] Validate that at least 1 row was affected by the step update (throw if 0 rows)
- [x] Handle completed_at: if progress = 100%, set status = 'completed' and completed_at = now
- [x] Run `npx vitest run` -- verify no regressions

**Files:** `src/services/supabase/instanceService.ts`

**Acceptance Criteria:**
- [x] Step status updates use exactly 3 queries instead of 4+
- [x] No DELETE + INSERT pattern for step updates
- [x] Progress is correctly recalculated
- [x] Instance status set to 'completed' when progress reaches 100%
- [x] Error thrown if step does not exist (0 rows affected)
- [x] Existing tests still pass

### Task 2.5: [P] Remove redundant uniqueness check in createCustomRole
- [x] In `createCustomRole`: remove the `validateRoleNameUniqueness` call
- [x] Keep `validateRoleName` (format validation) -- it runs locally, no network
- [x] In `dbCreateRole` (roleService.ts): check if the INSERT error contains "duplicate key" or "unique constraint" and throw a user-friendly "Role name already exists" error
- [x] Run `npx vitest run` -- verify no regressions

**Files:** `src/services/roleClient.ts`, `src/services/supabase/roleService.ts`

**Acceptance Criteria:**
- [x] createCustomRole no longer calls roleNameExists before INSERT
- [x] Duplicate role name still produces a user-friendly error message
- [x] One fewer network round-trip per role creation
- [x] Existing tests still pass

### Task 2.6: [P] Parallelize isRoleInUse queries
- [x] In `isRoleInUse` (roleService.ts): run template and instance checks in parallel with `Promise.all`
- [x] Run `npx vitest run` -- verify no regressions

**Files:** `src/services/supabase/roleService.ts`

**Acceptance Criteria:**
- [x] Template check and instance check run in parallel
- [x] Faster role delete validation (~50% faster)
- [x] Existing tests still pass

### Task 2.7: [P] Fix syncTemplateStepsToInstances to use filtered query
- [x] In `syncTemplateStepsToInstances`: replace `listOnboardingInstances()` + JS filter with a direct Supabase query filtered by `template_id`
- [x] Run `npx vitest run` -- verify no regressions

**Files:** `src/services/supabase/templateService.ts`

**Acceptance Criteria:**
- [x] Only instances for the specific template are fetched (not ALL instances)
- [x] Existing tests still pass

### PHASE 2 CHECKPOINT
- [x] Run `npx vitest run` -- all tests pass (655 passed)
- [x] Playwright verify: Create role -> appears instantly in table
- [x] Playwright verify: Delete role -> disappears instantly from table
- [x] Playwright verify: Create template -> appears instantly in grid
- [x] Playwright verify: Delete template via Trash2 icon -> triggers delete (not edit)

---

## Phase 3: Functional Bug Fixes

### Task 3.1: Fix EditTemplateModal to use dynamic roles from DB
- [x] Import `useRoles` from `../../hooks`
- [x] Replace hardcoded `AVAILABLE_ROLES` array with `const { roles, isLoading: rolesLoading } = useRoles()`
- [x] Update role checkbox rendering to iterate over `roles`
- [x] Fix `selectedRoles` initialization in `useEffect`: set to `[template.role]`
- [x] Verify checkboxes are pre-selected
- [x] Add loading state for roles ("Loading roles...")
- [x] Add empty state for roles ("No roles available")
- [x] Add dark mode classes to all form elements

**Files:** `src/components/templates/EditTemplateModal.tsx`

**Acceptance Criteria:**
- [x] Edit Template modal shows same roles as Create Template modal (from DB)
- [x] Current role assignment is pre-checked
- [x] Dark mode renders correctly
- [x] Existing tests still pass

### Task 3.2: Replace window.confirm with DeleteConfirmationDialog in UsersPanel
- [x] Import `DeleteConfirmationDialog` from `../ui`
- [x] Add state: `const [userToDelete, setUserToDelete] = useState<User | null>(null)`
- [x] In `handleDeleteUser`: remove `window.confirm()`, set `setUserToDelete(user)`
- [x] Add `handleConfirmDeleteUser` function
- [x] Render `DeleteConfirmationDialog` at the bottom of the component JSX
- [x] Update UsersPanel.test.tsx delete tests
- [x] Run `npx vitest run` -- verify no regressions

**Files:** `src/components/manager/UsersPanel.tsx`, `src/components/manager/UsersPanel.test.tsx`

**Acceptance Criteria:**
- [x] User delete shows a styled confirmation dialog, not window.confirm
- [x] Matches the pattern used in RoleManagementPanel and TemplatesView
- [x] Existing tests still pass

### Task 3.3: Fix DarkModeProvider initial render
- [x] Remove the `if (!isInitialized) return <>{children}</>` guard
- [x] Remove `isInitialized` state entirely
- [x] Always wrap children in `<DarkModeContext.Provider>` from the first render
- [x] Run `npx vitest run` -- verify no regressions

**Files:** `src/context/DarkModeContext.tsx`

**Acceptance Criteria:**
- [x] `useDarkMode()` never throws "must be used within a DarkModeProvider"
- [x] Dark mode still persists across page reloads
- [x] No flash of wrong theme on initial load
- [x] Existing tests still pass

### Task 3.4: Fix activity timestamps to compute relative time
- [x] In `activityService.ts`: add `ORDER BY timestamp DESC` to `listActivities`
- [x] In `mappers.ts`: in `toActivity`, replace `timeAgo: row.time_ago ?? ''` with `timeAgo: formatTimeAgo(timestamp)`
- [x] Update mapper tests for new behavior
- [x] Run `npx vitest run` -- verify no regressions

**Files:** `src/services/supabase/activityService.ts`, `src/services/supabase/mappers.ts`, `src/services/supabase/mappers.test.ts`

**Acceptance Criteria:**
- [x] Activities sorted by timestamp (newest first)
- [x] Activities show relative timestamps ("5m ago", "2h ago") not static values
- [x] Existing tests still pass

### Task 3.5: [P] Fix mappers.ts created_by fallback
- [x] Change `createdBy: row.created_by ?? 'system'` to `createdBy: row.created_by ?? 'Unknown'` in all mappers
- [x] Update mapper tests
- [x] Run `npx vitest run` -- verify no regressions

**Files:** `src/services/supabase/mappers.ts`, `src/services/supabase/mappers.test.ts`

**Acceptance Criteria:**
- [x] Roles with null created_by show "Unknown" instead of "system"
- [x] Mapper tests updated
- [x] Existing tests still pass

### PHASE 3 CHECKPOINT
- [x] Run `npx vitest run` -- all tests pass (655 passed)
- [x] Playwright verify: Edit Template shows correct roles from DB with pre-selection
- [x] Playwright verify: Delete user shows styled dialog, not browser confirm
- [x] Playwright verify: Activity feed shows relative timestamps

---

## Phase 4: Dark Mode Fixes

### Task 4.1: [P] Fix dark mode in Badge component + StepCard
- [x] Add dark: variants to Badge colorMap (blue, green, red, amber, slate)
- [x] StepCard already had extensive dark mode -- Badge was the missing piece

**Files:** `src/components/ui/Badge.tsx`

**Acceptance Criteria:**
- [x] StepCard text is readable in dark mode
- [x] Stuck, completed, and pending states render distinctly in dark mode
- [x] Badge colors work in dark mode

### Task 4.2: [P] Fix dark mode in CreateRoleModal
- [x] Add `dark:text-red-400` to error text paragraphs

**Files:** `src/components/modals/CreateRoleModal.tsx`

**Acceptance Criteria:**
- [x] Validation error text readable in dark mode

### Task 4.3: [P] Fix dark mode in CreateOnboardingModal
- [x] Add `dark:text-red-400` to error text paragraphs

**Files:** `src/components/modals/CreateOnboardingModal.tsx`

**Acceptance Criteria:**
- [x] Validation error text readable in dark mode

### Task 4.4: [P] Fix dark mode in CreateTemplateModal
- [x] Add `dark:text-brand-400` to Add Step button
- [x] Add `dark:hover:text-red-400` to Remove step button

**Files:** `src/components/templates/CreateTemplateModal.tsx`

**Acceptance Criteria:**
- [x] Add Step button visible in dark mode
- [x] Remove step button hover color works in dark mode

### Task 4.5: [P] Fix dark mode in DeleteConfirmationDialog
- [x] Add `dark:bg-slate-800` to dialog container
- [x] Add `dark:bg-red-900/40` to icon circle
- [x] Add `dark:text-slate-50` to title
- [x] Add `dark:text-slate-300` to message
- [x] Add `dark:bg-slate-700 dark:border-slate-600` to button bar
- [x] Add `dark:text-slate-300 dark:hover:bg-slate-600` to cancel button

**Files:** `src/components/ui/DeleteConfirmationDialog.tsx`

**Acceptance Criteria:**
- [x] Dialog readable in dark mode
- [x] All elements have proper dark variants

### PHASE 4 CHECKPOINT
- [x] Run `npx vitest run` -- all tests pass (655 passed)
- [x] Playwright verify: Dark mode looks correct across all views

---

## Phase 5: Minor Fixes + Cleanup

### Task 5.1: [P] Add filter to subscribeToEmployeeInstance
- [x] Add `filter: \`employee_email=eq.${normalizedEmail}\`` to the `onboarding_instances` subscription
- [x] Run `npx vitest run` -- verify no regressions

**Files:** `src/services/supabase/instanceService.ts`

**Acceptance Criteria:**
- [x] Employee instance subscription only fires for changes to the specific employee's instances
- [x] Existing tests still pass

### Task 5.2: [P] Remove dead code (areUsersEqual)
- [x] Remove `areUsersEqual` function from `userService.ts`
- [x] Remove from barrel export in `supabase/index.ts`
- [x] Run `npx vitest run` -- verify no regressions

**Files:** `src/services/supabase/userService.ts`, `src/services/supabase/index.ts`

**Acceptance Criteria:**
- [x] Function removed
- [x] No import errors
- [x] Existing tests still pass

### Task 5.3: [P] Remove duplicate authStorageChange dispatch
- [x] In `SignInView.tsx`: remove the manual `window.dispatchEvent` call after `signInWithEmailLink`
- [x] Update `SignInView.integration.test.tsx` to verify delegation instead of event dispatch
- [x] Run `npx vitest run` -- verify no regressions

**Files:** `src/views/SignInView.tsx`, `src/views/SignInView.integration.test.tsx`

**Acceptance Criteria:**
- [x] Only one `authStorageChange` event fires per sign-in (inside authService)
- [x] Auth flow still works correctly
- [x] Existing tests still pass

### PHASE 5 CHECKPOINT
- [x] Run `npx vitest run` -- all tests pass (655 passed)
- [x] `npx tsc -b` -- zero TypeScript errors

---

## Phase 6: Final Verification

### Task 6.1: Full test suite
- [x] Run `npx vitest run` -- all 655 tests pass
- [x] Run `npx tsc -b` -- zero TypeScript errors
- [x] Run `npx vite build` -- production build succeeds

### Task 6.2: Playwright end-to-end verification
- [x] Dashboard loads with KPI cards in dark mode
- [x] Activity feed shows relative timestamps ("48m ago")
- [x] Create a role -> appears IMMEDIATELY in roles table
- [x] Delete the role -> disappears IMMEDIATELY via styled dialog
- [x] Templates page shows cards in dark mode
- [x] Click Edit on template -> modal shows correct DB roles with pre-selection
- [x] Employee view displays step cards with dark mode Badge colors
- [x] Light mode toggle works correctly

### Task 6.3: Build verification
- [x] Run `npx vite build` -- production build succeeds with zero errors (2.47s)

**Acceptance Criteria:**
- [x] All unit tests pass (655/655)
- [x] Zero TypeScript errors
- [x] Production build succeeds
- [x] All Playwright checks pass

---

## Handoff Checklist for Test Agent

- [x] All tasks marked complete
- [x] `npx vitest run` passes (655 tests, 31 test files, all pass)
- [x] `npx tsc -b` passes (zero errors)
- [x] `npx vite build` passes
- [x] No new npm dependencies added
- [x] Playwright browser verification completed for all phases
- [x] Feature branch ready for `/test bug-fixing`
