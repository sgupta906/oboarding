# Tasks: template-reorder-fix

## Metadata
- **Feature:** template-reorder-fix
- **Bug #:** 37 (`template-reorder-not-persisted`)
- **Created:** 2026-02-16T23:30
- **Status:** implementation-complete
- **Based On:** `2026-02-16T23:30_plan.md`

## Execution Rules
- Tasks are sequential (dependency chain)
- TDD: write failing test FIRST (Task 1), then fix code (Task 2), then verify (Task 3)
- Completion marker: [x] when done

---

## Phase 1: Test (TDD -- write failing test first)

### Task 1.1: Add test for submitted step IDs after reorder
- [x] Add new test in `TemplateModal.test.tsx` inside the "step reorder" describe block (after line 579)
- [x] Test name: "should submit correct step IDs after reorder"
- [x] Test renders edit mode with `mockTemplateWithMultipleSteps`
- [x] Test clicks "Move step 1 down" to reorder [A,B,C] to [B,A,C]
- [x] Test clicks "Save Changes" button
- [x] Test asserts `onSubmit` was called once
- [x] Test asserts submitted steps have ids [1, 2, 3] (new positions)
- [x] Test asserts submitted steps[0].title === 'Step B' and steps[1].title === 'Step A'
- [x] Run test and confirm it FAILS (expected behavior before fix)

**Files:** `src/components/templates/TemplateModal.test.tsx`

**Acceptance Criteria:**
- [x] Test exists and runs
- [x] Test fails with current code (step ids are [2,1,3] instead of [1,2,3])

---

## Phase 2: Fix

### Task 2.1: Fix step ID assignment in TemplateModal handleSubmit
- [x] Edit `src/components/templates/TemplateModal.tsx` line 205
- [x] Change `id: s.id || index + 1` to `id: index + 1`
- [x] Run the new test from Task 1.1 and confirm it PASSES

**Files:** `src/components/templates/TemplateModal.tsx`

**Acceptance Criteria:**
- [x] Line 205 reads `id: index + 1,`
- [x] New reorder-payload test passes

---

## Phase 3: Verify

### Task 3.1: Run full test suite
- [x] Run `npx vitest run`
- [x] Confirm all tests pass (509 passed; 1 pre-existing failure in instanceService.test.ts for Bug #38 -- unrelated)
- [x] Confirm no new type errors (`npx tsc -b` -- 1 pre-existing TS error in instanceService.test.ts for Bug #38)

**Files:** None (verification only)

**Acceptance Criteria:**
- [x] All existing tests pass (no regressions from this change)
- [x] No new TypeScript errors
- [x] TemplateModal.test.tsx: 23/23 tests pass

---

## Handoff Checklist (for Test Agent)

- [x] New test added: "should submit correct step IDs after reorder"
- [x] Bug fix applied: line 205 of TemplateModal.tsx
- [x] All unit tests pass
- [x] TypeScript compiles clean (no new errors)
- [x] No new dependencies added
