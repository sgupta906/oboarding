# Pipeline Status

> **Claude: READ THIS FILE FIRST on every new session.**

---

## Current State

**Current Feature:** None — awaiting next assignment
**Current Phase:** IDLE
**Next Command:** Choose next bug from roadmap

### Pipeline Progress
- [ ] /research
- [ ] /plan
- [ ] /implement
- [ ] /test
- [ ] /finalize

---

## Architecture Refactor Roadmap

Based on findings in `ARCHITECTURE-FINDINGS.md`. The core problem is **isolated state silos** — 12 hooks with independent `useState`, zero shared state, causing sync bugs across views.

### Migration Strategy: INCREMENTAL — NOT BIG BANG

> **Do NOT rip out all 17 hooks and rewrite everything at once.**
> Migrate one slice of state at a time. Old hooks and new store coexist during transition.
> The app must be fully functional after every slice migration.

Each slice is its own pipeline run (`/research → /plan → /implement → /test → /finalize`).

### Migration Slices (in order)

| # | Feature | Slice | What Migrates | Status |
|---|---------|-------|---------------|--------|
| 1 | `zustand-store` | Store setup + instances slice | Install Zustand, create store with `instances` slice, migrate `useOnboardingInstances` + `useEmployeeOnboarding`. Fixes `realtime-status-sync` and `employee-dropdown-sync`. | **Complete** |
| 2 | `zustand-steps` | Steps slice | Add `steps` slice to store, migrate `useSteps`. Fixes `step-button-fix` (optimistic update race). | **Complete** |
| 3 | `zustand-users` | Users slice | Add `users` slice, migrate `useUsers`. Eliminates duplicate user subscriptions. | **Complete** |
| 4 | `zustand-activities` | Activities + suggestions slices | Add remaining slices, migrate `useActivities`, `useSuggestions`. Eliminates prop drilling for suggestions. | **Complete** |
| 5 | `zustand-cleanup` | Remove old hooks + slim OnboardingHub | Delete useManagerData aggregator, make ManagerView self-contained, slim OnboardingHub from 343 to 256 lines. | **Complete** |

After each slice: old hooks that aren't migrated yet keep working unchanged. Only the migrated slice uses the store.

### Bugs Resolved by `zustand-store`

These are **not separate pipeline features** — they are symptoms of the isolated state silo problem and will be verified as fixed during `zustand-store` testing.

| Bug | Symptom | Why Zustand Fixes It |
|-----|---------|---------------------|
| `step-button-fix` | Employee step buttons glitch/delay before registering | Optimistic updates move to store — no race between local useState and realtime callback |
| `employee-dropdown-sync` | Manager's Employee View dropdown doesn't update in real-time | Dropdown and employee view read from same store slice — update once, visible everywhere |
| `realtime-status-sync` | New Hires table progress/status don't update when employees complete steps | One subscription writes to store, all components (New Hires table, KPIs, dropdown) read from it |

### Additional Improvements (resolve as side effects during refactor)

| Issue | Current Problem | How It Resolves |
|-------|----------------|-----------------|
| Duplicate subscriptions | NewHiresPanel and OnboardingHub both subscribe to instances independently | One subscription per table in the store |
| OnboardingHub god component (343 lines) | State management, event handlers, modal state, derived data all in one file | State + handlers move to store; OnboardingHub becomes thin router |
| Prop drilling (4 levels deep) | Suggestions/callbacks threaded through OnboardingHub → ManagerView → Section → Card | Components call `useStore(s => s.action)` directly |

### Known Bugs — FIX BEFORE CONTINUING ZUSTAND MIGRATION

> **These bugs block the app from being functional. Fix them as `bugfix-round` before `zustand-steps`.**

| # | Bug | Priority | Symptom | Root Cause |
|---|-----|----------|---------|------------|
| 1 | `step-update-400` | **FIXED** | ~~Employee "Mark as Done" fails with HTTP 400~~ | Fixed in commit [pending] - added missing `updated_at` column to `onboarding_instances` table |
| 2 | `realtime-websocket-fail` | **FIXED** | ~~Supabase Realtime WebSocket closes before connecting~~ | Fixed in commit [pending] - implemented dual-track auth so WebSocket receives JWT, added channel status logging for observability. Server-side Realtime config still needs manual verification. |
| 3 | `instance-progress-not-computed` | **FIXED** | ~~After completing a step, instance `progress` stays 0%~~ | Resolved as side effect of Zustand migration — shared store ensures progress recomputation propagates to all views |
| 4 | `newhire-create-no-refresh` | **FIXED** | ~~New Hires table doesn't refresh after creating a hire — only shows after full page reload~~ | Fixed in commit 30a29c7 - added `_addInstance` action to Zustand store, wired `useCreateOnboarding` to push new instance instantly |
| 5 | `manager-markdone-broken` | **FIXED** | ~~"Mark as Done" in manager's Employee View does nothing~~ | Fixed in commit 230b915 - threaded `readOnly` prop through OnboardingHub → EmployeeView → StepTimeline → StepCard → ActionBar. When true, ActionBar shows "View Only" with Eye icon instead of action buttons. |
| 6 | `no-instance-delete` | **FIXED** | ~~No way to delete onboarding instances from New Hires table UI~~ | Fixed in commit 187b7ab - added Actions column with Trash2 delete button, DeleteConfirmationDialog, server-first delete via `_removeInstance` store action, +8 tests (443 total) |

**Priority order:** P0 bugs (1-2) make the entire app non-functional. P1 bugs (3-4) break key workflows. P2-P3 are UX gaps.

### Users Feature Bugs (discovered via Playwright scouting 2026-02-16)

> Full report: `.claude/active-work/users-scouting/bug-report.md`

| # | Bug | Priority | Symptom | Root Cause |
|---|-----|----------|---------|------------|
| 7 | `devauth-uuid-invalid` | **FIXED** | ~~Create User fails: `invalid input syntax for type uuid: "test-test-manager"`~~ | Fixed in commit 846f7d4 - created `src/utils/uuid.ts` with deterministic UUID generation for dev-auth users (`00000000-0000-4000-a000-00000000000X`), added service-layer guards, removed 'unknown' fallbacks. Testing verified all 3 roles generate valid UUIDs, user creation succeeds. |
| 8 | `user-form-clears-on-error` | **FIXED** | ~~UserModal form clears all fields when server returns an error~~ | Fixed in commit 72f5fa2 - re-throw errors in submit handlers so promise rejection prevents `resetForm()` |
| 9 | `users-table-always-empty` | **FIXED** | ~~Users tab shows "No users" despite 8+ active onboarding instances~~ | Fixed in commit 846f7d4 - same root cause as bug 7. Valid UUIDs now allow PostgreSQL queries to succeed. Users table loads correctly and displays data. |
| 10 | `users-error-persists` | **FIXED** | ~~Error banner stays visible after closing create modal~~ | Fixed in commit 72f5fa2 - clear store error on modal close via `reset()` call |
| 11 | `users-tab-hmr-bounce` | **P2 MEDIUM** | Users tab intermittently switches to another tab | Vite HMR triggers `useAuth must be used within AuthProvider` errors, crashes component tree, resets `activeTab` state to default |
| 12 | `users-duplicate-error-display` | **FIXED** | ~~Error shown both inside modal AND behind modal simultaneously~~ | Fixed in commit 72f5fa2 - suppress store error banner while modal is open with `!showCreateModal && editingUser === null` guard |

**Recommended fix order:** Bug 7 first (unblocks 9), then 8, 10, 11, 12.

### Template UI Enhancements (discovered via Playwright scouting 2026-02-16)

> Full report: `.claude/active-work/template-ui-scouting/bug-report.md`

| # | Issue | Priority | Symptom | Root Cause / Fix |
|---|-------|----------|---------|------------------|
| 13 | `template-steps-cramped` | **FIXED** | ~~Steps area shows only ~1.5 steps at a time with real content~~ | Fixed in commit 6879d18 - removed `max-h-96` inner scroll, single ModalWrapper scroll surface |
| 14 | `template-no-step-reorder` | **FIXED** | ~~Cannot insert step between existing steps or reorder~~ | Fixed in commit 6879d18 - added ChevronUp/ChevronDown buttons with boundary conditions |
| 15 | `template-modal-too-narrow` | **FIXED** | ~~Modal cramped for complex templates~~ | Fixed in commit 6879d18 - widened from max-w-lg (512px) to max-w-2xl (672px), 31% wider |
| 16 | `template-description-tiny` | **P2 MEDIUM** | Step description textarea too small and not resizable | `rows={2}` with `resize-none`; needs larger default + resizable |
| 17 | `template-delete-overlap` | **P2 MEDIUM** | Trash icon overlaps step number badge, no delete confirmation | `absolute top-2 right-10` only 24px from badge at `right-2` |
| 18 | `template-no-step-count` | **FIXED** | ~~No "Step X of Y" indicator~~ | Fixed in commit 6879d18 - added step count to section label "Onboarding Steps (N)" and badge per step |
| 19 | `template-no-autoscroll` | **P3 LOW** | New steps added offscreen with no scroll-into-view | Missing `scrollIntoView()` after push |
| 20 | `template-index-as-key` | **FIXED** | ~~Array index used as React key for steps~~ | Fixed in commit 6879d18 - replaced with stable _uid keys from incrementing counter |

### Dark Mode Bugs (discovered via Playwright scouting 2026-02-16)

> Full report: `.claude/active-work/darkmode-scouting/bug-report.md`

| # | Issue | Priority | Component | Problem |
|---|-------|----------|-----------|---------|
| 21 | `darkmode-suggest-edit` | **FIXED** | ~~`SuggestEditModal.tsx`~~ | Fixed in commit 2ab9c7e - added `dark:` Tailwind CSS class variants to all elements (textarea, banners, footer), +8 tests (474 total) |
| 22 | `darkmode-kpi-select` | **FIXED** | ~~`KPISection.tsx`~~ | Fixed in commit 080d095 - added dark: Tailwind CSS class variants, normalized gray->slate palette, +4 tests (508 total) |
| 23 | `darkmode-report-stuck` | **FIXED** | ~~`ReportStuckModal.tsx`~~ | Fixed in commit 080d095 - added dark: variants to all 16 elements (rose alert, blue info, cancel button, text), +5 tests (508 total) |
| 24 | `darkmode-template-delete` | **FIXED** | ~~`DeleteConfirmDialog.tsx`~~ | Fixed in commit 080d095 - added dark: variants to text colors and cancel button, +3 tests (508 total) |
| 25 | `darkmode-action-bar` | **FIXED** | ~~`ActionBar.tsx`~~ | Fixed in commit 080d095 - added dark: variants to all 9 button elements and border, +3 tests (508 total) |
| 26 | `darkmode-step-timeline` | **FIXED** | ~~`StepTimeline.tsx`~~ | Fixed in commit 080d095 - added dark: variants to timeline connectors and completion footer, +3 tests (508 total) |
| 27 | `darkmode-welcome-header` | **FIXED** | ~~`WelcomeHeader.tsx`~~ | Fixed in commit 080d095 - added explicit text-slate-900 bg-white to option elements, +3 tests (508 total) |

### General UI Bugs (discovered via Playwright scouting 2026-02-16)

> Full report: `.claude/active-work/ui-general-scouting/bug-report.md`

| # | Issue | Priority | Symptom | Root Cause |
|---|-------|----------|---------|------------|
| 28 | `modal-stale-form-data` | **FIXED** | ~~Modal forms retain stale data from previous open/close cycles~~ | Fixed in commit 230b915 - added useEffect reset hooks to 5 modals (CreateOnboardingModal, UserModal, RoleModal, TemplateModal, SuggestEditModal) that reset form state when isOpen becomes true. |
| 29 | `navbar-breaks-at-mobile` | **P2 MEDIUM** | At 375px, navbar loses brand name, templates button, dark mode toggle | No hamburger menu or responsive collapse |
| 30 | `employee-selector-exposed` | **P2 MEDIUM** | Employee selector dropdown visible in Employee View + duplicate Sign Out buttons | Manager impersonation tool leaking into employee view |
| 31 | `kpi-count-stale` | **P2 MEDIUM** | KPI "Active Onboardings" shows inconsistent counts between views | Caching or recomputation issue |
| 32 | `dashboard-layout-imbalance` | **P3 LOW** | Documentation Feedback and Live Activity sections unbalanced | Layout proportions off |
| 33 | `activity-initials-only` | **P3 LOW** | Activity feed shows only 2-letter initials, uniform blue — no full names | Missing name display |
| 34 | `template-delete-no-label` | **P3 LOW** | Template delete button has no text label, only icon | Inconsistent with Edit/Duplicate which have labels |
| 35 | `completed-step-strikethrough` | **P3 LOW** | Completed step description uses hard-to-read strikethrough | Poor readability |
| 36 | `no-loading-skeleton` | **P3 LOW** | Plain text "Loading dashboard..." instead of skeleton/spinner | Missing loading state components |

### Low-Priority Cleanup (do incrementally, no dedicated pipeline run)

| Issue | Notes |
|-------|-------|
| Inline Tailwind sprawl (649 className occurrences) | Extract repeated patterns as we touch files during refactor |
| Types grab bag (377 lines in one file) | Co-locate component props or split into entities/props — do during refactor |
| No routing library | Skip for now — 3 routes + tabs works fine. Revisit if more pages added |

### Approach
- **One slice per pipeline run** — never in a half-broken state
- Old hooks and new store coexist during transition
- **Playwright functional testing is MANDATORY** — after each slice, verify the migrated features AND that non-migrated features still work
- Bug verification: `realtime-status-sync` and `employee-dropdown-sync` verified after slice 1, `step-button-fix` verified after slice 2
- Tailwind cleanup and types split done opportunistically as we touch files, not as separate tasks

### Previous Bug-Fix Roadmap (superseded)

| # | Feature | Status |
|---|---------|--------|
| 1 | `restore-users-tab` | **COMPLETED** (commit 6bb3343) |
| 2-4 | `step-button-fix`, `employee-dropdown-sync`, `realtime-status-sync` | **Superseded** — all resolved by `zustand-store` |

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
| 16 | `zustand-store` | 2026-02-15 | [pending] | Zustand store with instances slice, migrated useOnboardingInstances + useEmployeeOnboarding, fixes realtime-status-sync and employee-dropdown-sync bugs, +20 tests (370 total) |
| 17 | `zustand-steps` | 2026-02-16 | [pending] | Steps slice migration, migrated useSteps hook, fixes step-button-fix race condition, per-instanceId subscriptions, +14 tests (384 total) |
| 18 | `zustand-users` | 2026-02-16 | [pending] | Users slice migration, migrated useUsers hook with ref-counted subscriptions, optimistic edit + server-first delete, -58 lines in hook, +14 tests (398 total) |
| 19 | `zustand-activities` | 2026-02-16 | [pending] | Activities and suggestions slices, migrated useActivities + useSuggestions hooks, all 5 store slices complete, +14 tests (412 total) |
| 20 | `zustand-cleanup` | 2026-02-16 | [pending] | Make ManagerView self-contained, delete useManagerData, slim OnboardingHub from 343 to 256 lines (-25%), complete Zustand migration (all 5 slices), +13 tests (425 total) |
| 21 | `step-update-400` | 2026-02-16 | [pending] | Fixed P0 CRITICAL bug - added missing `updated_at` column to `onboarding_instances` table, migration 00008 with backfill, fixes HTTP 400 on step updates (PostgreSQL error 42703) |
| 22 | `realtime-websocket-fail` | 2026-02-16 | [pending] | Fixed P0 CRITICAL bug - dual-track auth for WebSocket (real Supabase session + mock auth coexist), added channel status logging to all Realtime subscriptions, +7 tests (432 total). Server-side config (enable Realtime, apply publication) needs manual verification. |
| 23 | `newhire-create-no-refresh` | 2026-02-16 | 30a29c7 | Fixed P1 HIGH bug - added `_addInstance` action to Zustand store so newly created onboarding instances appear instantly in New Hires table without page reload, +3 tests (435 total) |
| 24 | `no-instance-delete` | 2026-02-16 | 187b7ab | Fixed P3 LOW bug - added delete onboarding instance feature to New Hires table with Actions column, Trash2 button, DeleteConfirmationDialog, server-first delete pattern, success toast, fire-and-forget activity logging, +8 tests (443 total) |
| 25 | `darkmode-suggest-edit` | 2026-02-16 | 2ab9c7e | Fixed P0 CRITICAL bug - added dark mode support to SuggestEditModal with dark: Tailwind class variants for textarea, validation banners, footer text, and Cancel button, +8 tests (474 total) |
| 26 | `template-steps-ux` | 2026-02-16 | 6879d18 | Fixed 5 template UX bugs (#13, #14, #15, #18, #20) - removed inner scroll, added step reorder buttons (ChevronUp/ChevronDown), widened modal 31%, added step count indicators, replaced index-based React keys with stable UIDs, +10 tests (474 total) |
| 27 | `devauth-uuid-invalid` | 2026-02-16 | 846f7d4 | Fixed P0 CRITICAL bugs #7 and #9 - created `src/utils/uuid.ts` with deterministic UUID generation for dev-auth users, added service-layer guards in 5 services, removed 'unknown' fallbacks in UsersPanel/NewHiresPanel, all 3 dev-auth roles now generate valid UUIDs, user creation succeeds, Users table loads correctly, +13 tests (474 total) |
| 28 | `users-error-handling` | 2026-02-16 | 72f5fa2 | Fixed bugs #8, #10, #12 - re-throw errors in submit handlers so form fields retained on server error, clear store error on modal close via reset(), suppress duplicate error banners while modal open, +5 tests (489 total) |
| 29 | `manager-modal-fixes` | 2026-02-16 | 230b915 | Fixed bugs #5 and #28 - threaded readOnly prop through component tree for manager "View Only" mode in Employee View, added useEffect reset hooks to 5 modals for form state cleanup on re-open, +7 tests (508 total) |
| 30 | `darkmode-batch` | 2026-02-16 | 080d095 | Fixed bugs #22-27 - added dark mode support to 6 remaining components (KPISection, ReportStuckModal, DeleteConfirmDialog, ActionBar, StepTimeline, WelcomeHeader), normalized gray->slate in KPISection, added option element styling, +21 tests (508 total) |

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
