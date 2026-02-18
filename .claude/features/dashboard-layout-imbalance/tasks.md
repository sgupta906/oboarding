# Tasks: dashboard-layout-imbalance

## Metadata
- **Feature:** dashboard-layout-imbalance (Bug #32)
- **Created:** 2026-02-17T00:00
- **Status:** implementation-complete
- **Based On:** 2026-02-17T00:00_plan.md

## Execution Rules
- Tasks marked [P] can be run in parallel
- TDD order: write tests first (Phase 2), then implement (Phase 3)
- Mark completed tasks with [x]
- All phases are sequential unless noted

---

## Phase 1: Setup
_No setup required -- no migrations, no new dependencies, no config changes._

---

## Phase 2: Tests (TDD -- write failing tests first)

### Task 2.1: Create layout class tests for SuggestionsSection and ActivitySection
- [x] Create test file `src/components/manager/DashboardLayout.test.tsx`
- [x] Write test: SuggestionsSection root div has `flex` and `flex-col` classes
- [x] Write test: SuggestionsSection empty-state Card has `flex-1`, `flex-col`, `justify-center` classes
- [x] Write test: SuggestionsSection suggestions list has `flex-1` class (when suggestions exist)
- [x] Write test: ActivitySection root div has `flex` and `flex-col` classes
- [x] Write test: ActivityFeed Card wrapper has `flex-1` class
- [x] Run tests and confirm they FAIL (TDD red phase)

**Files:** `src/components/manager/DashboardLayout.test.tsx` (new)

**Acceptance Criteria:**
- [x] All new tests exist and fail with clear assertion errors
- [x] Tests check for specific Tailwind class presence on rendered elements

---

## Phase 3: Core Implementation

### Task 3.1: Add flex utilities to SuggestionsSection [P]
- [x] Add `flex flex-col` to root div (line 49)
- [x] Add `flex-1 flex flex-col justify-center` to empty-state Card (line 61)
- [x] Add `flex-1` to suggestions list div (line 75)

**Files:** `src/components/manager/SuggestionsSection.tsx`

**Acceptance Criteria:**
- [x] Root div class: `space-y-4 flex flex-col`
- [x] Empty-state Card class includes: `flex-1 flex flex-col justify-center`
- [x] Suggestions list div class: `space-y-3 flex-1`

### Task 3.2: Add flex utilities to ActivitySection [P]
- [x] Add `flex flex-col` to root div (line 20)

**Files:** `src/components/manager/ActivitySection.tsx`

**Acceptance Criteria:**
- [x] Root div class: `space-y-3 flex flex-col`

### Task 3.3: Add flex-1 to ActivityFeed Card [P]
- [x] Add `flex-1` to Card wrapper (line 69)

**Files:** `src/components/manager/ActivityFeed.tsx`

**Acceptance Criteria:**
- [x] Card class: `overflow-hidden flex flex-col flex-1`

---

## Phase 4: Integration

### Task 4.1: Run all tests and verify no regressions
- [x] Run `npx vitest run` -- all tests pass (643 passed)
- [x] Confirm new DashboardLayout tests pass (TDD green phase)
- [x] Confirm no existing ManagerView tests break

**Acceptance Criteria:**
- [x] All ~508+ tests pass (643 passed)
- [x] Zero test regressions

---

## Phase 5: Polish

### Task 5.1: Visual verification with Playwright screenshot [P]
- [ ] Start dev server
- [ ] Navigate to manager dashboard
- [ ] Take screenshot of bottom grid section
- [ ] Verify both columns appear visually balanced
- [ ] Verify empty-state card fills height and content is centered
- [ ] Verify dark mode appearance (if applicable)

**Acceptance Criteria:**
- [ ] Both columns have equal visual height
- [ ] "All caught up!" content is vertically centered
- [ ] Activity feed retains scroll behavior

---

## Phase 6: Ready for Test Agent

### Handoff Checklist
- [x] All unit tests pass (`npx vitest run`)
- [x] Build succeeds (`npx vite build`)
- [x] No lint errors (`npx eslint .`)
- [ ] Visual verification screenshot saved
- [x] 3 files modified, ~5 lines changed (CSS classes only)
- [x] No functional logic changes
