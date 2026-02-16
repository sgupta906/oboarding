# Pipeline Status

> **Claude: READ THIS FILE FIRST on every new session.**

---

## Current State

**Current Feature:** `zustand-steps`
**Current Phase:** Awaiting /research
**Next Command:** `/research zustand-steps`

### Pipeline Progress
- [ ] /research
- [ ] /plan
- [ ] /implement
- [ ] /test (with mandatory Playwright functional testing)
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
| 2 | `zustand-steps` | Steps slice | Add `steps` slice to store, migrate `useSteps`. Fixes `step-button-fix` (optimistic update race). | **Next** |
| 3 | `zustand-users` | Users slice | Add `users` slice, migrate `useUsers`. Eliminates duplicate user subscriptions. | Queued |
| 4 | `zustand-activities` | Activities + suggestions slices | Add remaining slices, migrate `useActivities`, `useSuggestions`. Eliminates prop drilling for suggestions. | Queued |
| 5 | `zustand-cleanup` | Remove old hooks + slim OnboardingHub | Delete migrated hooks, slim god component to thin router. Final cleanup pass. | Queued |

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
