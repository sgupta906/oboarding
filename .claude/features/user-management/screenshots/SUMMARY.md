# User Management Visual Research Summary

Date: 2026-02-14
Screenshots: 21 files captured in this directory

---

## Current State of User Management

### What Exists

The app already has a **substantial user management system** implemented across the Manager View's "Users" tab. Here is what is currently built:

#### 1. Users Tab (Manager View > Users)
- **Location**: Manager View, third tab after "Dashboard" and "Roles"
- **Component**: `src/components/manager/UsersPanel.tsx` (635 lines)
- **Hook**: `src/hooks/useUsers.ts` (126 lines)
- **Service**: `src/services/supabase/userService.ts` (438 lines)
- **Features**:
  - "User Administration" header with icon and description
  - "New User" button (blue, top-right) opens a modal for adding system users (managers, admins, contractors)
  - Info banner: "Tip: Use 'New User' to add managers, admins, or contractors. Use 'New Hire' on the Dashboard to onboard employees with guided onboarding steps."
  - Empty state: "No users yet / Create your first user to get started" with an icon
  - When populated, shows two tables:
    - **Employees table**: Name, Email, Roles, Status (Active/Completed/On Hold), Progress (%), Start Date, Actions (edit/delete)
    - **Administrators & Managers table**: Name, Email, Roles, Profiles, Actions (edit/delete)
  - Filter toggle for employees: "All Employees" | "Currently Onboarding (N)"
  - Uses `useOnboardingInstances()` to look up onboarding status by email

#### 2. Add System User Modal
- **Title**: "Add System User"
- **Info box** (yellow): "Add a manager, admin, or contractor to the system. This does NOT create an onboarding journey."
- **Fields**: Email (required), Full Name (required), System Roles (checkboxes, required), Profiles (optional checkboxes)
- **Actions**: Cancel, Create User

#### 3. Add New Employee Onboarding Modal (Dashboard tab)
- **Title**: "Add New Employee Onboarding"
- **Info box** (yellow): "This creates a guided onboarding journey for a new employee."
- **Fields**: Employee Name (required), Email Address (required), Role (dropdown), Department (text), Role-Based Template (dropdown)
- **Actions**: Cancel, Create Onboarding

#### 4. Delete Capability
- **DeleteConfirmationDialog** component exists and is wired up
- Delete buttons (trash icon) appear in both employee and admin tables
- Custom delete messages warn about associated onboarding data
- Service layer (`deleteUser`) handles cascading deletion of onboarding instances, junction tables, and auth credentials

#### 5. Edit Capability
- Edit button (pencil icon) in both tables
- Opens `UserModal` in "edit" mode
- Service layer handles updating user rows, roles junction, and profiles junction

#### 6. Real-time Updates
- `subscribeToUsers()` provides real-time subscription to user changes
- Optimistic updates for edit operations with rollback on error
- Immediate local state updates for create and delete

### What's Missing / Broken

1. **Users tab shows "No users yet"** even though there are 3 active onboarding instances visible in the Dashboard KPI cards (Active Onboardings: 3). This suggests the `users` table in Supabase is empty or the subscription is returning no data, even though onboarding instances exist. The two concepts (system users vs onboarding instances) appear to be disconnected.

2. **No list of onboarding employees visible from the Users tab**: Although the code supports showing employees with onboarding status, the table is empty because no `users` rows exist. Onboarding instances appear to be created without corresponding entries in the `users` table.

3. **Employee View is minimal**: Just a dropdown selector ("Select Employee Onboarding") with three employees listed by name and progress. No rich employee list, no management capabilities.

4. **No search/filter on the Users tab** (unlike the Roles tab which has a search bar)

5. **No pagination** for users - could become an issue at scale

6. **The "New Hire" flow creates onboarding instances but may not create user rows**, leading to the disconnect between Dashboard KPIs (which read from `onboarding_instances`) and the Users tab (which reads from the `users` table)

---

## UI Patterns Observed (Design System Reference)

### Navigation
- **Top-level nav**: Horizontal button group in header (Employee View / Manager View / Templates), with active state using `bg-white shadow` (light) or `bg-slate-800` (dark)
- **Sub-tabs**: Horizontal tabs with bottom border highlight (`border-brand-600 text-brand-600` for active, `border-transparent text-slate-600` for inactive)
- **Dark mode toggle**: Icon button in header (moon icon in light mode, sun icon in dark mode)

### Layout
- **Max width**: `max-w-7xl mx-auto px-4`
- **Content sections**: Wrapped in `bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6`
- **Asymmetric grid**: `grid-cols-[2fr_1fr]` for dashboard layout

### Tables (Roles tab reference)
- **Container**: `bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden`
- **Header**: `bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600`
- **Header cells**: `px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200`
- **Body rows**: `divide-y divide-slate-200 dark:divide-slate-600` with `hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors`
- **Cell padding**: `px-6 py-4`
- **Action buttons** (Roles): Icon-only buttons with `aria-label`, using `p-2 rounded-lg transition-colors`:
  - Edit: `text-slate-600 hover:text-brand-600 hover:bg-brand-50` with pencil icon
  - Delete: `text-slate-600 hover:text-red-600 hover:bg-red-50` with trash icon

### Buttons
- **Primary**: `bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700`
- **Destructive**: `text-red-600 hover:bg-red-50` (icon buttons)
- **Filter toggle**: `px-3 py-1.5 text-xs font-medium` in a grouped border container

### Modals
- **Overlay**: Blurred/dimmed background
- **Container**: White card, rounded, with close X button top-right
- **Info boxes**: Yellow/amber background with informational text
- **Form fields**: Labeled with asterisk for required, standard input styling
- **Actions**: Right-aligned footer with Cancel (text) and Submit (primary button)

### Status Badges
- **Active**: `bg-blue-100 text-blue-700` / dark: `bg-blue-900/40 text-blue-300`
- **Completed**: `bg-emerald-100 text-emerald-700` / dark: `bg-emerald-900/40 text-emerald-300`
- **On Hold**: `bg-amber-100 text-amber-700` / dark: `bg-amber-900/40 text-amber-300`
- **Role badges**: `bg-brand-100 text-brand-700` / dark: `bg-brand-900/40 text-brand-300`

### Empty States
- Centered icon (muted color, `w-12 h-12`)
- Bold message line
- Lighter sub-message
- Optional CTA button

### Cards (KPI)
- Left-colored border (`border-l-4`)
- Icon in colored circle (top-right)
- Large number, label text, optional status line

### Colors
- **Brand**: `brand-600` (blue, used for primary actions and highlights)
- **Success**: `emerald` tones
- **Warning**: `amber` tones
- **Error**: `red` tones
- **Neutral**: `slate` tones throughout

### Dark Mode
- Full support via Tailwind `dark:` variants
- Background transitions: `bg-white` -> `bg-slate-800/900/950`
- Text transitions: `text-slate-900` -> `text-slate-50/100`
- Border transitions: `border-slate-200` -> `border-slate-700`
- Toggle persists via DarkMode context

### Responsive
- Mobile-first with `lg:` breakpoints for grid layouts
- Tables get `overflow-x-auto` for horizontal scrolling
- KPI cards stack vertically on mobile

---

## Screenshots Index

| # | Filename | Description |
|---|----------|-------------|
| 01 | `01-landing-signin.png` | Sign-in page with dev auth buttons (Employee/Manager/Admin) |
| 02 | `02-after-signin-click.png` | After clicking Manager sign-in |
| 04 | `04-manager-dashboard.png` | Manager Dashboard tab - KPIs, feedback, activity |
| 05 | `05-tab-dashboard.png` | Dashboard tab (same as above) |
| 05 | `05-tab-roles.png` | Roles tab - table with Name, Description, Date, Actions (edit/delete) |
| 05 | `05-tab-users.png` | Users tab - empty state with "No users yet" |
| 05 | `05-tab-templates.png` | Templates page - card grid with Edit/Duplicate/Delete |
| 10 | `10-users-tab-detail.png` | Users tab close-up - empty state |
| 11 | `11-new-user-modal.png` | Add System User modal - Email, Name, Roles, Profiles |
| 12 | `12-new-hire-modal.png` | Add New Employee Onboarding modal - Name, Email, Role, Dept, Template |
| 14 | `14-employee-view.png` | Employee View - dropdown to select employee onboarding |
| 15 | `15-users-dark-mode.png` | Users tab in dark mode |
| 16 | `16-dashboard-dark-mode.png` | Dashboard in dark mode |
| 17 | `17-roles-dark-mode.png` | Roles tab in dark mode |
| 20 | `20-mobile-dashboard.png` | Mobile viewport - dashboard (dark mode) |
| 21 | `21-mobile-users.png` | Mobile viewport - users tab (dark mode) |
