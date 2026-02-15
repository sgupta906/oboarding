# Tasks: slim-services

## Metadata
- **Feature:** slim-services
- **Created:** 2026-02-15T12:00
- **Status:** implement-complete
- **Based On:** `.claude/features/slim-services/2026-02-15T12:00_plan.md`

## Execution Rules
- Tasks within a phase are sequential unless marked **[P]** (parallelizable)
- TDD: Write tests first (Phase 2), then implement (Phase 3)
- Mark each subtask with [x] when complete
- Run `npx vitest run` after each service refactoring to catch regressions early
- The barrel export (`index.ts`) must NOT change at any point

---

## Phase 1: Setup (Sequential)

### Task 1.1: Create factory file with type definitions
- [x] Create `src/services/supabase/crudFactory.ts`
- [x] Define `CrudServiceConfig<TApp>` interface
- [x] Define `CrudService<TApp>` return type interface
- [x] Export the `createCrudService` function (stub -- implementation in Phase 3)
- [x] Verify file compiles: `npx tsc -b`

**Files:** `src/services/supabase/crudFactory.ts` (NEW)

**Acceptance Criteria:**
- [x] Config interface has: `table`, `selectClause`, `mapRow`, `entityName`, `listLimit?`, `listOrder?`, `subscription?`
- [x] Subscription config has: `channelName`, `tables` (array of `{ table, filter? }`), `shared?`
- [x] Return type has: `list`, `get`, `remove`, `subscribe`
- [x] TypeScript compiles without errors

---

## Phase 2: Tests (TDD - Write Before Implementation)

### Task 2.1: Write factory unit tests
- [x] Create `src/services/supabase/crudFactory.test.ts`
- [x] Mock the supabase client (`../../config/supabase`)
- [x] Mock the debounce utility (`../../utils/debounce`)
- [x] Write `list()` tests:
  - [x] Returns mapped results from Supabase query
  - [x] Applies correct selectClause
  - [x] Applies default limit of 200
  - [x] Applies custom limit when configured
  - [x] Applies ordering when `listOrder` is configured
  - [x] Throws with correct error message on Supabase error
  - [x] Returns empty array when data is null
- [x] Write `get(id)` tests:
  - [x] Returns mapped result for existing ID
  - [x] Returns null when PGRST116 error (not found)
  - [x] Throws on other Supabase errors
  - [x] Returns null when data is null
- [x] Write `remove(id)` tests:
  - [x] Calls delete().eq('id', id) on correct table
  - [x] Throws with correct error message on Supabase error
- [x] Write `subscribe(callback)` tests:
  - [x] Performs initial fetch immediately (calls list)
  - [x] Sets up Supabase channel with correct channel name
  - [x] Registers listeners for all configured tables
  - [x] Returns cleanup function
  - [x] Cleanup cancels debounce and removes channel
  - [x] Handles multi-table listening (2+ tables)
- [x] Write `shared subscription` tests:
  - [x] When `shared: true`, wraps with createSharedSubscription
  - [x] When `shared: false` or omitted, returns raw subscription

**Files:** `src/services/supabase/crudFactory.test.ts` (NEW)

**Acceptance Criteria:**
- [x] At least 18 test cases covering all 4 operations + shared subscription (22 tests)
- [x] Tests mock supabase client and debounce correctly

---

## Phase 3: Core Implementation (Sequential)

### Task 3.1: Implement the factory
- [x] Implement `list()` in `createCrudService`
- [x] Implement `get(id)`
- [x] Implement `remove(id)`
- [x] Implement `subscribe(callback)`
- [x] Run factory tests: `npx vitest run src/services/supabase/crudFactory.test.ts`
- [x] Verify all factory tests pass (22/22)

**Acceptance Criteria:**
- [x] All factory unit tests pass
- [x] TypeScript compiles: `npx tsc -b`
- [x] No new dependencies added

### Task 3.2: Refactor activityService.ts (simplest -- 2 operations)
- [x] Import `createCrudService` from `./crudFactory`
- [x] Replace `listActivities` with `crud.list`
- [x] Replace `subscribeToActivities` with `crud.subscribe`
- [x] Remove unused imports (debounce)
- [x] Keep `logActivity` custom function unchanged
- [x] All tests pass

**Result:** 63 lines (was 95, -32 lines)

### Task 3.3: Refactor suggestionService.ts (simple -- 3 operations)
- [x] Replace `listSuggestions` with `crud.list`
- [x] Replace `deleteSuggestion` with `crud.remove`
- [x] Replace `subscribeToSuggestions` with `crud.subscribe`
- [x] Keep `createSuggestion` and `updateSuggestionStatus` unchanged
- [x] All tests pass

**Result:** 78 lines (was 124, -46 lines)

### Task 3.4: Refactor roleService.ts (uses shared subscription)
- [x] Replace `listRoles` with `crud.list`
- [x] Replace `getRole` with `crud.get`
- [x] Replace `subscribeToRoles` with `crud.subscribe` (shared: true)
- [x] Remove `_subscribeToRolesRaw`, `sharedRolesSubscription`
- [x] Remove imports for `createSharedSubscription` and `debounce`
- [x] Keep `deleteRole` custom (has isRoleInUse check)
- [x] Keep `createRole`, `updateRole`, `roleNameExists`, `isRoleInUse`, `isValidUUID`
- [x] All tests pass

**Result:** 179 lines (was 246, -67 lines)

### Task 3.5: Refactor profileService.ts (2-table subscription)
- [x] Replace `listProfiles` with `crud.list`
- [x] Replace `getProfile` with `crud.get`
- [x] Replace `deleteProfile` with `crud.remove`
- [x] Replace `subscribeToProfiles` with `crud.subscribe`
- [x] Remove unused imports (debounce)
- [x] Keep `createProfile` and `updateProfile` unchanged
- [x] All tests pass

**Result:** 150 lines (was 221, -71 lines)

### Task 3.6: Refactor templateService.ts (shared subscription + 2 tables)
- [x] Replace `listTemplates` with `crud.list`
- [x] Replace `getTemplate` with `crud.get`
- [x] Replace `deleteTemplate` with `crud.remove`
- [x] Replace `subscribeToTemplates` with `crud.subscribe` (shared: true)
- [x] Remove `_subscribeToTemplatesRaw`, `sharedTemplatesSubscription`
- [x] Remove imports for `createSharedSubscription` and `debounce`
- [x] Keep `createTemplate`, `updateTemplate`, `syncTemplateStepsToInstances` unchanged
- [x] All tests pass

**Result:** 219 lines (was 310, -91 lines)

### Task 3.7: Refactor profileTemplateService.ts (partial factory use)
- [x] Replace `getProfileTemplate` with `crud.get`
- [x] Replace `deleteProfileTemplate` with `crud.remove`
- [x] Keep `listProfileTemplates` custom (has optional `profileId` filter parameter)
- [x] Keep `subscribeToProfileTemplates` custom (has dynamic channel name and filter)
- [x] Keep `createProfileTemplate` and `updateProfileTemplate` unchanged
- [x] All tests pass

**Result:** 255 lines (was 271, -16 lines)

### Task 3.8: Refactor instanceService.ts (most complex)
- [x] Replace `listOnboardingInstances` with `crud.list`
- [x] Replace `getOnboardingInstance` with `crud.get`
- [x] Replace `subscribeToOnboardingInstances` with `crud.subscribe`
- [x] Keep all custom operations and 3 filtered subscriptions
- [x] All tests pass

**Result:** 553 lines (was 614, -61 lines)

### Task 3.9: Refactor userService.ts (3 junction tables)
- [x] Replace `listUsers` with `crud.list`
- [x] Replace `getUser` with `crud.get`
- [x] Replace `subscribeToUsers` with `crud.subscribe`
- [x] Remove unused imports (debounce)
- [x] Keep all custom operations, auth helpers, test helpers
- [x] All tests pass

**Result:** 412 lines (was 480, -68 lines)

---

## Phase 4: Integration (Sequential)

### Task 4.1: Verify barrel export API is unchanged
- [x] Diff `src/services/supabase/index.ts` against git HEAD -- zero diff
- [x] Run `npx tsc -b` -- no errors
- [x] Run full test suite: `npx vitest run` -- 718 tests pass (696 + 22 new)

### Task 4.2: Measure line savings
- [x] Before: 2,361 lines across 8 service files
- [x] After: 2,095 lines across 8 service files + factory (1,909 in services + 186 in factory)
- [x] Net savings: 266 lines (11.3% reduction)
- [x] Note: Less than the ~510 estimated because factory has comprehensive JSDoc (186 vs ~120 estimate) and services retain more whitespace/comments for readability

---

## Phase 5: Polish [P] (Parallelizable)

### Task 5.1: Clean up unused imports across refactored files [P]
- [x] All unused imports removed during refactoring
- [x] TypeScript compiles cleanly

### Task 5.2: Add JSDoc to factory file [P]
- [x] Module-level JSDoc added to `crudFactory.ts`
- [x] JSDoc on `CrudServiceConfig` interface fields
- [x] JSDoc on `createCrudService` function
- [x] Inline comments for PGRST116 handling, shared subscription wrapping

---

## Phase 6: Ready for Test Agent

### Task 6.1: Final verification
- [x] Run full test suite: `npx vitest run` -- 718 tests pass (696 original + 22 new)
- [x] Run TypeScript check: `npx tsc -b` -- no errors
- [x] Run linter: `npx eslint src/services/supabase/` -- no new errors (only pre-existing warnings)
- [x] Verify barrel export is unchanged: `git diff src/services/supabase/index.ts` -- zero diff

---

## Handoff Checklist for Test Agent

- [x] All unit tests pass (`npx vitest run` -- 718 passing)
- [x] TypeScript compiles (`npx tsc -b` -- no errors)
- [x] No new lint errors (`npx eslint src/services/supabase/`)
- [x] Barrel export API unchanged (no consumer changes needed)
- [x] Factory file created with 22 tests
- [x] All 8 services refactored to use factory where appropriate
- [x] Net line savings: 266 lines (11.3%)
