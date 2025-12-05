# CODEX.md

Guidance for Codex agents collaborating on OnboardingHub. Read this before taking on a ticket so our workflow stays aligned with the rest of the team.

## Quick Orientation
- **Mission:** OnboardingHub lets new hires advance a Quest Log timeline while managers monitor KPIs, feedback, and blockers. Employees can mark steps complete, report being stuck, or submit suggestions.
- **Stack:** React 18 + Vite 5 + TypeScript (strict) + Tailwind 3.4. Firebase/Firestore backs auth/data via `src/services` and hooks (`useSteps`, `useSuggestions`, etc.). Styling primitives live under `src/components/ui`.
- **Runbook:** `npm install`, then `npm run dev` for the Vite server. `npm run build`, `npm run preview`, `npm run lint`, and `npm run format` are required sanity checks before shipping.

## Workflow Expectations
1. Skim `README.md`, `AGENTS.md`, and `CLAUDE.md` for architecture/state before editing.
2. Tickets are tracked in `project_status/tickets.md`. Mark in-progress/complete notes exactly as described there.
3. Keep changes scoped to `src/` unless a ticket calls for docs/config updates. Leave the legacy `exampleCode.js` untouched.
4. Type safety matters: extend interfaces in `src/types/index.ts` and wire them through hooks/services rather than introducing `any`.

## Data, Auth, and Views
- Auth flows are managed in `src/config/authContext.tsx` with Firebase or localStorage fallback. Roles (employee, manager, admin) control access to Employee/Manager/Template views inside `src/App.tsx`.
- Onboarding data flows through the hooks layer (`src/hooks/`) which subscribes to Firestore via `services/dataClient.ts`. Employee timelines render via `src/views/EmployeeView.tsx`; the manager dashboard (KPIs, ActivityFeed, RotReport, suggestions) is in `src/views/ManagerView.tsx`.
- Mock fixtures in `src/data/mockData.ts` should mirror Firestore schemas and stay in sync with the shared types.

## Large-Context Analysis with Gemini
- Prefer `gemini -p` for whole-project or multi-directory analysis that would exceed the local context window (>100KB combined files). The binary lives at `/opt/homebrew/bin/gemini`.
- Use the `@` syntax to inline files/dirs relative to the run directory, e.g., `gemini -p "@src/ Summarize the app architecture"`. Chain multiple `@path` entries or use `--all_files` when needed.
- Be explicit about the question (security audits, feature verification, etc.) so Gemini’s response is scoped. Treat Gemini output as guidance and confirm critical details in the repo before coding.

## Documentation & Output Boundaries
- Respect the documentation policy in `AGENTS.md`: no auto-generated reports or new guide/summary files beyond the canonical set (README, CLAUDE, AGENTS, mvp, tickets). Update those files only when a ticket or user request demands it.
- When summarizing work, include file references with line numbers, keep notes concise, and never fabricate test results.

## Quality Bar
- Run `npm run format` and `npm run lint` (or `lint:fix`) before delivering substantial code.
- Reuse existing components/patterns; keep prop drilling ≤3 levels (otherwise introduce context/state management).
- Add Tailwind utilities in layout → color → state order. Comment only when logic is non-obvious.

Refer back here whenever you need the Codex-specific expectations; use `CLAUDE.md` for deeper architectural context and `AGENTS.md` for repo-wide conventions.
