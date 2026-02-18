# Tasks: template-step-insert

## Metadata
- **Feature:** template-step-insert
- **Created:** 2026-02-17T21:00
- **Status:** implementation-complete
- **Based on:** 2026-02-17T21:00_plan.md
- **Estimated test delta:** +7 tests (from 633 to ~640)

## Execution Rules
- Tasks are ordered by dependency -- complete sequentially unless marked [P]
- [P] = parallelizable with other [P] tasks in the same phase
- TDD: Phase 2 writes failing tests, Phase 3 makes them pass
- Mark each subtask checkbox when complete
- Do NOT modify any files outside the listed files

## Phase 1: Setup

No setup needed. No database migrations, no new dependencies, no configuration changes.

---

## Phase 2: Tests (TDD -- write tests first, they will fail)

### Task 2.1: Write unit tests for step insertion

Write a new `describe('TemplateModal - step insertion')` block in the test file with 7 tests. All tests should fail until Phase 3 implementation.

- [x] Add `describe('TemplateModal - step insertion')` block after the existing step count tests
- [x] Test 1: `should show insert-step button on each step card` -- render edit mode with `mockTemplateWithMultipleSteps` (3 steps), assert 3 buttons with `aria-label` matching `/insert new step after step \d+/i`
- [x] Test 2: `should insert a blank step after step 1 when clicking insert` -- render edit mode with 3 steps, click button with `aria-label="Insert new step after step 1"`, assert step count becomes 4 (`Onboarding Steps (4)`), and the new step at position 2 has empty title
- [x] Test 3: `should insert a blank step after the last step` -- render edit mode with 3 steps, click insert on step 3, assert step count becomes 4 and new step 4 has empty title
- [x] Test 4: `should insert step with all fields empty` -- render edit mode, click insert on step 1, verify new step at position 2 has empty title, description, owner, expert
- [x] Test 5: `should update step count label after insertion` -- render create mode (1 step), click insert on step 1, assert `Onboarding Steps (2)` appears
- [x] Test 6: `should show correct step numbers after insertion` -- render edit mode with 3 steps, click insert on step 2, assert labels `Step 1 of 4`, `Step 2 of 4`, `Step 3 of 4`, `Step 4 of 4` all present
- [x] Test 7: `should submit correct 1-based step IDs after insertion` -- render edit mode with 3 steps, insert after step 1, fill new step title, click save, verify submitted steps have IDs [1,2,3,4] and titles match [Step A, (new), Step B, Step C]

**Files:** `src/components/templates/TemplateModal.test.tsx`

**Acceptance Criteria:**
- [x] 7 new tests added in a clearly labeled describe block
- [x] Tests reference the correct aria-labels (`Insert new step after step N`)
- [x] Tests will fail when run (implementation not yet done)

---

## Phase 3: Core Implementation

### Task 3.1: Add `handleInsertStepAfter` function

Add the insertion handler function to TemplateModal, positioned after `handleMoveStepDown` (around line 190).

- [x] Add `handleInsertStepAfter(index: number)` function
- [x] Function creates a blank `TemplateStep` using `nextStepUid()`
- [x] Function uses `Array.splice(index + 1, 0, newStep)` to insert at the correct position
- [x] Function calls `setSteps(newSteps)` with the updated array
- [x] Add `lastInsertedUid` state: `useState<string | null>(null)`
- [x] Set `lastInsertedUid` to the new step's `_uid` in `handleInsertStepAfter`

**Files:** `src/components/templates/TemplateModal.tsx`

**Acceptance Criteria:**
- [x] Function follows existing pattern from `handleAddStep`
- [x] New step has all fields initialized (title, description, owner, expert, link all empty strings)
- [x] TypeScript compiles without errors (`npx tsc -b`)

### Task 3.2: Add insert button to step card header

Add an "Insert step below" button in the step header row's button group, between the ChevronDown button and the Trash2 button.

- [x] Add `<button>` element with `Plus` icon at `size={14}`
- [x] Button `onClick` calls `handleInsertStepAfter(index)`
- [x] Button has `aria-label={`Insert new step after step ${index + 1}`}`
- [x] Button has `title="Insert step below"` for tooltip
- [x] Button uses same styling pattern as ChevronUp/ChevronDown: `p-1 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors`
- [x] Button has `type="button"` to prevent form submission

**Files:** `src/components/templates/TemplateModal.tsx`

**Acceptance Criteria:**
- [x] Button renders on every step card
- [x] Button matches existing button styling (dark mode, transitions)
- [x] Button has accessible aria-label
- [x] All Phase 2 tests pass (tests 1-7 green)

### Task 3.3: Add scroll-into-view for newly inserted steps

When a step is inserted, automatically scroll to bring the new step into view. This also addresses bug #19.

- [x] Add `data-step-uid={step._uid}` attribute to each step card's outer `<div>`
- [x] Add `useEffect` that watches `lastInsertedUid`:
  - If `lastInsertedUid` is non-null, query `document.querySelector('[data-step-uid="..."]')`
  - Call `element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`
  - Reset `lastInsertedUid` to `null`
- [x] Update import line to include `useRef` if needed (or just use `useEffect` with DOM query)
- [x] Also set `lastInsertedUid` in `handleAddStep` (top-level "Add Step" button) to get scroll-into-view for appended steps too (bug #19 fix)

**Files:** `src/components/templates/TemplateModal.tsx`

**Acceptance Criteria:**
- [x] New step scrolls into view after insertion
- [x] New step scrolls into view when appended via "Add Step" button
- [x] No regressions -- all existing tests still pass
- [x] `scrollIntoView` is called with `{ behavior: 'smooth', block: 'nearest' }`

---

## Phase 4: Integration

### Task 4.1: Verify all tests pass and build succeeds

- [x] Run `npx vitest run` -- all tests pass (631 existing + 7 new = 638)
- [x] Run `npx tsc -b` -- no type errors
- [x] Run `npx vite build` -- production build succeeds
- [x] Verify no lint errors on modified files: `npx eslint src/components/templates/TemplateModal.tsx src/components/templates/TemplateModal.test.tsx`

**Files:** (no file changes, verification only)

**Acceptance Criteria:**
- [x] All 638 tests pass
- [x] Zero type errors
- [x] Build succeeds
- [x] No lint errors (1 pre-existing warning on resetForm dependency, not a regression)

---

## Phase 5: Polish [P]

### Task 5.1: [P] Verify dark mode styling

- [x] Confirm insert button has `dark:` hover variant (`dark:hover:text-brand-400`)
- [x] Visual check that button doesn't look out of place in dark mode
- [x] No additional dark mode work expected -- following existing pattern

**Files:** `src/components/templates/TemplateModal.tsx`

**Acceptance Criteria:**
- [x] Insert button has dark mode hover class
- [x] No visual regression in dark mode

### Task 5.2: [P] Verify accessibility

- [x] Insert button has `aria-label` with dynamic step number
- [x] Insert button has `title` attribute for tooltip
- [x] Insert button has `type="button"` to prevent accidental form submission
- [x] Button is keyboard-focusable (default for `<button>` elements)

**Files:** `src/components/templates/TemplateModal.tsx`

**Acceptance Criteria:**
- [x] All accessibility requirements met
- [x] Screen reader can identify the button purpose

---

## Phase 6: Handoff Checklist

Before handing off to the Test Agent:

- [x] All 638 unit tests pass (`npx vitest run`)
- [x] TypeScript compiles cleanly (`npx tsc -b`)
- [x] Production build succeeds (`npx vite build`)
- [x] No lint errors on modified files
- [x] Only 2 files modified: `TemplateModal.tsx` and `TemplateModal.test.tsx`
- [x] No service, database, type, or hook changes
- [x] Feature works in both create mode and edit mode
- [x] Scroll-into-view works for both insert and append
