# Modal Baseline Screenshots - Before Refactor

Captured: 2026-02-14
Purpose: Visual baseline of all modal dialogs before the `slim-modals` refactor.

## Screenshots Captured

| # | File | Modal | Status |
|---|------|-------|--------|
| 00 | `00-signin-page.png` | Sign-in page (context) | OK |
| 01 | `01-dashboard.png` | Dashboard after Manager login (context) | OK |
| 02 | `02-roles-tab.png` | Roles tab showing 2 existing roles | OK |
| 03 | `03-create-role-modal.png` | **Create New Role** modal | OK |
| 04 | `04-edit-role-modal.png` | **Edit Role: software engineer** modal | OK |
| 05 | `05-users-tab.png` | Users tab (empty state) | OK |
| 06 | `06-create-user-modal.png` | **Add System User** (Create User) modal | OK |
| 07 | -- | **Edit User** modal | SKIPPED - No users exist to edit |
| 08 | `08-templates-page.png` | Templates page showing 2 templates | OK |
| 09 | `09-create-template-modal.png` | **Create New Template** modal | OK |
| 10 | `10-edit-template-modal.png` | **Edit Template: Engineering** modal | OK |
| 11 | `11-create-onboarding-modal.png` | **Add New Employee Onboarding** modal | OK |

---

## Modal-by-Modal Analysis

### 1. Role Modals (Create vs Edit)

**Create New Role** (`03-create-role-modal.png`)
- Title: "Create New Role"
- Size: `md` (medium)
- Fields:
  - Role Name * (text input, placeholder "e.g., Senior Developer", 0/50 char counter)
  - Description (optional) (textarea, 0/500 char counter)
- Extra UI:
  - Blue tip box at bottom: "Role names should be descriptive..."
  - Real-time validation with green checkmark / red alert icons
- Footer: Cancel | Create Role (with checkmark icon)
- Lines of code: ~293

**Edit Role: software engineer** (`04-edit-role-modal.png`)
- Title: "Edit Role: software engineer"
- Size: `md` (medium)
- Fields:
  - Role Name (read-only) - disabled input showing current name
  - "Role names cannot be changed to prevent duplicate entries" hint
  - Description (textarea, 8/500 char counter, shows "unsaved changes" indicator)
- Extra UI:
  - Gray metadata box: Created date, Last updated, Created by
- Footer: Delete Role (left, disabled) | Cancel | Update Role
- Lines of code: ~280

**Similarity Assessment: Role Create vs Edit**
- Fields overlap: Both have Name + Description. Edit makes Name read-only.
- Edit adds: metadata display, delete button, "unsaved changes" indicator
- Edit removes: the blue tip box
- Validation: Create has full name validation; Edit only validates description
- **Merge potential: HIGH** - Same 2 fields, just different behavior for Name (editable vs read-only) and different footer buttons. Could be unified with a `mode: 'create' | 'edit'` prop.

---

### 2. User Modals (Create vs Edit)

**Add System User** (`06-create-user-modal.png`)
- Title: "Add System User"
- Size: `lg` (large)
- Fields:
  - Amber intro box explaining difference between "New User" and "New Hire"
  - Email * (text input)
  - Full Name * (text input)
  - System Roles * (checkboxes from DB: "software engineer", "Engineering")
  - Profiles (Optional) (checkboxes: Engineering, Sales, Product, HR, All)
- Footer: Cancel | Create User
- Lines of code: ~312

**Edit User** (NOT captured - no users exist)
- From source code review (`/workspaces/onboarding/src/components/modals/EditUserModal.tsx`):
  - Title: "Edit User: {user.name}"
  - Size: `lg` (large)
  - Fields: identical to Create (Email, Full Name, Roles checkboxes, Profiles checkboxes)
  - Pre-populated with existing user data
  - Footer: Cancel | Save Changes
  - Lines of code: ~317

**Similarity Assessment: User Create vs Edit**
- Fields: **IDENTICAL** - both have Email, Name, Roles, Profiles
- Only differences: title, button text, and Edit pre-fills with existing data
- Edit removes the amber intro box
- Edit uses `useEffect` to pre-populate
- **Merge potential: VERY HIGH** - These are almost copy-paste identical. The only structural difference is the intro box and button labels.

---

### 3. Template Modals (Create vs Edit)

**Create New Template** (`09-create-template-modal.png`)
- Title: "Create New Template"
- Size: `lg` (large)
- Fields:
  - Template Name (text input)
  - Applicable Roles (checkboxes from DB)
  - Status (radio: Draft / Published)
  - Onboarding Steps (dynamic list):
    - Each step has: Title, Description (textarea), Owner, Expert
    - "+ Add Step" button
    - Trash icon to remove steps (when >1 step)
    - Step number badge
- Footer: Cancel | Save Template
- Lines of code: ~411

**Edit Template: Engineering** (`10-edit-template-modal.png`)
- Title: "Edit Template: Engineering"
- Size: `lg` (large)
- Fields: **IDENTICAL** to Create - Template Name, Applicable Roles, Status, Steps
- Pre-populated with existing template data
- Extra UI: Delete Template button in footer
- Footer: Delete Template (left) | Cancel | Save Changes
- Lines of code: ~471

**Similarity Assessment: Template Create vs Edit**
- Fields: **IDENTICAL** - same form structure, same inputs
- Edit adds: Delete Template button, `useEffect` for pre-population, DeleteConfirmDialog
- Edit uses `max-h-96 overflow-y-auto` on steps (Create does not)
- **Merge potential: VERY HIGH** - Nearly identical form. Only differences are pre-population, delete button, and button labels.

---

### 4. CreateOnboardingModal (New Hire)

**Add New Employee Onboarding** (`11-create-onboarding-modal.png`)
- Title: "Add New Employee Onboarding"
- Size: `lg` (large)
- Fields:
  - Blue intro box: explains this creates a "Quest Log" for new employees
  - Employee Name * (text input)
  - Email Address * (text input)
  - Role * (select dropdown from roles)
  - Department * (text input)
  - Role-Based Template * (select dropdown from templates)
  - Template Preview (shows when template selected)
  - Start Date (optional, date picker)
- Footer: Cancel | Create Onboarding
- No corresponding Edit modal exists
- Lines of code: ~502

**Note:** This modal has no Edit counterpart. It is a standalone "create-only" modal.

---

## Summary of Merge Opportunities

| Create/Edit Pair | Lines (Create) | Lines (Edit) | Merged Estimate | Savings |
|------------------|---------------|--------------|-----------------|---------|
| Role Modal | 293 | 280 | ~250 | ~323 lines |
| User Modal | 312 | 317 | ~300 | ~329 lines |
| Template Modal | 411 | 471 | ~420 | ~462 lines |
| **Total** | **1016** | **1068** | **~970** | **~1,114 lines** |

## Visible Issues Noted

1. **EditRoleModal missing dark mode classes**: The Edit Role modal has several elements with only light-mode colors (e.g., `text-slate-700`, `bg-slate-50` without `dark:` variants). The Create Role modal has dark mode support.
2. **EditUserModal missing dark mode classes**: Same issue - hardcoded light colors only.
3. **Inconsistent button styling**: Edit Role has `CheckCircle` icon on Update button; Create User has plain text "Create User". No consistent pattern.
4. **Hardcoded profiles**: The User modals have hardcoded profile options (Engineering, Sales, Product, HR, All) instead of pulling from DB.
5. **CreateOnboardingModal is large**: At 502 lines, this is the biggest modal but has no Edit pair, so it is not a merge candidate for this feature.
6. **Delete Role button is permanently disabled**: In EditRoleModal, the delete button has `disabled` hardcoded and no onClick handler.
7. **Metadata display inconsistent**: Only EditRoleModal shows created/updated metadata. EditTemplateModal does not show it.
