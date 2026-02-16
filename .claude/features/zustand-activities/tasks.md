# Tasks: zustand-activities

## Metadata
- **Feature:** zustand-activities
- **Created:** 2026-02-16T00:01
- **Status:** implementation-complete
- **Based on:** 2026-02-16T00:01_plan.md

## Execution Rules
- Tasks within the same phase are sequential unless marked **[P]** (parallelizable)
- TDD: write tests (Phase 2) before implementation (Phase 3)
- Mark each checkbox when complete
- All 398 existing tests must continue passing after each task

---

## Phase 1: Setup (Sequential)

### Task 1.1: Add ActivitiesSlice and SuggestionsSlice interfaces to store

- [x] Add `import type { Activity, Suggestion, SuggestionStatus }` to the store imports
- [x] Add `import { subscribeToActivities, subscribeToSuggestions }` to the service imports
- [x] Define `ActivitiesSlice` interface with `activities`, `activitiesLoading`, `activitiesError`, `_startActivitiesSubscription`
- [x] Define `SuggestionsSlice` interface with `suggestions`, `suggestionsLoading`, `suggestionsError`, `_startSuggestionsSubscription`, `_optimisticUpdateSuggestionStatus`, `_optimisticRemoveSuggestion`, `_rollbackSuggestions`
- [x] Update `OnboardingStore` type: `InstancesSlice & StepsSlice & UsersSlice & ActivitiesSlice & SuggestionsSlice`
- [x] Add TSDoc comments on all new interface members

**Files:** `src/store/useOnboardingStore.ts`

**Acceptance Criteria:**
- [x] TypeScript compiles without errors
- [x] `OnboardingStore` type includes all 5 slices

### Task 1.2: Add module-level ref-counting for activities and suggestions

- [x] Add `let activitiesRefCount = 0` and `let activitiesCleanup: (() => void) | null = null`
- [x] Add `let suggestionsRefCount = 0` and `let suggestionsCleanup: (() => void) | null = null`
- [x] Extend `resetStoreInternals()` to reset activities ref-count (`activitiesRefCount = 0`, call and clear `activitiesCleanup`)
- [x] Extend `resetStoreInternals()` to reset suggestions ref-count (`suggestionsRefCount = 0`, call and clear `suggestionsCleanup`)
- [x] Update `resetStoreInternals()` TSDoc to mention activities and suggestions

**Files:** `src/store/useOnboardingStore.ts`

**Acceptance Criteria:**
- [x] `resetStoreInternals()` clears all 5 slices' ref-counting state
- [x] TypeScript compiles without errors

### Task 1.3: Add ActivitiesSlice state and actions to the store

- [x] Add initial state: `activities: []`, `activitiesLoading: false`, `activitiesError: null`
- [x] Implement `_startActivitiesSubscription`: ref-counting, subscription setup, callback updates state, error handling, cleanup function with double-invoke guard
- [x] Follow exact pattern from `_startInstancesSubscription` (scalar ref-counting)

**Files:** `src/store/useOnboardingStore.ts`

**Acceptance Criteria:**
- [x] `_startActivitiesSubscription()` returns a cleanup function
- [x] First call starts subscription; subsequent calls are no-ops
- [x] Last cleanup unsubscribes and resets state
- [x] Error in subscription setup sets `activitiesError` and clears loading

### Task 1.4: Add SuggestionsSlice state and actions to the store

- [x] Add initial state: `suggestions: []`, `suggestionsLoading: false`, `suggestionsError: null`
- [x] Implement `_startSuggestionsSubscription`: ref-counting, subscription setup, callback updates state, error handling, cleanup function with double-invoke guard
- [x] Implement `_optimisticUpdateSuggestionStatus(id, status)`: capture `get().suggestions` snapshot, map to update status via `set()`, return snapshot
- [x] Implement `_optimisticRemoveSuggestion(id)`: capture snapshot, filter out by id via `set()`, return snapshot
- [x] Implement `_rollbackSuggestions(snapshot)`: call `set({ suggestions: snapshot })`

**Files:** `src/store/useOnboardingStore.ts`

**Acceptance Criteria:**
- [x] `_startSuggestionsSubscription()` returns a cleanup function
- [x] Ref-counting works correctly
- [x] `_optimisticUpdateSuggestionStatus` returns pre-mutation snapshot
- [x] `_optimisticRemoveSuggestion` returns pre-mutation snapshot
- [x] `_rollbackSuggestions` restores state from snapshot

### Task 1.5: Update store barrel exports

- [x] Add `ActivitiesSlice` and `SuggestionsSlice` to the `export type` block in `src/store/index.ts`

**Files:** `src/store/index.ts`

**Acceptance Criteria:**
- [x] Both types are importable from `../store`

---

## Phase 2: Tests (TDD - write before implementation verification)

### Task 2.1: Add ActivitiesSlice store tests

- [x] Add `mockActivitiesUnsubscribe` and `mockSubscribeToActivities` mock variables
- [x] Add `subscribeToActivities` to the existing `vi.mock('../services/supabase', ...)` block
- [x] Extend `beforeEach` `setState` to include `activities: [], activitiesLoading: false, activitiesError: null`
- [x] Add default mock: `mockSubscribeToActivities.mockImplementation(() => mockActivitiesUnsubscribe)`
- [x] Write test: "initializes with empty activities state"
- [x] Write test: "_startActivitiesSubscription calls subscribeToActivities"
- [x] Write test: "subscription callback updates activities and clears loading"
- [x] Write test: "subscription error sets error and clears loading"
- [x] Write test: "second start is no-op (subscribeToActivities called once)"
- [x] Write test: "last cleanup unsubscribes and resets state"
- [x] Write test: "double cleanup is safe (idempotent)"

**Files:** `src/store/useOnboardingStore.test.ts`

**Acceptance Criteria:**
- [x] 7 new ActivitiesSlice tests in a `describe('ActivitiesSlice', ...)` block
- [x] All 7 tests pass
- [x] All existing tests still pass

### Task 2.2: Add SuggestionsSlice store tests

- [x] Add `mockSuggestionsUnsubscribe` and `mockSubscribeToSuggestions` mock variables
- [x] Add `subscribeToSuggestions` to the existing `vi.mock('../services/supabase', ...)` block
- [x] Extend `beforeEach` `setState` to include `suggestions: [], suggestionsLoading: false, suggestionsError: null`
- [x] Add default mock: `mockSubscribeToSuggestions.mockImplementation(() => mockSuggestionsUnsubscribe)`
- [x] Add `makeSuggestion` helper
- [x] Write test: "initializes with empty suggestions state"
- [x] Write test: "_startSuggestionsSubscription calls subscribeToSuggestions"
- [x] Write test: "subscription callback updates suggestions and clears loading"
- [x] Write test: "_optimisticUpdateSuggestionStatus changes status and returns snapshot"
- [x] Write test: "_optimisticRemoveSuggestion removes suggestion and returns snapshot"
- [x] Write test: "_rollbackSuggestions restores previous state"
- [x] Write test: "last cleanup unsubscribes and resets state"

**Files:** `src/store/useOnboardingStore.test.ts`

**Acceptance Criteria:**
- [x] 7 new SuggestionsSlice tests in a `describe('SuggestionsSlice', ...)` block
- [x] All 7 tests pass
- [x] All existing tests still pass

---

## Phase 3: Core Implementation (Sequential)

### Task 3.1: Migrate useActivities hook to store wrapper

- [x] Remove `useState` imports for `data`, `isLoading`, `error`
- [x] Remove `subscribeToActivities` import from services
- [x] Add `import { useOnboardingStore } from '../store'`
- [x] Add store selectors for `activities`, `activitiesLoading`, `activitiesError`, `_startActivitiesSubscription`
- [x] Rewrite `useEffect`: when `enabled`, call `startSubscription()` and return cleanup; when not enabled, no-op
- [x] When `enabled=false`, return `{ data: [], isLoading: false, error: null }` directly
- [x] When `enabled=true`, return `{ data, isLoading, error }` from store selectors
- [x] Preserve `UseActivitiesReturn` interface (unchanged)
- [x] Preserve TSDoc comments

**Files:** `src/hooks/useActivities.ts`

**Acceptance Criteria:**
- [x] Return type is `{ data: Activity[], isLoading: boolean, error: Error | null }`
- [x] `enabled=false` returns defaults without starting subscription
- [x] `enabled=true` starts subscription and returns store state
- [x] All existing tests pass (no tests for this hook, but transitive via useManagerData consumers)

### Task 3.2: Migrate useSuggestions hook to store wrapper

- [x] Remove `useState` imports for `data`, `isLoading`, `error`
- [x] Remove `subscribeToSuggestions` import from services
- [x] Add `import { useOnboardingStore } from '../store'`
- [x] Add store selectors for `suggestions`, `suggestionsLoading`, `suggestionsError`, `_startSuggestionsSubscription`, `_optimisticUpdateSuggestionStatus`, `_optimisticRemoveSuggestion`, `_rollbackSuggestions`
- [x] Rewrite `useEffect`: when `enabled`, call `startSubscription()` and return cleanup; when not enabled, no-op
- [x] Create `useCallback` wrappers for `optimisticUpdateStatus`, `optimisticRemove`, `rollback` that delegate to store actions
- [x] When `enabled=false`, return defaults with the callback wrappers
- [x] When `enabled=true`, return store state with the callback wrappers
- [x] Preserve `UseSuggestionsReturn` interface (unchanged)
- [x] Preserve TSDoc comments

**Files:** `src/hooks/useSuggestions.ts`

**Acceptance Criteria:**
- [x] Return type matches `UseSuggestionsReturn` exactly
- [x] `enabled=false` returns defaults without starting subscription
- [x] `enabled=true` starts subscription and returns store state
- [x] `optimisticUpdateStatus(id, status)` returns `Suggestion[]` (pre-mutation snapshot)
- [x] `optimisticRemove(id)` returns `Suggestion[]` (pre-mutation snapshot)
- [x] `rollback(snapshot)` restores state

---

## Phase 4: Integration (Sequential)

### Task 4.1: Verify useSuggestions.test.ts passes

- [x] Run `npx vitest run src/hooks/useSuggestions.test.ts`
- [x] If tests fail due to store initialization in test context, add store mock/reset in test setup
- [x] All 3 existing tests must pass: optimisticUpdateStatus, optimisticRemove, rollback

**Files:** `src/hooks/useSuggestions.test.ts` (read-only verification, modify only if needed)

**Acceptance Criteria:**
- [x] All 3 tests pass without modification to test file
- [x] If modification needed, document what changed and why

### Task 4.2: Run full test suite

- [x] Run `npx vitest run`
- [x] All 398+ tests pass
- [x] No new warnings or errors

**Files:** None (verification only)

**Acceptance Criteria:**
- [x] Full test suite passes (412 tests = 398 existing + 14 new)
- [x] Zero test regressions

### Task 4.3: Verify TypeScript compilation

- [x] Run `npx tsc -b`
- [x] No type errors

**Files:** None (verification only)

**Acceptance Criteria:**
- [x] Clean TypeScript build with zero errors

---

## Phase 5: Polish [P] (Parallelizable)

### Task 5.1: Verify build succeeds [P]

- [x] Run `npx vite build`
- [x] Build completes without errors
- [x] Bundle size is reasonable (no unexpected growth)

**Files:** None (verification only)

**Acceptance Criteria:**
- [x] Production build succeeds

### Task 5.2: Final code review [P]

- [x] Verify all TSDoc comments are present on new exports
- [x] Verify no unused imports in modified files
- [x] Verify consistent naming (`activitiesX` / `suggestionsX` prefix pattern)
- [x] Verify `resetStoreInternals()` covers all 5 slices
- [x] Verify barrel exports in `src/store/index.ts` include both new types

**Files:** All modified files (read-only review)

**Acceptance Criteria:**
- [x] Code follows established patterns from slices 1-3
- [x] No lint warnings

---

## Phase 6: Ready for Test Agent

### Handoff Checklist

- [x] `src/store/useOnboardingStore.ts` extended with ActivitiesSlice + SuggestionsSlice
- [x] `src/store/index.ts` exports both new slice types
- [x] `src/hooks/useActivities.ts` is a thin store wrapper
- [x] `src/hooks/useSuggestions.ts` is a thin store wrapper with optimistic operations
- [x] ~14 new store tests pass (7 activities + 7 suggestions)
- [x] 3 existing `useSuggestions.test.ts` tests pass
- [x] Full test suite passes (412 tests, 0 regressions)
- [x] TypeScript compiles cleanly (`npx tsc -b`)
- [x] Production build succeeds (`npx vite build`)
- [x] `useManagerData` works unchanged (no modifications to file)
- [x] No changes to service layer, components, or views
