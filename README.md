# OnboardingHub

A web-first employee onboarding platform that transforms stale documentation into a living, self-healing system. Instead of static Confluence pages that degrade over time, OnboardingHub creates an interactive experience where new hires actively participate in keeping documentation current through the innovative "Fix-It-Forward" system.

## Philosophy

New hires are not just consumers of documentation; they are QA testers of it. When instructions become outdated, employees can flag issues, suggest edits, and report blockers — ensuring the onboarding experience improves with every new hire rather than degrading over time.

## Key Features

- **Dual View System**: Separate interfaces optimized for employees (Quest Log timeline) and managers (Live Dashboard)
- **Fix-It-Forward**: Documentation improvement system where employees can suggest edits and improvements
- **Blocker Button**: One-click escalation that notifies the specific step owner (not just HR)
- **Role-Based Playlists**: Dynamic filtering so engineers only see engineering steps, sales only sees CRM setup, etc.
- **Live Progress Tracking**: Managers see exactly where new hires are stuck in real-time
- **Rot Report**: Automated identification of outdated documentation based on employee feedback
- **Template & Profile Management**: Dedicated manager surfaces to author onboarding templates, seed profile metadata, and launch multi-profile onboarding runs
- **Role-Aware Auth**: Dev auth bypass for local testing, plus role-gated views (Templates, Users, New Onboarding)

## Tech Stack

- **Frontend**: React 18 + Vite 7 (fast dev server, optimized builds)
- **Language**: TypeScript 5.5 in strict mode
- **Styling**: Tailwind CSS 3.4 with a custom design system (brand colors, badges, KPI tiles, animations)
- **Icons**: Lucide React (modern, tree-shakeable icon library)
- **Backend**: Supabase (Postgres database, Auth, Realtime subscriptions)
- **Client Library**: @supabase/supabase-js with typed database client
- **Testing**: Vitest + React Testing Library (650+ tests)

## Installation & Setup

### Prerequisites

- Node.js 18+ and npm

### Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.template .env.local
# Edit .env.local with your Supabase credentials (see below)

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Configuration

Copy `.env.template` to `.env.local` and fill in your Supabase credentials:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL (Settings > API) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public API key |
| `VITE_USE_DEV_AUTH` | No | Set to `true` to bypass real auth for local dev |

You can find your Supabase URL and anon key in your [Supabase Dashboard](https://supabase.com/dashboard) under Settings > API.

### Database Setup

The database schema is defined in `supabase/migrations/`. To apply migrations to your Supabase project:

```bash
npx supabase db push --db-url "your-database-connection-string"
```

Find your connection string in the Supabase Dashboard under Settings > Database.

### Code Quality

```bash
# Run ESLint
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# Format with Prettier
npm run format
```

### Testing

```bash
# Run all tests
npm run test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# Test UI dashboard
npm run test:ui
```

## How to Log In

### Dev Auth Mode (Local Development)

When `VITE_USE_DEV_AUTH=true`, the sign-in page displays quick-login buttons for rapid role-switching:

1. Start the app: `npm run dev`
2. On the sign-in screen, click one of the Quick Login buttons:
   - **Employee**: Access the new hire onboarding timeline
   - **Manager**: Access the live dashboard with KPIs and feedback
   - **Admin**: Full system access

### Email-Based Sign-In

For testing the complete sign-in flow, enter one of these test emails:

| Email | Role | Use Case |
|-------|------|----------|
| `test-employee@example.com` | Employee | Test onboarding timeline, suggest edits, report blockers |
| `test-manager@example.com` | Manager | Test dashboard, view stuck employees, review suggestions |
| `test-admin@example.com` | Admin | Full access (development/QA only) |

### Sign Out

Click your profile menu (top-right) and select "Sign Out" to return to the login page.

## Project Structure

```
onboarding/
├── src/
│   ├── App.tsx                    # Root: auth provider + hash routing
│   ├── main.tsx                   # Vite entry point
│   ├── index.css                  # Tailwind directives + custom classes
│   ├── components/
│   │   ├── OnboardingHub.tsx      # Main app container
│   │   ├── ui/                    # Reusable primitives (Button, Card, Badge, Progress)
│   │   ├── onboarding/            # Employee-facing (StepCard, Timeline, ActionButtons)
│   │   ├── manager/               # Dashboard (KPICard, ActivityFeed, RotReport)
│   │   ├── modals/                # Suggest Edit / Blocker dialogs
│   │   └── templates/             # Template CRUD modals and helpers
│   ├── views/
│   │   ├── EmployeeView.tsx       # New hire "Quest Log" timeline
│   │   ├── ManagerView.tsx        # Dashboard with KPIs, activity feed
│   │   ├── TemplatesView.tsx      # Template builder (manager-only)
│   │   ├── SignInView.tsx         # Auth + quick login buttons
│   │   └── SignOutView.tsx        # Sign-out confirmation
│   ├── hooks/                     # 17 custom hooks (data fetching, subscriptions)
│   ├── services/
│   │   ├── authService.ts         # Supabase Auth wrapper
│   │   ├── roleClient.ts          # Role validation + CRUD
│   │   └── supabase/              # 8 modular data services
│   │       ├── index.ts           # Barrel export
│   │       ├── mappers.ts         # DB row <-> app type mappers
│   │       ├── activityService.ts
│   │       ├── instanceService.ts
│   │       ├── profileService.ts
│   │       ├── profileTemplateService.ts
│   │       ├── roleService.ts
│   │       ├── suggestionService.ts
│   │       ├── templateService.ts
│   │       └── userService.ts
│   ├── config/
│   │   ├── supabase.ts            # Lazy-init typed client (Proxy pattern)
│   │   └── authContext.tsx         # Auth provider + dev auth bypass
│   ├── context/                   # React context providers (DarkMode)
│   ├── data/                      # Mock data for development
│   ├── types/
│   │   ├── index.ts               # App-level type definitions
│   │   └── database.types.ts      # Supabase DB types (16 tables)
│   ├── utils/                     # Helper utilities
│   └── test/
│       └── setup.ts               # Vitest global setup
├── supabase/
│   └── migrations/                # 7 SQL migration files (16 tables)
├── CLAUDE.md                      # AI agent guidance + architecture
├── mvp.md                         # Product spec and feature roadmap
└── .env.template                  # Environment variable reference
```

## Architecture

### Data Layer

The data layer uses 8 modular Supabase services under `src/services/supabase/`, each handling one entity type (users, roles, templates, instances, etc.). A mapper layer converts between snake_case database rows and camelCase app types.

### Database

16 Postgres tables across 3 categories:
- **8 core tables**: users, roles, profiles, templates, profile_templates, onboarding_instances, suggestions, activities
- **3 step-child tables**: template_steps, profile_template_steps, instance_steps
- **5 junction/support tables**: role assignments, indexes, triggers

Schema defined in `supabase/migrations/` (7 migration files).

### Auth

Supabase Auth with a dev-auth bypass mode (`VITE_USE_DEV_AUTH=true`) for local development without needing a live Supabase instance.

### Realtime

Supabase Realtime subscriptions for live data updates. All 16 tables are published for realtime events. Hooks like `useActivities` and `useSuggestions` use subscription-based updates instead of polling.

### Routing

Hash-based SPA routing (`#/`, `#/templates`, `#/sign-out`) with no React Router dependency.

## Custom Tailwind Design System

### Color Palette

- **Brand**: `brand-*` (indigo/violet for CTAs and headers)
- **Status**: `success-*`, `warning-*`, `error-*`, `stuck-*` (semantic task states)
- **Neutrals**: `slate-*` (text, borders, backgrounds)

### Component Classes

```css
.card / .card-hover          /* Cards with elevation and hover effects */
.status-indicator-*          /* Left border accent indicators */
.badge-success/error/warning /* Status pill badges */
.btn-primary/secondary       /* Action buttons with focus states */
.gradient-header             /* Brand gradient for headers */
.glass                       /* Frosted glass effect */
```

### Animations

All animations respect `prefers-reduced-motion`:

- `animate-fade-in`, `animate-slide-up`, `animate-slide-down`, `animate-scale-in`

## Development Workflow

### Coding Standards

- **Indentation**: 2 spaces (Prettier)
- **Naming**: camelCase for variables/functions, PascalCase for components
- **TypeScript**: Strict mode with `noUnusedLocals` and `noUnusedParameters`
- **React**: Functional components with hooks only

### Commit Format

```
feat(scope): add feature description
fix(scope): fix bug description
chore: maintenance task
```

## Target Audience

30-100 employee companies struggling with stale Confluence onboarding pages who need:

- Real-time visibility into new hire progress
- Self-healing documentation through employee feedback
- Reduced IT/HR bottlenecks during onboarding
- Role-specific onboarding paths (Engineering, Sales, Product, etc.)

## License

Private project - not licensed for public use.
