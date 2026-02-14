# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## MANDATORY PIPELINE - READ THIS FIRST

> **Claude MUST follow the development pipeline. No exceptions. No shortcuts.**

### ON EVERY NEW SESSION

**Claude MUST do this FIRST, before ANY other work:**

1. Read `.claude/pipeline/STATUS.md` to see current state
2. Report to user: "Current feature: X, Phase: Y, Next step: /command"
3. Ask user: "Should I continue with /command?" or wait for instructions

**DO NOT start working until you know where we are in the pipeline.**

### AUTO-INVOKE RULES

**Claude MUST automatically invoke the next pipeline command when:**

| Situation | Auto-Invoke |
|-----------|-------------|
| User says "start working on X" | `/research X` |
| User says "continue" or "next" | Whatever STATUS.md says is next |
| `/research` completes | Prompt: "Research done. Run `/plan <feature>`?" |
| `/plan` completes | Prompt: "Plan done. Run `/implement <feature>`?" |
| `/implement` completes | Prompt: "Implementation done. Run `/test <feature>`?" |
| `/test` passes | Prompt: "Tests passed! Run `/finalize <feature>`?" |
| `/test` fails | Prompt: "Tests failed. Run `/diagnose <feature>`?" |
| `/diagnose` completes | Prompt: "Diagnosis done. Run `/plan <feature>` to fix?" |
| User says "different approach" / "try another way" | `/rework <feature>` |

**After each command completes, Claude MUST:**
1. Update `.claude/pipeline/STATUS.md` with new phase
2. Tell user what was done
3. Suggest the next command

### The Pipeline

All feature work MUST go through this pipeline in order:

```
/research → /plan → /implement → /test → /finalize
```

If tests fail:
```
/test (fail) → /diagnose → /plan → /implement → /test → /finalize
```

### Pipeline Commands

| Step | Command | Agent | Purpose |
|------|---------|-------|---------|
| 1 | `/research <feature>` | research-agent | Gather context, extract requirements |
| 2 | `/plan <feature>` | plan-agent | Design architecture, create tasks |
| 3 | `/implement <feature>` | execute-agent | Build feature following TDD |
| 4 | `/test <feature>` | test-agent | Validate with full test suite |
| 5a | `/finalize <feature>` | finalize-agent | Commit and PR (on success) |
| 5b | `/diagnose <feature>` | diagnose-agent | Root cause analysis (on failure) |
| - | `/rework <feature>` | - | User wants different approach |

### What Claude CANNOT Do

**FORBIDDEN ACTIONS:**
- Start coding without `/research` and `/plan` first
- Skip any pipeline step
- Make code changes outside of `/implement`
- Create PRs without going through `/finalize`
- Ignore test failures
- Work on multiple features simultaneously without completing the pipeline

### What Claude MUST Do

**REQUIRED ACTIONS:**
- Check for required input files before each step
- Create output files at each step
- Use the appropriate agent for each phase
- Complete one feature's pipeline before starting another
- Ask user before proceeding if unsure

### Handoff Files

Each step reads from and writes to specific files:

```
.claude/features/<feature>/           # Committed - design docs
├── YYYY-MM-DDTHH:MM_research.md     # /research creates
├── YYYY-MM-DDTHH:MM_plan.md         # /plan creates
└── tasks.md                          # /plan creates

.claude/active-work/<feature>/        # NOT committed - working files
├── implementation.md                 # /implement creates
├── test-success.md                   # /test creates (on pass)
├── test-failure.md                   # /test creates (on fail)
└── diagnosis.md                      # /diagnose creates
```

### Pipeline Documentation

Full details: `.claude/pipeline/WORKFLOW.md`

---

## Project Overview

OnboardingHub is an employee onboarding platform built with a "Fix-It-Forward" approach. It provides role-based dashboards for employees (step-by-step onboarding) and managers (KPIs, suggestions, activity feed). The backend uses Supabase (Postgres, Auth, Realtime) with 8 modular service files for data access.

## Technical Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 3
- **Backend:** Supabase (Postgres database, Auth, Realtime subscriptions)
- **Client Library:** @supabase/supabase-js
- **Testing:** Vitest + React Testing Library
- **Linting:** ESLint 9 + Prettier
- **Icons:** Lucide React

## Build & Run Commands

```bash
# Install dependencies
npm install

# Run dev server (port 5173)
npx vite

# Run tests
npx vitest run

# Run tests in watch mode
npx vitest

# Type check
npx tsc -b

# Production build (type check + bundle)
npx vite build

# Lint
npx eslint .

# Format
npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"
```

## Architecture

```
src/
├── App.tsx                    # Root component with auth + routing
├── main.tsx                   # Vite entry point
├── index.css                  # Tailwind CSS imports
├── vite-env.d.ts              # Vite type declarations
├── components/
│   ├── OnboardingHub.tsx      # Main app container
│   ├── manager/               # Manager dashboard components
│   ├── modals/                # Modal dialogs (edit role, report stuck, etc.)
│   ├── onboarding/            # Employee onboarding step cards, progress
│   ├── templates/             # Template management views
│   └── ui/                    # Reusable primitives (Badge, Card, ProgressBar)
├── config/
│   └── supabase.ts            # Lazy-init Supabase client (Proxy pattern)
├── context/                   # React context providers (DarkMode)
├── data/
│   └── mockData.ts            # Mock data for development
├── hooks/                     # 17 custom React hooks (data fetching, auth, etc.)
├── services/
│   ├── authService.ts         # Supabase Auth wrapper
│   ├── roleClient.ts          # Role validation + CRUD with business rules
│   ├── roleClient.test.ts     # Unit tests for roleClient
│   ├── roleOperations.test.ts # Integration tests for role operations
│   └── supabase/              # 8 modular Supabase data services
│       ├── index.ts           # Barrel export
│       ├── mappers.ts         # DB row <-> app type mappers
│       ├── mappers.test.ts    # Mapper unit tests
│       ├── activityService.ts
│       ├── instanceService.ts
│       ├── profileService.ts
│       ├── profileTemplateService.ts
│       ├── roleService.ts
│       ├── suggestionService.ts
│       ├── templateService.ts
│       └── userService.ts
├── test/
│   └── setup.ts               # Vitest global setup (mocks, env)
├── types/
│   ├── index.ts               # App-level type definitions (373 lines)
│   └── database.types.ts      # Supabase DB types (16 tables)
├── utils/                     # Utility functions
└── views/                     # Top-level page views
```

## Testing Requirements

- **Framework:** Vitest + React Testing Library + jsdom
- **Test Count:** ~650 tests across 30 test files
- **Run:** `npx vitest run` (single run) or `npx vitest` (watch mode)
- **Setup:** `src/test/setup.ts` configures localStorage mocks, disables dev auth, and stubs `window.matchMedia`
- **Supabase Mocking:** All Supabase service modules are mocked via `vi.mock('./supabase')` -- no live database needed for tests
- **Key Pattern:** Tests use localStorage-backed mock implementations for integration-style tests of the role operations layer

## Key Technical Details

- **Supabase Client:** Uses a lazy-initialization Proxy pattern (`src/config/supabase.ts`) to prevent import-time crashes in test files that mock the service layer. The real client is only created on first property access.
- **Routing:** Hash-based routing (`#/`, `#/templates`, `#/sign-out`) -- no React Router dependency
- **Service Architecture:** 8 modular Supabase services under `src/services/supabase/` with a barrel export. Each service handles one entity type. Mappers convert between snake_case DB rows and camelCase app types.
- **Database Schema:** 16 Postgres tables (8 core, 3 step-child, 5 junction) defined in `supabase/migrations/`
- **Auth Flow:** Supabase Auth with dev-auth bypass mode (`VITE_USE_DEV_AUTH=true`) for local development without a live Supabase instance

## Performance Targets

No specific performance targets defined. The app is a standard SPA with no unusual performance constraints.

## Platform Permissions / Configuration

Environment variables (set in `.env.local`, see `.env.template` for reference):

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL (Settings > API) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public API key |
| `VITE_USE_DEV_AUTH` | No | Set to `true` to bypass real auth for local dev |
