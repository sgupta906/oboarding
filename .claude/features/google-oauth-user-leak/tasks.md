# Tasks: google-oauth-user-leak

## Metadata
- **Feature:** google-oauth-user-leak
- **Created:** 2026-02-18T20:15
- **Status:** implement-complete
- **Based On:** 2026-02-18T20:15_plan.md

## Execution Rules
- TDD order: write test first (Phase 1), then implement (Phase 2), then verify (Phase 3)
- No tasks are parallelizable -- this is a 3-step sequential fix
- Mark each checkbox as complete during implementation

---

## Phase 1: Write Regression Test (TDD -- test fails initially)

### Task 1.1: Add roleless user to mock data and write regression test
- [x] Add a roleless mock user to `UsersPanel.test.tsx` mock data:
  ```typescript
  {
    id: 'user-google-1',
    email: 'newgoogle@gmail.com',
    name: 'Google OAuth User',
    roles: [],
    profiles: [],
    createdAt: 1701792000000,
    updatedAt: 1701792000000,
    createdBy: 'system',
  }
  ```
- [x] Add regression test in the `Rendering` describe block:
  - Test name: `'does not render users with no roles (Google OAuth unassigned users)'`
  - Set `mockUseUsersReturn.users` to include both roled and roleless users
  - Assert roleless user name/email is NOT in the document (`queryByText` returns null)
  - Assert roled users ARE still rendered
- [x] Run `npx vitest run src/components/manager/UsersPanel.test.tsx` -- expect the new test to FAIL (red phase)

**Files:** `src/components/manager/UsersPanel.test.tsx`

**Acceptance Criteria:**
- [x] New test exists and correctly asserts roleless users are excluded
- [x] New test FAILS because UsersPanel does not yet filter

---

## Phase 2: Implement the Filter

### Task 2.1: Add useMemo filter to UsersPanel.tsx
- [x] Add `useMemo` to the React import on line 1
- [x] Rename `users` to `allUsers` in the `useUsers()` destructure on line 25
- [x] Add `useMemo` filter below the destructure:
  ```typescript
  const users = useMemo(
    () => allUsers.filter((u) => u.roles.length > 0),
    [allUsers],
  );
  ```
- [x] Run `npx vitest run src/components/manager/UsersPanel.test.tsx` -- expect the new test to PASS (green phase)

**Files:** `src/components/manager/UsersPanel.tsx`

**Acceptance Criteria:**
- [x] `useMemo` imported from React
- [x] Users filtered to exclude `roles.length === 0`
- [x] New regression test passes
- [x] All existing UsersPanel tests pass

---

## Phase 3: Full Verification

### Task 3.1: Run full test suite
- [x] Run `npx vitest run` -- all tests must pass
- [x] Verify test count is 670 (669 existing + 1 new regression test)

**Files:** None (verification only)

**Acceptance Criteria:**
- [x] All tests pass (zero failures)
- [x] No type errors (`npx tsc -b` clean)

---

## Handoff Checklist (for Test Agent)

- [x] Regression test verifies roleless users excluded from Users tab
- [x] All existing UsersPanel tests pass unchanged
- [x] Full test suite passes
- [x] TypeScript compiles cleanly
- [x] Fix is presentation-layer only (no store/service/migration changes)
