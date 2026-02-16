# Visual Findings: no-instance-delete

**Date:** 2026-02-16
**Branch:** zustand-migration-bugfixes
**URL:** http://localhost:5173

---

## New Hires Table - Current State

### Table Structure (7 columns, NO actions column)

| Column | Content |
|--------|---------|
| Name | Employee name (bold, font-medium) |
| Email | Email address (monospace, text-xs) |
| Department | Department name |
| Role | Role badge (blue pill: `bg-brand-100 text-brand-700`) |
| Status | Status badge (color-coded: blue=Active, green=Completed, amber=On Hold) |
| Progress | ProgressBar component with percentage label (w-24) |
| Start Date | Formatted date or dash |

### Current Row Count

- **Total:** 8 onboarding instances
- **Active:** 4 (Bug Test User, Test Refresh User, luke, paul)
- **Completed:** 4 (joe, Test Employee, Sanjay x2)
- **On Hold:** 0

### Status Filter Bar

Four toggle buttons above the table: All (8), Active (4), Completed (4), On Hold (0). Currently "All" is pressed.

---

## Actions Available on Instances

**NONE.** The New Hires table is completely read-only:

1. **No Actions column** - The table has 7 data columns and no actions column
2. **No delete button** - No trash icon anywhere on any row
3. **No edit button** - No pencil/edit icon anywhere on any row
4. **No hover actions** - Hovering over rows shows `hover:bg-slate-50` background only, no action buttons appear
5. **No right-click context menu** - Right-clicking a row shows only the browser's default context menu
6. **No row click navigation** - Clicking on a row does nothing; there is no detail view
7. **No bulk selection** - No checkboxes, no "select all" mechanism
8. **No kebab/more menu** - No "..." or three-dot menu on any row

The component (`src/components/manager/NewHiresPanel.tsx`) is explicitly documented as a "Read-only view of employees going through onboarding."

---

## Existing Delete Patterns in the App

### Roles Tab (`RoleManagementPanel.tsx`)

- **Actions column** with Edit (pencil) and Delete (trash) icon buttons per row
- Button styling: `p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors`
- Uses `Trash2` icon from `lucide-react` at `size={18}`
- Aria label: `Delete role ${role.name}`
- On click: Opens `DeleteConfirmationDialog`

### Users Tab (`UsersPanel.tsx`)

- **Actions column** (right-aligned) with Edit and Delete icon buttons per row
- Same button styling and icon as Roles
- Aria label: `Delete user ${u.name}`
- On click: Opens `DeleteConfirmationDialog`

### DeleteConfirmationDialog (Reusable Component)

- Located at: `src/components/ui/DeleteConfirmationDialog.tsx`
- Full-screen overlay with centered dialog
- Warning icon (`AlertTriangle` from lucide) in a colored circle
- Title, descriptive message, Cancel and Delete buttons
- Delete button is red (`bg-red-600`) when `isDangerous={true}`
- Supports loading state with spinner and "Deleting..." text
- Proper a11y: `role="alertdialog"`, `aria-labelledby`, `aria-describedby`

### Props interface:
```typescript
{
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;   // default "Delete"
  cancelLabel?: string;    // default "Cancel"
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isDangerous?: boolean;   // default true
}
```

---

## Backend / Service Layer Status

- `src/services/supabase/instanceService.ts` has NO `deleteOnboardingInstance` function
- The Zustand store has `_addInstance` but no `_removeInstance`
- The `useOnboardingInstances` hook returns `{ data, isLoading, error }` only (no mutation functions)
- The `crudFactory` (if applicable) would need a `delete` operation added

---

## UI Pattern the Delete Feature Should Follow

Based on Roles and Users, the delete feature for instances should:

1. Add an **"Actions" column** (right-aligned header) to the New Hires table
2. Add a **trash icon button** (`Trash2`, size 18) per row with:
   - Styling: `p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg`
   - Aria label: `Delete instance for ${instance.employeeName}`
3. On click, show `DeleteConfirmationDialog` with:
   - Title: "Delete Onboarding Instance"
   - Message: `Are you sure you want to delete the onboarding instance for "${name}"? This will permanently remove all onboarding steps and progress. This action cannot be undone.`
   - `isDangerous={true}`
4. Backend: Add `deleteOnboardingInstance(id)` to instanceService.ts
5. Store: Add `_removeInstance(id)` to the InstancesSlice (optimistic removal)
6. Hook: Expose a `deleteInstance` function from the hook or use store directly

---

## Screenshots Captured

| File | Description |
|------|-------------|
| `01-new-hires-table-full.png` | Full page screenshot - was accidentally showing Users tab |
| `02-new-hires-table-active.png` | Full New Hires table with all 8 rows, status filter, 7 columns, NO actions |
| `03-row-hover-state.png` | Row hover state - no action buttons appear |
| `04-right-click-row.png` | Right-click on row - no custom context menu |
| `05-dashboard-view.png` | Dashboard tab - KPIs, activity feed, no instance actions |
| `06-roles-table-with-actions.png` | Roles table showing the existing Actions column with Edit + Delete icons |
| `07-roles-delete-confirmation-dialog.png` | Delete confirmation dialog for roles (pattern to follow) |

---

## Console Errors

All errors are known Realtime channel timeouts (WebSocket connection issues), not related to the New Hires feature:

- `[Realtime] Channel instances-all timed out`
- `[Realtime] Channel suggestions-all timed out`
- `[Realtime] Channel activities-all timed out`
- `[Realtime] Channel roles-all timed out`
- `[Realtime] Channel templates-all timed out`
- `[Realtime] Channel users-all timed out`
