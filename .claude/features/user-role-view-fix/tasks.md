# Tasks: user-role-view-fix

## Metadata
- **Feature:** user-role-view-fix
- **Created:** 2026-02-16T23:30
- **Status:** implementation-complete
- **Based On:** 2026-02-16T23:30_plan.md

## Execution Rules
- Tasks are sequential unless marked [P]
- TDD: write tests BEFORE implementation (Task 1 tests, then Task 2 code)
- Mark items with [x] as completed
- Each task has acceptance criteria that must pass before moving on

---

## Phase 1: Setup -- Type Definition

### Task 1.1: Broaden UserRole type and add hasManagerAccess() helper
- [x] Open `src/config/authTypes.ts`
- [x] Change line 9 from `export type UserRole = 'employee' | 'manager' | 'admin';` to `export type UserRole = string;`
- [x] Add exported `hasManagerAccess()` function after the type definition
- [x] Verify file saves without TypeScript errors (`npx tsc -b`)

**Files:** `src/config/authTypes.ts`

**Acceptance Criteria:**
- [x] `UserRole` is `string` (not union)
- [x] `hasManagerAccess` is exported
- [x] No TypeScript errors

---

## Phase 2: Tests (TDD -- write before implementation)

### Task 2.1: Write unit tests for hasManagerAccess()
- [x] Create `src/config/authTypes.test.ts`
- [x] Test cases:
  - `null` returns `false`
  - `'employee'` returns `false`
  - `'manager'` returns `true`
  - `'admin'` returns `true`
  - `'team-lead'` returns `true` (custom role)
  - `'hr-admin'` returns `true` (custom role)
  - `'talker'` returns `true` (custom role from research)
  - `''` returns `true` (edge: empty string is non-null, non-employee)
- [x] Run `npx vitest run src/config/authTypes.test.ts` -- all tests pass

**Files:** `src/config/authTypes.test.ts` (new)

**Acceptance Criteria:**
- [x] 8 test cases covering null, employee, standard roles, custom roles, edge cases
- [x] All tests pass

---

## Phase 3: Core Implementation

### Task 3.1: Update App.tsx -- 3 locations
- [x] Add import: `import { hasManagerAccess } from './config/authTypes';`
- [x] Line 22: Replace `role === 'manager' || role === 'admin' ? 'manager' : 'employee'` with `hasManagerAccess(role) ? 'manager' : 'employee'`
- [x] Line 34: Replace `if (role === 'manager' || role === 'admin')` with `if (hasManagerAccess(role))`
- [x] Line 89: Replace `const canAccessTemplates = role === 'manager' || role === 'admin'` with `const canAccessTemplates = hasManagerAccess(role)`

**Files:** `src/App.tsx`

**Acceptance Criteria:**
- [x] All 3 inline role checks replaced with `hasManagerAccess(role)`
- [x] Import added at top of file
- [x] No TypeScript errors

### Task 3.2: Update OnboardingHub.tsx -- 1 location
- [x] Add import: `import { hasManagerAccess } from '../config/authTypes';`
- [x] Line 40: Replace `const isManager = role === 'manager' || role === 'admin'` with `const isManager = hasManagerAccess(role)`

**Files:** `src/components/OnboardingHub.tsx`

**Acceptance Criteria:**
- [x] Inline role check replaced with `hasManagerAccess(role)`
- [x] Import added at top of file

### Task 3.3: Update NavBar.tsx -- 1 location
- [x] Add import: `import { hasManagerAccess } from '../../config/authTypes';`
- [x] Line 41: Replace `const canAccessManagerView = role === 'manager' || role === 'admin'` with `const canAccessManagerView = hasManagerAccess(role)`
- [x] Update comment on line 40 to reflect new logic

**Files:** `src/components/ui/NavBar.tsx`

**Acceptance Criteria:**
- [x] Inline role check replaced with `hasManagerAccess(role)`
- [x] Import added at top of file
- [x] Comment updated

### Task 3.4: Update authContext.tsx -- JSDoc comment only
- [x] Line 284: Replace `{(role === 'manager' || role === 'admin') && <ManagerView />}` with `{hasManagerAccess(role) && <ManagerView />}` in JSDoc comment

**Files:** `src/config/authContext.tsx`

**Acceptance Criteria:**
- [x] JSDoc comment updated to show new pattern

### Task 3.5: Fix authService.test.ts -- type annotation
- [x] Line 244: Replace `const testRoles: Array<'employee' | 'manager' | 'admin'>` with `const testRoles: string[]`

**Files:** `src/services/authService.test.ts`

**Acceptance Criteria:**
- [x] Type annotation uses `string[]` instead of hardcoded union
- [x] No TypeScript errors

---

## Phase 4: Verification

### Task 4.1: Run full test suite
- [x] Run `npx vitest run` -- all 528 tests pass (520 existing + 8 new)
- [x] Run `npx tsc -b` -- no TypeScript errors
- [x] Verify no regressions in existing role-related tests

**Acceptance Criteria:**
- [x] All tests pass
- [x] Zero TypeScript errors
- [x] Test count increased by 8

---

## Handoff Checklist (for Test Agent)

- [x] `hasManagerAccess()` helper exists in `src/config/authTypes.ts`
- [x] All 5 call sites use `hasManagerAccess(role)` instead of inline checks
- [x] `UserRole` type is `string` (not union)
- [x] 8 new unit tests for `hasManagerAccess()` pass
- [x] All 520+ existing tests still pass
- [x] `npx tsc -b` has zero errors
- [x] Custom role users (e.g., "team-lead") see Manager Dashboard, not Employee View
