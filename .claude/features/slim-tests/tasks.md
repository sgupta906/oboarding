# Tasks: slim-tests

## Metadata
- **Feature:** slim-tests
- **Created:** 2026-02-14T16:30
- **Status:** plan-complete
- **Based On:** 2026-02-14T16:30_plan.md

## Execution Rules
- Tasks within a phase are sequential unless marked **[P]** (parallelizable)
- Run `npx vitest run` after each task to verify nothing breaks
- Mark each checkbox when complete
- If a test run fails, fix immediately before moving to next task

---

## Phase 1: Remove LOW-Value Test Files (15 files, ~5,436 lines)

Bulk deletion of entire test files. Zero risk of syntax errors. Run tests once after all deletions.

### Task 1.1: Delete CSS Class Assertion Tests (3 files, 1,610 lines)
- [ ] Delete `src/components/manager/KPISection.test.tsx` (958 lines)
- [ ] Delete `src/components/manager/KPICard.test.tsx` (305 lines)
- [ ] Delete `src/components/templates/ModalScrolling.test.tsx` (347 lines)

**Files:** 3 deletions
**Acceptance Criteria:**
- [ ] Files no longer exist on disk
- [ ] `npx vitest run` passes

### Task 1.2: Delete Integration Test Files (3 files, 1,205 lines)
- [ ] Delete `src/views/NavigationFlow.integration.test.tsx` (356 lines)
- [ ] Delete `src/views/AuthFlow.integration.test.tsx` (595 lines)
- [ ] Delete `src/views/SignInView.integration.test.tsx` (254 lines)

**Files:** 3 deletions
**Acceptance Criteria:**
- [ ] Files no longer exist on disk
- [ ] `npx vitest run` passes

### Task 1.3: Delete View Test Files (2 files, 745 lines)
- [ ] Delete `src/views/ManagerView.test.tsx` (431 lines)
- [ ] Delete `src/views/TemplatesView.test.tsx` (314 lines)

**Files:** 2 deletions
**Acceptance Criteria:**
- [ ] Files no longer exist on disk
- [ ] `npx vitest run` passes

### Task 1.4: Delete Component Test Files (1 file, 296 lines)
- [ ] Delete `src/components/manager/UsersPanel.test.tsx` (296 lines)

**Files:** 1 deletion
**Acceptance Criteria:**
- [ ] File no longer exists on disk
- [ ] `npx vitest run` passes

### Task 1.5: Delete Cookie-Cutter Hook Tests (4 files, 711 lines)
- [ ] Delete `src/hooks/useActivities.test.ts` (180 lines)
- [ ] Delete `src/hooks/useSteps.test.ts` (169 lines)
- [ ] Delete `src/hooks/useSuggestions.test.ts` (168 lines)
- [ ] Delete `src/hooks/useTemplates.test.ts` (194 lines)

**Files:** 4 deletions
**Acceptance Criteria:**
- [ ] Files no longer exist on disk
- [ ] `npx vitest run` passes

### Task 1.6: Delete Miscellaneous Low-Value Tests (2 files, 869 lines)
- [ ] Delete `src/config/supabase.test.ts` (80 lines)
- [ ] Delete `src/services/roleOperations.test.ts` (789 lines)

**Files:** 2 deletions
**Acceptance Criteria:**
- [ ] Files no longer exist on disk
- [ ] `npx vitest run` passes

### Task 1.7: Verify Phase 1 Complete
- [ ] Run `npx vitest run` -- all remaining 17 test files pass
- [ ] Confirm 15 test files have been removed
- [ ] Note test count and pass/fail summary

**Acceptance Criteria:**
- [ ] All remaining tests pass
- [ ] No import errors from removed files

---

## Phase 2: Trim MEDIUM-Value Test Files (8 files, ~2,030 lines removed)

Surgical removal of low-value test blocks from files that contain a mix of valuable and trivial tests. Edit one file at a time, run tests after each.

### Task 2.1: Trim RoleModal.test.tsx (~600 lines removed)
- [ ] Remove create mode: "Modal Rendering" describe block (6 tests, lines 36-95)
- [ ] Remove create mode: "disables submit button while submitting", "shows loading state", "disables submit button until form is valid" from Form Submission (3 tests, lines 304-348)
- [ ] Remove create mode: "displays server error message" from Error Handling (lines 352-364)
- [ ] Remove create mode: "Modal Interaction" describe block (3 tests, lines 379-425)
- [ ] Remove create mode: "Accessibility" describe block (4 tests, lines 427-474)
- [ ] Remove create mode: "User Interactions" describe block (3 tests, lines 476-508)
- [ ] Remove create mode: "Form State Management" describe block (1 test, lines 510-527)
- [ ] Remove edit mode: "Modal Rendering" describe block (8 tests, lines 535-651)
- [ ] Remove edit mode: redundant description validation/character count/success tests (3 tests, lines 790-853)
- [ ] Remove edit mode: loading/disabled submission tests (2 tests, lines 986-1015)
- [ ] Remove edit mode: "Error Handling" describe block (2 tests, lines 1018-1061)
- [ ] Remove edit mode: "Delete Option" describe block (3 tests, lines 1063-1110)
- [ ] Remove edit mode: "Modal Interaction" describe block (2 tests, lines 1112-1163)
- [ ] Remove edit mode: "Metadata Display" describe block (3 tests, lines 1165-1207)
- [ ] Remove edit mode: "Accessibility" describe block (3 tests, lines 1210-1269)
- [ ] Remove edit mode: "Edge Cases" describe block (2 tests, lines 1272-1314)
- [ ] Clean up empty describe blocks and verify structure
- [ ] Run `npx vitest run` -- must pass

**Files:** `src/components/modals/RoleModal.test.tsx`
**Acceptance Criteria:**
- [ ] ~716 lines remaining (validation, submission, pre-fill, change detection tests kept)
- [ ] All remaining tests pass
- [ ] No orphaned describe blocks

### Task 2.2: Trim CreateOnboardingModal.test.tsx (~400 lines removed)
- [ ] Remove visibility tests (2 tests, lines 119-145)
- [ ] Remove form fields rendering tests (3 tests, lines 151-209)
- [ ] Remove loading and error states section (5 tests, lines 547-629)
- [ ] Remove loading state during submission section (2 tests, lines 635-686)
- [ ] Remove cancel button test (lines 692-708)
- [ ] Remove accessibility section (2 tests, lines 757-798)
- [ ] Remove required field indicators section (2 tests, lines 804-835)
- [ ] Clean up empty describe blocks and verify structure
- [ ] Run `npx vitest run` -- must pass

**Files:** `src/components/modals/CreateOnboardingModal.test.tsx`
**Acceptance Criteria:**
- [ ] ~436 lines remaining (validation, submission, template preview, whitespace tests kept)
- [ ] All remaining tests pass

### Task 2.3: Trim TemplateModal.test.tsx (~300 lines removed)
- [ ] Remove create mode: visibility/render tests (2 tests, lines 75-103)
- [ ] Remove create mode: title, step form, name input, role checkboxes, status radio button tests (5 tests, lines 105-177)
- [ ] Remove create mode: cancel button test (lines 294-310)
- [ ] Remove create mode: step form fields, error message, submit disabled, default status tests (4 tests, lines 336-421)
- [ ] Remove edit mode: visibility/render tests (2 tests, lines 429-461)
- [ ] Remove edit mode: title test (lines 463-479)
- [ ] Remove edit mode: delete button, status pre-populate tests (2 tests, lines 500-577)
- [ ] Remove edit mode: cancel, error, submit disabled, form structure tests (4 tests, lines 629-726)
- [ ] Clean up empty describe blocks and verify structure
- [ ] Run `npx vitest run` -- must pass

**Files:** `src/components/templates/TemplateModal.test.tsx`
**Acceptance Criteria:**
- [ ] ~428 lines remaining (validation, submission, step management, pre-fill tests kept)
- [ ] All remaining tests pass

### Task 2.4: Trim UserModal.test.tsx (~150 lines removed)
- [ ] Remove create mode: "render modal when open" (lines 42-56)
- [ ] Remove create mode: "not render modal when closed" (lines 58-69)
- [ ] Remove create mode: "show intro section" (lines 72-84)
- [ ] Remove create mode: "display server error" (lines 273-286)
- [ ] Remove create mode: "disable submit button while submitting" (lines 288-302)
- [ ] Remove create mode: "close modal on cancel" (lines 304-319)
- [ ] Remove edit mode: "not show intro section" (lines 395-408)
- [ ] Remove edit mode: "show 'Save Changes' submit button" (lines 410-424)
- [ ] Remove edit mode: "show 'Saving...' loading state" (lines 469-483)
- [ ] Remove edit mode: "close modal on cancel in edit mode" (lines 485-501)
- [ ] Remove edit mode: "display server error in edit mode" (lines 503-517)
- [ ] Clean up empty describe blocks and verify structure
- [ ] Run `npx vitest run` -- must pass

**Files:** `src/components/modals/UserModal.test.tsx`
**Acceptance Criteria:**
- [ ] ~369 lines remaining (validation, submission, role/profile selection, pre-fill tests kept)
- [ ] All remaining tests pass

### Task 2.5: Trim RoleManagementPanel.test.tsx (~200 lines removed)
- [ ] Remove "Rendering and Layout" describe block (7 tests, lines 70-128)
- [ ] Remove "Empty States" describe block (2 tests, lines 205-228)
- [ ] Remove "Loading States" describe block (2 tests, lines 230-251)
- [ ] Remove "Error Handling" describe block (3 tests, lines 253-289)
- [ ] Remove "Callbacks" describe block (2 tests, lines 404-438)
- [ ] Remove "Accessibility" describe block (3 tests, lines 440-470)
- [ ] Remove "Responsive Design" describe block (1 test, lines 472-481)
- [ ] Clean up empty describe blocks and verify structure
- [ ] Run `npx vitest run` -- must pass

**Files:** `src/components/manager/RoleManagementPanel.test.tsx`
**Acceptance Criteria:**
- [ ] ~290 lines remaining (search/filter, edit modal, delete confirmation, UID tracking tests kept)
- [ ] All remaining tests pass

### Task 2.6: Trim EmployeeView.test.tsx (~150 lines removed)
- [ ] Remove "renders welcome header with correct title" (lines 79-86)
- [ ] Remove "displays all onboarding steps" (lines 88-95)
- [ ] Remove "passes callback functions to child components" (lines 154-161)
- [ ] Remove "displays step owner and expert information" (lines 163-173)
- [ ] Remove "displays step descriptions" (lines 175-182)
- [ ] Remove "handles empty steps array gracefully" (lines 184-194)
- [ ] Remove "handles steps with stuck status showing waiting message" (lines 196-204)
- [ ] Remove "displays progress bar with accessibility attributes" (lines 206-214)
- [ ] Remove "renders step timeline with proper list role" (lines 216-224)
- [ ] Remove "displays status indicator showing completion progress" (lines 226-232)
- [ ] Remove "maintains completion footer visibility on all breakpoints" (lines 306-321)
- [ ] Clean up and verify structure
- [ ] Run `npx vitest run` -- must pass

**Files:** `src/views/EmployeeView.test.tsx`
**Acceptance Criteria:**
- [ ] ~172 lines remaining (progress calculation, completion footer regression tests kept)
- [ ] All remaining tests pass

### Task 2.7: Trim useUsers.test.ts (~150 lines removed)
- [ ] Remove "initialize with empty users and loading state" (lines 55-68)
- [ ] Remove "load users on mount" (lines 70-84)
- [ ] Remove "fetch a single user by ID" (lines 233-250)
- [ ] Remove "handle when user not found" (lines 252-268)
- [ ] Remove "unsubscribe on cleanup" (lines 301-310)
- [ ] Clean up and verify structure
- [ ] Run `npx vitest run` -- must pass

**Files:** `src/hooks/useUsers.test.ts`
**Acceptance Criteria:**
- [ ] ~161 lines remaining (CRUD operations, error handling, reset tests kept)
- [ ] All remaining tests pass

### Task 2.8: Trim DeleteConfirmDialog.test.tsx (~80 lines removed)
- [ ] Remove "not render when isOpen is false" (lines 23-33)
- [ ] Remove "render when isOpen is true" (lines 35-47)
- [ ] Remove "have Cancel button" (lines 81-91)
- [ ] Remove "have Delete button" (lines 93-107)
- [ ] Remove "disable buttons when isDeleting" (lines 151-169)
- [ ] Remove "show loading state while deleting" (lines 171-183)
- [ ] Remove "display confirmation message with template name" (lines 185-197)
- [ ] Clean up and verify structure
- [ ] Run `npx vitest run` -- must pass

**Files:** `src/components/templates/DeleteConfirmDialog.test.tsx`
**Acceptance Criteria:**
- [ ] ~118 lines remaining (template name display, warning, cancel/confirm callback tests kept)
- [ ] All remaining tests pass

---

## Phase 3: Verify and Adjust

### Task 3.1: Run Full Test Suite
- [ ] Run `npx vitest run` -- all tests must pass
- [ ] Record final test count and file count
- [ ] Verify 17 test files remain

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] Test file count is 17

### Task 3.2: Check Coverage Thresholds
- [ ] Run `npx vitest run --coverage`
- [ ] Record coverage numbers (lines, functions, branches, statements)
- [ ] If coverage is below thresholds (80/80/75/80), adjust `vitest.config.ts`
- [ ] If thresholds adjusted, run `npx vitest run --coverage` again to confirm pass

**Files:** `vitest.config.ts` (only if thresholds need adjustment)
**Acceptance Criteria:**
- [ ] Coverage report generated
- [ ] Thresholds pass (either existing or adjusted)

### Task 3.3: Run Type Check
- [ ] Run `npx tsc -b` -- must pass with no errors
- [ ] Verify no lingering imports to deleted test files

**Acceptance Criteria:**
- [ ] Type check passes cleanly

---

## Phase 4: Clean Up

### Task 4.1: Verify No Orphaned References
- [ ] Search for imports of deleted files in remaining test files
- [ ] Search for references to deleted test files in any configuration
- [ ] Remove any stale references found

**Acceptance Criteria:**
- [ ] No references to deleted files remain

### Task 4.2: Final Verification
- [ ] Run `npx vitest run` -- final pass
- [ ] Run `npx tsc -b` -- final pass
- [ ] Count remaining test lines (target: ~5,963)
- [ ] Record final metrics: files removed, lines saved, tests remaining

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] Type check passes
- [ ] Metrics recorded for finalize step

---

## Handoff Checklist (for Test Agent)

- [ ] All 15 LOW-value test files deleted
- [ ] All 8 MEDIUM-value test files trimmed
- [ ] `npx vitest run` passes
- [ ] `npx tsc -b` passes
- [ ] Coverage thresholds pass (adjusted if needed)
- [ ] No orphaned imports or references
- [ ] Final line count: ~5,963 test lines (down from ~13,429)
- [ ] Final file count: 17 test files (down from 32)
