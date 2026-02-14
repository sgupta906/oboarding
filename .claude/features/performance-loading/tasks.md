# Tasks: performance-loading

## Metadata
- **Feature:** performance-loading
- **Created:** 2026-02-14T12:00
- **Status:** implementation-complete
- **Based On:** `.claude/features/performance-loading/2026-02-14T12:00_plan.md`

## Execution Rules
- Tasks are numbered by Phase.Task (e.g., 1.1, 2.1)
- [P] = parallelizable with other tasks in the same phase
- Complete all tasks in a phase before moving to the next phase
- Run `npx vitest run` after each task to verify no regressions
- Run `npx tsc -b` after each task to verify TypeScript
- Mark tasks with [x] when complete

---

## Phase 1: Setup (Sequential)

### Task 1.1: Create debounce utility
- [x] Create `src/utils/debounce.ts`
- [x] Implement trailing-edge debounce function with cancel method
- [x] Export the function
- [x] Verify TypeScript compiles: `npx tsc -b`

**Files:** `src/utils/debounce.ts` (new)

**Acceptance Criteria:**
- [x] `debounce(fn, ms)` returns a debounced function with `.cancel()` method
- [x] TypeScript strict mode passes
- [x] No new dependencies added

---

### Task 1.2: Create debounce utility tests (TDD)
- [x] Create `src/utils/debounce.test.ts`
- [x] Test: calls function after delay
- [x] Test: batches rapid calls into one execution
- [x] Test: cancel prevents pending execution
- [x] Test: each new call resets the timer
- [x] Test: works with different delay values
- [x] Test: passes arguments through correctly
- [x] Run tests: `npx vitest run src/utils/debounce.test.ts`

**Files:** `src/utils/debounce.test.ts` (new)

**Acceptance Criteria:**
- [x] All debounce tests pass (11 tests)
- [x] Minimum 6 test cases covering core behavior

---

## Phase 2: Service Layer - Debounce All Subscriptions [P]

All tasks in this phase follow the same pattern and can be done in parallel.

### Task 2.1: [P] Add debounce to subscribeToRoles + limit to listRoles
- [x] Import `debounce` from `../../utils/debounce`
- [x] In `subscribeToRoles`: create debounced re-fetch, use in Realtime handler, cancel in cleanup
- [x] In `listRoles`: add `.limit(200)` to the query
- [x] Verify existing tests pass: `npx vitest run`

**Acceptance Criteria:**
- [x] Initial fetch is NOT debounced (immediate)
- [x] Realtime change handler IS debounced (300ms)
- [x] Cleanup calls `debouncedRefetch.cancel()`
- [x] `listRoles()` has `.limit(200)`
- [x] All existing tests pass

---

### Task 2.2: [P] Add debounce to subscribeToTemplates + limit to listTemplates
- [x] Import `debounce`
- [x] In `subscribeToTemplates`: debounce re-fetch for both `templates` and `template_steps` change handlers
- [x] In `listTemplates`: add `.limit(200)` to the query
- [x] Verify existing tests pass

**Acceptance Criteria:**
- [x] Both table handlers share the same debounced re-fetch function
- [x] `listTemplates()` has `.limit(200)`
- [x] All existing tests pass

---

### Task 2.3: [P] Add debounce to subscribeToUsers + limit to listUsers
- [x] Import `debounce`
- [x] In `subscribeToUsers`: debounce re-fetch for all 3 table handlers (users, user_roles, user_profiles)
- [x] In `listUsers`: add `.limit(200)` to the query
- [x] Verify existing tests pass

**Acceptance Criteria:**
- [x] All 3 table handlers share the same debounced re-fetch
- [x] `listUsers()` has `.limit(200)`
- [x] All existing tests pass

---

### Task 2.4: [P] Add debounce to subscribeToActivities + limit(50) to listActivities
- [x] Import `debounce`
- [x] In `subscribeToActivities`: debounce re-fetch
- [x] In `listActivities`: change to `.limit(50)` (activities grow unboundedly -- this is the critical limit)
- [x] Verify the `.order('timestamp', { ascending: false })` is preserved
- [x] Verify existing tests pass

**Acceptance Criteria:**
- [x] `listActivities()` returns at most 50 rows, ordered by timestamp DESC
- [x] Realtime handler is debounced
- [x] All existing tests pass

---

### Task 2.5: [P] Add debounce to subscribeToSuggestions + limit to listSuggestions
- [x] Import `debounce`
- [x] In `subscribeToSuggestions`: debounce re-fetch
- [x] In `listSuggestions`: add `.limit(200)` to the query
- [x] Verify existing tests pass

**Acceptance Criteria:**
- [x] Debounced re-fetch on Realtime events
- [x] `listSuggestions()` has `.limit(200)`
- [x] All existing tests pass

---

### Task 2.6: [P] Add debounce to instance subscriptions + limit to listOnboardingInstances
- [x] Import `debounce`
- [x] In `subscribeToOnboardingInstances`: debounce re-fetch for both table handlers
- [x] In `subscribeToOnboardingInstance`: debounce re-fetch for both table handlers
- [x] In `subscribeToEmployeeInstance`: debounce re-fetch for both table handlers
- [x] In `listOnboardingInstances`: add `.limit(200)` to the query
- [x] Verify existing tests pass

**Acceptance Criteria:**
- [x] All 3 instance subscribe functions have debounced re-fetch
- [x] `listOnboardingInstances()` has `.limit(200)`
- [x] All existing tests pass

---

### Task 2.7: [P] Fix subscribeToSteps to query instance_steps directly + debounce
- [x] Import `debounce`
- [x] Rewrite `fetchSteps` in `subscribeToSteps` to query `instance_steps` directly instead of `getOnboardingInstance`
- [x] Add mapper logic to convert `InstanceStepRow` to `Step` (use `toStep` helper or inline mapping)
- [x] Debounce the re-fetch handler
- [x] Only listen on `instance_steps` table (remove `onboarding_instances` listener since we no longer need the parent)
- [x] Verify existing tests pass

**Acceptance Criteria:**
- [x] `subscribeToSteps` no longer calls `getOnboardingInstance`
- [x] Queries `instance_steps` directly with `eq('instance_id', instanceId)`
- [x] Results sorted by `position` ascending
- [x] Steps correctly mapped to `Step` type
- [x] Debounced re-fetch on Realtime events
- [x] All existing tests pass

---

### Task 2.8: [P] Add debounce to subscribeToProfiles and subscribeToProfileTemplates + limits
- [x] Import `debounce` in both service files
- [x] In `subscribeToProfiles`: debounce re-fetch for both table handlers
- [x] In `subscribeToProfileTemplates`: debounce re-fetch for both table handlers
- [x] In `listProfiles`: add `.limit(200)`
- [x] In `listProfileTemplates`: add `.limit(200)`
- [x] Verify existing tests pass

**Acceptance Criteria:**
- [x] Both subscribe functions have debounced re-fetch
- [x] Both list functions have `.limit(200)`
- [x] All existing tests pass

---

## Phase 3: Modal Refactoring - Props Instead of Hooks

### Task 3.1: Refactor CreateUserModal to accept roles as prop
- [x] Add `roles?: CustomRole[]` to `CreateUserModalProps` interface
- [x] Add `rolesLoading?: boolean` to props (or derive from `!roles`)
- [x] Remove `import { useRoles } from '../../hooks'` and `useRoles()` call
- [x] Use `roles` prop and derive loading state
- [x] Update `CreateUserModal.test.tsx` to pass roles as prop instead of mocking useRoles
- [x] Verify tests pass

**Acceptance Criteria:**
- [x] CreateUserModal no longer imports or calls useRoles
- [x] Roles data comes from props
- [x] All CreateUserModal tests pass
- [x] TypeScript compiles

---

### Task 3.2: Refactor EditUserModal to accept roles as prop
- [x] Add `roles?: CustomRole[]` to `EditUserModalProps` interface
- [x] Remove `useRoles()` hook call
- [x] Use `roles` prop
- [x] No dedicated test file exists for EditUserModal -- verify via parent tests
- [x] Verify tests pass

**Acceptance Criteria:**
- [x] EditUserModal no longer imports or calls useRoles
- [x] Roles data comes from props
- [x] TypeScript compiles
- [x] All existing tests pass

---

### Task 3.3: Refactor CreateTemplateModal to accept roles as prop
- [x] Add `roles?: CustomRole[]` to `CreateTemplateModalProps` interface
- [x] Remove `useRoles()` hook call
- [x] Use `roles` prop
- [x] Update `CreateTemplateModal.test.tsx` to pass roles as prop
- [x] Verify tests pass

**Acceptance Criteria:**
- [x] CreateTemplateModal no longer imports or calls useRoles
- [x] All CreateTemplateModal tests pass
- [x] TypeScript compiles

---

### Task 3.4: Refactor EditTemplateModal to accept roles as prop
- [x] Add `roles?: CustomRole[]` to `EditTemplateModalProps` interface
- [x] Remove `useRoles()` hook call
- [x] Use `roles` prop
- [x] Update `EditTemplateModal.test.tsx` to pass roles as prop
- [x] Verify tests pass

**Acceptance Criteria:**
- [x] EditTemplateModal no longer imports or calls useRoles
- [x] All EditTemplateModal tests pass
- [x] TypeScript compiles

---

### Task 3.5: Refactor CreateOnboardingModal to accept roles + templates as props
- [x] Add `roles?: CustomRole[]` and `templates?: Template[]` to `CreateOnboardingModalProps` interface
- [x] Remove `useRoles()` and `useTemplates()` hook calls
- [x] Use `roles` and `templates` from props
- [x] Update `CreateOnboardingModal.test.tsx` to pass roles/templates as props
- [x] Verify tests pass

**Acceptance Criteria:**
- [x] CreateOnboardingModal no longer imports or calls useRoles/useTemplates
- [x] All CreateOnboardingModal tests pass
- [x] TypeScript compiles

---

## Phase 4: Parent Components - Pass Data Down

### Task 4.1: Update UsersPanel to provide roles to modals
- [x] Import `useRoles` in UsersPanel
- [x] Call `useRoles()` to get `{ roles }`
- [x] Pass `roles={roles}` to `CreateUserModal` and `EditUserModal`
- [x] Verify tests pass

**Acceptance Criteria:**
- [x] UsersPanel calls useRoles once
- [x] Both modals receive roles as prop
- [x] All UsersPanel tests pass
- [x] TypeScript compiles

---

### Task 4.2: Update TemplatesView to provide roles to modals
- [x] Import `useRoles` in TemplatesView
- [x] Call `useRoles()` to get `{ roles }`
- [x] Pass `roles={roles}` to `CreateTemplateModal` and `EditTemplateModal`
- [x] Verify tests pass

**Acceptance Criteria:**
- [x] TemplatesView calls useRoles once
- [x] Both template modals receive roles as prop
- [x] All TemplatesView tests pass
- [x] TypeScript compiles

---

### Task 4.3: Update ManagerView to provide roles + templates to CreateOnboardingModal
- [x] Import `useRoles` and `useTemplates` in ManagerView
- [x] Call both hooks to get roles and templates data
- [x] Pass `roles={roles}` and `templates={templates}` to `CreateOnboardingModal`
- [x] Verify tests pass

**Acceptance Criteria:**
- [x] ManagerView calls useRoles and useTemplates once
- [x] CreateOnboardingModal receives both as props
- [x] All ManagerView tests pass
- [x] TypeScript compiles

---

## Phase 5: Subscription Manager (Shared Subscriptions) [P]

### Task 5.1: Create subscriptionManager utility
- [x] Create `src/services/supabase/subscriptionManager.ts`
- [x] Implement `createSharedSubscription<T>(key, subscribeFn)` function
- [x] Reference counting: first subscribe opens, last unsubscribe closes
- [x] Cache last data and deliver immediately to new subscribers
- [x] Export function

**Acceptance Criteria:**
- [x] Module exports `createSharedSubscription`
- [x] TypeScript strict mode passes
- [x] No new dependencies

---

### Task 5.2: Create subscriptionManager tests
- [x] Create `src/services/supabase/subscriptionManager.test.ts`
- [x] Test: first subscriber creates underlying subscription
- [x] Test: second subscriber reuses existing subscription (does NOT call subscribeFn again)
- [x] Test: new subscriber receives cached lastData immediately
- [x] Test: unsubscribe decrements ref count
- [x] Test: last unsubscribe calls underlying cleanup
- [x] Test: after full cleanup, new subscriber creates fresh subscription
- [x] Test: callbacks are isolated (one subscriber's callback doesn't affect another)
- [x] Test: double unsubscribe handled gracefully
- [x] Test: works with different data types
- [x] Test: broadcast new data to all subscribers
- [x] Run tests: `npx vitest run src/services/supabase/subscriptionManager.test.ts`

**Acceptance Criteria:**
- [x] All subscription manager tests pass (11 tests)
- [x] Minimum 8 test cases

---

### Task 5.3: [P] Wire subscribeToRoles through shared subscription manager
- [x] In `roleService.ts`, create a module-level shared subscription for roles
- [x] Modify `subscribeToRoles` to delegate to the shared subscription
- [x] Ensure debounce is still applied (inside the underlying subscribe function)
- [x] Verify all existing tests pass

**Acceptance Criteria:**
- [x] Multiple callers of `subscribeToRoles` share one Supabase channel
- [x] All tests pass
- [x] TypeScript compiles

---

### Task 5.4: [P] Wire subscribeToTemplates through shared subscription manager
- [x] In `templateService.ts`, create a module-level shared subscription for templates
- [x] Modify `subscribeToTemplates` to delegate to the shared subscription
- [x] Verify all existing tests pass

**Acceptance Criteria:**
- [x] Multiple callers of `subscribeToTemplates` share one Supabase channel
- [x] All tests pass
- [x] TypeScript compiles

---

## Phase 6: Verification and Polish

### Task 6.1: Run full test suite
- [x] Run `npx vitest run` -- 677 tests pass (up from 655 baseline)
- [x] Run `npx tsc -b` -- zero TypeScript errors
- [x] Run `npx eslint .` -- no new lint errors (all pre-existing)

**Acceptance Criteria:**
- [x] All tests pass (zero failures)
- [x] Zero TypeScript errors
- [x] No new lint warnings/errors

---

### Task 6.2: Verify via Playwright MCP (browser test)
- [ ] Skipped: No Playwright MCP available in this session

---

## Handoff Checklist for Test Agent

Before handing off to `/test`:
- [x] All 677 tests pass (`npx vitest run`)
- [x] Zero TypeScript errors (`npx tsc -b`)
- [x] No new lint errors (`npx eslint .`)
- [x] New utility tests written (debounce: 11 tests, subscriptionManager: 11 tests)
- [x] All modified test files updated for prop-passing changes
- [ ] Verified in browser via Playwright MCP (skipped - not available)
- [x] No new dependencies added to package.json
