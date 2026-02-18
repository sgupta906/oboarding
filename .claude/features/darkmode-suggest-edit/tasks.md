# Tasks: darkmode-suggest-edit

## Metadata
- **Feature:** darkmode-suggest-edit (Bug #21)
- **Created:** 2026-02-16T22:00
- **Status:** implementation-complete
- **Based On:** 2026-02-16T22:00_plan.md
- **Estimated Tests:** +7 (450 total)

## Execution Rules
- Tasks run sequentially unless marked [P]
- TDD: write tests first (Phase 2), then implement (Phase 3)
- Mark tasks complete with [x] as they finish

---

## Phase 1: Setup
*No setup needed. No migrations, no new dependencies.*

---

## Phase 2: Tests (TDD -- Write First, Expect Failures)

### Task 2.1: Create SuggestEditModal Test File
- [x] Create `src/components/modals/SuggestEditModal.test.tsx`
- [x] Add mock data: a minimal `Step` object and standard modal props
- [x] Mock `ModalWrapper` to render children directly (avoid deep DOM issues)

**Files:** `src/components/modals/SuggestEditModal.test.tsx` (new)

### Task 2.2: Write Dark Mode Class Tests
- [x] Test: renders without error with required props
- [x] Test: textarea contains `dark:bg-slate-700` and `dark:text-white` classes
- [x] Test: description paragraph contains `dark:text-slate-400`
- [x] Test: cancel button contains `dark:text-slate-300` and `dark:hover:bg-slate-600`
- [x] Test: validation warning banner contains `dark:bg-amber-900/20` (requires typing < 10 chars and triggering validation)
- [x] Test: success banner contains `dark:bg-emerald-900/20` (requires typing >= 10 chars)
- [x] Test: character count contains `dark:text-slate-400` (requires typing any text)
- [x] Run tests -- all dark mode class tests should FAIL (classes don't exist yet)

**Files:** `src/components/modals/SuggestEditModal.test.tsx`

**Acceptance Criteria:**
- [x] 8 tests written (7 dark mode + 1 regression)
- [x] Tests correctly assert dark: class presence
- [x] Tests FAIL at this point (expected -- TDD red phase)

---

## Phase 3: Core Implementation

### Task 3.1: Add Dark Mode Classes to Footer Section
- [x] Line 66: Add `dark:text-slate-400` to character count div
- [x] Line 71: Add `dark:text-amber-400` to minimum chars warning span
- [x] Line 82: Add `dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-600` to Cancel button

**Files:** `src/components/modals/SuggestEditModal.tsx` (lines 64-112)

### Task 3.2: Add Dark Mode Classes to Body Section
- [x] Line 121: Add `dark:text-slate-400` to description paragraph
- [x] Line 130 (textarea branch 1 -- amber warning): Add `dark:border-amber-500 dark:bg-amber-900/20`
- [x] Line 132 (textarea branch 2 -- valid/empty): Add `dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400`
- [x] Line 133 (textarea branch 3 -- default): Add `dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400`

**Files:** `src/components/modals/SuggestEditModal.tsx` (lines 114-134)

### Task 3.3: Add Dark Mode Classes to Banners
- [x] Line 155 (amber warning container): Add `dark:bg-amber-900/20 dark:border-amber-700`
- [x] Line 156 (AlertCircle icon): Add `dark:text-amber-400`
- [x] Line 157 (warning text): Add `dark:text-amber-300`
- [x] Line 166 (emerald success container): Add `dark:bg-emerald-900/20 dark:border-emerald-700`
- [x] Line 167 (CheckCircle icon): Add `dark:text-emerald-400`
- [x] Line 168 (success text): Add `dark:text-emerald-300`

**Files:** `src/components/modals/SuggestEditModal.tsx` (lines 153-172)

### Task 3.4: Run Tests -- Verify All Pass
- [x] Run `npx vitest run src/components/modals/SuggestEditModal.test.tsx`
- [x] All 8 tests pass (TDD green phase)
- [x] Run `npx vitest run` -- full suite passes (no regressions; 10 pre-existing TemplateModal failures unrelated)

**Acceptance Criteria:**
- [x] All 8 new tests pass
- [x] Full test suite passes (464 passing; 10 pre-existing TemplateModal failures)
- [x] Zero changes to component logic

---

## Phase 4: Integration
*No integration needed. Changes are purely cosmetic within one component.*

---

## Phase 5: Polish [P]

### Task 5.1: [P] Type Check
- [x] Run `npx tsc -b` -- no type errors in our files (4 pre-existing errors in TemplateModal.tsx from other branch work)

### Task 5.2: [P] Lint Check
- [x] Run `npx eslint src/components/modals/SuggestEditModal.tsx` -- no lint errors
- [x] Run `npx eslint src/components/modals/SuggestEditModal.test.tsx` -- no lint errors

**Acceptance Criteria:**
- [x] Type check passes for our files
- [x] Lint passes

---

## Phase 6: Ready for Test Agent

### Handoff Checklist
- [x] All 8 new unit tests pass
- [x] Full test suite passes (464 pass; 10 pre-existing TemplateModal failures from other branch work)
- [x] `npx tsc -b` passes for our files (pre-existing TemplateModal.tsx errors from other branch work)
- [x] `npx eslint` passes for both files
- [ ] `npx vite build` succeeds (blocked by pre-existing tsc errors in TemplateModal.tsx)
- [x] SuggestEditModal.tsx has dark: classes on all 12 className locations (13 lines)
- [x] No component logic changed (diff shows only className string additions)
