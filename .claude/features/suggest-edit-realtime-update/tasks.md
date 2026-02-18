# Tasks: suggest-edit-realtime-update

**Feature:** suggest-edit-realtime-update
**Date:** 2026-02-17T04:00
**Status:** complete
**Based on:** 2026-02-17T04:00_plan.md

---

## Execution Rules

- Tasks are sequential unless marked [P]
- TDD: write tests BEFORE implementation where marked
- Mark completed tasks with [x]
- Each task has acceptance criteria with checkboxes

---

## Phase 1: Tests (TDD)

### Task 1.1: Write unit tests for `_addSuggestion` store action

- [x] Add test: `_addSuggestion appends suggestion to empty array`
- [x] Add test: `_addSuggestion appends suggestion preserving existing suggestions`

**Files:** `src/store/useOnboardingStore.test.ts`

**Acceptance Criteria:**
- [x] Both tests written and FAILING (action does not exist yet)

---

## Phase 2: Core Implementation

### Task 2.1: Add `_addSuggestion` to SuggestionsSlice

- [x] Add `_addSuggestion` to `SuggestionsSlice` interface (after `_rollbackSuggestions`)
- [x] Add `_addSuggestion` implementation (after `_rollbackSuggestions` implementation)
- [x] Run unit tests from Task 1.1 -- verify they PASS

**Files:** `src/store/useOnboardingStore.ts`

**Acceptance Criteria:**
- [x] `_addSuggestion` exists on the store
- [x] Appends suggestion to `suggestions` array via `set()`
- [x] Unit tests from Task 1.1 pass

### Task 2.2: Wire `_addSuggestion` into `handleSuggestEdit`

- [x] Capture return value from `createSuggestion()` (`const newId = await ...`)
- [x] Call `useOnboardingStore.getState()._addSuggestion(...)` with full Suggestion object
- [x] Add `useOnboardingStore` import if not already present

**Files:** `src/components/OnboardingHub.tsx`

**Acceptance Criteria:**
- [x] `handleSuggestEdit` constructs Suggestion with: id (from service), stepId, user, text, status='pending', createdAt=Date.now(), instanceId
- [x] Store is updated after successful `createSuggestion()` call (not before -- not truly optimistic, but after server confirms)
- [x] Error path unchanged (toast shown, no store update on failure)

---

## Phase 3: Validation

### Task 3.1: Run full test suite

- [x] Run `npx vitest run`
- [x] Verify all tests pass (no regressions)
- [x] Verify TypeScript compiles: `npx tsc -b`

**Acceptance Criteria:**
- [x] All existing tests pass
- [x] New tests pass
- [x] Zero TypeScript errors
- [x] Zero ESLint errors

---

## Handoff Checklist (for Test Agent)

- [x] 2 new unit tests added to `src/store/useOnboardingStore.test.ts`
- [x] `_addSuggestion` action added to Zustand store
- [x] `OnboardingHub.handleSuggestEdit` calls `_addSuggestion` after successful DB insert
- [x] All tests pass (`npx vitest run`)
- [x] TypeScript compiles (`npx tsc -b`)
- [ ] Build succeeds (`npx vite build`)
