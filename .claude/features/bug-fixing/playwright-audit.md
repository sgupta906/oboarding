# OnboardHub Playwright Bug Audit Report

**Date:** 2026-02-14
**Tester:** Claude (Automated QA via Playwright MCP)
**Environment:** Dev server at http://localhost:5173 (Vite + React 18)
**Supabase Instance:** ecnshfhpgwjxvuybewth.supabase.co (us-west-2)

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH | 7 |
| MEDIUM | 6 |
| LOW | 5 |
| **TOTAL** | **21** |

---

## CRITICAL Bugs

### BUG-001: Supabase Realtime WebSocket Connection Fails

- **Severity:** CRITICAL
- **Category:** Functional / Infrastructure
- **Description:** The Supabase Realtime WebSocket connection fails on every page load. This is the ROOT CAUSE of multiple other bugs (BUG-002, BUG-003). The connection closes before it's established, meaning all real-time subscriptions are dead. The app falls back to initial fetch only -- mutations never trigger UI updates.
- **Steps to reproduce:** Load any page. Check console warnings.
- **Expected:** WebSocket connection to Supabase Realtime should establish and maintain.
- **Actual:** `WebSocket connection to 'wss://ecnshfhpgwjxvuybewth.supabase.co/realtime/v1/websocket?apikey=...' failed: WebSocket is closed before the connection is established.`
- **Console errors:** WARNING on every page load/navigation.
- **Root Cause:** The WebSocket connection attempt happens but closes before handshake completes. This may be because the anonymous key lacks Realtime permissions, or the Realtime feature is not enabled on the Supabase project, or RLS policies block the subscription.
- **Impact:** All CRUD operations succeed on the backend but the UI never updates to reflect changes. Users must manually navigate away and back to see results.
- **Screenshot:** N/A (console warning)
- **File:** `src/services/supabase/roleService.ts:202-224` (subscribeToRoles), `src/hooks/useRoles.ts:54-82`

### BUG-002: Role List Does Not Refresh After Create

- **Severity:** CRITICAL
- **Category:** Functional
- **Description:** After creating a role, the modal closes but the new role does NOT appear in the roles table. The POST request returns 201 (success), but the Realtime subscription (which is broken, see BUG-001) never notifies the UI. User must navigate to another tab and back to see the new role.
- **Steps to reproduce:**
  1. Sign in as Manager
  2. Go to Roles tab
  3. Click "Add New Role"
  4. Enter name "Test Role" and description "Testing"
  5. Click "Create Role"
- **Expected:** New role appears immediately in the table after creation.
- **Actual:** Modal closes, table stays unchanged. Role only appears after navigating away and back (~9 seconds total wait observed, though this includes modal interaction time).
- **Console errors:** None (no error, just silent failure to update)
- **Network:** POST /roles returns 201 successfully.
- **Screenshot:** `04-roles-tab.png` (before), then role missing after creation
- **File:** `src/hooks/useRoles.ts:84-106` (createRole relies on Realtime)

### BUG-003: Role List Does Not Refresh After Delete

- **Severity:** CRITICAL
- **Category:** Functional
- **Description:** After deleting a role via the confirmation dialog, the role remains visible in the table. The DELETE request returns 204 (success), but the UI does not update. Same root cause as BUG-002.
- **Steps to reproduce:**
  1. Sign in as Manager
  2. Go to Roles tab
  3. Click trash icon on a role
  4. Confirm deletion in dialog
- **Expected:** Role disappears from the table immediately.
- **Actual:** Role remains in the table. Only disappears after full page reload or navigation.
- **Console errors:** None
- **Network:** DELETE /roles?id=eq.{uuid} returns 204 successfully.
- **Screenshot:** `07-delete-confirmation.png`
- **File:** `src/hooks/useRoles.ts:131-144` (deleteRole relies on Realtime)

---

## HIGH Bugs

### BUG-004: All Modals Use Light Theme in Dark Mode

- **Severity:** HIGH
- **Category:** Visual
- **Description:** Every modal dialog in the application renders with a white/light background regardless of the dark mode setting. This creates a jarring visual contrast and makes the modals look broken in dark mode. Affected modals include:
  - Create New Role modal
  - Edit Role modal
  - Delete Role confirmation dialog
  - Add System User modal
  - Create Template modal
  - Edit Template modal
  - Add New Employee Onboarding modal
- **Steps to reproduce:**
  1. Sign in as Manager
  2. Ensure dark mode is active (default)
  3. Open any modal (e.g., "Add New Role")
- **Expected:** Modal should use dark theme colors matching the rest of the UI.
- **Actual:** Modal has white background, light input fields, and light text -- visually inconsistent with the dark app behind it.
- **Screenshots:** `05-create-role-modal.png`, `06-edit-role-modal.png`, `07-delete-confirmation.png`, `09-new-user-modal.png`, `11-create-template-modal.png`, `12-edit-template-modal.png`, `15-new-hire-modal.png`

### BUG-005: Edit Template Modal Shows Profiles Instead of Roles

- **Severity:** HIGH
- **Category:** Functional / Data
- **Description:** The "Edit Template" modal shows a DIFFERENT set of role options than the "Create Template" modal. The Create modal correctly shows actual roles from the `roles` table (Engineering, QA Engineer, aert, etc.), but the Edit modal shows profile names (Engineering, Sales, Product, HR, Operations, Design, Marketing) which come from a different data source (likely hardcoded or from a profiles table).
- **Steps to reproduce:**
  1. Sign in as Manager
  2. Go to Templates
  3. Click "Edit" on the Engineering template
  4. Look at "Applicable Roles" checkboxes
  5. Compare with "Create Template" modal roles
- **Expected:** Both modals should show the same set of roles from the roles table.
- **Actual:** Create modal shows: Engineering, QA Engineer, aert, software engineer, fgs. Edit modal shows: Engineering, Sales, Product, HR, Operations, Design, Marketing.
- **Screenshot:** `11-create-template-modal.png` vs `12-edit-template-modal.png`

### BUG-006: Edit Template Roles Not Pre-Selected

- **Severity:** HIGH
- **Category:** Functional
- **Description:** When editing a template that is assigned to a role (e.g., "aert"), the role checkbox is not pre-selected in the edit modal. All checkboxes appear unchecked regardless of the template's current role assignment.
- **Steps to reproduce:**
  1. Sign in as Manager
  2. Go to Templates
  3. Click "Edit" on the Engineering template (which shows "aert" as its role)
  4. Look at the role checkboxes
- **Expected:** The "aert" role checkbox should be checked.
- **Actual:** All role checkboxes are unchecked.
- **Screenshot:** `12-edit-template-modal.png`

### BUG-007: created_by Field Set to "system" Instead of User UUID

- **Severity:** HIGH
- **Category:** Functional / Data Integrity
- **Description:** Roles created via the UI have their `created_by` field set to the string "system" instead of the actual user's UUID. The Edit Role modal shows "Created by: system". This breaks data integrity and any auditing functionality.
- **Steps to reproduce:**
  1. Sign in as Manager
  2. Create a role
  3. Edit the role -- check "Created by" field
- **Expected:** "Created by: {user UUID or email}"
- **Actual:** "Created by: system"
- **Root Cause:** `useRoles` hook passes `user?.uid` which may be undefined in dev auth mode. The fallback chain is `createdBy ?? userId ?? null` in createRole, but then `mappers.ts` converts null to "system" on read.
- **Screenshot:** `06-edit-role-modal.png`
- **File:** `src/hooks/useRoles.ts:93`, `src/services/supabase/mappers.ts:213`

### BUG-008: Redundant API Requests on Every Tab Switch

- **Severity:** HIGH
- **Category:** Performance
- **Description:** The app makes redundant API calls when switching between tabs. The roles endpoint is called 4+ times when navigating to the Roles tab. The employee onboarding instances endpoint is called 4 times when loading the employee view. Each subscription teardown and recreation triggers fresh fetches.
- **Steps to reproduce:**
  1. Sign in as Manager
  2. Open browser DevTools Network tab
  3. Click between Dashboard, Roles, Users tabs
  4. Observe duplicate GET requests
- **Expected:** At most 1 GET request per data type when switching tabs.
- **Actual:** 4+ duplicate GET requests for the same endpoint.
- **Network evidence:** `GET /roles?select=*` appears 4 times on initial Roles tab load. `GET /onboarding_instances?...&employee_email=eq.test-employee@example.com` appears 4 times on employee view load.
- **Root Cause:** Each component mount/unmount cycle triggers a new subscription with an initial fetch. React StrictMode double-invocation may compound this.

### BUG-009: Delete Role Button Disabled in Edit Modal

- **Severity:** HIGH
- **Category:** UX / Functional
- **Description:** The "Delete Role" button in the Edit Role modal is permanently disabled. Users cannot delete a role from the edit view, only from the table's trash icon. This is confusing because the button is visible but non-functional.
- **Steps to reproduce:**
  1. Sign in as Manager
  2. Go to Roles tab
  3. Click Edit on any role
  4. Look at the "Delete Role" button in the modal footer
- **Expected:** Delete button should be enabled (or not shown at all if not supported).
- **Actual:** Delete button is disabled/grayed out with no explanation.
- **Screenshot:** `06-edit-role-modal.png`

### BUG-010: Duplicate Navbar in Employee View (Manager Toggle)

- **Severity:** HIGH
- **Category:** UX / Visual
- **Description:** When a Manager switches to Employee View via the nav pill, the employee sees TWO navigation bars and TWO "Sign Out" buttons. The main app navbar persists at the top, and a secondary "Employee View / Active Onboarding" header appears below it. This is confusing and wastes vertical space.
- **Steps to reproduce:**
  1. Sign in as Manager
  2. Click "Employee View" in the nav pill
  3. Select an employee from the dropdown
- **Expected:** Single consistent navigation bar.
- **Actual:** Two navigation bars stacked vertically, each with its own Sign Out button.
- **Screenshot:** `14-employee-view-selected.png`

---

## MEDIUM Bugs

### BUG-011: Role Name Cannot Be Edited

- **Severity:** MEDIUM
- **Category:** UX
- **Description:** The Edit Role modal has the role name field set to read-only with a note "Role names cannot be changed to prevent duplicate entries." This is a poor UX choice -- duplicate checking should be done at save time, not by disabling the field entirely. Users who make a typo in a role name must delete the role and recreate it.
- **Steps to reproduce:** Edit any role -- name field is disabled.
- **Expected:** Role name should be editable with server-side duplicate validation.
- **Actual:** Role name is permanently read-only.
- **Screenshot:** `06-edit-role-modal.png`

### BUG-012: Admin Login Identical to Manager Login

- **Severity:** MEDIUM
- **Category:** Functional
- **Description:** Signing in as Admin shows the exact same UI as signing in as Manager. There is no admin-specific functionality, no user management page, no system settings, and no visual indication that the user has admin privileges. The three login roles (Employee, Manager, Admin) suggest differentiated experiences, but Admin = Manager.
- **Steps to reproduce:**
  1. Sign out
  2. Sign in as Admin
  3. Compare with Manager view
- **Expected:** Admin should have additional capabilities (e.g., user management, system settings, audit logs).
- **Actual:** Identical to Manager view in every way.
- **Screenshot:** `20-admin-login.png`

### BUG-013: Light Mode Background Color Inconsistency

- **Severity:** MEDIUM
- **Category:** Visual
- **Description:** In light mode, the area below the main content has a brownish/beige tint instead of matching the white/light-gray of the content area above. This creates a two-tone effect that looks unfinished.
- **Steps to reproduce:**
  1. Sign in as Manager
  2. Switch to light mode
  3. Look at the lower portion of the page below content
- **Expected:** Uniform background color throughout the page.
- **Actual:** White content area transitions to a brownish/beige area below.
- **Screenshot:** `17-dashboard-light-fullpage.png`

### BUG-014: Manager Default View Shows Dashboard (Not Employee View After Login)

- **Severity:** MEDIUM
- **Category:** UX
- **Description:** When a Manager logs in, they land on the Manager View (Dashboard tab) with the "Manager View" pill active. This is correct behavior in isolation, but the previous audit noted this as an issue where Managers were accidentally landing on Employee View. The current behavior (Manager View as default) appears to be correct now.
- **Actual finding:** The "Dashboard" sub-tab is selected by default, which is correct. However, there is no visual indication of the currently logged-in user's name or role anywhere in the UI.
- **Steps to reproduce:** Sign in as Manager.
- **Expected:** User should see their name/email and role somewhere in the UI.
- **Actual:** No user identity displayed anywhere -- just "OnboardHub" and navigation options.

### BUG-015: No Loading Spinner During Role CRUD Operations

- **Severity:** MEDIUM
- **Category:** UX
- **Description:** When creating, updating, or deleting a role, there is no loading spinner or visual feedback during the API call. The button state doesn't change to "loading." Combined with BUG-002/003 (list doesn't refresh), users have no idea if their action succeeded.
- **Steps to reproduce:**
  1. Create a role
  2. Watch the Create Role button -- no spinner appears
  3. After modal closes, no success toast or confirmation
- **Expected:** Loading spinner on button, then success toast/notification.
- **Actual:** Button clicks, modal closes after a delay, no feedback.

### BUG-016: No Success/Error Toast Notifications

- **Severity:** MEDIUM
- **Category:** UX
- **Description:** The application has no toast/notification system. After any CRUD operation (create role, delete role, create template, etc.), there is no visual confirmation of success or failure. Users rely entirely on seeing the data change in the UI -- which doesn't work due to the Realtime bug.
- **Steps to reproduce:** Perform any CRUD action.
- **Expected:** Toast notification showing "Role created successfully" or "Error: ..."
- **Actual:** No notification of any kind.

---

## LOW Bugs

### BUG-017: Junk Test Data in Production Database

- **Severity:** LOW
- **Category:** Data Quality
- **Description:** The database contains obviously junk test data from previous testing sessions. Roles named "aert", "fgs", "software engineer" (with typo description "softawf erngie"), and an employee named "asdf" with role "sdfgsdfg" all appear in the UI.
- **Steps to reproduce:** Navigate to Roles tab or Employee View dropdown.
- **Expected:** Clean demo data or empty database.
- **Actual:** Junk entries from manual testing.

### BUG-018: Sign In Button Disabled Without Clear Validation Message

- **Severity:** LOW
- **Category:** UX
- **Description:** The "Sign In" button on the login page is disabled by default with no explanation of why. There's no inline validation error message saying "Email is required." Users must figure out they need to type an email first.
- **Steps to reproduce:** Load the sign-in page.
- **Expected:** Clear validation message or the button should show an error on click.
- **Actual:** Button is just grayed out with no explanation.
- **Screenshot:** `01-signin-page.png`

### BUG-019: Employee Dropdown Shows All Employees (Privacy Issue)

- **Severity:** LOW
- **Category:** UX / Security
- **Description:** When a Manager switches to Employee View, there's a dropdown showing ALL employees with their names and completion percentages. This might be intentional for Managers, but the dropdown text format "asdf (sdfgsdfg) - 0% complete" leaks employee progress data in an uncontrolled way.
- **Steps to reproduce:**
  1. Sign in as Manager
  2. Click "Employee View"
  3. Open the dropdown
- **Expected:** More controlled employee selection (e.g., just names).
- **Actual:** Names, roles, and completion percentages all visible in a raw dropdown.
- **Screenshot:** `13-employee-view-from-manager.png`

### BUG-020: Dark Mode Toggle Has No Transition Animation

- **Severity:** LOW
- **Category:** Visual / Polish
- **Description:** When toggling between light and dark mode, the change is instantaneous with no transition. This creates a harsh visual flash, especially in dark environments.
- **Steps to reproduce:** Click the sun/moon icon to toggle dark mode.
- **Expected:** Smooth CSS transition (200-300ms) on background and text colors.
- **Actual:** Instant snap between themes.

### BUG-021: Activity Feed Shows "just now" for All Items

- **Severity:** LOW
- **Category:** Functional / Data
- **Description:** All activity feed items show "just now" as their timestamp, regardless of when the activity actually occurred. This suggests the timestamp is being generated client-side at render time rather than stored in the database, or the mock data has no real timestamps.
- **Steps to reproduce:** Sign in as Manager, look at Activity Feed on Dashboard.
- **Expected:** Relative timestamps (e.g., "2 hours ago", "yesterday").
- **Actual:** All items show "just now."
- **Screenshot:** `02-manager-dashboard.png`

---

## Additional Observations (Not Bugs)

### OBS-001: Role Search Works Correctly
The search filter on the Roles tab correctly filters roles by name and description in real-time. This is working as expected.

### OBS-002: Employee Route Protection Works
An employee user cannot access `#/templates` -- the app redirects back to `#/` and shows the Employee View. Route protection is working.

### OBS-003: Sign-Out Flow Works Well
The sign-out flow is smooth: shows a "You're signed out" page with a 1-second auto-redirect back to sign-in. The "Return to Sign In" button also works as a manual override.

### OBS-004: Template Card Display Works
Template cards on the Templates page display correctly with role badges, step count, creation date, and action buttons (Edit, Duplicate, Delete).

### OBS-005: KPI Cards Display Real Data
The dashboard KPI cards show real data from Supabase (1 Active Onboarding, 0 Stuck Employees, 0 Doc Feedback).

---

## Recommended Fix Priority

### Phase 1 - Critical Infrastructure (MUST FIX FIRST)
1. **BUG-001:** Fix Supabase Realtime WebSocket connection OR add optimistic UI updates / manual refetch after mutations
2. **BUG-002 + BUG-003:** These are resolved if BUG-001 is fixed. If Realtime can't be fixed quickly, add `refetch()` calls after each mutation as a workaround.

### Phase 2 - Dark Mode & Visual Consistency
3. **BUG-004:** Add dark mode support to all modal components
4. **BUG-013:** Fix light mode background color

### Phase 3 - Data & Functionality Fixes
5. **BUG-005:** Fix Edit Template modal to use roles (not profiles)
6. **BUG-006:** Fix Edit Template to pre-select current role assignments
7. **BUG-007:** Fix created_by to use actual user UUID
8. **BUG-009:** Either enable or remove the Delete button in Edit Role modal
9. **BUG-010:** Remove duplicate navbar from Employee View when accessed via Manager toggle

### Phase 4 - UX Polish
10. **BUG-008:** Deduplicate redundant API requests
11. **BUG-015 + BUG-016:** Add loading states and toast notifications
12. **BUG-011:** Allow role name editing with validation
13. **BUG-014:** Show current user identity in UI
14. **BUG-012:** Differentiate Admin from Manager (or remove Admin option if not needed)

### Phase 5 - Cleanup
15. **BUG-017:** Clean junk test data from database
16. **BUG-018 - BUG-021:** Minor UX polish items

---

## Screenshots Index

All screenshots saved to `/workspaces/onboarding/.claude/screenshots/bug-fixing/`:

| File | Description |
|------|-------------|
| `01-signin-page.png` | Sign-in page (clean) |
| `02-manager-dashboard.png` | Manager dashboard dark mode |
| `03-manager-dashboard-light.png` | Manager dashboard light mode |
| `04-roles-tab.png` | Roles tab with existing roles |
| `05-create-role-modal.png` | Create Role modal (light in dark mode) |
| `06-edit-role-modal.png` | Edit Role modal (shows "system" creator) |
| `07-delete-confirmation.png` | Delete confirmation dialog (light in dark mode) |
| `08-users-tab.png` | Users tab empty state |
| `09-new-user-modal.png` | Add System User modal |
| `10-templates.png` | Templates page with one template |
| `11-create-template-modal.png` | Create Template modal |
| `12-edit-template-modal.png` | Edit Template modal (wrong roles listed) |
| `13-employee-view-from-manager.png` | Employee View via Manager toggle (empty) |
| `14-employee-view-selected.png` | Employee View with employee selected (dual navbar) |
| `15-new-hire-modal.png` | New Hire onboarding modal |
| `16-dashboard-light-mode.png` | Dashboard in light mode |
| `17-dashboard-light-fullpage.png` | Full page light mode (shows background issue) |
| `18-sign-out-page.png` | Sign-out confirmation page |
| `19-employee-login.png` | Employee login empty state |
| `20-admin-login.png` | Admin login (identical to Manager) |

---

## Network Request Summary

### Successful Requests
- All GET requests return 200
- POST /roles returns 201 (creates successfully)
- DELETE /roles returns 204 (deletes successfully)

### Failed Connections
- WebSocket to Supabase Realtime: FAILS on every page load

### Redundant Requests
- GET /roles?select=* called 4x on Roles tab load
- GET /onboarding_instances called 4x on Employee View load
- GET /templates called 2x on Template page load

### Console Error Summary
- **Errors:** 0 across entire session
- **Warnings:** WebSocket failure warning on every page load (1-2 per navigation)
- **Info:** React DevTools suggestion, dev auth impersonation logs
