# Tasks: template-steps-ux

## Metadata
- **Feature:** template-steps-ux
- **Created:** 2026-02-16T22:00
- **Status:** implementation-complete
- **Based-on:** 2026-02-16T22:00_plan.md
- **Estimated effort:** ~1 hour

## Execution Rules

- Tasks within a phase are sequential unless marked with **[P]** (parallelizable)
- TDD: Phase 2 writes tests that fail, Phase 3 makes them pass
- Mark completed tasks with `[x]`
- Each task has acceptance criteria that must all pass before moving on

---

## Phase 1: Setup (Sequential)

### Task 1.1: Add ModalWrapper size variants to types
- [x] Open `src/types/index.ts`
- [x] Change `size?: 'sm' | 'md' | 'lg'` to `size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'` on line 347

**Files:** `src/types/index.ts`

**Acceptance Criteria:**
- [x] TypeScript compiles without errors (`npx tsc -b`)
- [x] Existing modal size values still valid

### Task 1.2: Add ModalWrapper sizeMap entries
- [x] Open `src/components/ui/ModalWrapper.tsx`
- [x] Add `xl: 'max-w-xl'` and `'2xl': 'max-w-2xl'` to the `sizeMap` object (lines 10-14)

**Files:** `src/components/ui/ModalWrapper.tsx`

**Acceptance Criteria:**
- [x] TypeScript compiles without errors
- [x] Existing modals (sm, md, lg) still work (no behavioral change)

---

## Phase 2: Tests First (TDD)

### Task 2.1: Write reorder unit tests
- [x] Open `src/components/templates/TemplateModal.test.tsx`
- [x] Add a `mockTemplateWithMultipleSteps` fixture with 3 steps (titled "Step A", "Step B", "Step C")
- [x] Add new `describe('TemplateModal - step reorder')` block with the following tests:

**Test: should move step down when clicking move-down button**
- Render edit modal with 3-step template
- Find and click the "Move step 1 down" button
- Verify "Step A" content moved to position 2, "Step B" to position 1

**Test: should move step up when clicking move-up button**
- Render edit modal with 3-step template
- Find and click the "Move step 2 up" button
- Verify "Step B" content moved to position 1, "Step A" to position 2

**Test: should disable move-up button for first step**
- Render edit modal with 3-step template
- Find the "Move step 1 up" button
- Verify it has `disabled` attribute

**Test: should disable move-down button for last step**
- Render edit modal with 3-step template
- Find the "Move step 3 down" button
- Verify it has `disabled` attribute

**Test: should preserve step data after reorder**
- Render edit modal with 3-step template (with owner/expert values)
- Click "Move step 1 down"
- Verify owner and expert values moved with the step

**Test: should update step numbers after reorder**
- Render edit modal with 3-step template
- Click "Move step 1 down"
- Verify "Step 1 of 3" is now associated with "Step B" content

**Files:** `src/components/templates/TemplateModal.test.tsx`

**Acceptance Criteria:**
- [x] All 6 new tests compile
- [x] All 6 new tests FAIL (implementation not yet done)
- [x] Existing 12 tests still pass

### Task 2.2: Write step count indicator tests
- [x] Add new `describe('TemplateModal - step count')` block:

**Test: should display step count in section label**
- Render create modal
- Verify text "Onboarding Steps (1)" appears

**Test: should update step count when adding steps**
- Render create modal
- Click "Add Step"
- Verify text "Onboarding Steps (2)" appears

**Test: should update step count when removing steps**
- Render edit modal with 3-step template
- Click "Remove step 3"
- Verify text "Onboarding Steps (2)" appears

**Files:** `src/components/templates/TemplateModal.test.tsx`

**Acceptance Criteria:**
- [x] All 3 new tests compile
- [x] All 3 new tests FAIL (implementation not yet done)
- [x] Existing 12 tests still pass

### Task 2.3: Write modal size test [P]
- [x] Add test to verify TemplateModal uses wider size:

**Test: should render modal with 2xl width**
- Render create modal
- Verify the dialog container has `max-w-2xl` class

**Files:** `src/components/templates/TemplateModal.test.tsx`

**Acceptance Criteria:**
- [x] Test compiles
- [x] Test FAILS (size not yet changed)

---

## Phase 3: Core Implementation (Sequential)

### Task 3.1: Add stable UIDs to TemplateStep
- [x] In `TemplateModal.tsx`, add `_uid: string` to the local `TemplateStep` interface (line 26-32)
- [x] Add module-level UID counter above the component
- [x] Update initial `useState` to include `_uid: nextStepUid()` (line 56-58)
- [x] Update `useEffect` pre-fill mapping to include `_uid: nextStepUid()` (lines 69-76)
- [x] Update `resetForm` to include `_uid: nextStepUid()` (line 86-88)
- [x] Update `handleAddStep` to include `_uid: nextStepUid()` (line 141-143)
- [x] Update `handleStepChange` type to exclude `_uid`: `keyof Omit<TemplateStep, 'id' | '_uid'>` (line 149-152)

**Files:** `src/components/templates/TemplateModal.tsx`

**Acceptance Criteria:**
- [x] TypeScript compiles without errors
- [x] Existing 12 tests still pass (UIDs are internal, invisible to tests)

### Task 3.2: Change modal to wider size
- [x] Change `size="lg"` to `size="2xl"` on the ModalWrapper usage (line 291)

**Files:** `src/components/templates/TemplateModal.tsx`

**Acceptance Criteria:**
- [x] Task 2.3 modal size test NOW PASSES

### Task 3.3: Remove inner scroll and add step count
- [x] Remove `max-h-96 overflow-y-auto` from the steps container (line 406): change to just `className="space-y-4"`
- [x] Update the "Onboarding Steps" label to include count: `Onboarding Steps ({steps.length})`

**Files:** `src/components/templates/TemplateModal.tsx`

**Acceptance Criteria:**
- [x] Task 2.2 step count tests NOW PASS
- [x] No double scroll when rendered (verified by test agent - e2e-screenshots/template-modal-fullpage.png)

### Task 3.4: Add reorder handlers
- [x] Add `ChevronUp, ChevronDown` to the lucide-react import (line 8)
- [x] Add `handleMoveStepUp` function after `handleStepChange` (~line 157):
  ```typescript
  const handleMoveStepUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    setSteps(newSteps);
  };
  ```
- [x] Add `handleMoveStepDown` function:
  ```typescript
  const handleMoveStepDown = (index: number) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    setSteps(newSteps);
  };
  ```

**Files:** `src/components/templates/TemplateModal.tsx`

**Acceptance Criteria:**
- [x] TypeScript compiles without errors
- [x] Functions exist (tests still reference missing UI elements, so some Task 2.1 tests may still fail)

### Task 3.5: Restructure step card header with reorder buttons
- [x] Change step card `key={index}` to `key={step._uid}` (line 409)
- [x] Remove `relative` from step card className (line 410)
- [x] Delete the absolute-positioned step badge div (lines 412-415)
- [x] Delete the absolute-positioned trash button (lines 500-508)
- [x] Add new flex header row at the top of each step card (before the Title input):
  ```tsx
  <div className="flex items-center justify-between mb-2">
    <span className="text-xs font-medium text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded">
      Step {index + 1} of {steps.length}
    </span>
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => handleMoveStepUp(index)}
        disabled={index === 0}
        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label={`Move step ${index + 1} up`}
      >
        <ChevronUp size={16} />
      </button>
      <button
        type="button"
        onClick={() => handleMoveStepDown(index)}
        disabled={index === steps.length - 1}
        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label={`Move step ${index + 1} down`}
      >
        <ChevronDown size={16} />
      </button>
      {steps.length > 1 && (
        <button
          type="button"
          onClick={() => handleRemoveStep(index)}
          className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          aria-label={`Remove step ${index + 1}`}
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  </div>
  ```

**Files:** `src/components/templates/TemplateModal.tsx`

**Acceptance Criteria:**
- [x] ALL Task 2.1 reorder tests NOW PASS
- [x] ALL Task 2.2 step count tests STILL PASS
- [x] ALL existing 12 tests STILL PASS
- [x] TypeScript compiles without errors

---

## Phase 4: Integration (Sequential)

### Task 4.1: Run full test suite
- [x] Run `npx vitest run` -- all tests must pass (474 passed)
- [x] Run `npx tsc -b` -- no type errors
- [x] Run `npx eslint .` -- no new lint errors (only pre-existing no-useless-escape on line 12)

**Acceptance Criteria:**
- [x] All 474 tests pass (464 existing + 10 new)
- [x] Zero TypeScript errors
- [x] Zero new ESLint errors

---

## Phase 5: Polish [P]

### Task 5.1: Verify dark mode support
- [x] Confirm all new buttons have `dark:` variants in their classNames
- [x] Confirm step badge has `dark:bg-slate-600 dark:text-slate-300`
- [x] Confirm reorder buttons have `dark:hover:text-slate-200`

**Files:** `src/components/templates/TemplateModal.tsx`

**Acceptance Criteria:**
- [x] All new elements have appropriate dark mode classes

### Task 5.2: Verify accessibility
- [x] Confirm all reorder buttons have descriptive `aria-label` props
- [x] Confirm disabled buttons have `disabled` attribute (not just visual styling)
- [x] Confirm step count is exposed in the label text (screen reader accessible)

**Files:** `src/components/templates/TemplateModal.tsx`

**Acceptance Criteria:**
- [x] All interactive elements have aria-labels
- [x] Disabled state communicated to assistive technology

---

## Phase 6: Ready for Test Agent

### Handoff Checklist
- [x] All unit tests pass (`npx vitest run`) -- 474 passed
- [x] TypeScript compiles (`npx tsc -b`) -- zero errors
- [x] No new lint errors (`npx eslint .`) -- only pre-existing error
- [x] Implementation matches plan architecture
- [x] Files modified match plan (only 4 files)
- [x] No new dependencies added
- [x] Existing modal behavior unaffected (ModalWrapper backward compatible)

### What the Test Agent Should Verify
1. **Visual:** Open TemplateModal with 5+ steps -- confirm single scroll, no cramped inner area
2. **Visual:** Confirm modal is wider than before (672px vs 512px)
3. **Functional:** Click up/down arrows to reorder steps -- verify content moves correctly
4. **Functional:** Verify first step's up button and last step's down button are disabled
5. **Functional:** Add steps, remove steps, verify step count updates in label
6. **Functional:** Reorder steps then submit -- verify submission data has correct order
7. **Dark mode:** Toggle dark mode -- verify reorder buttons and badges are properly styled
8. **Regression:** Open other modals (RoleModal, CreateOnboardingModal, UserModal) -- verify unchanged
