# Tasks: responsive-ux

## Metadata
- **Feature:** responsive-ux
- **Created:** 2026-02-14T23:00
- **Status:** implementation-complete
- **Based On:** 2026-02-14T23:00_plan.md

## Execution Rules

- **[P]** = Task can run in parallel with other [P] tasks in the same phase
- **TDD** = Write tests BEFORE implementation code
- **Completion** = Mark checkbox when done: `- [x]`
- Tasks within a phase are sequential unless marked [P]
- Phases are sequential (Phase 1 before Phase 2, etc.)

---

## Phase 1: Bug Fix + Setup (Sequential)

### Task 1.1: Fix instance status revert bug (FR7)
- [x] Read `src/services/supabase/instanceService.ts` lines 243-248
- [x] Add `else` branch after `if (progress === 100)` block
- [x] In else branch: set `instanceUpdates.status = 'active'` and `instanceUpdates.completed_at = null`
- [x] Verify TypeScript compiles: `npx tsc -b`

**Files:** `src/services/supabase/instanceService.ts`

**Acceptance Criteria:**
- [x] When progress drops below 100%, instance status is set to 'active'
- [x] When progress drops below 100%, completed_at is set to null
- [x] When progress reaches 100%, existing behavior is preserved
- [x] TypeScript compiles without errors

---

### Task 1.2: Create ToastContext (FR5)
- [x] Create `src/context/ToastContext.tsx` following `DarkModeContext.tsx` pattern
- [x] Define `Toast` interface: `{ id: string; message: string; type: 'success' | 'error' | 'info' }`
- [x] Define `ToastContextType`: `{ showToast: (message: string, type?: Toast['type']) => void }`
- [x] Implement `ToastProvider`:
  - [x] `useState<Toast[]>` for toast queue
  - [x] `showToast` adds toast with `crypto.randomUUID()` id
  - [x] `useEffect` auto-dismiss timer (4 seconds per toast)
  - [x] `dismissToast(id)` removes specific toast
  - [x] Render fixed-position container: `fixed bottom-4 right-4 z-[60] space-y-2`
  - [x] Toast item: color-coded (emerald/rose/blue), X dismiss button, max-w-sm
- [x] Export `useToast()` hook with guard check (throw if used outside provider)
- [x] Verify TypeScript compiles: `npx tsc -b`

**Files:** `src/context/ToastContext.tsx` (NEW)

**Acceptance Criteria:**
- [x] `ToastProvider` renders children and a toast container
- [x] `showToast('message', 'error')` adds a red toast
- [x] `showToast('message', 'success')` adds a green toast
- [x] `showToast('message')` defaults to 'info' (blue)
- [x] Toasts auto-dismiss after 4 seconds
- [x] X button dismisses toast immediately
- [x] `useToast()` throws if used outside `ToastProvider`
- [x] Toast container is `z-[60]` (above modal z-50)

---

### Task 1.3: Wire ToastProvider into App.tsx
- [x] Import `ToastProvider` from `../context/ToastContext`
- [x] Wrap `AppContent` with `<ToastProvider>` inside `DarkModeProvider`
- [x] Verify app builds: `npx vite build`

**Files:** `src/App.tsx`

**Acceptance Criteria:**
- [x] `ToastProvider` wraps `AppContent`
- [x] Build succeeds without errors
- [x] Existing tests still pass

---

## Phase 2: Type Updates (Sequential)

### Task 2.1: Add isLoading to component prop types
- [x] Add `isLoading?: boolean` to `ActionBarProps` in `src/types/index.ts`
- [x] Add `isLoading?: boolean` to `StepCardProps` in `src/types/index.ts`
- [x] Add `isLoading?: boolean` to `SuggestionCardProps` in `src/types/index.ts`
- [x] Verify TypeScript compiles: `npx tsc -b`

**Files:** `src/types/index.ts`

**Acceptance Criteria:**
- [x] `ActionBarProps.isLoading` is optional boolean
- [x] `StepCardProps.isLoading` is optional boolean
- [x] `SuggestionCardProps.isLoading` is optional boolean
- [x] All existing code still compiles (optional props, so no breaking changes)

---

## Phase 3: Tests First (TDD)

### Task 3.1: [P] Write ToastContext tests
- [x] Create `src/context/ToastContext.test.tsx`
- [x] Test: ToastProvider renders children
- [x] Test: showToast adds visible toast with correct message
- [x] Test: toast auto-dismisses after 4 seconds (vi.useFakeTimers)
- [x] Test: dismiss button removes toast immediately
- [x] Test: error type renders with error styling (rose color classes)
- [x] Test: useToast throws when used outside ToastProvider

**Files:** `src/context/ToastContext.test.tsx` (NEW)

**Acceptance Criteria:**
- [x] 6 test cases defined
- [x] Tests use React Testing Library patterns consistent with project
- [x] All tests pass

---

### Task 3.2: [P] Write instanceService bug fix test
- [x] Created `src/services/supabase/instanceService.test.ts`
- [x] Test: when progress reaches 100%, verify `status: 'completed'` and `completed_at` is set
- [x] Test: when progress drops below 100%, verify `status: 'active'` and `completed_at: null`
- [x] Test: progress 0% edge case

**Files:** `src/services/supabase/instanceService.test.ts` (NEW)

**Acceptance Criteria:**
- [x] 3 test cases cover the status revert logic
- [x] Tests verify Supabase `.update()` is called with correct parameters

---

### Task 3.3: [P] Write useSteps.updateStatus tests
- [x] Test: updateStatus applies optimistic change to data immediately
- [x] Test: updateStatus rolls back on server error
- [x] Test: updateStatus still returns original hook properties (data, isLoading, error)

**Files:** `src/hooks/useSteps.test.ts` (NEW)

**Acceptance Criteria:**
- [x] Tests mock `subscribeToSteps` and `updateStepStatus`
- [x] Optimistic behavior verified (state changes before await resolves)
- [x] Rollback behavior verified (state reverts on rejection)

---

### Task 3.4: [P] Write useSuggestions optimistic tests
- [x] Test: optimisticUpdateStatus changes suggestion status in data
- [x] Test: optimisticRemove removes suggestion from data
- [x] Test: rollback restores original data on error

**Files:** `src/hooks/useSuggestions.test.ts` (NEW)

**Acceptance Criteria:**
- [x] Tests mock `subscribeToSuggestions`
- [x] Optimistic and rollback behavior verified

---

### Task 3.5: [P] Write useUsers.editUser optimistic test
- [x] Test: editUser applies optimistic patch to matching user in list
- [x] Test: editUser rolls back on error
- [x] Test: non-matching users are not affected

**Files:** `src/hooks/useUsers.test.ts` (extended existing)

**Acceptance Criteria:**
- [x] Optimistic update applies `{ ...user, ...data }` for matching user ID
- [x] Rollback restores original user list on error

---

### Task 3.6: [P] Write ActionBar loading state tests
- [x] Test: buttons are disabled when `isLoading={true}`
- [x] Test: loading indicator is visible when `isLoading={true}`
- [x] Test: click handlers are not called when `isLoading={true}`

**Files:** `src/components/onboarding/ActionBar.test.tsx` (NEW)

**Acceptance Criteria:**
- [x] Buttons have `disabled` attribute when loading
- [x] Click events do not fire through to handlers

---

## Phase 4: Core Implementation (Sequential)

### Task 4.1: Add updateStatus to useSteps hook
- [x] Import `updateStepStatus` from services
- [x] Import `useCallback` from react
- [x] Add `updateStatus` function using `useCallback`
- [x] Expand `UseStepsReturn` interface to include `updateStatus`
- [x] Return `updateStatus` from hook

**Files:** `src/hooks/useSteps.ts`

**Acceptance Criteria:**
- [x] `updateStatus` optimistically updates the step in `data`
- [x] On server error, `data` reverts to snapshot
- [x] Hook return type includes `updateStatus`
- [x] Existing subscription behavior is unchanged

---

### Task 4.2: Add optimistic methods to useSuggestions hook
- [x] Import `useCallback` from react
- [x] Add `optimisticUpdateStatus(id, status)` returning snapshot
- [x] Add `optimisticRemove(id)` returning snapshot
- [x] Add `rollback(snapshot)` to restore state
- [x] Expand `UseSuggestionsReturn` interface
- [x] Return new methods from hook

**Files:** `src/hooks/useSuggestions.ts`

**Acceptance Criteria:**
- [x] `optimisticUpdateStatus` changes suggestion status in local state immediately
- [x] `optimisticRemove` removes suggestion from local state immediately
- [x] `rollback` restores previous state
- [x] Existing subscription behavior unchanged

---

### Task 4.3: Add optimistic update to useUsers.editUser
- [x] Before `await updateUser(userId, data)`, add optimistic update
- [x] In catch block, add rollback: `setUsers(snapshot)`

**Files:** `src/hooks/useUsers.ts`

**Acceptance Criteria:**
- [x] `editUser` updates matching user in local state before server call
- [x] On error, local state reverts to snapshot
- [x] Non-matching users are not affected

---

### Task 4.4: Update ActionBar for loading state
- [x] Destructure `isLoading` from props (default to `false`)
- [x] Primary button: add `disabled` attribute, show spinner when loading
- [x] Mark as Incomplete button: add `disabled` attribute
- [x] Resume Work button: add `disabled` attribute
- [x] I'm Stuck button: add `disabled` attribute
- [x] Suggest Edit button: add `disabled` attribute
- [x] All onClick handlers: guard with `if (isLoading) return;`

**Files:** `src/components/onboarding/ActionBar.tsx`

**Acceptance Criteria:**
- [x] All action buttons disabled when `isLoading={true}`
- [x] Visual loading indicator on primary button
- [x] Clicks do not fire handlers when loading
- [x] No visual change when `isLoading={false}` (backward compatible)

---

### Task 4.5: Update SuggestionCard for loading state
- [x] Destructure `isLoading` from props (default to `false`)
- [x] Approve and Reject buttons: add `disabled` attribute when loading
- [x] Guard onClick handlers: `if (isLoading) return;`

**Files:** `src/components/manager/SuggestionCard.tsx`

**Acceptance Criteria:**
- [x] Both buttons disabled when `isLoading={true}`
- [x] Visual disabled state (opacity)
- [x] Clicks do not fire handlers when loading
- [x] No visual change when `isLoading={false}`

---

## Phase 5: Integration (Sequential)

### Task 5.1: Thread isLoading through StepCard and StepTimeline
- [x] `StepTimeline`: Add `loadingStepIds?: Set<number>` prop to interface
- [x] `StepTimeline`: Pass `isLoading={loadingStepIds?.has(step.id)}` to each `StepCard`
- [x] `StepCard`: Destructure `isLoading` from props
- [x] `StepCard`: Pass `isLoading={isLoading}` to `ActionBar`

**Files:** `src/components/onboarding/StepTimeline.tsx`, `src/components/onboarding/StepCard.tsx`

**Acceptance Criteria:**
- [x] `loadingStepIds` prop flows from StepTimeline to StepCard to ActionBar
- [x] When a step ID is in the set, its ActionBar shows loading state
- [x] When prop is undefined, no loading state (backward compatible)

---

### Task 5.2: Thread loadingStepIds through EmployeeView
- [x] Add `loadingStepIds?: Set<number>` to `EmployeeViewProps`
- [x] Pass `loadingStepIds` to `StepTimeline`

**Files:** `src/views/EmployeeView.tsx`

**Acceptance Criteria:**
- [x] Props flow through to StepTimeline
- [x] Existing behavior unchanged when prop is not provided

---

### Task 5.3: Thread loadingSuggestionIds through ManagerView and SuggestionsSection
- [x] Add `loadingSuggestionIds?: Set<number|string>` to `ManagerViewProps`
- [x] Pass to `SuggestionsSection`
- [x] In `SuggestionsSection`: accept `loadingSuggestionIds` prop
- [x] In `SuggestionsSection`: pass `isLoading={loadingSuggestionIds?.has(sugg.id)}` to each `SuggestionCard`
- [x] Add `loadingSuggestionIds` to `SuggestionsSectionProps` type

**Files:** `src/views/ManagerView.tsx`, `src/components/manager/SuggestionsSection.tsx`, `src/types/index.ts`

**Acceptance Criteria:**
- [x] Props flow through to each SuggestionCard
- [x] Existing behavior unchanged when prop is not provided

---

### Task 5.4: Rewire OnboardingHub handlers
- [x] Import `useToast` from `../context/ToastContext`
- [x] Add `const { showToast } = useToast()`
- [x] Add `const [loadingStepIds, setLoadingStepIds] = useState<Set<number>>(new Set())`
- [x] Add `const [loadingSuggestionIds, setLoadingSuggestionIds] = useState<Set<number|string>>(new Set())`
- [x] Get `updateStatus` from `useSteps` destructuring
- [x] Extend `useManagerData` to return `suggestionsOptimistic` methods
- [x] Rewrite `handleStatusChange` with optimistic update + fire-and-forget logActivity + toast errors
- [x] Rewrite `handleSuggestEdit` with fire-and-forget logActivity + toast errors
- [x] Rewrite `handleReportStuck` with fire-and-forget logActivity + toast errors
- [x] Rewrite `handleApproveSuggestion` with optimistic update + fire-and-forget logActivity + toast errors
- [x] Rewrite `handleRejectSuggestion` with optimistic remove + fire-and-forget logActivity + toast errors
- [x] Pass `loadingStepIds` to `MemoizedEmployeeView`
- [x] Pass `loadingSuggestionIds` to `MemoizedManagerView`

**Files:** `src/components/OnboardingHub.tsx`, `src/hooks/useManagerData.ts`

**Acceptance Criteria:**
- [x] Step status changes are optimistic (instant UI update)
- [x] Suggestion approve/reject is optimistic
- [x] All logActivity calls are fire-and-forget (no `await`)
- [x] Errors show toast notifications instead of only console.error
- [x] Loading states track per-step and per-suggestion IDs
- [x] Loading states passed to child views
- [x] Rollback on server error restores previous state

---

## Phase 6: Polish (Parallel OK)

### Task 6.1: [P] Verify all existing tests pass
- [x] Run `npx vitest run` -- 320 tests pass (297 original + 23 new)
- [x] No regressions

**Acceptance Criteria:**
- [x] All pre-existing tests pass
- [x] No test regressions

---

### Task 6.2: [P] Type check and lint
- [x] Run `npx tsc -b` -- zero errors
- [x] Run `npx eslint .` -- zero errors in modified files (pre-existing errors unchanged)

**Acceptance Criteria:**
- [x] Zero TypeScript errors
- [x] Zero ESLint errors in new/modified files

---

### Task 6.3: [P] Verify production build
- [x] Run `npx vite build` -- succeeds
- [x] Build output: 479KB JS, 49KB CSS

**Acceptance Criteria:**
- [x] Production build succeeds
- [x] No build warnings related to new code

---

## Phase 7: Ready for Test Agent

### Handoff Checklist
- [x] All tasks in Phases 1-6 complete
- [x] All new tests pass (23 new tests)
- [x] All existing tests pass (297 original, 320 total)
- [x] TypeScript compiles: `npx tsc -b`
- [x] Production build succeeds: `npx vite build`
- [x] ESLint clean on modified files
- [x] FR1: Step status changes are optimistic with rollback
- [x] FR2: useUsers.editUser has optimistic update with rollback
- [x] FR3: All logActivity calls are fire-and-forget
- [x] FR4: Action buttons show loading/disabled state
- [x] FR5: Error notifications visible via toast system
- [x] FR6: Suggestion approve/reject is optimistic with rollback
- [x] FR7: Instance status reverts to active when progress < 100%

### Files Changed Summary
| File | Status |
|------|--------|
| `src/context/ToastContext.tsx` | NEW |
| `src/context/ToastContext.test.tsx` | NEW |
| `src/services/supabase/instanceService.ts` | MODIFIED |
| `src/services/supabase/instanceService.test.ts` | NEW |
| `src/hooks/useSteps.ts` | MODIFIED |
| `src/hooks/useSteps.test.ts` | NEW |
| `src/hooks/useSuggestions.ts` | MODIFIED |
| `src/hooks/useSuggestions.test.ts` | NEW |
| `src/hooks/useUsers.ts` | MODIFIED |
| `src/hooks/useManagerData.ts` | MODIFIED |
| `src/components/OnboardingHub.tsx` | MODIFIED |
| `src/components/onboarding/ActionBar.tsx` | MODIFIED |
| `src/components/onboarding/ActionBar.test.tsx` | NEW |
| `src/components/onboarding/StepCard.tsx` | MODIFIED |
| `src/components/onboarding/StepTimeline.tsx` | MODIFIED |
| `src/components/manager/SuggestionCard.tsx` | MODIFIED |
| `src/components/manager/SuggestionsSection.tsx` | MODIFIED |
| `src/views/EmployeeView.tsx` | MODIFIED |
| `src/views/ManagerView.tsx` | MODIFIED |
| `src/types/index.ts` | MODIFIED |
| `src/App.tsx` | MODIFIED |
