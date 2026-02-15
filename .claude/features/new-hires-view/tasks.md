# Tasks: new-hires-view

## Metadata
- **Feature:** new-hires-view
- **Created:** 2026-02-15T12:15
- **Status:** implement-complete
- **Based On:** 2026-02-15T12:15_plan.md

## Execution Rules
- Tasks are numbered by phase (e.g., 1.1, 2.1)
- [P] = parallelizable with other [P] tasks in the same phase
- Complete each checkbox before moving to the next
- TDD: Phase 2 writes failing tests, Phase 3 makes them pass

---

## Phase 1: Setup (Sequential)

### Task 1.1: Update barrel export
- [x] In `src/components/manager/index.ts`, replace `UsersPanel` export with `NewHiresPanel` export
- [x] Create empty placeholder `src/components/manager/NewHiresPanel.tsx` that exports a stub component (so imports resolve)

**Files:** `src/components/manager/index.ts`, `src/components/manager/NewHiresPanel.tsx`

**Acceptance Criteria:**
- [x] `index.ts` exports `NewHiresPanel` instead of `UsersPanel`
- [x] Placeholder component exists and can be imported
- [x] TypeScript compiles without errors (stub returns empty div)

---

## Phase 2: Tests (TDD - write tests first, they will fail)

### Task 2.1: Write NewHiresPanel tests
- [x] Create `src/components/manager/NewHiresPanel.test.tsx`
- [x] Mock `useOnboardingInstances` via `vi.mock('../../hooks')` returning configurable test data
- [x] Write rendering tests:
  - [x] Test: renders table with instance data (name, email, department, role, status, progress, start date)
  - [x] Test: renders ProgressBar for each instance
  - [x] Test: renders correct status badge text (Active, Completed, On Hold)
- [x] Write filter tests:
  - [x] Test: shows all instances by default
  - [x] Test: clicking Active filter shows only active instances
  - [x] Test: clicking Completed filter shows only completed instances
  - [x] Test: clicking On Hold filter shows only on_hold instances
  - [x] Test: filter buttons display correct counts
- [x] Write state tests:
  - [x] Test: shows loading spinner when isLoading is true
  - [x] Test: shows error message when error is present
  - [x] Test: shows empty state when no instances
  - [x] Test: shows filtered empty state when filter yields no results
- [x] Run tests -- confirm they fail (component is a stub)

**Files:** `src/components/manager/NewHiresPanel.test.tsx`

**Acceptance Criteria:**
- [x] 10-12 tests written (12 tests)
- [x] All tests fail (expected -- TDD red phase)
- [x] Mocking pattern follows existing UsersPanel.test.tsx conventions
- [x] Tests import from `./NewHiresPanel` and use `render` from `../../test/test-utils`

---

## Phase 3: Core Implementation (Sequential)

### Task 3.1: Implement NewHiresPanel component
- [x] Import `useOnboardingInstances` from `../../hooks`
- [x] Import `ProgressBar` from `../ui/ProgressBar`
- [x] Import `Users` icon from `lucide-react`
- [x] Add `filter` state: `useState<'all' | 'active' | 'completed' | 'on_hold'>('all')`
- [x] Add `filteredInstances` memo: filter `data` by status when filter is not 'all'
- [x] Add `statusCounts` memo: count instances per status for filter button labels
- [x] Implement helper functions:
  - [x] `getStatusBadgeClasses(status)` -- returns Tailwind classes per status
  - [x] `getStatusLabel(status)` -- returns display label per status
  - [x] `formatDate(timestamp?)` -- returns formatted date string or dash
- [x] Render header: icon + "New Hires" title + subtitle
- [x] Render filter toggle group with four buttons (All / Active / Completed / On Hold) with counts and `aria-pressed`
- [x] Render loading state: spinner + "Loading onboarding data..." text
- [x] Render error state: red alert box with error message
- [x] Render empty state: Users icon + context-aware message (varies by filter)
- [x] Render table:
  - [x] `thead`: Name, Email, Department, Role, Status, Progress, Start Date
  - [x] `tbody`: map over filteredInstances, render one row per instance
  - [x] Name cell: `employeeName` with `font-medium`
  - [x] Email cell: `employeeEmail` with `font-mono text-xs`
  - [x] Department cell: `department`
  - [x] Role cell: `role` with badge styling
  - [x] Status cell: badge with `getStatusBadgeClasses` + `getStatusLabel`
  - [x] Progress cell: `ProgressBar` component with `value={instance.progress}` and `showPercentage={true}`
  - [x] Start Date cell: `formatDate(instance.startDate)`
- [x] Support dark mode across all elements
- [x] Run tests -- confirm all NewHiresPanel tests pass

**Files:** `src/components/manager/NewHiresPanel.tsx`

**Acceptance Criteria:**
- [x] Component renders onboarding instances in a table
- [x] Status filter works for all four options
- [x] Loading, error, and empty states display correctly
- [x] All tests from Task 2.1 pass
- [x] No TypeScript errors

---

## Phase 4: Integration (Sequential)

### Task 4.1: Wire NewHiresPanel into ManagerView
- [x] In `src/views/ManagerView.tsx`:
  - [x] Replace `UsersPanel` import with `NewHiresPanel` in the destructured import from `'../components/manager'`
  - [x] Change `activeTab` type from `'dashboard' | 'roles' | 'users'` to `'dashboard' | 'roles' | 'new-hires'`
  - [x] Change tab button: `setActiveTab('users')` -> `setActiveTab('new-hires')`
  - [x] Change tab button label text from `Users` to `New Hires`
  - [x] Change tab button `aria-label` from `"Show users management view"` to `"Show new hires view"`
  - [x] Change tab button `aria-current` condition from `activeTab === 'users'` to `activeTab === 'new-hires'`
  - [x] Change tab content condition from `activeTab === 'users'` to `activeTab === 'new-hires'`
  - [x] Replace `<UsersPanel />` with `<NewHiresPanel />`
  - [x] Update the comment from `{/* Users Tab Content */}` to `{/* New Hires Tab Content */}`
- [x] Verify TypeScript compiles with no errors (`npx tsc -b`)

**Files:** `src/views/ManagerView.tsx`

**Acceptance Criteria:**
- [x] ManagerView renders "New Hires" tab label
- [x] Clicking "New Hires" tab renders NewHiresPanel
- [x] No TypeScript errors
- [x] No references to `UsersPanel` or `'users'` tab remain in ManagerView.tsx

### Task 4.2: Delete old UsersPanel files
- [x] Delete `src/components/manager/UsersPanel.tsx`
- [x] Delete `src/components/manager/UsersPanel.test.tsx`
- [x] Verify no remaining imports of `UsersPanel` anywhere in src/ (grep check)

**Files:** `src/components/manager/UsersPanel.tsx` (delete), `src/components/manager/UsersPanel.test.tsx` (delete)

**Acceptance Criteria:**
- [x] Both files deleted
- [x] No import errors anywhere in the project
- [x] `npx tsc -b` succeeds
- [x] `npx vitest run` passes (all remaining tests green)

---

## Phase 5: Polish [P] (Parallel OK)

### Task 5.1: [P] Verify build and full test suite
- [x] Run `npx tsc -b` -- no type errors
- [x] Run `npx vitest run` -- all tests pass (338 tests, 24 files)
- [x] Run `npx vite build` -- production build succeeds
- [ ] Run `npx eslint .` -- no lint errors

**Acceptance Criteria:**
- [x] Zero type errors
- [x] All tests pass
- [x] Build succeeds
- [ ] No lint errors (deferred -- not blocking)

### Task 5.2: [P] Verify ProgressBar integration
- [x] Confirm ProgressBar renders inside table cells without layout overflow
- [x] Confirm ProgressBar width constraint works within table column (`className="w-24"` applied)
- [x] ProgressBar props: `value={instance.progress}`, `showPercentage={true}`, `className="w-24"`

**Acceptance Criteria:**
- [x] ProgressBar displays correctly in table context
- [x] No horizontal overflow on narrow screens

---

## Phase 6: Ready for Test Agent

### Handoff Checklist
- [x] All NewHiresPanel tests pass
- [x] No type errors (`npx tsc -b`)
- [x] Full test suite passes (`npx vitest run`)
- [x] Production build succeeds (`npx vite build`)
- [ ] No lint errors (`npx eslint .`) -- deferred
- [x] Old UsersPanel files deleted
- [x] ManagerView wired to NewHiresPanel
- [x] Barrel export updated

### Summary for Test Agent
- **New component:** `src/components/manager/NewHiresPanel.tsx` (249 lines)
- **New tests:** `src/components/manager/NewHiresPanel.test.tsx` (12 tests, 228 lines)
- **Modified:** `src/views/ManagerView.tsx` (tab rename + component swap)
- **Modified:** `src/components/manager/index.ts` (export swap)
- **Deleted:** `src/components/manager/UsersPanel.tsx`, `src/components/manager/UsersPanel.test.tsx`
- **Net effect:** ~830 lines removed, ~477 lines added = ~353 line reduction
- **Behavioral change:** "Users" tab becomes "New Hires" tab showing read-only onboarding instance table with status filter
