# Pipeline Status

> **Claude: READ THIS FILE FIRST on every new session.**

---

## Current State

**Current Feature:** None (idle)
**Current Phase:** idle
**Next Command:** Start next feature from Bug-Fix Roadmap

### Pipeline Progress
- [ ] /research
- [ ] /plan
- [ ] /implement
- [ ] /test (with mandatory Playwright functional testing)
- [ ] /finalize

---

## Bug-Fix Roadmap

Issues found after `new-hires-view` replaced the Users tab without proper functional Playwright testing. Fix one at a time through the full pipeline. **Playwright functional interaction testing is MANDATORY for every /test step.**

### Fix Features (in order)

| # | Feature | Problem | Target Fix | Status |
|---|---------|---------|------------|--------|
| 1 | `restore-users-tab` | Users admin page deleted — managers can't manage system users (create/edit/delete managers, admins, contractors). `useUsers` hook and `userService` are orphaned with no UI. | Add Users tab back alongside New Hires tab (4 tabs: Dashboard, Roles, New Hires, Users) | **COMPLETED** |
| 2 | `step-button-fix` | Employee onboarding step buttons glitch/delay before registering clicks. Optimistic update + 300ms debounce race condition suspected. | Playwright functional test to reproduce, then fix the interaction timing | Queued |
| 3 | `employee-dropdown-sync` | Manager's Employee View dropdown doesn't update progress/status as employees complete steps in real-time. | Verify subscription wiring, fix if broken, Playwright functional test across views | Queued |
| 4 | `realtime-status-sync` | New Hires table progress/status columns may not update in real-time when employees complete steps. Single status value per user should propagate everywhere. | Playwright cross-view functional test: complete step as employee, verify manager views update | Queued |

### Approach
- One feature at a time through the full pipeline
- **Playwright functional testing is MANDATORY** — not just screenshots, but clicking buttons, filling forms, verifying state changes across views
- Each fix gets its own commit on main
- Test agent must interact with the app, not just render-check

---

## Completed Features

| # | Feature | Completed | Commit | Summary |
|---|---------|-----------|--------|---------|
| 1 | `supabase-setup` | 2026-02-14 | 28ea803 | 16-table database schema, typed client, migrations, RLS, indexes, triggers |
| 2 | `supabase-data-layer` | 2026-02-14 | 9efdfed | 8 modular Supabase services replacing monolithic Firebase services |
| 3 | `supabase-auth` | 2026-02-14 | eade899 | Supabase Auth replacing Firebase Auth |
| 4 | `supabase-realtime` | 2026-02-14 | 7f6a9a0 | Realtime subscriptions for all 16 tables |
| 5 | `cleanup` | 2026-02-14 | cd6d82a | Removed all Firebase remnants |
| 6 | `webapp-rework` | 2026-02-14 | 60196e0, ee1309c | Critical bug fixes, dark mode, ShyftSolutions branding |
| 7 | `bug-fixing` | 2026-02-14 | c4e0bbc | Optimistic updates, UX improvements, 30+ fixes |
| 8 | `performance-loading` | 2026-02-14 | a6c8fd8 | Debounced subscriptions, shared channels, query limits |
| 9 | `slim-modals` | 2026-02-15 | 380b709 | Unified 6 modals into 3 mode-based components, -771 lines (37%), +19 tests |
| 10 | `slim-services` | 2026-02-15 | f511dbb | Generic CRUD factory, refactored 8 services, -266 lines (11.3%), +22 tests |
| 11 | `slim-tests` | 2026-02-15 | 15b86c5 | Removed low-value mocked tests, trimmed suite by 56.9%, 297 tests passing across 17 files |
| 12 | `responsive-ux` | 2026-02-14 | 6c90585 | Optimistic updates, fire-and-forget logging, loading states, toast notifications, instance status revert fix |
| 13 | `user-management` | 2026-02-15 | 4a8235e | Onboarding status columns, filter toggle, cascade delete with instance cleanup, +12 tests (332 total) |
| 14 | `new-hires-view` | 2026-02-15 | 45c2555 | Replaced Users tab (636 lines) with New Hires onboarding table (249 lines), status filters, -350 lines, +12 tests (338 total) |
| 15 | `restore-users-tab` | 2026-02-15 | 6bb3343 | Restored Users tab as 4th tab in manager dashboard, UsersPanel component (346 lines) with CRUD operations, +12 tests (350 total) |

---

## How To Update This File

After each pipeline step, update:

1. **Current Phase** to the completed step
2. **Next Command** to the next step
3. **Pipeline Progress** checkboxes

When feature completes (`/finalize` done):
1. Add to Completed Features table
2. Set Current Feature to next trim feature
3. Reset Pipeline Progress checkboxes
