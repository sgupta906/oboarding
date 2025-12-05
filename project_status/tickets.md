# Tickets Log

## Agent Instructions
- Tickets use task boxes (`- [ ]`). Leave new tickets unchecked until work starts so we can scan the backlog quickly.
- When you begin a ticket, append `(in progress by YOUR_NAME @ YYYY-MM-DD)` to the line. When you finish, switch the box to `[x]`, remove the in-progress note, and add a short completion note with the date. This keeps the file functioning as both backlog and delivery log.
- Keep completed tickets in place (do not delete them); the checkmark history is part of our audit trail.
- Feel free to add or reprioritize tickets as needs evolve—note the reason for any new ticket so future agents understand the intent.
- Before starting any ticket, skim `CLAUDE.md` and `AGENTS.md` for architecture, style, and workflow expectations.
- Do not move forward to another milestone until the user has approved the current one.
- Keep token usage efficient; break large tasks into smaller tickets when possible.
- Add more tickets per milestone as you identify gaps (coordinate with the user on priority).

### Documentation Policy
- **DO NOT** auto-generate separate summary, report, or status documents (e.g., `MILESTONE_*.md`, `*_REPORT.md`, `*_SUMMARY.md`, `*_GUIDE.md`).
- Keep all documentation in canonical files: `README.md`, `CLAUDE.md`, `AGENTS.md`, `mvp.md`, and this file (`tickets.md`).
- Ticket completion notes must be concise (1-5 sentences) and factual.
- This file serves as both backlog and completion audit trail—treat it as the source of truth.

## Backlog

### Milestone 1 – Project Foundations
- [x] Bootstrap a Vite + React + TypeScript app that mirrors the structure from `exampleCode.js`, migrate the mock component into `src/`, and commit the initial scaffold. (Completed 2025-11-23 - Created Vite+React+TS scaffold, installed lucide-react, dev server verified)
- [x] Configure Tailwind CSS, PostCSS, and base theme tokens (colors, spacing) so both Employee and Manager views can share utilities. (Completed 2025-11-23 - Installed Tailwind 3.4.18 with custom brand/status palette + component utilities)
- [x] Add ESLint + Prettier + TypeScript configs plus npm scripts (`lint`, `lint:fix`, `format`) that match the conventions documented in `AGENTS.md`. (Completed 2025-11-23 - Added eslint.config.js + prettier config, verified scripts)
- [x] Migrate the real Employee/Manager UI from `exampleCode.js` into `src/` (App + component folders) so the Vite app renders the actual onboarding experience instead of the Tailwind preview page; mirror the folder layout from `README.md`, keep hooks/data stubs under `src/`, and run `npm run dev` to confirm the views load with the Tailwind theme. (Completed 2025-11-23 - 24 typed components, Tailwind theme wired, dev server confirmed)
- [x] Refresh `README.md` to match the current stack: update the TypeScript version to `5.5.x`, state that Tailwind CSS is already configured (describe key utilities), align the “Next Steps” list with the remaining Milestone 1 tickets, and note where the original prototype now lives. (Completed 2025-11-23 - README documents stack, utilities, roadmap, prototype location)
- [x] Remove tracked OS artifacts such as `src/.DS_Store`, double-check `.gitignore` prevents future commits (add nested rules if needed), and mention the cleanup in the completion note so contributors know the tree is clean. (Completed 2025-11-23 - Enhanced `.gitignore`, confirmed no OS artifacts tracked)
- [x] Fix the Suggest Edit flow regression introduced during the migration: `handleSuggestEdit` ignored the `text` argument and relied on stale state. Ensure suggestions append correctly and verify new suggestions render in Manager view. (Completed 2025-11-23 - Removed unused modal state, verified submission flow end-to-end)
- [x] Re-run the `.DS_Store` cleanup: delete any tracked files, add nested ignore rules, and confirm with `git status` + `rg --files -g '*.DS_Store'` that no artifacts remain. (Completed 2025-11-23 - Removed root + nested `.DS_Store`, verification commands noted)

### Milestone 2 – Core UI Implementation
- [x] Establish composable component architecture so Employee/Manager UI primitives (Card, Badge, KPI sections, modals) live under `src/components` with strict typing. (Completed 2025-12-05 - Split into ui/onboarding/manager/modals folders, prop interfaces centralized)
- [x] Ship the Employee timeline view with status transitions, action buttons, and progress tracking; ensure `EmployeeView` consumes `Step` types and `OnboardingHub` handlers. (Completed 2025-12-05 - Timeline renders Firestore-driven steps, actions update activity log)
- [x] Deliver the Manager dashboard (KPIs, ActivityFeed, Rot Report, suggestion moderation) with responsive layout and accessible cards. (Completed 2025-12-06 - KPISection/SuggestionsSection/ActivitySection wired to hooks, layout verified)
- [x] Add “Mark as Incomplete” reversal so employees can revert completed steps; update UI state and activity logging accordingly. (Completed 2025-12-06 - ActionBar includes revert, statuses sync with Firestore)
- [x] Purge redundant documentation (IMPLEMENTATION_*.md, ROLE_* guides, etc.) per the repo policy so contributors only update canonical files. (Completed 2025-12-07 - Deleted 15+ markdown reports, AGENTS.md updated)
- [ ] Refresh `README.md`, `AGENTS.md`, and `CLAUDE.md` with Milestone 2 learnings (manager tabs, modal architecture, hooks). **Acceptance:** highlight NavBar manager tabs, templates route hash, and modal accessibility expectations.
- [ ] Wire up automated testing foundation (Vitest + RTL) to unblock coverage goals. **Acceptance:** `npm run test` and `npm run test -- --coverage` succeed; at least one RTL test per major view (Employee, Manager, Templates).
- [ ] Optimize Manager view layout/performance for large datasets (>30 steps, >15 suggestions). **Acceptance:** skeleton loaders, memoized KPIs, and xl breakpoint refinements with screenshot in completion note.
- [ ] Audit this `tickets.md` log for accuracy and reorder/prune tickets that no longer apply. **Acceptance:** note any re-prioritization plus confirmation that all completed entries have factual notes.

### Milestone 3 – Data & Authentication
- [x] Configure Firebase project + Emulator Suite + `.env.local`; support both direct emulator run and Docker Compose workflow. (Completed 2026-01-10 - Added firebase.json, docker-compose, npm scripts, README instructions)
- [x] Implement `src/services/dataClient.ts` with CRUD helpers for templates, onboarding instances, roles, suggestions, and activities plus localStorage fallback. (Completed 2026-01-11 - Strongly typed helpers + unit tests in `services/*.test.ts`)
- [x] Create real-time hooks (`useSteps`, `useSuggestions`, `useActivities`, `useOnboardingInstances`, `useEmployeeOnboarding`) with loading/error states. (Completed 2026-01-12 - Hooks documented in CLAUDE.md)
- [x] Add Firebase Auth integration with role-based access (employee/manager/admin) and localStorage fallback/impersonation for QA. (Completed 2026-01-13 - `AuthProvider` + SignInView quick login buttons)
- [x] Build Templates dashboard (route `#/templates`) so managers can create/edit/delete/reorder templates with validation and real-time updates. (Completed 2026-01-14 - `TemplatesView` + modals + tests)
- [x] Harden auth resilience with sign-out confirmation, hash routing reset, and mock auth storage listener. (Completed 2026-01-14 - `SignOutView` auto-redirect implemented)
- [x] Add onboarding creation modal for managers and ensure creation logs activity + updates dashboard instantly. (Completed 2026-01-15 - `CreateOnboardingModal`, `useCreateOnboarding`, success toast)

### Milestone 4 – Feedback Loop & QA
- [ ] **Fix-It-Forward reviewer workflow** – Expand the Manager Suggestions section into a true review queue: allow filtering (pending/reviewed/implemented), capture SME ownership metadata, and persist review outcomes (status, resolution note, reviewer ID, timestamp) back to Firestore. **Acceptance:** suggestions list shows review metadata, managers can approve/implement/reject with notes, activity feed reflects the action, and README/CLAUDE mention the workflow.
- [ ] **Blocker escalation with SLA tracking** – When employees press “I’m Stuck,” create a blocker record tied to the step owner, include severity + comment, and surface the blocker in a dashboard widget with SLA countdown (e.g., warn if unresolved after 24h). **Acceptance:** `OnboardingHub` logs blocker entities, Manager view exposes “Live Blockers” with SLA badges + resolve controls, and resolving a blocker clears the alert + logs activity.
- [ ] **Comprehensive QA + coverage** – Stand up Vitest + RTL suites covering Employee flows (status transitions, modals), Manager approvals, Templates CRUD, and blocker workflow; enforce >80% coverage. **Acceptance:** `npm run test -- --coverage` passes with >80% statements/branches, README documents how to run the suite, and completion note includes coverage summary.
- [ ] **Observability & audit trail enhancements** – Persist review + blocker events to the `activities` feed with structured metadata (user, action, resource, SLA). **Acceptance:** Activity feed shows new event types with icons/colors, `logActivity` helper accepts resource metadata, and engineers can filter feed by event type (helper or query param added).

### Milestone 5 – Deployment & Integrations
- [ ] Automate production build + deploy pipeline (Vercel or Firebase Hosting) with preview deployments per PR and documented release steps.
- [ ] Design Slack (or Teams) notification integration for blockers/Fix-It-Forward events; provide mock webhook handler and configuration guidance in README.
