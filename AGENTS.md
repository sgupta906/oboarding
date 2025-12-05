# Repository Guidelines

## Project Structure & Module Organization

The production codebase lives in `src/` with the following architecture:

```
src/
├── components/
│   ├── ui/              # Reusable primitives (Button, Card, Badge, Progress)
│   ├── onboarding/      # Employee-facing components (StepCard, Timeline, ActionButtons)
│   ├── manager/         # Admin dashboard components (KPICard, ActivityFeed, RotReport)
│   └── modals/          # Modal dialogs (SuggestEditModal, ReportBlockerModal)
├── views/
│   ├── EmployeeView.tsx # New hire "Quest Log" timeline view
│   └── ManagerView.tsx  # Dashboard with KPIs, live feed, pending reviews
├── data/
│   └── mockData.ts      # Mock onboarding steps and suggestions (mirrors Firestore schema)
├── types/
│   └── index.ts         # TypeScript interfaces (Step, Suggestion, OnboardingInstance)
├── hooks/               # Custom React hooks (future: useFirestore, useAuth)
├── App.tsx              # Main application with view switching
└── index.css            # Tailwind directives + custom component classes
```

The original React/Tailwind prototype remains in `exampleCode.js` as a reference for design decisions and interaction patterns. All new development happens in `src/`.

Put integration specs, API payloads, and fixture data under `docs/` or `tests/fixtures/` when they're created (currently pending Milestone 3).

## Build, Test, and Development Commands

Bootstrap the app with `npm install` from the project root, then run `npm run dev` for the Vite dev server at `http://localhost:5173`.

**Available npm scripts:**
- `npm run dev` - Start Vite development server (hot reload enabled)
- `npm run build` - TypeScript compile + production build to `dist/` for deployment
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint + TypeScript checks
- `npm run lint:fix` - Auto-fix safe ESLint issues
- `npm run format` - Format code with Prettier (2-space indent, single quotes)

**Testing** (Milestone 2 - not yet implemented):
- `npm run test` - Run Vitest + React Testing Library suite
- `npm run test -- --coverage` - Generate coverage report (target: >80%)

Ship-ready bundles are output to `dist/` for Vercel/Firebase deployments.

## Coding Style & Naming Conventions

**React & TypeScript:**
- Modern React only: functional components with hooks (no class components or legacy lifecycle methods)
- TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters` enabled
- Define interfaces in `src/types/index.ts` for shared types
- Use descriptive type names: `Step`, `Suggestion`, `OnboardingInstance`, etc.

**Naming Conventions:**
- **Variables/Functions:** camelCase (`handleSuggestEdit`, `filteredSteps`, `isStuck`)
- **Components:** PascalCase (`StepCard`, `ManagerView`, `ActionBar`)
- **Files:** PascalCase for components (`StepCard.tsx`), camelCase for utilities (`mockData.ts`)
- **CSS Classes:** Tailwind utilities + custom classes in kebab-case (`.status-indicator-success`, `.btn-primary`)

**Code Organization:**
- Two-space indentation (enforced by Prettier)
- Tailwind utility order: layout → color → state for readability
- Component prop drilling: max 3 levels deep (use context/state management beyond that)
- Import order: React → third-party → local components → types → data

**Quality Checks:**
- Run `npm run format` before committing (Prettier auto-format)
- Run `npm run lint:fix` to auto-fix safe ESLint issues
- Ensure `npm run build` succeeds (TypeScript compilation must pass)

## Testing Guidelines

**Current Status:** Testing framework not yet implemented (planned for Milestone 2).

**Planned Approach** (when implemented):
- **Framework:** Vitest + React Testing Library
- **Location:** Write specs alongside code in `__tests__/` directories or `ComponentName.test.tsx` files
- **Test Names:** Describe observable behavior, not implementation (e.g., `"reports blocker when stuck button clicked"`, `"updates progress bar after marking step complete"`)
- **Mocking:** Mock Firestore calls with lightweight fakes; avoid testing Firebase SDK internals
- **Query Strategy:** Use React Testing Library queries (`getByRole`, `findByText`, `getByLabelText`) to assert user-visible outcomes
- **Coverage Target:** >80% for onboarding flows, status transitions, and feedback submissions
- **CI Requirement:** PRs must pass `npm run test -- --coverage` before merging

**Test Priority** (when implementing):
1. Employee view: step status transitions (pending → completed → stuck)
2. Manager view: KPI calculations and activity feed updates
3. Modal workflows: Suggest Edit and Report Blocker submissions
4. Edge cases: empty states, error handling, validation

## Commit & Pull Request Guidelines
Commits follow the imperative present tense and an optional scope (e.g., `feat(manager-view): surface live blockers`). Squash noisy WIP commits before opening PRs. Each PR must describe the change, list validation steps (`npm run test`, screenshots of UI deltas), and link the relevant Linear/GitHub issue. Request reviews from both frontend and product stakeholders when UX changes impact onboarding copy or flow.

## Security & Configuration Tips

Store Firebase project IDs, API keys, and Slack tokens in `.env.local`; never commit secrets. Document required env vars in `docs/config.md` (when created) and reference them in PRs touching auth or networking. When working with user feedback data, anonymize seed fixtures and scrub personally identifiable information before sharing logs.

## Documentation Policy

**IMPORTANT for AI agents and contributors:**

This project maintains strict documentation standards to prevent redundancy:

- **Do NOT auto-generate** separate summary, report, or status documents without explicit user request
- **Prohibited file patterns:**
  - `MILESTONE_*.md` (milestone status belongs in README.md and tickets.md)
  - `*_REPORT.md`, `*_SUMMARY.md` (summaries belong in ticket completion notes)
  - `*_GUIDE.md` (guides belong in README.md or AGENTS.md)
  - `IMPLEMENTATION_*.md`, `MIGRATION_*.md`, `ENHANCEMENT_*.md`
- **Canonical documentation files:**
  - `README.md` - Project overview, tech stack, setup, current status
  - `CLAUDE.md` - Architecture, data model, AI agent guidance
  - `AGENTS.md` (this file) - Development conventions, style, testing
  - `mvp.md` - Product vision and feature roadmap
  - `project_status/tickets.md` - Backlog and completion audit trail
- **Ticket completion notes** in `tickets.md` are the source of truth for work completed
  - Keep notes concise (1-2 sentences) and factual
  - No exaggeration (e.g., don't claim "10/10 tests passing" unless tests exist)
- **When documentation is needed:** Ask where it should live (which canonical file, or if a new doc is truly necessary)

**Rationale:** This project previously experienced an explosion of 15+ redundant auto-generated Markdown files. The canonical files above are sufficient for all project documentation needs.

## Gemini CLI Usage

- When analyzing large codebases or multiple files that exceed the local context window, use the Gemini CLI to offload the analysis. The binary is available at `/opt/homebrew/bin/gemini`.
- Preferred invocation: `gemini -p "<prompt>"` with `@` syntax to include files or directories relative to the working directory. Examples:
  - `gemini -p "@src/ Summarize the architecture of this codebase"`
  - `gemini -p "@src/main.ts @src/utils/ Explain how authentication works"`
- Include multiple targets by prefixing each path with `@`, or use `--all_files` for whole-project sweeps.
- Use Gemini for:
  - Whole-project reviews, dependency analysis, or any request that would push beyond the standard context size (>100KB combined files).
  - Cross-cutting feature verification (e.g., “Has dark mode been implemented?”).
  - Pattern searches spanning many files (security audits, caching strategies, etc.).
- Keep prompts specific about what you need Gemini to verify so responses stay focused.
- Continue following the documentation policy above; do not create new markdown reports when summarizing Gemini findings unless the user explicitly requests it.
