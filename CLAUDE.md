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
- `mvp.md` - Product specification and feature roadmap (Phases 1-4)
- `README.md` - Project overview, tech stack, setup instructions, milestone status
- `AGENTS.md` - Code style, testing conventions, commit guidelines, and development commands
- `CLAUDE.md` (this file) - Architecture, data model, and AI agent guidance
- `project_status/tickets.md` - Milestone-based backlog with completion audit trail
- `exampleCode.js` - Original React prototype (preserved as reference; production code is in `src/`)

### Ticket Workflow
When working on tickets from `project_status/tickets.md`:
1. Before starting, skim `CLAUDE.md` and `AGENTS.md` for architecture and conventions
2. When beginning work, append `(in progress by YOUR_NAME @ YYYY-MM-DD)` to the ticket
3. When complete, check the box `[x]`, remove the in-progress note, and add a completion note with the date
4. Keep completed tickets in place as an audit trail; do not delete them
5. Add or reprioritize tickets as needed, noting the reason for clarity

### Development Milestones

The project is organized into 5 milestones with clear completion criteria:

**Milestone 1: Project Foundations** - ✅ Complete (8/8 tickets)
- Vite 5.4.21 + React 18.3.1 + TypeScript 5.9.3 scaffold
- Tailwind CSS 3.4.18 with custom theme (brand/status colors, component utilities)
- ESLint + Prettier + TypeScript strict mode with all scripts
- Full UI migration from `exampleCode.js` to production-ready `src/` structure
- 24 fully-typed components (ui/, onboarding/, manager/, modals/)
- Mock data and type definitions matching Firestore schema
- OS artifacts cleanup and enhanced `.gitignore`
- Suggest Edit flow regression fix

**Milestone 2: Core UI Implementation** - 🚧 In Progress (5/9 tickets)
- ✅ Composable component architecture with proper separation
- ✅ Employee view timeline with status transitions and modal flows
- ✅ Manager dashboard with KPIs, Rot Report, and live activity feed
- ✅ "Mark as Incomplete" functionality for reverting steps
- ✅ Documentation cleanup (removed 15 auto-generated files)
- ⏳ Documentation refresh (README, AGENTS, CLAUDE) - current task
- ⏳ Automated testing setup (Vitest + React Testing Library)
- ⏳ Manager view layout optimization for large screens
- ⏳ Ticket completion note accuracy audit

**Milestone 3: Data & Authentication** - ✅ Complete (7/7 tickets)
- ✅ Firebase project setup with Emulator Suite, .env.local, docker-compose
- ✅ Data-access layer (src/services/dataClient.ts) with 15 CRUD functions
- ✅ Real-time Firestore-powered hooks (useSteps, useSuggestions, useActivities)
- ✅ Firebase Auth with role-based permissions (employee, manager, admin)
- ✅ Templates dashboard for managers (create/edit/delete/reorder steps)
- ✅ Authentication resilience with localStorage fallback for development
- ✅ Sign-out confirmation page with auto-redirect

**Milestone 4: Feedback Loop & QA** - ⏳ Upcoming
- Fix-It-Forward workflow with manager review panel
- Blocker button notifications to step owners with SLA tracking
- Comprehensive test suite with >80% coverage requirement

**Milestone 5: Deployment & Integrations** - ⏳ Upcoming
- Vercel/Firebase Hosting CI/CD pipeline with preview deployments
- Slack bot integration design and webhook proof-of-concept

See `project_status/tickets.md` for detailed ticket descriptions and completion notes.

## Working with the Codebase

### Production Code Structure

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

### Key Implementation Details

**State Management:**
- Currently using React `useState` in `OnboardingHub.tsx` component
- State includes: steps array, suggestions array, active modal, current view
- Manager-specific subscriptions now live in `src/hooks/useManagerData.ts`, which keeps onboarding instance lists hydrated for EmployeeSelector even when the dashboard tab is inactive while lazily loading suggestions/activities only when required.
- Props passed down max 3 levels to avoid prop drilling complexity

**Component Organization:**
- `ui/` components are generic and reusable (Button, Card, Badge, Progress)
- `onboarding/` components are Employee-specific (StepCard, Timeline, ActionBar)
- `onboarding/EmployeeSelector.tsx` contains the manager-only dropdown that lets admins inspect other onboarding runs from the Employee view.
- `manager/` components are Manager-specific (KPICard, ActivityFeed, RotReport)
- `modals/` handle user interactions (SuggestEditModal, ReportBlockerModal)

**The Original Prototype:**
The `exampleCode.js` file is a single-file React component preserved as a reference for:
- Initial design decisions and interaction patterns
- Complete UX flow demonstration
- Mock data structures that mirror the Firestore schema

All new development happens in `src/`. Do not modify `exampleCode.js`.

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
- Mock data in `src/data/mockData.ts` mirrors Firestore schema from `mvp.md`
- Modal state tracking via `activeModal` object with `type` and `stepId`
- Status transitions: "pending" → "completed" or "stuck" (reversible with "Mark as Incomplete")
- Activity logging for all user actions (complete step, suggest edit, report blocker)

### Important Development Patterns

**Data Immutability:**
- Keep step data immutable; use array `.map()` for updates
- Never mutate state directly; always use `setState` with new arrays/objects

**Modal Interactions:**
- Modal interactions update local state immediately (optimistic UI)
- Backend calls are currently stubbed (will be implemented in Milestone 3 with Firebase)
- Pass validation errors back to modals for user feedback

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
- Keep all documentation in the canonical files: `README.md`, `CLAUDE.md`, `AGENTS.md`, `mvp.md`, and `project_status/tickets.md`
- When completing tickets, add concise completion notes directly in `project_status/tickets.md` (not separate report files)
- Do NOT create files like:
  - `MILESTONE_*.md` (milestone status belongs in README.md and tickets.md)
  - `*_REPORT.md` or `*_SUMMARY.md` (summaries belong in ticket completion notes)
  - `*_GUIDE.md` (guides belong in README.md or AGENTS.md)
  - `IMPLEMENTATION_*.md`, `MIGRATION_*.md`, `ENHANCEMENT_*.md`, etc.
- If the user explicitly requests documentation, ask where it should go (README, CLAUDE, AGENTS, or a new doc)
- The ticket completion notes in `tickets.md` should be the source of truth for work completed

### Rationale
This project experienced an explosion of auto-generated Markdown files (15+ report/summary docs) that created redundancy and confusion. The canonical documentation files are sufficient for all project needs.

## Future Development Notes

**Milestone 3: Data & Authentication**
- When integrating Firestore, replace mock data in `src/data/mockData.ts` with real-time queries using `onSnapshot()`
- Create custom hooks: `useSteps()`, `useSuggestions()`, `useAuth()` for data fetching
- Implement Firebase Auth with email link or SSO
- Add role-based permissions for editing templates and reviewing suggestions

**Milestone 4: Feedback Loop & QA**
- The "I'm Stuck" blocker button needs backend notification system (email/webhook to step owner)
- The "Rot Report" should highlight frequently flagged steps to prioritize documentation fixes
- Add SLA timers for blocker resolution

**Milestone 5: Deployment & Integrations**
- Set up CI/CD pipeline with Vercel or Firebase Hosting
- Design Slack bot integration for proactive reminders and blocker notifications
- Implement API automation for actions like "Create GitHub Account" (Phase 4 from mvp.md)
