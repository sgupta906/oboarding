# OnboardingHub

A web-first employee onboarding platform that transforms stale documentation into a living, self-healing system. Instead of static Confluence pages that degrade over time, OnboardingHub creates an interactive experience where new hires actively participate in keeping documentation current through the innovative "Fix-It-Forward" system.

## Philosophy

New hires are not just consumers of documentation; they are QA testers of it. When instructions become outdated, employees can flag issues, suggest edits, and report blockers - ensuring the onboarding experience improves with every new hire rather than degrading over time.

## Key Features

- **Dual View System**: Separate interfaces optimized for employees (Quest Log timeline) and managers (Live Dashboard)
- **Fix-It-Forward**: Documentation improvement system where employees can suggest edits and improvements
- **Blocker Button**: One-click escalation that notifies the specific step owner (not just HR)
- **Role-Based Playlists**: Dynamic filtering so engineers only see engineering steps, sales only sees CRM setup, etc.
- **Live Progress Tracking**: Managers see exactly where new hires are stuck in real-time
- **Rot Report**: Automated identification of outdated documentation based on employee feedback
- **Template & Profile Management**: Dedicated manager surfaces to author onboarding templates, seed profile metadata, and launch multi-profile onboarding runs
- **Role-Aware Auth**: Email-link mock auth plus emulator quick logins, localStorage fallback, and manager/admin-only views (Templates, Users, New Onboarding)

## Tech Stack

- **Frontend**: React 18.3.1 with Vite 7.2.x (blazing-fast dev server, optimized builds)
- **Language**: TypeScript 5.5.x in strict mode with comprehensive linting
- **Styling**: Tailwind CSS 3.4.18 with a custom design system (brand colors, badges, KPI tiles, animations)
- **Icons**: Lucide React 0.344.0 (modern, tree-shakeable icon library)
- **Auth & Data**: Firebase 12.x + Firestore Emulator Suite with localStorage fallback wired through `src/config/authContext.tsx` and `src/services/dataClient.ts`
- **Hosting** (planned): Vercel or Firebase Hosting

## Installation & Setup

### Prerequisites

- Node.js 18+ and npm

### Quick Start

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality Tools

```bash
# Run ESLint checks
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format
```

### Testing

```bash
# Run unit tests
npm run test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# Test UI dashboard
npm run test:ui
```

### Firebase Emulator Setup (Local Development)

```bash
# Option 1: Run emulator directly (requires firebase-tools globally)
npm run firebase:emulator

# Option 2: Run with Docker Compose
npm run docker:emulator

# Stop Docker containers
npm run docker:emulator:down

# Import/export emulator state
npm run firebase:emulator:import
npm run firebase:emulator:export
```

**Environment Configuration:**
- Copy `.env.template` to `.env.local` for local development
- All `.env.local` values are pre-configured to point to the local emulator
- Firebase Emulator UI accessible at `http://localhost:4000`
- Firestore runs on `127.0.0.1:8080`
- Auth Emulator runs on `127.0.0.1:9099`
- Storage Emulator runs on `127.0.0.1:9199`

**Docker Setup (Optional):**
The included `docker-compose.yml` provides a containerized Firebase Emulator Suite that auto-persists state. Useful for CI/CD or isolated environments.

## How to Log In

OnboardingHub provides multiple ways to authenticate for different scenarios:

### Option 1: Quick Login with Test Accounts (Emulator Mode)

When `VITE_USE_FIREBASE_EMULATOR=true`, the sign-in page displays quick-login buttons for rapid role-switching during QA:

1. Start the app: `npm run dev`
2. On the sign-in screen, click one of the Quick Login buttons:
   - **Employee**: Access the new hire onboarding timeline
   - **Manager**: Access the live dashboard with KPIs and feedback
   - **Admin**: Full system access (development only)

**Benefits**: No form submission required, instant role switching for testing different user flows.

### Option 2: Traditional Email-Based Sign-In

For testing the complete sign-in flow:

1. On the sign-in page, enter one of these test emails:
   - `test-employee@example.com` → Employee role
   - `test-manager@example.com` → Manager role
   - `test-admin@example.com` → Admin role

**Note**: This is a mock implementation. In production, users would receive actual email links.

### Option 3: Firebase Emulator with Seeded Test Users

For testing with real Firebase Emulator data:

1. Start the Firebase Emulator:
   ```bash
   npm run firebase:emulator
   ```

2. In a new terminal, seed test users:
   ```bash
   npm run seed:test-users
   ```

3. Start the app:
   ```bash
   npm run dev
   ```

4. Use any of the test emails above to sign in

**Seed Script Details**:
- Creates test accounts directly in Firebase Auth
- Sets up Firestore user documents with role information
- Idempotent (safe to run multiple times)
- Run `npm run seed:test-users` after emulator is running

### Test User Credentials

| Email | Role | Use Case |
|-------|------|----------|
| `test-employee@example.com` | Employee | Test new hire onboarding timeline, suggest edits, report blockers |
| `test-manager@example.com` | Manager | Test dashboard, view stuck employees, review suggestions |
| `test-admin@example.com` | Admin | Full access (development/QA only) |

### Impersonating Test Users Programmatically

For end-to-end tests or QA automation, use the `impersonateUserForQA()` function:

```typescript
import { impersonateUserForQA } from './src/config/authContext';

// Impersonate a manager (emulator mode only)
impersonateUserForQA({
  email: 'test-manager@example.com',
  role: 'manager',
});
```

**Important**: This function only works when `VITE_USE_FIREBASE_EMULATOR=true` for security.

### localStorage Fallback

When Firebase Emulator is not running, the app falls back to localStorage for authentication:

1. Auth state is stored in `localStorage.mockAuthUser`
2. All test accounts work via the regular sign-in form
3. No emulator setup required
4. Perfect for quick development without Firebase overhead

**Note**: localStorage fallback is for development only and is not used in production.

### Sign Out

To sign out and return to the login page:

1. Click your profile menu (top-right corner)
2. Select "Sign Out"
3. Confirm the sign-out
4. You'll be redirected to the sign-in page

## Project Structure

```
onboarding/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable primitives (Button, Card, Badge, Progress)
│   │   ├── onboarding/      # Employee-facing components (StepCard, Timeline, ActionButtons)
│   │   ├── manager/         # Admin dashboard components (KPICard, ActivityFeed, RotReport)
│   │   ├── modals/          # Suggest Edit / Blocker dialogs
│   │   └── templates/       # Manager template CRUD modals and helper components
│   ├── views/
│   │   ├── EmployeeView.tsx # New hire "Quest Log" timeline view
│   │   ├── ManagerView.tsx  # Dashboard with KPIs, activity feed, onboarding admin
│   │   ├── TemplatesView.tsx# Manager-only template builder
│   │   ├── SignInView.tsx   # Email-link mock auth + quick login buttons
│   │   └── SignOutView.tsx  # Sign-out confirmation + redirect
│   ├── hooks/               # Real-time Firestore hooks (useSteps, useManagerData, useTemplates, useUsers, useRoles)
│   ├── services/            # Data access helpers (dataClient, authService, userOperations)
│   ├── config/              # firebase.ts + authContext.tsx (AuthProvider + emulator detection)
│   ├── context/             # DarkModeProvider
│   ├── data/                # mockData.ts for legacy fallback/reference
│   ├── types/               # Shared TS interfaces (Step, Suggestion, Profile, etc.)
│   ├── utils/               # Helper utilities (filterUtils, formatting helpers)
│   ├── App.tsx              # AuthProvider wrapper + hash routing
│   ├── main.tsx             # Vite entry point
│   └── index.css            # Tailwind directives + custom component classes
├── docs/
│   └── profiles.md          # Profile + profileTemplate schema references
├── firebase.json            # Firebase Emulator Suite configuration
├── firestore.rules          # Firestore security rules (dev: allow all)
├── storage.rules            # Storage security rules (dev: allow all)
├── firestore.indexes.json   # Firestore composite indexes
├── docker-compose.yml       # Docker recipe for running Firebase Emulator in a container
├── CODEX.md                 # Codex-specific expectations & workflow guardrails
├── CLAUDE.md                # Architecture, data model, and AI agent guidance
├── mvp.md                   # Product specification and feature roadmap
├── project_status/
│   └── tickets.md           # Milestone-based backlog with completion tracking
└── exampleCode.js           # Original React prototype (reference only)
```

## Custom Tailwind Utilities

OnboardingHub includes a comprehensive design system built on Tailwind CSS:

### Color Palette

- **Brand Colors**: `brand-*` (indigo/violet for CTAs and headers)
- **Status Colors**: `success-*`, `warning-*`, `error-*`, `stuck-*` (semantic task states)
- **Neutrals**: `slate-*` (text, borders, backgrounds)

### Component Classes

```css
/* Cards with elevation */
.card                    /* Base card style with shadow and border */
.card-hover              /* Smooth hover shadow transition */

/* Status indicators (left border accent) */
.status-indicator-success
.status-indicator-error
.status-indicator-warning
.status-indicator-brand

/* Badges for step status */
.badge-success           /* Green pill for completed steps */
.badge-error             /* Red pill for stuck/blocked */
.badge-warning           /* Amber pill for pending review */
.badge-brand             /* Indigo pill for active tasks */
.badge-neutral           /* Gray pill for general labels */

/* Buttons with focus states */
.btn-primary             /* Brand-colored CTA button */
.btn-secondary           /* Outlined neutral button */
.btn-success             /* Green action button (Mark as Done) */
.btn-error               /* Red alert button (I'm Stuck) */

/* Special effects */
.gradient-header         /* Brand gradient for section headers */
.glass                   /* Frosted glass effect (backdrop blur) */
```

### Animations

All animations respect `prefers-reduced-motion` for accessibility:

- `animate-fade-in`: Smooth opacity transition
- `animate-slide-up`: Enter from bottom
- `animate-slide-down`: Enter from top
- `animate-scale-in`: Subtle zoom effect

### Responsive Design

- Mobile-first breakpoints (sm, md, lg, xl, 2xl)
- Touch-friendly button sizes (min 44x44px)
- Readable typography scale (16px base)

## Development Workflow

### Coding Standards

- **Indentation**: 2 spaces (enforced by Prettier)
- **Naming**: camelCase for variables/functions, PascalCase for components, kebab-case for files
- **TypeScript**: Strict mode with `noUnusedLocals` and `noUnusedParameters` enabled
- **React**: Functional components with hooks (no class components)

### Testing Guidelines

Vitest + React Testing Library specs live alongside feature code (e.g., `src/**/__tests__`, `src/hooks/*.test.ts`, `tests/fixtures/`). Run the suite with:

```bash
# Run unit/integration tests
npm run test

# Watch mode for local debugging
npm run test:watch

# Coverage report (V8)
npm run test:coverage
```

Target: >80% coverage for onboarding flows, status transitions, auth, and feedback submissions as Milestone 4 ships.

### Commit Message Format

Follow imperative present tense with optional scope:

```
feat(manager-view): add live blocker notifications
fix(timeline): prevent duplicate step completion
docs: update Firebase setup instructions
```

See `CODEX.md` for Codex-specific commit and PR guidelines.

## Current Development Status

### Milestone 1: Project Foundations – ✅ Complete

- Vite 7 + React 18 + TypeScript 5.5 scaffold with strict tsconfig and optimized folder structure
- Tailwind CSS 3.4 theme with brand/status palettes, animations, and shared UI primitives
- ESLint + Prettier + npm scripts (`lint`, `lint:fix`, `format`, `build`) wired into the runbook
- Full UI migration from `exampleCode.js` into modular `src/` components and views
- Strictly typed mock data + interfaces mirroring the planned Firestore schema
- Repaired Suggest Edit regression and scrubbed tracked OS artifacts

### Milestone 2: Core UI Implementation – ✅ Complete

- Broke the prototype into composable UI primitives, onboarding timeline tiles, manager widgets, and modal flows
- Employee view delivers keyboard-accessible status transitions, stuck/report modals, and completion footer safeguards
- Manager dashboard exposes KPIs, Rot Report, Live Activity feed, collapsible sections, and an onboarding instance selector
- Added “Mark as Incomplete,” tooltip-safe KPI layouts, and responsive grid updates for large displays
- Established Vitest + React Testing Library coverage across Employee/Manager views to guard interactions
- Documented the “no auto-generated summaries” policy and deleted redundant Markdown reports

### Milestone 3: Data & Authentication – ✅ Complete

- Configured Firebase Emulator Suite (Auth, Firestore, Storage) with `.env.template` + Docker recipes
- Implemented `src/services/dataClient.ts` + `userOperations.ts` with Firestore + localStorage fallback and 15+ CRUD helpers
- Added real-time hooks (`useSteps`, `useSuggestions`, `useManagerData`, `useTemplates`, `useUsers`, `useRoles`, etc.) with unsubscribe safety
- Delivered AuthProvider + SignIn/SignOut views, localStorage fallback, QA quick-logins, and role-gated routing/NavBar controls
- Built Templates dashboard, onboarding-run creation modal, and Users admin surface for managers/admins
- Seeded role profiles, filtering utilities, and impersonation helpers with extensive Vitest coverage across hooks/services/views

### Milestone 4: Profile Templates & Assignment – 🚧 In Progress (1/6 tickets)

- ✅ Profile + profileTemplate schema defined in Firestore/dataClient with docs captured in `docs/profiles.md`
- Next up: manager-facing Profiles panel, onboarding-run profile selection, employee multi-profile UX, seeded fixtures/tests, and offboarding template flows (see `project_status/tickets.md`)

### Milestone 5: Shyft Branding & Dashboard Polish – ⏳ Upcoming

- Apply the Shyft palette (charcoal, navy, electric blue, soft gray) via Tailwind tokens and document AA contrast checks
- Refresh shared components (buttons, tabs, KPI cards, modals) to use the new tokens + spacing guidance from `.claude/agents/frontend-architect.md`
- Reposition the Live Activity module with better density/sticky behavior and add KPI drilldowns with accessible popovers
- Expand the dashboard regression suite (e.g., theming/interactions tests) to lock down the updated UI

### Milestone 6: Feedback Loop & QA – ⏳ Upcoming

- Implement the Fix-It-Forward manager review panel with suggestion approvals/rejections backed by Firestore
- Wire the Blocker button to notify SMEs (email/webhook stub) and surface SLA timers/history in the dashboard
- Drive Vitest + RTL coverage above 80% and enforce coverage thresholds in CI

### Milestone 7: AI-Assisted Template Builder – ⏳ Upcoming

- Design the Templates import UX with upload validation, progress indicators, and a mocked ingestion pipeline
- Build the editable Template Builder UI with drag-and-drop steps, metadata side panels, and persistence hooks
- Store generated templates (mocked for now) with versioning so managers can preview/tweak them before launching onboarding runs

### Milestone 8: Deployment & Integrations – ⏳ Upcoming

- Stand up a Vercel/Firebase Hosting pipeline with preview deployments per branch plus a release checklist
- Draft the Slack bot/webhook architecture for blocker alerts, Fix-It-Forward updates, and proactive reminders

See `project_status/tickets.md` for per-ticket completion notes and acceptance criteria.

## About the Prototype

The original React prototype lives in `exampleCode.js` as a single-file component demonstrating the full UX flow. It has been migrated to the production-ready `src/` structure with:

- Modular, composable components
- TypeScript type safety
- Tailwind design system
- Optimized build pipeline

The prototype remains in the repo as a reference for design decisions and interaction patterns.

## Key Documentation

- **`mvp.md`**: Product vision, feature specifications, and phased roadmap
- **`CLAUDE.md`**: Architecture overview, data model, and development patterns for AI agents
- **`CODEX.md`**: Codex-agent workflow guardrails, coding conventions, and runbook reminders
- **`docs/profiles.md`**: Profile/profileTemplate schema reference plus fixtures for Milestone 4
- **`project_status/tickets.md`**: Milestone-based backlog with agent workflow instructions

### Documentation Policy

**Important for AI agents and contributors:**

This project maintains a strict documentation policy to avoid redundancy and confusion:

- **Do NOT auto-generate** separate summary, report, or status documents (e.g., `MILESTONE_*.md`, `*_REPORT.md`, `*_SUMMARY.md`, `*_GUIDE.md`, `IMPLEMENTATION_*.md`)
- All documentation belongs in the **canonical files** listed above (`README.md`, `CLAUDE.md`, `CODEX.md`, `mvp.md`, `project_status/tickets.md`) or in the explicitly called-out specs under `docs/`
- All workflow guidance now lives in this README, `CLAUDE.md`, and `CODEX.md`
- Ticket completion notes in `project_status/tickets.md` serve as the source of truth for work completed
- Keep completion notes concise (1-2 sentences) and factual
- If new documentation is needed, discuss with the team where it should live first

This policy was established after the project experienced an explosion of 15+ auto-generated Markdown files that created redundancy across documentation sources.

## Contributing

Before starting work:

1. Read `CLAUDE.md` for architecture and core concepts
2. Review `CODEX.md` (and any relevant `.claude/agents/*` briefs) for workflow and coding standards
3. Check `project_status/tickets.md` for the current backlog
4. Run `npm run lint` and `npm run format` before committing
5. Ensure TypeScript builds without errors: `npm run build`

When working on tickets:

- Append `(in progress by YOUR_NAME @ YYYY-MM-DD)` when starting
- Check the box `[x]` and add completion note with date when finished
- Keep completed tickets in place as an audit trail
- Test your changes locally with `npm run dev`

## License

Private project - not licensed for public use.

## Target Audience

30-100 employee companies struggling with stale Confluence onboarding pages who need:

- Real-time visibility into new hire progress
- Self-healing documentation through employee feedback
- Reduced IT/HR bottlenecks during onboarding
- Role-specific onboarding paths (Engineering, Sales, Product, etc.)

---

**Built with modern web technologies for fast, interactive, real-time onboarding experiences.**
