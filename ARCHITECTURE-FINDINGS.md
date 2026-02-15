# Architecture Findings — OnboardingHub

## Summary

The project is lean (12,200 lines, 4 runtime deps, 703KB src/) but has a fragmented data layer that causes sync bugs whenever new views are added.

## The Problem: Isolated State Silos

Every hook manages its own independent copy of state via `useState`. There is no shared data layer.

### Current Architecture

```
useEmployeeOnboarding  →  own useState  →  subscribes to Supabase (single instance)
useOnboardingInstances →  own useState  →  subscribes to Supabase (all instances)
useSteps               →  own useState  →  subscribes to Supabase (steps for one instance)
useUsers               →  own useState  →  subscribes to Supabase (all users)
useActivities          →  own useState  →  subscribes to Supabase (activities)
useSuggestions         →  own useState  →  subscribes to Supabase (suggestions)
useManagerData         →  bundles 3 hooks together, but they're still independent states
```

**12 hooks, 72 useState/useEffect/useCallback calls, zero shared state.**

Each hook opens its own Supabase realtime subscription, receives updates independently, and stores data in its own local React state. No hook knows about any other hook's data.

### What Happens When an Employee Completes a Step

1. `useSteps` gets the realtime update — the employee's step list re-renders ✓
2. `useOnboardingInstances` is a **separate subscription** — it may update later, or the data shape may not include the derived status
3. The manager's New Hires table reads from `useOnboardingInstances` — stale until its own subscription fires
4. The manager's Dashboard KPIs are computed from a different copy of the same data
5. The Employee View dropdown reads from yet another copy

**Result:** Multiple views showing different states for the same hire at the same time.

### Bugs Caused by This Architecture

| Bug | Root Cause |
|-----|-----------|
| `employee-dropdown-sync` — Manager's Employee View dropdown doesn't update when employees complete steps | Dropdown reads from `useOnboardingInstances`, employee view reads from `useSteps` — separate state |
| `realtime-status-sync` — New Hires table progress/status doesn't update in real-time | New Hires table reads from its own subscription, not the same state the employee is updating |
| `step-button-fix` — Step buttons glitch/delay | Optimistic update in `useSteps` races with the realtime subscription callback |

All three bugs are symptoms of the same problem: no single source of truth.

## The Fix: Centralized Data Store

Replace the 12 independent hooks with a single store that all components read from.

### Target Architecture

```
DataStore (single source of truth)
├── users:     Map<id, User>
├── instances: Map<id, Instance>     ← one copy, everyone reads
├── steps:     Map<instanceId, Step[]>
├── activities: Activity[]
├── suggestions: Suggestion[]
└── subscriptions: managed centrally  ← one subscription per table

Components read via selectors:
  const instance = useStore(s => s.instances.get(id))
  const steps = useStore(s => s.steps.get(instanceId))

Update once → updates everywhere. Same object reference.
```

### Implementation Options

| Option | Size | Complexity | Fits This Project? |
|--------|------|------------|-------------------|
| **Zustand** | ~1KB | Low — just a hook around a plain object | Yes — minimal API, no boilerplate, no providers |
| React Context + useReducer | 0KB (built-in) | Medium — need to manage re-renders manually | Possible but less ergonomic at this scale |
| Jotai | ~3KB | Low — atom-based, good for derived state | Viable alternative to Zustand |

**Recommendation: Zustand.** It's the simplest option that solves the problem. One store file, selectors in components, no provider wrappers, and it handles subscription-driven updates well.

### What Changes

1. **New:** `src/store/` — single Zustand store with slices for each entity
2. **New:** Centralized subscription manager — one realtime listener per table, writes to store
3. **Refactor:** Hooks become thin selectors (`useStore(s => s.instances)`) or are removed entirely
4. **Refactor:** Optimistic updates happen in the store, not scattered across hooks
5. **Delete:** Most of the 12 hooks (their state management logic moves to the store)

### What Stays the Same

- Services layer (`src/services/supabase/`) — still handles Supabase API calls
- Components — still receive data via hooks/selectors, just from one source now
- Types — unchanged
- Tests — service mocks stay, hook tests become store tests

## Impact

- Fixes bugs #2, #3, #4 from the roadmap as a side effect of the refactor
- Any new view added in the future automatically gets correct, synced data
- Fewer Supabase subscriptions (one per table instead of one per hook instance)
- Less code overall (store replaces ~1,000 lines of hook boilerplate)

---

## Other Issues Found

### 2. Duplicate Subscriptions

`NewHiresPanel` calls `useOnboardingInstances()` directly inside itself (line 67). But `OnboardingHub` already loads `useOnboardingInstances` via `useManagerData`. So when a manager views the New Hires tab, **two independent subscriptions** to the same Supabase table are running simultaneously, each with its own state.

Same pattern in `RoleManagementPanel` — it likely calls `useRoles()` internally while the parent also loads roles for the Create Onboarding modal.

**Fix:** Centralized store eliminates this. Every component reads from one place, one subscription per table.

### 3. God Component — OnboardingHub (343 lines)

`OnboardingHub.tsx` is doing too much:
- Manages employee data loading
- Manages manager data loading
- Handles step status changes with optimistic updates
- Handles suggestion approve/reject with optimistic updates
- Manages modal state
- Handles employee selection for manager view
- Computes derived data (managerSteps, stuckEmployeeNames)
- Renders conditionally for employee vs. manager

Every new feature touching onboarding touches this file. It's a bottleneck.

**Fix:** With a centralized store, most of the state management and event handlers move out. `OnboardingHub` becomes a thin routing component: "are you an employee or manager? Render that view." The views themselves read from the store and dispatch actions directly.

### 4. Props Drilling Through ManagerView

Look at the data flow for suggestions:
```
OnboardingHub
  → loads suggestions via useManagerData
  → passes suggestions to ManagerView as props
    → ManagerView passes them to SuggestionsSection as props
      → SuggestionsSection passes each to SuggestionCard as props
```

And the callbacks go back up:
```
SuggestionCard → onApprove(id)
  → SuggestionsSection → onApprove(id)
    → ManagerView → onApproveSuggestion(id)
      → OnboardingHub → handleApproveSuggestion(id)
```

Four levels deep, both directions. Adding any new data to the manager dashboard means threading it through every layer.

**Fix:** With a store, `SuggestionCard` calls `useStore(s => s.approveSuggestion)` directly. No prop threading.

### 5. No Routing Library

The app uses manual hash routing in `App.tsx`:
```ts
window.addEventListener('hashchange', handleHashChange);
```

This works for 3 routes (`#/`, `#/templates`, `#/sign-out`), but adding the Users page (or any future page) means more `if/else` branches in `App.tsx`. There's no route params, no nested routes, no programmatic navigation beyond `window.location.hash = '...'`.

The tab system inside `ManagerView` is also manual state (`activeTab: 'dashboard' | 'roles' | 'new-hires'`). These tabs aren't in the URL, so you can't link directly to the Roles tab or use browser back/forward.

**Fix (optional):** If you're adding more pages, consider a lightweight router. React Router is the standard, but even something like `wouter` (~1.5KB) would give you route params and nested routes. This is lower priority than the state management fix — the current approach works, it's just not scalable.

### 6. Inline Tailwind Sprawl

649 `className=` occurrences across 35 files. Some examples from `ManagerView.tsx`:
```tsx
className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
  activeTab === 'dashboard'
    ? 'border-brand-600 text-brand-600'
    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
}`}
```

This same tab button pattern is repeated 3 times in that file. Similar patterns repeat across components for badges, cards, buttons, status indicators, etc.

Not a bug, but it makes components harder to read and the styling harder to stay consistent. The `getStatusBadgeClasses()` pattern in `NewHiresPanel` is actually the right idea — extract repeated style logic into named functions.

**Fix (low priority):** No need for a full CSS refactor, but as you touch components, extract repeated className patterns into small utility functions or shared Tailwind `@apply` classes. The existing `ui/` components (Badge, Card, ProgressBar) are a good start — just extend the pattern.

### 7. Types File Is a Grab Bag

`src/types/index.ts` (377 lines) has domain types, component props, validation types, and UI state types all in one file. When you add a new component, you add its props here. When you add a new entity, you add its type here.

This creates a coupling problem: changing a `BadgeColor` type triggers a recompile of everything that imports from `types/`. More practically, it's hard to find what you're looking for.

**Fix (low priority):** Split into `types/entities.ts` (User, Step, Instance, etc.), `types/props.ts` (component props), and keep `types/index.ts` as a barrel. Or co-locate component props with their components — that's the more modern React pattern.

---

## Priority Order

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | Centralized store (Zustand) | Fixes 3 known bugs, prevents future sync issues, enables easy feature addition | Medium — 2-3 day refactor |
| 2 | Eliminate duplicate subscriptions | Performance + correctness | Comes free with #1 |
| 3 | Slim down OnboardingHub | Maintainability | Comes mostly free with #1 |
| 4 | Remove prop drilling | Developer experience | Comes free with #1 |
| 5 | Add routing library | Scalability for new pages | Small — if/when needed |
| 6 | Extract Tailwind patterns | Readability | Ongoing, low effort |
| 7 | Split types file | Organization | Small, do anytime |

The Zustand refactor is the big one. Issues #2, #3, and #4 resolve themselves as a byproduct of it. Issues #5-#7 are quality-of-life improvements you can do incrementally.
