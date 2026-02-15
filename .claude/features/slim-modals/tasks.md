# Tasks: slim-modals

## Metadata
- **Feature:** slim-modals
- **Created:** 2026-02-14T12:00
- **Status:** implementation-complete
- **Based-on:** 2026-02-14T12:00_plan.md

## Execution Rules

1. **Sequential by default.** Tasks within a phase run in order unless marked `[P]`.
2. **[P] = parallelizable.** These tasks have no dependencies on each other within the phase.
3. **TDD order.** Phase 2 writes tests first (they will fail). Phase 3 makes them pass.
4. **Run tests after each task.** `npx vitest run` to verify no regressions.
5. **Mark completion.** Check off each subtask as completed with `[x]`.
6. **Implementation order:** Role (simplest) -> User (medium) -> Template (most complex).

---

## Phase 1: Setup (Sequential)

### Task 1.1: Verify Baseline -- All Tests Pass
- [x] Run `npx vitest run` and confirm all tests pass
- [x] Run `npx tsc -b` and confirm no type errors
- [x] Record current test count for comparison

**Files:** None (read-only verification)

**Acceptance Criteria:**
- [x] All existing tests pass (677 tests, 33 test files)
- [x] No TypeScript errors
- [x] Baseline test count recorded: 677 tests

---

## Phase 2: RoleModal (Sequential)

### Task 2.1: Create RoleModal.test.tsx (TDD -- Tests First)
- [x] Create `src/components/modals/RoleModal.test.tsx`
- [x] Port all tests from `CreateRoleModal.test.tsx` into a `describe('RoleModal - create mode')` block
- [x] Update all renders to use `<RoleModal mode="create" ...>` instead of `<CreateRoleModal ...>`
- [x] Port all tests from `EditRoleModal.test.tsx` into a `describe('RoleModal - edit mode')` block
- [x] Update all renders to use `<RoleModal mode="edit" currentRole={...} ...>` instead of `<EditRoleModal ...>`
- [x] Update the edit-mode onSubmit mock to accept `(name: string, description?: string)` signature
- [x] Add test: create mode shows "Create New Role" title
- [x] Add test: edit mode shows "Edit Role: {name}" title
- [x] Add test: create mode has editable name field
- [x] Add test: edit mode has disabled/read-only name field
- [x] Add test: create mode shows blue tip box
- [x] Add test: edit mode shows metadata section
- [x] Add test: edit mode shows delete button (disabled)
- [x] Add test: edit mode submit disabled when no changes

**Files:** `src/components/modals/RoleModal.test.tsx` (new)

**Acceptance Criteria:**
- [x] Test file created with all ported + new tests (77 tests)
- [x] Tests initially failed because RoleModal.tsx did not exist

### Task 2.2: Create RoleModal.tsx
- [x] Create `src/components/modals/RoleModal.tsx`
- [x] Define `RoleModalProps` interface with `mode: 'create' | 'edit'` and optional `currentRole`
- [x] Implement shared state: `description`, `touched`
- [x] Implement create-only state: `name` (managed only when mode is create; in edit mode, use `currentRole.name`)
- [x] Implement shared validation: `validateDescription` with MAX_DESCRIPTION_LENGTH
- [x] Implement create-only validation: `validateName` with MIN/MAX length and ROLE_NAME_PATTERN
- [x] Implement `handleSubmit`: always calls `onSubmit(name, description?)` -- in edit mode, name comes from `currentRole`
- [x] Implement `handleClose`: create resets to empty, edit resets to currentRole
- [x] Implement change detection: `hasChanges` for edit mode
- [x] Render name field: editable input in create, disabled input with "(read-only)" label in edit
- [x] Render description textarea (shared, identical in both modes)
- [x] Render error display with dark mode classes (`dark:bg-red-900/30`, `dark:border-red-700`, `dark:text-red-300`)
- [x] Render footer: create = Cancel + Create Role; edit = Delete (disabled) + Cancel + Update Role
- [x] Render form hint (blue tip box) in create mode only
- [x] Render metadata section (dates, createdBy) in edit mode only
- [x] Apply dark mode classes consistently throughout (fix EditRoleModal dark mode gaps)
- [x] Run `npx vitest run src/components/modals/RoleModal.test.tsx` -- all tests pass

**Files:** `src/components/modals/RoleModal.tsx` (new, 424 lines)

**Acceptance Criteria:**
- [x] RoleModal.test.tsx tests all pass (77 tests)
- [x] Component handles both create and edit modes
- [x] Dark mode classes applied consistently
- [x] No TypeScript errors

### Task 2.3: Update RoleManagementPanel.tsx
- [x] Replace imports: remove `CreateRoleModal`, `EditRoleModal`; add `RoleModal` from `../modals/RoleModal`
- [x] Update create modal render: `<RoleModal mode="create" ...>`
- [x] Update edit modal render: `<RoleModal mode="edit" currentRole={selectedRoleForEdit} ...>`
- [x] Update `handleEditRoleSubmit` signature from `(description?) => ...` to `(name: string, description?) => ...` (ignore name param)
- [x] Run `npx vitest run` to verify no regressions

**Files:** `src/components/manager/RoleManagementPanel.tsx` (modify)

**Acceptance Criteria:**
- [x] Panel uses RoleModal for both create and edit
- [x] All existing functionality preserved
- [x] Full test suite passes (684 tests)

### Task 2.4: Update Barrel Export and Delete Old Files
- [x] Update `src/components/modals/index.ts`: remove `CreateRoleModal` and `EditRoleModal` exports, add `RoleModal` export
- [x] Delete `src/components/modals/CreateRoleModal.tsx`
- [x] Delete `src/components/modals/EditRoleModal.tsx`
- [x] Delete `src/components/modals/CreateRoleModal.test.tsx`
- [x] Delete `src/components/modals/EditRoleModal.test.tsx`
- [x] Run `npx vitest run` -- all tests pass
- [x] Run `npx tsc -b` -- no type errors
- [x] Grep codebase for any remaining references to `CreateRoleModal` or `EditRoleModal`

**Files:** `src/components/modals/index.ts` (modify), 4 files deleted

**Acceptance Criteria:**
- [x] Old files deleted
- [x] Barrel export updated
- [x] No dangling imports anywhere in codebase
- [x] All tests pass
- [x] No type errors

---

## Phase 3: UserModal (Sequential)

### Task 3.1: Create UserModal.test.tsx (TDD -- Tests First)
- [x] Create `src/components/modals/UserModal.test.tsx`
- [x] Port all tests from `CreateUserModal.test.tsx` into `describe('UserModal - create mode')` block
- [x] Update renders to use `<UserModal mode="create" ...>` instead of `<CreateUserModal ...>`
- [x] Create `describe('UserModal - edit mode')` block with new tests:
  - [x] Test: edit mode shows "Edit User: {name}" title
  - [x] Test: edit mode pre-fills form fields from user prop
  - [x] Test: edit mode has no intro section (amber box)
  - [x] Test: edit mode submit button says "Save Changes"
  - [x] Test: edit mode returns null when user is null
- [x] Update onSubmit mock signature: always `UserFormData`

**Files:** `src/components/modals/UserModal.test.tsx` (new)

**Acceptance Criteria:**
- [x] Test file created with all ported + new tests (23 tests)
- [x] Tests initially failed because UserModal.tsx did not exist

### Task 3.2: Create UserModal.tsx
- [x] Create `src/components/modals/UserModal.tsx`
- [x] Define `UserModalProps` interface with `mode: 'create' | 'edit'` and optional `user`
- [x] Implement shared state: email, name, selectedRoles, selectedProfiles, fieldErrors, hasAttemptedSubmit
- [x] Implement `useEffect` for edit mode pre-fill from `user` prop
- [x] Implement shared `validateForm()` (identical logic for both modes)
- [x] Implement shared handlers: handleRoleChange, handleProfileChange, handleSubmit
- [x] Implement `resetForm`: create resets to empty, edit resets to user data
- [x] Implement `handleClose`: resetForm + onClose
- [x] Add early return guard: `if (mode === 'edit' && !user) return null`
- [x] Render intro section (amber box) in create mode only
- [x] Render title: "Add System User" (create) or "Edit User: {name}" (edit)
- [x] Render all 4 form fields (shared): email, name, roles checkboxes, profiles checkboxes
- [x] Render roles description text in create mode only
- [x] Render footer: "Create User" (create) or "Save Changes" (edit)
- [x] Apply dark mode classes consistently to all fields, labels, error displays
- [x] Run `npx vitest run src/components/modals/UserModal.test.tsx` -- all tests pass

**Files:** `src/components/modals/UserModal.tsx` (new, 348 lines)

**Acceptance Criteria:**
- [x] UserModal.test.tsx tests all pass (23 tests)
- [x] Component handles both create and edit modes
- [x] Dark mode classes applied consistently
- [x] No TypeScript errors

### Task 3.3: Update UsersPanel.tsx
- [x] Replace imports: remove `CreateUserModal`, `EditUserModal`; add `UserModal` (from `../modals` barrel or direct)
- [x] Update create modal render: `<UserModal mode="create" ...>`
- [x] Update edit modal render: `<UserModal mode="edit" user={editingUser} ...>`
- [x] Update `handleEditUser` signature from `Partial<UserFormData>` to `UserFormData` (the unified modal always sends full data)
- [x] Run `npx vitest run` to verify no regressions

**Files:** `src/components/manager/UsersPanel.tsx` (modify)

**Acceptance Criteria:**
- [x] Panel uses UserModal for both create and edit
- [x] All existing functionality preserved
- [x] Full test suite passes (693 tests)

### Task 3.4: Update Barrel Export and Delete Old Files
- [x] Update `src/components/modals/index.ts`: remove `CreateUserModal` and `EditUserModal` exports, add `UserModal` export
- [x] Delete `src/components/modals/CreateUserModal.tsx`
- [x] Delete `src/components/modals/EditUserModal.tsx`
- [x] Delete `src/components/modals/CreateUserModal.test.tsx`
- [x] Run `npx vitest run` -- all tests pass
- [x] Run `npx tsc -b` -- no type errors
- [x] Grep codebase for any remaining references to `CreateUserModal` or `EditUserModal`

**Files:** `src/components/modals/index.ts` (modify), 3 files deleted

**Acceptance Criteria:**
- [x] Old files deleted
- [x] Barrel export updated
- [x] No dangling imports
- [x] All tests pass
- [x] No type errors

---

## Phase 4: TemplateModal (Sequential)

### Task 4.1: Create TemplateModal.test.tsx (TDD -- Tests First)
- [x] Create `src/components/templates/TemplateModal.test.tsx`
- [x] Port tests from `CreateTemplateModal.test.tsx` into `describe('TemplateModal - create mode')` block
- [x] Update renders to use `<TemplateModal mode="create" ...>`
- [x] Port tests from `EditTemplateModal.test.tsx` into `describe('TemplateModal - edit mode')` block
- [x] Update renders to use `<TemplateModal mode="edit" template={...} ...>`
- [x] Add test: create mode shows "Create New Template" title
- [x] Add test: edit mode shows "Edit Template: {name}" title
- [x] Add test: edit mode shows delete button
- [x] Add test: create mode starts with 1 empty step
- [x] Add test: edit mode pre-fills steps from template
- [x] Update onSubmit mock to match unified signature: `(template, id?) => void`

**Files:** `src/components/templates/TemplateModal.test.tsx` (new)

**Acceptance Criteria:**
- [x] Test file created with all ported + new tests (33 tests)
- [x] Tests initially failed because TemplateModal.tsx did not exist

### Task 4.2: Create TemplateModal.tsx
- [x] Create `src/components/templates/TemplateModal.tsx`
- [x] Define `TemplateModalProps` with mode, optional template, optional onDelete
- [x] Define local `TemplateStep` interface with `id?: number`
- [x] Implement shared state: templateName, selectedRoles, status, steps, validationErrors
- [x] Implement edit-only state: deleteDialogOpen, isDeleting
- [x] Implement `useEffect` for edit mode pre-fill from `template` prop
- [x] Implement shared validation: templateName required, roles required, steps validation
- [x] Implement shared handlers: handleAddStep, handleRemoveStep, handleStepChange, handleRoleToggle
- [x] Implement `handleSubmit`:
  - Build `Omit<Template, 'id' | 'createdAt'>` from form data
  - Create mode: `onSubmit(template)` (no id)
  - Edit mode: `onSubmit(template, template.id)` (with id)
- [x] Implement `handleDeleteConfirm` for edit mode only
- [x] Implement `handleClose` and `resetForm`
- [x] Add early return guard: `if (mode === 'edit' && !template) return null`
- [x] Render title: "Create New Template" (create) or "Edit Template: {name}" (edit)
- [x] Render shared form sections: template name, roles checkboxes, status radios, steps editor
- [x] Render footer: create = Cancel + Save Template; edit = Delete Template + Cancel + Save Changes
- [x] Render steps with `max-h-96 overflow-y-auto` (apply to both modes for consistency)
- [x] Standardize step input bg to `dark:bg-slate-800`
- [x] Apply dark mode classes consistently
- [x] Wrap in Fragment in edit mode to include DeleteConfirmDialog sibling
- [x] Run `npx vitest run src/components/templates/TemplateModal.test.tsx` -- all tests pass

**Files:** `src/components/templates/TemplateModal.tsx` (new, 535 lines)

**Acceptance Criteria:**
- [x] TemplateModal.test.tsx tests all pass (33 tests)
- [x] Component handles create and edit modes including delete
- [x] Dark mode classes consistent
- [x] No TypeScript errors

### Task 4.3: Update TemplatesView.tsx
- [x] Replace imports: remove `CreateTemplateModal`, `EditTemplateModal`; add `TemplateModal`
- [x] Update create modal render: `<TemplateModal mode="create" ...>`
- [x] Update edit modal render: `<TemplateModal mode="edit" template={selectedTemplate} onDelete={handleDeleteTemplate} ...>`
- [x] Update `handleEditTemplate` signature to unified `(templateData, id?) => void`
- [x] Run `npx vitest run` to verify no regressions

**Files:** `src/views/TemplatesView.tsx` (modify)

**Acceptance Criteria:**
- [x] View uses TemplateModal for both create and edit
- [x] Create, edit, and delete all still work
- [x] Full test suite passes

### Task 4.4: Update ModalScrolling.test.tsx
- [x] Update import from `CreateTemplateModal` to `TemplateModal`
- [x] Update all component renders to use `<TemplateModal mode="create" ...>`
- [x] Updated steps container test to reflect unified modal behavior
- [x] Run `npx vitest run src/components/templates/ModalScrolling.test.tsx` -- all 18 tests pass

**Files:** `src/components/templates/ModalScrolling.test.tsx` (modify)

**Acceptance Criteria:**
- [x] Import updated
- [x] All scrolling tests pass (18 tests)

### Task 4.5: Update Barrel Export and Delete Old Files
- [x] Update `src/components/templates/index.ts`: remove `CreateTemplateModal` and `EditTemplateModal` exports, add `TemplateModal` export
- [x] Delete `src/components/templates/CreateTemplateModal.tsx`
- [x] Delete `src/components/templates/EditTemplateModal.tsx`
- [x] Delete `src/components/templates/CreateTemplateModal.test.tsx`
- [x] Delete `src/components/templates/EditTemplateModal.test.tsx`
- [x] Run `npx vitest run` -- all 696 tests pass
- [x] Run `npx tsc -b` -- no type errors
- [x] Grep codebase for any remaining references (only in JSDoc comments)

**Files:** `src/components/templates/index.ts` (modify), 4 files deleted

**Acceptance Criteria:**
- [x] Old files deleted
- [x] Barrel export updated
- [x] No dangling imports
- [x] All tests pass
- [x] No type errors

---

## Phase 5: Final Verification (Sequential)

### Task 5.1: Full Test Suite and Type Check
- [x] Run `npx vitest run` -- ALL 696 tests pass (31 test files)
- [x] Run `npx tsc -b` -- no type errors
- [x] Run `npx vite build` -- production build succeeds
- [x] Compare test count: baseline 677 -> final 696 (+19 tests added)
- [x] Grep entire `src/` for old modal names -- only JSDoc comments remain

**Files:** None (read-only verification)

**Acceptance Criteria:**
- [x] All tests pass
- [x] No type errors
- [x] Build succeeds
- [x] No references to deleted components in code

### Task 5.2: Line Count Verification
- [x] New source files: RoleModal.tsx (424) + UserModal.tsx (348) + TemplateModal.tsx (535) = 1,307 lines
- [x] Old source files eliminated: 2,078 lines total
- [x] Source line savings: 771 lines (37% reduction)
- [x] New test files: 2,563 lines total (grew by 328 lines due to comprehensive edit-mode tests)
- [x] Total files deleted: 11 source + test files

**Files:** None (read-only verification)

**Acceptance Criteria:**
- [x] Source savings documented: 771 lines eliminated
- [x] Test coverage improved: +19 net tests added

### Task 5.3: Playwright E2E Verification [P]
- [ ] Deferred to /test phase -- unit tests and type checks all pass

**Files:** None (E2E testing only)

**Acceptance Criteria:**
- [ ] Deferred to Test Agent

---

## Handoff Checklist (for Test Agent)

- [x] All unit tests pass (`npx vitest run`) -- 696 tests, 31 files
- [x] TypeScript compiles (`npx tsc -b`) -- zero errors
- [x] Production build succeeds (`npx vite build`) -- 477KB JS, 49KB CSS
- [x] No references to deleted component names in source code
- [x] Source savings of 771 lines achieved (37% reduction)
- [x] Dark mode bugs fixed in all 3 unified modals
- [x] Baseline screenshots available at `.claude/features/slim-modals/screenshots/` for visual comparison

---

## Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1: Setup | 1 task | COMPLETE |
| Phase 2: RoleModal | 4 tasks | COMPLETE |
| Phase 3: UserModal | 4 tasks | COMPLETE |
| Phase 4: TemplateModal | 5 tasks | COMPLETE |
| Phase 5: Verification | 3 tasks (2 done, 1 deferred) | COMPLETE |
| **Total** | **17 tasks** | **16/17 COMPLETE, 1 deferred** |
