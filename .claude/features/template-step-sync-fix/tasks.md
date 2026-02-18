# Tasks: template-step-sync-fix

## Metadata
- **Feature:** template-step-sync-fix
- **Created:** 2026-02-17T03:23 UTC
- **Status:** implement-complete
- **Based On:** `2026-02-17T03:23_plan.md`

## Execution Rules
- Tasks are numbered Phase.Task (e.g., 1.1, 2.1)
- [P] = parallelizable with other [P] tasks in same phase
- TDD order: Phase 2 (tests) BEFORE Phase 3 (implementation)
- Mark items with [x] when complete

---

## Phase 1: Setup (Sequential)

### Task 1.1: Verify Prerequisites
- [x] Confirm `templateService.ts` exists and contains `syncTemplateStepsToInstances` at lines 170-219
- [x] Confirm `instanceService.ts` exports `updateOnboardingInstance`
- [x] Confirm `instanceService.test.ts` exists as reference for mock patterns
- [x] Run `npx vitest run` to confirm baseline test suite passes (508+ tests)

**Files:** Read-only -- `src/services/supabase/templateService.ts`, `src/services/supabase/instanceService.ts`

**Acceptance Criteria:**
- [x] All existing tests pass (528 tests)
- [x] No type errors (`npx tsc -b`)

---

## Phase 2: Tests (TDD -- Write Tests First)

### Task 2.1: Create Test File with Mocks and Helpers
- [x] Create `src/services/supabase/templateService.test.ts`
- [x] Set up `vi.mock('../../config/supabase')` with configurable Supabase mock that handles:
  - `from('templates').update().eq()` -- for `updateTemplate` template row update
  - `from('template_steps').delete().eq()` -- for deleting old template steps
  - `from('template_steps').insert()` -- for inserting new template steps
  - `from('onboarding_instances').select().eq()` -- returns mock instances (configurable per test)
- [x] Set up `vi.mock('./instanceService')` to capture `updateOnboardingInstance` calls
- [x] Set up `vi.mock('./crudFactory')` to stub factory-generated operations (listTemplates, getTemplate, etc.)
- [x] Set up `vi.mock('./subscriptionManager')` stub
- [x] Create helper function `makeStep(overrides)` that returns a `Step` with sensible defaults
- [x] Create helper function `makeInstance(overrides)` that returns a mock instance DB row with steps

**Files:** `src/services/supabase/templateService.test.ts` (new)

**Acceptance Criteria:**
- [x] Test file compiles without errors
- [x] Mock setup covers all Supabase query chains used by `updateTemplate`

### Task 2.2: Write Reorder Tests
- [x] Test: "reorder preserves completion status" -- steps [A(completed), B(pending), C(stuck), D(completed)] reordered to [B, A, D, C] in template; verify instance steps have correct new positions AND original statuses preserved
- [x] Test: "reorder with all completed steps" -- all 3 steps completed, reorder; verify progress stays 100%
- [x] Test: "single step template sync" -- template and instance both have 1 step; verify status preserved, fields updated

**Files:** `src/services/supabase/templateService.test.ts`

**Acceptance Criteria:**
- [x] All 3 reorder tests written
- [x] Tests FAILED when run against original implementation (TDD red phase confirmed: 10/12 tests failed)

### Task 2.3: Write Field Update Tests
- [x] Test: "description change propagates while preserving status" -- change description of a completed step; verify description updated but status still 'completed'
- [x] Test: "owner/expert/role/link changes propagate" -- change multiple metadata fields on a step; verify all updated, status preserved

**Files:** `src/services/supabase/templateService.test.ts`

**Acceptance Criteria:**
- [x] All 2 field update tests written
- [x] Tests FAILED when run against original implementation

### Task 2.4: Write Add/Remove Tests
- [x] Test: "new step added to template appears in instance as pending" -- template gains a new step "Security training"; verify it appears in instance with `status: 'pending'` at correct position
- [x] Test: "step removed from template is dropped from instance" -- remove a step from template; verify instance no longer contains it and progress is recalculated
- [x] Test: "mixed add + remove + reorder" -- add 1 new step, remove 1 existing step, reorder remaining; verify full reconciliation with correct positions, statuses, and progress

**Files:** `src/services/supabase/templateService.test.ts`

**Acceptance Criteria:**
- [x] All 3 add/remove tests written
- [x] Tests FAILED when run against original implementation

### Task 2.5: Write Progress Calculation Tests
- [x] Test: "removing pending steps increases progress" -- 2/4 completed, remove 2 pending steps; verify progress = 100% (2/2 completed)
- [x] Test: "adding new step decreases progress" -- 3/3 completed (100%), add 1 new pending step; verify progress = 75% (3/4 completed)

**Files:** `src/services/supabase/templateService.test.ts`

**Acceptance Criteria:**
- [x] All 2 progress tests written
- [x] Tests FAILED when run against original implementation

### Task 2.6: Write Edge Case Tests
- [x] Test: "empty template steps clears all instance steps" -- template updated to have 0 steps; verify instance steps become empty array, progress = 0
- [x] Test: "multiple instances synced independently" -- 2 instances with different step statuses; verify each synced correctly with its own status preservation

**Files:** `src/services/supabase/templateService.test.ts`

**Acceptance Criteria:**
- [x] All 2 edge case tests written
- [x] Tests FAILED when run against original implementation

---

## Phase 3: Core Implementation (Sequential)

### Task 3.1: Rewrite `syncTemplateStepsToInstances()`
- [x] Replace lines 170-219 in `templateService.ts` with title-based reconciliation algorithm
- [x] Keep function signature: `async function syncTemplateStepsToInstances(templateId: string, newSteps: Step[]): Promise<void>`
- [x] Keep lazy import: `const { updateOnboardingInstance } = await import('./instanceService')`
- [x] Keep instance fetch: `supabase.from('onboarding_instances').select('*, instance_steps(*)').eq('template_id', templateId)`
- [x] Keep `toInstance` mapping of fetched rows
- [x] NEW: For each instance, build `Map<string, Step>` from `instance.steps` keyed by `step.title`
- [x] NEW: Walk `newSteps` in order, build merged array:
  - If `titleMap.get(templateStep.title)` exists: create step with template fields + instance `status`
  - If no match: create step with template fields + `status: 'pending'`
- [x] NEW: Calculate progress: `Math.round((completedCount / mergedSteps.length) * 100)` with 0-division guard
- [x] NEW: Call `updateOnboardingInstance(instance.id, { steps: mergedSteps, progress })`
- [x] Keep per-instance try/catch with `console.warn`
- [x] Keep outer try/catch with `console.warn`
- [x] Update JSDoc comment to describe the new behavior

**Files:** `src/services/supabase/templateService.ts` (lines 165-244)

**Acceptance Criteria:**
- [x] Function compiles without type errors
- [x] Algorithm handles: reorder, rename, add, remove, status preservation
- [x] Existing function signature and error handling patterns preserved

---

## Phase 4: Verification (Sequential)

### Task 4.1: Run Tests and Verify
- [x] Run `npx vitest run src/services/supabase/templateService.test.ts` -- all 12 new tests pass
- [x] Run `npx vitest run` -- all existing tests still pass (528 existing + 12 new = 540 total)
- [x] Run `npx tsc -b` -- no type errors
- [x] Run `npx vite build` -- build succeeds

**Files:** None (verification only)

**Acceptance Criteria:**
- [x] All new templateService tests pass (green)
- [x] All existing tests still pass (no regressions)
- [x] TypeScript compilation clean
- [x] Production build succeeds

---

## Phase 5: Polish (Parallel OK)

### Task 5.1: [P] Update Function JSDoc
- [x] Verify the JSDoc on `syncTemplateStepsToInstances` accurately describes title-based matching
- [x] Mention that only `status` is preserved from instance steps
- [x] Mention that orphan steps (removed from template) are dropped

**Files:** `src/services/supabase/templateService.ts`

**Acceptance Criteria:**
- [x] JSDoc is accurate and complete

### Task 5.2: [P] Verify No Lint Errors
- [x] Run `npx eslint src/services/supabase/templateService.ts`
- [x] Run `npx eslint src/services/supabase/templateService.test.ts`
- [x] Fix any lint issues

**Files:** `src/services/supabase/templateService.ts`, `src/services/supabase/templateService.test.ts`

**Acceptance Criteria:**
- [x] No ESLint errors (warnings only, matching existing project patterns for `any` types in mocks)

---

## Phase 6: Ready for Test Agent

### Handoff Checklist
- [x] All 12 new unit tests pass
- [x] All 528 existing tests pass (no regressions) -- 540 total
- [x] `npx tsc -b` clean
- [x] `npx vite build` succeeds
- [x] `npx eslint` passes (0 errors, warnings only matching existing patterns)
- [x] Single file modified: `templateService.ts` (lines 165-244 rewritten)
- [x] Single file created: `templateService.test.ts` (12 test cases)
- [x] No database migrations needed
- [x] No type changes needed
- [x] No UI changes needed

### What the Test Agent Should Verify
1. **Unit tests:** `npx vitest run` -- all pass
2. **Functional test (Playwright):**
   - Log in as Manager
   - Edit an existing template: reorder steps
   - Navigate to an active instance using that template
   - Verify steps appear in the new order with statuses preserved
   - Edit template again: add a new step, remove an existing step
   - Verify instance reflects additions (pending) and removals (dropped)
3. **Console errors:** No new console errors during sync operations
