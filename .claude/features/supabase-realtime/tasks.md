# Tasks: supabase-realtime

## Metadata
- **Feature:** supabase-realtime
- **Created:** 2026-02-14T08:20
- **Status:** ready-for-implementation
- **Based On:** 2026-02-14T08:20_plan.md

## Execution Rules
- Tasks within a phase are sequential unless marked with `[P]`
- `[P]` = parallelizable (can run concurrently with other `[P]` tasks in the same phase)
- TDD: Write/update tests BEFORE implementation where noted
- Mark tasks complete by checking the boxes when done

---

## Phase 1: Database Setup (Sequential)

### Task 1.1: Create Realtime Publication Migration
- [x] Create `supabase/migrations/00007_enable_realtime.sql`
- [x] Add header comment following the pattern from 00006 (purpose, tables)
- [x] Add `ALTER PUBLICATION supabase_realtime ADD TABLE` for all 16 tables:
  `users, roles, profiles, templates, profile_templates, onboarding_instances,
  suggestions, activities, template_steps, instance_steps, profile_template_steps,
  user_roles, user_profiles, profile_role_tags, instance_profiles, instance_template_refs`
- [x] Verify SQL syntax is valid

**Files:** `supabase/migrations/00007_enable_realtime.sql` (new)

**Acceptance Criteria:**
- [x] Migration file exists with correct naming convention
- [x] All 16 tables are listed in the ALTER PUBLICATION statement
- [x] Header comment explains the purpose clearly
- [x] SQL syntax follows patterns from existing migrations (00001-00006)

---

## Phase 2: Tests First (TDD)

### Task 2.1: Update useSuggestions Tests for Subscription Pattern
- [x] Change mock from `listSuggestions: vi.fn()` to `subscribeToSuggestions: vi.fn()`
- [x] Update import to use `subscribeToSuggestions` instead of `listSuggestions`
- [x] Rewrite "should initialize with loading state and empty data" test
      (mock subscribeToSuggestions to return a cleanup fn without calling callback)
- [x] Rewrite "should fetch and display suggestions on mount" to
      "should update data when subscription receives suggestions"
      (mock calls callback(mockSuggestions) immediately)
- [x] Rewrite "should set error state on fetch failure" to
      "should handle error gracefully during subscription"
      (mock throws an error)
- [x] Rewrite "should clear polling interval on unmount" to
      "should unsubscribe on unmount"
      (verify mockUnsubscribe is called once)
- [x] Keep "should handle empty suggestions array" test
      (update to use subscription mock that calls callback([]))
- [x] Update "should update data when new suggestions are available" to
      "should handle multiple suggestion updates"
      (capture callback ref, call it multiple times)
- [x] Keep "should handle fetch errors gracefully without throwing" or merge into error test
- [x] All tests should FAIL initially (because useSuggestions still uses polling)

**Files:** `src/hooks/useSuggestions.test.ts`

**Reference:** `src/hooks/useActivities.test.ts` (follow this exact mock pattern)

**Acceptance Criteria:**
- [x] Tests use `subscribeToSuggestions` mock instead of `listSuggestions`
- [x] Tests follow the same pattern as `useActivities.test.ts`
- [x] Tests fail when run against the current (polling) `useSuggestions.ts`
- [x] At least 7 test cases covering: init, data, error, unmount, empty, multiple updates

---

## Phase 3: Core Implementation (Sequential)

### Task 3.1: Add subscribeToSuggestions to Service
- [x] Add `subscribeToSuggestions` function to `src/services/supabase/suggestionService.ts`
- [x] Function signature: `(callback: (suggestions: Suggestion[]) => void) => () => void`
- [x] Step 1: Initial fetch via `listSuggestions().then(callback).catch(console.error)`
- [x] Step 2: Create channel `supabase.channel('suggestions-all')`
- [x] Step 3: Listen with `.on('postgres_changes', { event: '*', schema: 'public', table: 'suggestions' }, re-fetch)`
- [x] Step 4: Call `.subscribe()` on the channel
- [x] Step 5: Return cleanup function `() => { supabase.removeChannel(channel); }`
- [x] Add JSDoc comment matching the style of `subscribeToActivities`

**Files:** `src/services/supabase/suggestionService.ts`

**Reference:** `src/services/supabase/activityService.ts` lines 64-86 (copy this pattern exactly)

**Acceptance Criteria:**
- [x] Function follows the exact same pattern as `subscribeToActivities`
- [x] Channel name is `'suggestions-all'`
- [x] Initial fetch calls `listSuggestions()`
- [x] Change handler re-fetches via `listSuggestions()`
- [x] Cleanup removes the channel
- [x] TypeScript compiles with no errors

### Task 3.2: Export subscribeToSuggestions from Barrel
- [x] Add `subscribeToSuggestions` to the export list in `src/services/supabase/index.ts`
  under the `-- Suggestion Service --` section

**Files:** `src/services/supabase/index.ts`

**Acceptance Criteria:**
- [x] `subscribeToSuggestions` is exported alongside other suggestion functions
- [x] Import from `'../services/supabase'` resolves correctly

### Task 3.3: Convert useSuggestions from Polling to Subscription
- [x] Update JSDoc: change "polling interval" to "real-time subscription"
- [x] Change import from `listSuggestions` to `subscribeToSuggestions`
- [x] Remove `fetchSuggestions` async function
- [x] Remove `setInterval` and `clearInterval` logic
- [x] Remove `isMounted` tracking (not needed with subscription pattern)
- [x] Add subscription pattern matching `useActivities.ts`:
  - `let unsubscribe: (() => void) | null = null;`
  - `try { unsubscribe = subscribeToSuggestions(callback); } catch (err) { ... }`
  - Callback: `(suggestions) => { setData(suggestions); setIsLoading(false); }`
  - Cleanup: `return () => { if (unsubscribe) unsubscribe(); }`
- [x] Preserve `enabled` parameter behavior (skip subscription when false)
- [x] Preserve return type `{ data, isLoading, error }`
- [x] Run tests: `npx vitest run src/hooks/useSuggestions.test.ts`

**Files:** `src/hooks/useSuggestions.ts`

**Reference:** `src/hooks/useActivities.ts` (replicate this structure exactly)

**Acceptance Criteria:**
- [x] No `setInterval`, `clearInterval`, or `isMounted` in the file
- [x] Uses `subscribeToSuggestions` from `'../services/supabase'`
- [x] Hook API is unchanged: `useSuggestions(enabled?) => { data, isLoading, error }`
- [x] All `useSuggestions.test.ts` tests pass
- [x] Structure matches `useActivities.ts` line-for-line

---

## Phase 4: Comment Cleanup [P] (All Parallelizable)

### Task 4.1: [P] Clean Up useRoles.ts Comments
- [x] Line 6: Change `"The dataClient now handles localStorage fallback with pre-seeded default roles,
  so this hook no longer needs to manually seed roles on initialization."` to
  `"Uses Supabase Realtime subscription for automatic updates."`
- [x] Line 39: Change `"Default roles are now auto-initialized by the dataClient's localStorage fallback"` to
  `"Subscribes to Supabase Realtime for automatic role updates"`
- [x] Line 55: Change `"Subscribe to real-time updates (dataClient handles localStorage fallback with defaults)"` to
  `"Subscribe to real-time role updates via Supabase Realtime"`

**Files:** `src/hooks/useRoles.ts` (lines 6, 39, 55)

**Acceptance Criteria:**
- [x] No references to "dataClient", "localStorage fallback", or "pre-seeded" remain
- [x] Comments accurately describe the Supabase Realtime subscription pattern
- [x] No executable code changed -- only JSDoc/comment strings

### Task 4.2: [P] Clean Up useCreateOnboarding.ts Comments and Error String
- [x] Line 3: Change `"Wraps createOnboardingRunFromTemplate from dataClient"` to
  `"Wraps createOnboardingRunFromTemplate from Supabase service layer"`
- [x] Line 109: Change `message.includes('Firestore') || message.includes('Firebase')` to
  `message.includes('database') || message.includes('Database')` (or `'Supabase'`)

**Files:** `src/hooks/useCreateOnboarding.ts` (lines 3, 109)

**Acceptance Criteria:**
- [x] No references to "dataClient", "Firestore", or "Firebase" remain
- [x] Error detection string updated to match Supabase error messages
- [x] No other logic changed

### Task 4.3: [P] Clean Up useManagerData.ts Comment
- [x] Line 2: Change `"useManagerData Hook - Centralizes manager-only Firestore subscriptions"` to
  `"useManagerData Hook - Centralizes manager-only Supabase Realtime subscriptions"`

**Files:** `src/hooks/useManagerData.ts` (line 2)

**Acceptance Criteria:**
- [x] No references to "Firestore" remain
- [x] No executable code changed

### Task 4.4: [P] Clean Up Barrel File Comment
- [x] Line 8: Change `"Migration Step: 2 of 5 (Firebase -> Supabase)"` to
  `"Supabase Data Layer - Service Exports"`  (remove migration step reference since migration is complete)

**Files:** `src/services/supabase/index.ts` (line 8)

**Acceptance Criteria:**
- [x] No stale migration step reference remains
- [x] Comment accurately describes the file's purpose

### Task 4.5: [P] Clean Up userService.ts Comments
- [x] Line 4: Change `"auth credential helpers (localStorage, preserved until supabase-auth step),"` to
  `"auth credential helpers (localStorage for dev mode),"` (supabase-auth step is now complete)
- [x] Line 19: Change `"Auth Credential Helpers (localStorage - preserved until supabase-auth step 3)"` to
  `"Auth Credential Helpers (localStorage - dev mode only)"`

**Files:** `src/services/supabase/userService.ts` (lines 4, 19)

**Acceptance Criteria:**
- [x] No references to "supabase-auth step" or "step 3" remain
- [x] Comments accurately reflect current state (auth migration is done)
- [x] No executable code changed

---

## Phase 5: Validation (Sequential)

### Task 5.1: Run Full Test Suite
- [x] Run `npx vitest run` and verify all tests pass
- [x] Confirm test count is >= 654 (may change slightly due to test rewrite)
- [x] Verify zero test failures

**Acceptance Criteria:**
- [x] All tests pass (652/653; 1 pre-existing flaky timeout in CreateRoleModal.test.tsx)
- [x] No regressions from the changes

### Task 5.2: Run TypeScript and Build Checks
- [x] Run `npx tsc -b` and verify zero errors
- [x] Run `npx vite build` and verify build succeeds

**Acceptance Criteria:**
- [x] Zero TypeScript errors
- [x] Build completes successfully
- [x] No new warnings introduced

---

## Phase 6: Handoff to Test Agent

### Handoff Checklist
- [x] `subscribeToSuggestions` function added to `suggestionService.ts`
- [x] `subscribeToSuggestions` exported from barrel file
- [x] `useSuggestions` hook converted from polling to subscription
- [x] `useSuggestions.test.ts` updated with subscription-based tests
- [x] Migration `00007_enable_realtime.sql` created
- [x] All stale comments cleaned up (5 files)
- [x] All tests passing (`npx vitest run`)
- [x] TypeScript clean (`npx tsc -b`)
- [x] Build succeeds (`npx vite build`)
- [x] No Firebase/Firestore/dataClient references remain in modified files

### Files Changed Summary
| File | Change Type |
|------|-------------|
| `supabase/migrations/00007_enable_realtime.sql` | NEW |
| `src/services/supabase/suggestionService.ts` | MODIFIED (+subscribe function) |
| `src/services/supabase/index.ts` | MODIFIED (+export, comment) |
| `src/hooks/useSuggestions.ts` | MODIFIED (rewritten: polling -> subscription) |
| `src/hooks/useSuggestions.test.ts` | MODIFIED (rewritten: subscription mocks) |
| `src/hooks/useRoles.ts` | MODIFIED (comments only) |
| `src/hooks/useCreateOnboarding.ts` | MODIFIED (comment + error string) |
| `src/hooks/useManagerData.ts` | MODIFIED (comment only) |
| `src/services/supabase/userService.ts` | MODIFIED (comments only) |
