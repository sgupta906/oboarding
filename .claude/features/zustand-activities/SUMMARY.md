# Feature Summary: zustand-activities

## Overview

Completed slice 4 of 5 in the incremental Zustand migration. Added `ActivitiesSlice` and `SuggestionsSlice` to the existing Zustand store, then migrated `useActivities` and `useSuggestions` hooks to thin store wrappers. This eliminates prop drilling for suggestions and consolidates all realtime data streams into shared state.

## What Was Built

### Store Slices

**ActivitiesSlice** (read-only):
- State: `activities: Activity[]`, `activitiesLoading: boolean`, `activitiesError: Error | null`
- Actions: `_startActivitiesSubscription()`, `_stopActivitiesSubscription()`
- Ref-counted subscription to `subscribeToActivities()` service
- Module-level ref counter: `activitiesRefCount`

**SuggestionsSlice** (with optimistic operations):
- State: `suggestions: Suggestion[]`, `suggestionsLoading: boolean`, `suggestionsError: Error | null`
- Actions: `_startSuggestionsSubscription()`, `_stopSuggestionsSubscription()`, `_optimisticUpdateSuggestionStatus()`, `_optimisticRemoveSuggestion()`, `_rollbackSuggestions()`
- Ref-counted subscription to `subscribeToSuggestions()` service
- Module-level ref counter: `suggestionsRefCount`
- Optimistic operations return state snapshots for rollback

### Hook Migrations

**useActivities** (63 lines → 43 lines):
- Thin wrapper over Zustand store
- Uses selectors for `activities`, `activitiesLoading`, `activitiesError`
- Calls `_startActivitiesSubscription()` in `useEffect`
- Returns defaults when `enabled=false`
- Same API: `{ data: Activity[], isLoading: boolean, error: Error | null }`

**useSuggestions** (93 lines → 87 lines):
- Thin wrapper over Zustand store
- Uses selectors for `suggestions`, `suggestionsLoading`, `suggestionsError`
- Calls `_startSuggestionsSubscription()` in `useEffect`
- Provides `useCallback` wrappers for optimistic operations
- Improved stale closure handling: uses `get()` instead of render-time closure
- Same API: `{ data: Suggestion[], isLoading: boolean, error: Error | null, optimisticUpdateStatus, optimisticRemove, rollback }`

## Files Changed

| File | Before | After | Change | Description |
|------|--------|-------|--------|-------------|
| `src/store/useOnboardingStore.ts` | 418 | 615 | +197 | Added ActivitiesSlice + SuggestionsSlice interfaces, 4 ref-counting vars, subscription + optimistic actions |
| `src/store/index.ts` | 14 | 16 | +2 | Added type exports for new slices |
| `src/hooks/useActivities.ts` | 63 | 43 | -20 | Rewrote as thin Zustand wrapper |
| `src/hooks/useSuggestions.ts` | 93 | 87 | -6 | Rewrote as thin Zustand wrapper |
| `src/store/useOnboardingStore.test.ts` | 773 | 1010 | +237 | Added 14 new tests (7 per slice) |

**Total:** +408 lines net (mostly tests and store infrastructure)

## Test Results

- **Store tests:** 51 tests pass (37 existing + 14 new)
- **Hook tests:** 3 `useSuggestions` tests pass (unchanged)
- **Full suite:** 412 tests pass (398 existing + 14 new)
- **Regressions:** 0
- **TypeScript:** Clean compilation
- **Build:** Successful (2.42s, 488KB bundle)

## Playwright Functional Testing

Verified all 5 store slices working together:
- Dashboard tab: Activities section (empty), Suggestions section (0), KPIs correct
- New Hires tab: 3 employees displayed with progress/status (InstancesSlice)
- Users tab: Empty state (UsersSlice)
- Roles tab: 1 role displayed
- Employee View: Dropdown shows 3 employees, steps loaded, progress bar 100% (StepsSlice)
- No console errors (1 expected WebSocket warning in dev mode)

## Architecture Impact

### Before
```
useActivities (useState + subscription)  →  useManagerData  →  OnboardingHub  →  ManagerView
useSuggestions (useState + subscription) →  useManagerData  →  OnboardingHub  →  ManagerView
```

### After
```
Zustand Store (ActivitiesSlice + SuggestionsSlice)
    ↓
useActivities (selector wrapper)  →  useManagerData  →  OnboardingHub  →  ManagerView
useSuggestions (selector wrapper) →  useManagerData  →  OnboardingHub  →  ManagerView
```

### Store State (All 5 Slices)
```typescript
{
  // InstancesSlice (from zustand-store)
  instances: OnboardingInstance[]
  instancesLoading: boolean
  instancesError: Error | null

  // StepsSlice (from zustand-steps)
  stepsByInstanceId: Map<string, InstanceStep[]>
  stepsLoadingByInstanceId: Map<string, boolean>
  stepsErrorByInstanceId: Map<string, Error | null>

  // UsersSlice (from zustand-users)
  users: User[]
  usersLoading: boolean
  usersError: string | null

  // ActivitiesSlice (NEW)
  activities: Activity[]
  activitiesLoading: boolean
  activitiesError: Error | null

  // SuggestionsSlice (NEW)
  suggestions: Suggestion[]
  suggestionsLoading: boolean
  suggestionsError: Error | null
}
```

## Bugs Fixed

None (this is an incremental migration slice, not a bug fix).

## Known Issues

None. All tests pass, no regressions.

## Next Steps

This completes slice 4 of 5. One slice remaining:

**Slice 5: `zustand-cleanup`**
- Remove migrated hooks (`useOnboardingInstances`, `useEmployeeOnboarding`, `useSteps`, `useUsers`, `useActivities`, `useSuggestions`)
- Slim `OnboardingHub.tsx` from 343 lines to thin router
- Remove `useManagerData` (components read from store directly)
- Final cleanup: eliminate prop drilling, consolidate state access patterns

After slice 5, the Zustand migration is complete and the app will have:
- Zero isolated state silos
- One subscription per table (via store)
- No prop drilling for manager data
- OnboardingHub as thin router (not god component)

## Migration Metrics

### Cumulative Progress (Slices 1-4)

| Slice | Feature | LOC Delta | Tests Added | Tests Passing |
|-------|---------|-----------|-------------|---------------|
| 1 | zustand-store | +450 | +20 | 370 |
| 2 | zustand-steps | +180 | +14 | 384 |
| 3 | zustand-users | +195 | +14 | 398 |
| 4 | zustand-activities | +408 | +14 | 412 |
| **Total** | **Slices 1-4** | **+1233** | **+62** | **412** |

### What's Left

- 6 hooks not yet migrated: `useTemplates`, `useRoles`, `useCreateOnboarding`, `useManagerData`, `useTemplateStats`, `useRoleValidation`
- `OnboardingHub` (343 lines) to be slimmed in slice 5
- Prop drilling still exists for manager data (eliminated in slice 5)

## Notes

- Both slices implemented in single PR due to low complexity (activities read-only, suggestions simpler than UsersSlice)
- Optimistic operations moved to store as pure state mutations (server calls remain in OnboardingHub)
- `enabled` parameter handled in hooks, not store (store has no concept of "enabled")
- Error type is `Error | null` for both slices (matching instances/steps patterns)
- Stale closure improvement: `get().suggestions` at call time vs render-time closure

## Documentation

- Research: `.claude/features/zustand-activities/2026-02-16T00:00_research.md`
- Plan: `.claude/features/zustand-activities/2026-02-16T00:01_plan.md`
- Tasks: `.claude/features/zustand-activities/tasks.md`
- Implementation: `.claude/active-work/zustand-activities/implementation.md` (not committed)
- Test Success: `.claude/active-work/zustand-activities/test-success.md` (not committed)
- Summary: This file

## Commit Details

- **Branch:** main
- **Commit:** (pending)
- **Message:** `feat(store): add activities and suggestions slices, migrate hooks`
- **Co-Authored-By:** Claude Opus 4.6 <noreply@anthropic.com>
