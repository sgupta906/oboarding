# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OnboardingHub** is a web-first application designed to transform stale onboarding documentation into a living, self-healing system. Instead of static Confluence pages, new hires can interactively complete steps, flag issues, and report being stuck—creating a feedback loop that improves documentation with each new hire.

**Key Philosophy:** New hires are not just consumers of documentation; they are QA testers of it.

# Using Gemini CLI for Large Codebase Analysis

When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
context window. Use `gemini -p` to leverage Google Gemini's large context capacity.

## File and Directory Inclusion Syntax

Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
  gemini command:

### Examples:

**Single file analysis:**
gemini -p "@src/main.py Explain this file's purpose and structure"

Multiple files:
gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"

Entire directory:
gemini -p "@src/ Summarize the architecture of this codebase"

Multiple directories:
gemini -p "@src/ @tests/ Analyze test coverage for the source code"

Current directory and subdirectories:
gemini -p "@./ Give me an overview of this entire project"

# Or use --all_files flag:
gemini --all_files -p "Analyze the project structure and dependencies"

Implementation Verification Examples

Check if a feature is implemented:
gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"

Verify authentication implementation:
gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"

Check for specific patterns:
gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

Verify error handling:
gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"

Check for rate limiting:
gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"

Verify caching strategy:
gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"

Check for specific security measures:
gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"

Verify test coverage for features:
gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"

When to Use Gemini CLI

Use gemini -p when:
- Analyzing entire codebases or large directories
- Comparing multiple large files
- Need to understand project-wide patterns or architecture
- Current context window is insufficient for the task
- Working with files totaling more than 100KB
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase

Important Notes

- Paths in @ syntax are relative to your current working directory when invoking gemini
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results

## Architecture & Core Concepts

### Technology Stack
- **Frontend:** React 18.3.1 with Vite 5.4.21 (fast dev server, HMR, optimized builds)
- **Language:** TypeScript 5.9.3 in strict mode with comprehensive linting
- **Styling:** Tailwind CSS 3.4.18 with custom theme (brand/status colors, component utilities, animations)
- **Icons:** Lucide React 0.344.0 (modern, tree-shakeable icon library)
- **Backend/Database:** Firebase/Firestore (planned - handles auth, real-time subscriptions, and storage)
- **Hosting:** Vercel or Firebase Hosting (planned)

### Core Data Model (Firestore)

The app uses three main collections:

1. **templates** - Master instruction templates (reusable across all hires)
   - Fields: `id`, `title`, `content`, `role_tags`, `owner_id`, `version`
   - Contains markdown-formatted instructions, code snippets, and images

2. **onboarding_instances** - Specific onboarding runs for individual users
   - Fields: `id`, `user_id`, `template_snapshot`, `progress` (object tracking step status)
   - Statuses: "PENDING", "COMPLETED", "STUCK"

3. **suggestions** - User-generated feedback for improving docs (the "Fix-It-Forward" system)
   - Fields: `id`, `step_id`, `suggested_by`, `suggestion_text`, `status`
   - Allows new hires to flag outdated screenshots, broken links, permission issues, etc.

### Core Features

1. **The Fix-It-Forward System** - Employees can suggest edits to improve documentation
2. **The Blocker Button** - Employees can report being stuck, which notifies the step owner (not just manager)
3. **Role-Based Playlists** - Filter steps by role tags (Engineering, Sales, All, etc.) to reduce noise
4. **Subject Matter Expert Context** - Each step displays the SME avatar/name who can help

### Two Main Views

- **Employee View (Quest Log):** Vertical timeline-style progression through onboarding steps with action buttons (Mark as Done, Report Issue, I'm Stuck)
- **Manager/Admin View (Dashboard):** KPI cards showing active onboardings, stuck employees, pending feedback; live activity feed; and "Rot Report" (documentation that needs fixing)

## Development Workflow

### Key Documentation Files
- `README.md` - Project overview, tech stack, setup instructions, milestone status, and coding standards
- `CLAUDE.md` (this file) - Architecture, data model, and AI agent guidance
- `CODEX.md` - Codex-agent workflow guardrails, commit expectations, and CLI runbook
- `mvp.md` - Product specification and phased roadmap
- `project_status/tickets.md` - Milestone backlog plus completion audit trail
- `docs/profiles.md` - Profile/profileTemplate schema reference that powers Milestone 4
- `exampleCode.js` - Original React prototype retained as a UX reference (do not modify)

### AI Agent Workflow
1. **Kickoff Analysis** – Before coding, consult the specialized briefs in `.claude/agents/` (e.g., `backend-architect`, `frontend-architect`, `Plan`, `Explore`) that match the ticket domain. Capture their recommendations in your own plan so future agents can follow the same patterns.
2. **Large-Context Sweeps** – Use the Gemini CLI (`/opt/homebrew/bin/gemini`) for cross-file analysis that would exceed the local context window (schema audits, design reviews, regression sweeps). Reference the `Using Gemini CLI` section above for the `@path` syntax.
3. **Implementation Order** – Extend shared types first (`src/types`), then update services (`src/services`), hooks (`src/hooks`), and finally the UI (`src/components`, `src/views`). Keep prop drilling ≤3 levels and prefer context/hooks for cross-cutting state. Follow Tailwind utility order (layout → color → state) and reuse primitives under `components/ui`.
4. **Validation** – Run `npm run format`, `npm run lint`, `npm run build`, and the Vitest suite (`npm run test` / `npm run test:coverage`) before handing over. For deeper QA, leverage the `testsmith` and `test-writer-validator` agents; use `Explore` to confirm your changes match existing patterns.

### Ticket Workflow
When working on tickets from `project_status/tickets.md`:
1. Before touching code, skim `README.md`, `CLAUDE.md`, `CODEX.md`, and any relevant `.claude/agents/*` briefs for architecture and conventions
2. When beginning work, append `(in progress by YOUR_NAME @ YYYY-MM-DD)` to the ticket
3. When complete, check the box `[x]`, remove the in-progress note, and add a completion note with the date
4. Keep completed tickets in place as an audit trail; do not delete them
5. Add or reprioritize tickets as needed, noting the reason for clarity and the agent/tooling consulted

### Development Milestones

**Milestone 1: Project Foundations** – ✅ Complete  
- Established the Vite 7 + React 18 + TypeScript 5.5 scaffold with strict linting/formatting scripts  
- Created the Tailwind design system (brand + status palettes, component utilities, motion tokens)  
- Migrated the entire onboarding experience from `exampleCode.js` into modular `src/` folders with strongly typed mock data  
- Hardened `.gitignore`, removed OS artifacts, and fixed the Suggest Edit regression introduced during migration

**Milestone 2: Core UI Implementation** – ✅ Complete  
- Broke the UI into reusable primitives, onboarding timeline modules, manager widgets, and modal flows  
- Delivered accessible Employee and Manager views with “Mark as Incomplete,” Rot Report, KPIs, Live Activity feed, and onboarding instance selector  
- Tuned layout for large breakpoints (max-w-7xl, asymmetric grids, collapsible feeds) and ensured KPI tile parity  
- Added Vitest + React Testing Library suites for Employee/Manager flows and codified the documentation policy

**Milestone 3: Data & Authentication** – ✅ Complete  
- Wired Firebase Emulator Suite, `.env.template`, and Docker workflows; added firebase scripts to `package.json`  
- Built `src/services/dataClient.ts` + `userOperations.ts` with Firestore + localStorage fallbacks, plus dozens of CRUD helpers  
- Added custom hooks (`useSteps`, `useManagerData`, `useTemplates`, `useUsers`, `useRoles`, `useEmployeeOnboarding`, etc.) with unsubscribe safety and loading/error states  
- Implemented AuthProvider + SignIn/SignOut flows, mock email-link login, QA impersonation helpers, and role-gated routing/NavBar behavior  
- Delivered Templates dashboard, onboarding-run creation modal, profile filters, and Users admin tooling with comprehensive Vitest coverage

**Milestone 4: Profile Templates & Assignment** – 🚧 In Progress  
- Already completed: Firestore schema + dataClient CRUD for `profiles`/`profileTemplates`, documentation captured in `docs/profiles.md`, and fixtures for engineer/sales profiles  
- Upcoming: Manager Profiles panel UI, onboarding modal updates to attach multiple profiles, Employee-side merged timelines, seeded fixtures/tests, and an offboarding template option

**Milestone 5: Deployment & Integrations** – ⏳ Upcoming  
- CI/CD pipeline (Vercel or Firebase Hosting) with preview deployments and release checklist  
- Slack bot/webhook concepts for blocker escalation + Fix-It-Forward notifications

See `project_status/tickets.md` for acceptance criteria and completion notes per ticket.

## Working with the Codebase

### Production Code Structure

The production codebase lives in `src/` with the following architecture:

```
src/
├── components/
│   ├── ui/              # Reusable primitives (Button, Card, Badge, Progress)
│   ├── onboarding/      # Employee-facing components (StepCard, Timeline, ActionButtons)
│   ├── manager/         # Manager dashboard components (KPICard, ActivityFeed, RotReport, UsersPanel)
│   ├── modals/          # Suggest Edit / Blocker / onboarding modals
│   └── templates/       # Template CRUD modals and helper components
├── views/
│   ├── EmployeeView.tsx # New hire "Quest Log" timeline
│   ├── ManagerView.tsx  # KPIs, Rot Report, Live Activity, onboarding admin
│   ├── TemplatesView.tsx# Manager-only template dashboard
│   ├── SignInView.tsx   # Mock email-link auth + quick logins
│   └── SignOutView.tsx  # Sign-out confirmation + redirect
├── hooks/               # Firestore/data hooks (useSteps, useManagerData, useTemplates, useRoles, useUsers, etc.)
├── services/            # Data layer + auth helpers (dataClient, authService, userOperations)
├── config/              # firebase.ts + authContext.tsx (AuthProvider + emulator detection)
├── context/             # DarkModeProvider
├── data/                # Legacy mock data for quick demos/tests
├── types/               # Shared interfaces (Step, Suggestion, Activity, Profile, ProfileTemplate, etc.)
├── utils/               # Helpers like `filterUtils.ts`
├── App.tsx              # AuthProvider/DarkModeProvider wrapper with hash routing
├── main.tsx             # Entry point
└── index.css            # Tailwind directives + custom component classes
```

### Key Implementation Details

**Auth & Routing**
- `src/config/authContext.tsx` exports `AuthProvider`, `useAuth`, and helpers (`impersonateUserForQA`, storage events) that coordinate Firebase emulator mode and localStorage fallback.
- `App.tsx` wraps `AppContent` with `AuthProvider` + `DarkModeProvider`, uses hash-based routing for `#/templates` and `#/sign-out`, and gates manager-only surfaces (NavBar, TemplatesView) based on `role`.
- `SignInView` and `SignOutView` live in `src/views/`, provide mock email-link auth, QA quick logins, and auto-redirect flows.

**Data Layer & Hooks**
- `src/services/dataClient.ts` and `userOperations.ts` wrap Firestore collections (`templates`, `onboarding_instances`, `profiles`, `profileTemplates`, `users`, etc.) with type-safe CRUD, real-time listeners, and localStorage fallbacks.
- Hooks such as `useEmployeeOnboarding`, `useSteps`, `useSuggestions`, `useManagerData`, `useTemplates`, `useUsers`, `useRoles`, and `useCreateOnboarding` own subscription lifecycles, error states, and custom storage events.
- Activity logging (`logActivity`) ensures manager KPIs and feeds reflect every employee action, suggestion, or onboarding run change.

**OnboardingHub Container**
- `src/components/OnboardingHub.tsx` orchestrates the Employee/Manager experience: it conditionally loads employee data vs. manager dashboards, memoizes views, drives Suggest Edit / Report Stuck modals, and routes manager actions to the data layer.
- Managers using the Employee tab can inspect any onboarding instance via `EmployeeSelector`; the component hydrates selected timelines via additional `useSteps` subscriptions.

**Component Organization**
- `components/ui` contains primitives (Badge, Button, Card, Progress, NavBar) shared across views.
- `components/onboarding` hosts StepCard, Timeline, ActionBar, EmployeeSelector, WelcomeHeader, etc.
- `components/manager` owns KPIs, Rot Report, ActivityFeed, UsersPanel, CreateOnboardingModal triggers, and supporting widgets.
- `components/templates` includes Create/Edit modals for template management, and `components/modals` handles Suggest Edit / Report Stuck workflows.

**Prototype Reference**
- `exampleCode.js` remains as the single-file prototype for historical context only—never edit it. All production work belongs under `src/`.

### Key Implementation Patterns

**React & TypeScript:**
- Functional components with hooks (`useState`, `useEffect`) for state management
- TypeScript strict mode with comprehensive type definitions in `src/types/index.ts`
- Interfaces for all data structures: `Step`, `Suggestion`, `Activity`, etc.

**Styling:**
- Tailwind CSS utilities for all styling (no separate CSS modules)
- Custom component classes defined in `src/index.css` (`.btn-primary`, `.card`, `.badge-*`)
- Responsive design with mobile-first breakpoints
- Accessibility: WCAG 2.1 AA compliance with keyboard navigation and ARIA labels

**Data Flow:**
- Real-time data comes from Firestore via `dataClient` + hooks with localStorage fallback; `src/data/mockData.ts` exists only for fixtures/demos
- Modal state tracking via `activeModal` object with `type` and `stepId`
- Status transitions: "pending" → "completed" or "stuck" (reversible with "Mark as Incomplete")
- Activity logging writes through `logActivity` so KPIs/feeds stay current across roles

### Important Development Patterns

**Data Immutability:**
- Keep step data immutable; use array `.map()` for updates
- Never mutate state directly; always use `setState` with new arrays/objects

**Modal Interactions:**
- Modal interactions update local state optimistically but persist via the data layer (`createSuggestion`, `updateStepStatus`, etc.)
- Handle async errors gracefully and surface validation issues inside the modal components
- Keep modals accessible (focus trap, ARIA labels) and keyboard friendly

**Calculations:**
- Progress bar is calculated client-side based on completed steps
- KPIs (completion rate, stuck count) are derived from current state
- Activity feed is chronologically sorted using timestamps

**Timestamps:**
- Use `Date.now()` for ordering suggestions and activities
- Format dates consistently for display (relative times: "2 hours ago")

## Product Roadmap (from mvp.md)

1. **Phase 1 (MVP):** Web portal with login, step progression, checkbox completion, manager progress dashboard
2. **Phase 2:** Add "Suggest Edit" and "I'm Stuck" buttons with notification system
3. **Phase 3:** Slack bot integration for proactive reminders and updates
4. **Phase 4:** API automation—clicking "Create Github Account" triggers actual GitHub API invites

## Agent Documentation Policy

**IMPORTANT:** Do NOT auto-generate summary, report, or status documents unless explicitly requested by the user.

### Documentation Guidelines for Agents
- Keep all documentation in the canonical files: `README.md`, `CLAUDE.md`, `CODEX.md`, `mvp.md`, `project_status/tickets.md`, and any explicitly sanctioned specs under `docs/` (e.g., `docs/profiles.md`)
- When completing tickets, add concise completion notes directly in `project_status/tickets.md` (not separate report files)
- Do NOT create files like:
  - `MILESTONE_*.md` (milestone status belongs in README.md and tickets.md)
  - `*_REPORT.md` or `*_SUMMARY.md` (summaries belong in ticket completion notes)
  - `*_GUIDE.md` (guides belong in README.md or CODEX.md)
  - `IMPLEMENTATION_*.md`, `MIGRATION_*.md`, `ENHANCEMENT_*.md`, etc.
- If the user explicitly requests documentation, ask where it should go (README, CLAUDE, CODEX, project_status, or a documented `docs/` location)
- The ticket completion notes in `tickets.md` should be the source of truth for work completed

### Rationale
This project experienced an explosion of auto-generated Markdown files (15+ report/summary docs) that created redundancy and confusion. The canonical documentation files are sufficient for all project needs.

## Future Development Notes

**Milestone 4: Profile Templates & Assignment**
- Build the Profiles panel UI under `src/views/ManagerView` for CRUD + template assignment
- Update the “New Onboarding” modal so managers can attach multiple profiles with conflict resolution, inline hints, and test coverage
- Merge profile playlists inside Employee timelines (filters, badges, accessibility) and add fixture/docs updates for seeded profiles
- Introduce an Offboarding template option surfaced throughout the manager + employee flows

**Milestone 5: Shyft Branding & Dashboard Polish**
- Apply the Shyft palette tokens inside `tailwind.config.js` and shared components, documenting AA contrast results
- Refresh buttons, tabs, KPI cards, and modals to use the new tokens + typography guidance in `.claude/agents/frontend-architect.md`
- Rethink the Live Activity module placement/density and add KPI drilldowns (clickable cards with detail popovers)
- Expand the regression suite (e.g., `ManagerDashboard.theme.test.tsx`) to lock down the revised theming/layout

**Milestone 6: Feedback Loop & QA**
- Implement the Fix-It-Forward manager review workflow, wiring suggestion approvals/rejections into the data layer
- Wire the Blocker button to notify SMEs (email/webhook stubs) and expose SLA timers/history in the manager dashboard
- Drive overall test coverage above 80% (Vitest + RTL) and enforce it via CI once Milestone 6 lands

**Milestone 7: AI-Assisted Template Builder**
- Design the “Import Onboarding Doc” UX with drag/drop, upload validation, and progress indicators
- Build a mock ingestion pipeline or containerized worker that can parse docs and emit `Step` JSON
- Create the Template Builder UI with expandable step tiles, drag-and-drop ordering, metadata editing, and persistence hooks
- Integrate generated templates into onboarding creation so managers can preview and tweak before publishing

**Milestone 8: Deployment & Integrations**
- Stand up Vercel/Firebase Hosting deployments with preview branches, release checklist, and env-var documentation in `docs/`
- Draft Slack bot/webhook interfaces for blocker alerts, Fix-It-Forward updates, and proactive reminders
