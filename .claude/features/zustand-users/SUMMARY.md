# Feature Summary: zustand-users

## Metadata
- **Feature:** zustand-users
- **Finalized:** 2026-02-16
- **Slice:** 3 of 5 in Zustand migration roadmap
- **Status:** Complete and merged

## Overview

Added a `UsersSlice` to the existing Zustand store and migrated the `useUsers` hook from local `useState`-based state management to a thin wrapper over the centralized store. This is the third slice in the incremental Zustand state migration.

## What Was Built

### Store Changes
1. **UsersSlice Interface** - Added to `src/store/useOnboardingStore.ts`
   - 3 state fields: `users`, `usersLoading`, `usersError`
   - 6 actions: `_startUsersSubscription`, `_createUser`, `_editUser`, `_removeUser`, `_fetchUser`, `_resetUsersError`
   - Ref-counted subscription pattern (shared across consumers)

2. **Module-Level Ref-Counting**
   - `usersRefCount` and `usersCleanup` variables
   - Extended `resetStoreInternals()` for test isolation

3. **Store Tests** - 14 new tests in `src/store/useOnboardingStore.test.ts`
   - Subscription lifecycle (start, callback, cleanup, ref-counting)
   - CRUD operations (create, edit optimistic, delete server-first)
   - Error handling and state management

### Hook Migration
4. **useUsers Hook** - Rewritten from 125 to 67 lines (-46% reduction)
   - Replaced 3 `useState` hooks with store selectors
   - Eliminated direct service calls (now via store actions)
   - Preserved exact `UseUsersReturn` interface (zero breaking changes)
   - Fixed stale closure bug: `editUser` callback deps changed from `[users]` to `[]`

### Test Coverage
- **Total Tests:** 398 (384 existing + 14 new)
- **All Passing:** Zero regressions
- **Files with new tests:** `src/store/useOnboardingStore.test.ts` (+14 tests)
- **Files with updated setup:** `src/hooks/useUsers.test.ts` (added store reset)

## Technical Details

### Architecture Decisions

1. **Error Type: `string | null`**
   - Preserves existing hook API where `UsersPanel` renders error directly as text
   - Different from `instancesError: Error | null` by design

2. **Delete is Server-First (Not Optimistic)**
   - `_removeUser` calls `deleteUser()` first, then updates local state
   - Preserves existing destructive operation behavior

3. **Edit is Optimistic with Rollback**
   - `_editUser` captures snapshot via `get().users`, applies patch immediately
   - Rolls back to snapshot on server error

4. **Stable Callback References**
   - All `useCallback` deps are `[]` (use `getState()` internally)
   - Fixes stale closure bug from original `editUser([users])` dependency

### Files Changed

| File | Lines Before | Lines After | Change |
|------|--------------|-------------|--------|
| `src/store/useOnboardingStore.ts` | 266 | 382 | +116 |
| `src/store/useOnboardingStore.test.ts` | 485 | 697 | +212 |
| `src/store/index.ts` | 13 | 15 | +2 |
| `src/hooks/useUsers.ts` | 125 | 67 | -58 |
| `src/hooks/useUsers.test.ts` | 293 | 300 | +7 |
| **Total** | **1182** | **1461** | **+279** |

**Net change:** +279 lines (store tests account for +212)

### Quality Metrics

- **Tests:** 398/398 passing
- **Type Check:** Clean (`npx tsc -b`)
- **Build:** Successful (`npx vite build`)
- **Coverage:** All store actions, edge cases, error paths tested
- **Regressions:** Zero

## Benefits Achieved

1. **State Consolidation** - Users data moved to centralized Zustand store
2. **Subscription Deduplication** - One realtime subscription shared across all consumers (via ref-counting)
3. **Stable Callbacks** - All action callbacks have `[]` deps, eliminating stale closure bugs
4. **Preserved API** - `UseUsersReturn` interface unchanged, zero breaking changes for `UsersPanel`
5. **Test Coverage** - 14 new store tests covering subscription lifecycle, CRUD, ref-counting edge cases
6. **Code Reduction** - Hook reduced from 125 to 67 lines (-46%)

## Migration Progress

| Slice | Feature | Status |
|-------|---------|--------|
| 1 | zustand-store (instances) | Complete |
| 2 | zustand-steps (steps) | Complete |
| 3 | zustand-users (users) | **Complete** (this feature) |
| 4 | zustand-activities (activities) | Next |
| 5 | zustand-cleanup (remove old hooks) | Queued |

## Next Steps

1. Continue with `/research zustand-activities` for slice 4
2. After all slices complete, run `zustand-cleanup` to remove old hook implementations
3. Final consolidation: All stateful hooks using centralized store

## Related Documents

- Research: `.claude/features/zustand-users/2026-02-16T00:00_research.md`
- Plan: `.claude/features/zustand-users/2026-02-16T00:01_plan.md`
- Tasks: `.claude/features/zustand-users/tasks.md`
- Implementation: `.claude/active-work/zustand-users/implementation.md`
- Test Success: `.claude/active-work/zustand-users/test-success.md`

## Commit Information

- **Commit:** feat(store): add users slice to Zustand store, migrate useUsers hook
- **Files Committed:**
  - `src/store/useOnboardingStore.ts`
  - `src/store/useOnboardingStore.test.ts`
  - `src/store/index.ts`
  - `src/hooks/useUsers.ts`
  - `src/hooks/useUsers.test.ts`
  - `.claude/pipeline/STATUS.md`
  - `.claude/features/zustand-users/` (research, plan, tasks, SUMMARY)
