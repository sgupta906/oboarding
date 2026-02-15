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
