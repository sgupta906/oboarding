# Pipeline Status

> **Claude: READ THIS FILE FIRST on every new session.**

---

## Current State

**Current Feature:** cleanup
**Current Phase:** not-started
**Next Command:** `/research cleanup`

### Pipeline Progress
- [ ] /research  - Not started
- [ ] /plan      - Not started
- [ ] /implement - Not started
- [ ] /test      - Not started
- [ ] /finalize  - Not started

---

## Migration Plan: Firebase → Supabase

This is a multi-feature refactor. Each feature goes through the full pipeline in order:

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 1 | `cleanup` | Remove Firebase deps, dead code, simplify codebase | **NEXT** (queued) |

---

## Completed Features

| # | Feature | Completed | Commit | Summary |
|---|---------|-----------|--------|---------|
| 1 | `supabase-setup` | 2026-02-14 | 28ea803 | Added Supabase infrastructure: 16-table database schema, typed client, migrations, RLS, indexes, and triggers. Zero existing code modified. |
| 2 | `supabase-data-layer` | 2026-02-14 | 9efdfed | Replaced monolithic Firebase services (dataClient.ts 2,084 lines, userOperations.ts 1,025 lines) with 8 modular Supabase services. Added type mapper layer, lazy-init client. 651/654 tests passing, zero TS errors. |
| 3 | `supabase-auth` | 2026-02-14 | eade899 | Replaced Firebase Auth with Supabase Auth. Rewrote authService.ts and authContext.tsx, removed 3 deprecated types, renamed env var to VITE_USE_DEV_AUTH. 9 files changed (-94 net lines), 654/654 tests passing, zero TS errors. |
| 4 | `supabase-realtime` | 2026-02-14 | 7f6a9a0 | Enabled Supabase Realtime for all 16 tables. Added subscribeToSuggestions, converted useSuggestions from polling to subscription. Cleaned up stale Firebase/Firestore/dataClient references in 5 files. 9 files changed, 652/653 tests passing, zero TS errors. |

---

## What To Do

The `supabase-realtime` feature is finalized and committed (7f6a9a0).

**Next feature:** `cleanup`
**Next step:** Run `/research cleanup` to gather context for the final migration step.

This is the last feature in the Firebase → Supabase migration. After cleanup completes, the migration will be done and the codebase will be fully on Supabase with no Firebase dependencies.

---

## How To Update This File

After each pipeline step, update:

1. **Current Phase** to the completed step
2. **Next Command** to the next step
3. **Pipeline Progress** checkboxes

When feature completes (`/finalize` done):
1. Add to Completed Features table
2. Set Current Feature to next feature
3. Reset Pipeline Progress checkboxes
4. Set Next Command to next feature
