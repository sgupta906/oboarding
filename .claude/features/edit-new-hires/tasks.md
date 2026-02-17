# Tasks: edit-new-hires

## Metadata
- **Feature:** edit-new-hires
- **Created:** 2026-02-17T22:00
- **Status:** implementation-complete
- **Based on:** 2026-02-17T22:00_plan.md

## Execution Rules
- Tasks within a phase execute sequentially unless marked [P]
- [P] = parallelizable (can run concurrently with other [P] tasks in same phase)
- TDD: Write tests BEFORE implementation (Phase 2 before Phase 3)
- Mark tasks complete with [x] when done
- Each task should leave the build passing (`npx tsc -b` and `npx vitest run`)

---

## Phase 1: Store Layer (Foundation)

### Task 1.1: Add `_updateInstance` to Zustand store
- [x] Add `_updateInstance` to `InstancesSlice` interface in `useOnboardingStore.ts`
- [x] Import `updateOnboardingInstance` from `../services/supabase` (already exported in barrel)
- [x] Implement `_updateInstance` action following `_editUser` pattern:
  - Capture snapshot of `instances` array
  - Optimistic update: map over instances, merge `updates` into matching instance
  - Call `updateOnboardingInstance(instanceId, updates)` on server
  - On error: rollback to snapshot, re-throw
- [x] Verify `npx tsc -b` passes

**Files:** `src/store/useOnboardingStore.ts`

**Acceptance Criteria:**
- [x] `InstancesSlice` interface includes `_updateInstance: (instanceId: string, updates: Partial<OnboardingInstance>) => Promise<void>`
- [x] Implementation follows optimistic update + rollback pattern
- [x] TypeScript compiles without errors

### Task 1.2: Expose `updateInstance` from useOnboardingInstances hook
- [x] Add `updateInstance` to `UseOnboardingInstancesReturn` interface
- [x] Implement `updateInstance` function that calls `useOnboardingStore.getState()._updateInstance()`
- [x] Verify `npx tsc -b` passes

**Files:** `src/hooks/useOnboardingInstances.ts`

**Acceptance Criteria:**
- [x] Hook returns `updateInstance: (id: string, updates: Partial<OnboardingInstance>) => Promise<void>`
- [x] Function delegates to store action
- [x] TypeScript compiles without errors

---

## Phase 2: Tests First (TDD)

### Task 2.1: Write store `_updateInstance` tests
- [x] Add test block for `_updateInstance` in existing store test file
- [x] Test: optimistically updates instance in store (check state after calling action with mocked service)
- [x] Test: rolls back on server error
- [x] Test: calls `updateOnboardingInstance` with correct arguments
- [x] Test: re-throws server errors for caller to handle
- [x] All 4 tests pass (implementation was done in Phase 1)

**Files:** `src/store/useOnboardingStore.test.ts`

**Acceptance Criteria:**
- [x] 4 tests written for `_updateInstance`
- [x] Tests use vi.mock for supabase services

### Task 2.2: Write EditHireModal unit tests [P]
- [x] Create `src/components/modals/EditHireModal.test.tsx`
- [x] Mock `../../services/supabase` (getTemplate, logActivity)
- [x] Write test data: mockInstance, mockTemplates, mockRoles, mockNewTemplate
- [x] Tests:
  - Pre-fills form fields from instance prop (name, email, role, department, template)
  - Shows current template selected in dropdown
  - Validation error for empty employee name (clear field, submit)
  - Validation error for invalid email format
  - Validation error for empty role
  - Validation error for empty department
  - Shows template change warning when different template selected
  - Does NOT show warning when template unchanged
  - Displays template preview when template selected
  - Submits with correct data (no template change)
  - Submits with merged steps when template changes
  - Preserves completed step status via title match
  - New steps from template get pending status
  - Resets form when modal closed and re-opened
  - Shows loading spinner during submission
  - Returns null if isOpen but no instance (guard)

**Files:** `src/components/modals/EditHireModal.test.tsx`

**Acceptance Criteria:**
- [x] 16 tests written covering pre-fill, validation, template change, step merging, reset, loading, guard
- [x] Tests follow same patterns as CreateOnboardingModal.test.tsx

### Task 2.3: Write NewHiresPanel edit button tests [P]
- [x] Add tests to existing `NewHiresPanel.test.tsx`
- [x] Update mock to include `updateInstance` in hook return
- [x] Update mock to include `useRoles` and `useTemplates` hooks
- [x] Tests:
  - Renders edit button for each row with correct aria-label
  - Edit button is alongside delete button in Actions column
  - Opens edit modal when edit button is clicked
  - Passes correct instance to EditHireModal (verifies pre-filled name)

**Files:** `src/components/manager/NewHiresPanel.test.tsx`

**Acceptance Criteria:**
- [x] 4 tests written for edit button rendering and interaction
- [x] All tests pass

---

## Phase 3: Core Implementation (Sequential)

### Task 3.1: Create EditHireModal component
- [x] Create `src/components/modals/EditHireModal.tsx`
- [x] Define `EditHireModalProps` interface
- [x] Implement form state: employeeName, employeeEmail, role, department, templateId
- [x] Implement useEffect to pre-fill from instance prop when isOpen changes
- [x] Track original templateId to detect template changes
- [x] Implement validateForm() with same validation as CreateOnboardingModal
- [x] Implement template preview (reuse pattern from CreateOnboardingModal)
- [x] Implement template change warning banner (amber, shows when templateId !== original)
- [x] Implement handleSubmit() with title-based step merging
- [x] Implement resetForm() and handleClose()
- [x] Full dark mode support on all elements
- [x] Full a11y: aria-labels, aria-required, aria-describedby for errors, role="alert"
- [x] Guard: return null if isOpen && !instance
- [x] All 16 EditHireModal tests pass

**Files:** `src/components/modals/EditHireModal.tsx`

**Acceptance Criteria:**
- [x] All EditHireModal tests from Task 2.2 pass
- [x] Component renders correctly with ModalWrapper
- [x] Template change triggers step merging
- [x] Dark mode and a11y complete
- [x] TypeScript compiles

### Task 3.2: Export EditHireModal from barrel
- [x] Add `export { EditHireModal } from './EditHireModal';` to `src/components/modals/index.ts`

**Files:** `src/components/modals/index.ts`

**Acceptance Criteria:**
- [x] EditHireModal importable from `../modals`

---

## Phase 4: Integration (Sequential)

### Task 4.1: Add Edit button and modal to NewHiresPanel
- [x] Import `Pencil` from `lucide-react`
- [x] Import `EditHireModal` from `../modals/EditHireModal`
- [x] Import `useRoles` and `useTemplates` from `../../hooks`
- [x] Add state: `editingInstance: OnboardingInstance | null`
- [x] Add state: `isEditing: boolean` (submitting state)
- [x] Add state: `editError: string | null`
- [x] Call `useRoles()` and `useTemplates()` hooks
- [x] Destructure `updateInstance` from `useOnboardingInstances()` return value
- [x] Add Pencil button in Actions column next to Trash2 button with blue hover styling
- [x] Implement `handleEditSubmit(instanceId, updates)` with activity logging and success toast
- [x] Render EditHireModal at bottom of component with all props
- [x] All 21 NewHiresPanel tests pass (17 existing + 4 new)

**Files:** `src/components/manager/NewHiresPanel.tsx`

**Acceptance Criteria:**
- [x] All NewHiresPanel tests pass (existing + new from Task 2.3)
- [x] Edit button visible next to delete button for each row
- [x] EditHireModal opens with correct instance data
- [x] Successful edit shows toast and closes modal
- [x] Error keeps modal open with error message

---

## Phase 5: Polish (Parallel OK)

### Task 5.1: Verify full test suite passes [P]
- [x] Run `npx vitest run` -- all 633 tests pass
- [x] Run `npx tsc -b` -- no type errors
- [x] New tests added: 4 (store) + 16 (EditHireModal) + 4 (NewHiresPanel edit) = 24

**Acceptance Criteria:**
- [x] Zero test failures
- [x] Zero type errors

---

## Phase 6: Ready for Test Agent

### Handoff Checklist
- [x] All unit tests passing (`npx vitest run`) -- 633 tests, 0 failures
- [x] Build succeeds (`npx tsc -b`)
- [x] New files created: EditHireModal.tsx, EditHireModal.test.tsx
- [x] Modified files: useOnboardingStore.ts, useOnboardingInstances.ts, NewHiresPanel.tsx, NewHiresPanel.test.tsx, modals/index.ts, useOnboardingStore.test.ts
- [x] Store test file updated with _updateInstance tests
- [x] Feature is fully self-contained (no ManagerView changes needed)

### Summary of Changes
| Category | Count |
|----------|-------|
| New files | 2 (EditHireModal.tsx + EditHireModal.test.tsx) |
| Modified files | 6 |
| New tests | 24 |
