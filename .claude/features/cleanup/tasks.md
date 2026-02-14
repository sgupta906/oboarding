# Tasks: cleanup

## Metadata
- **Feature:** cleanup
- **Created:** 2026-02-14T09:05
- **Status:** plan-complete
- **Based On:** 2026-02-14T09:05_plan.md

## Execution Rules
- Tasks within a phase run sequentially unless marked **[P]**
- **[P]** = can run in parallel with other [P] tasks in the same phase
- Mark tasks complete with `[x]` when done
- Run tests after each phase to catch regressions early

---

## Phase 1: Delete Dead Files

> Remove all Firebase source, config, infrastructure, logs, and stale documentation.
> These are pure deletions with zero code impact.

### Task 1.1: Delete Firebase Source Files
- [x] Delete `src/config/firebase.ts`
- [x] Delete `src/config/firebase.test.ts`

**Files:** `src/config/firebase.ts`, `src/config/firebase.test.ts`

**Acceptance Criteria:**
- [ ] Both files deleted
- [ ] No TypeScript errors (`npx tsc -b`)
- [ ] No import resolution errors

### Task 1.2: Delete Firebase Config and Infrastructure Files [P]
- [x] Delete `firebase.json`
- [x] Delete `firestore.rules`
- [x] Delete `firestore.indexes.json`
- [x] Delete `storage.rules`
- [x] Delete `docker-compose.yml`
- [x] Delete `scripts/seedTestUsers.ts`
- [x] Remove `scripts/` directory if empty after deletion

**Files:** `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `docker-compose.yml`, `scripts/seedTestUsers.ts`

**Acceptance Criteria:**
- [ ] All 6 files deleted
- [ ] `scripts/` directory removed if empty

### Task 1.3: Delete Dead Root Code Files [P]
- [x] Delete `FIXED_deleteUser.ts`
- [x] Delete `exampleCode.js`

**Files:** `FIXED_deleteUser.ts`, `exampleCode.js`

**Acceptance Criteria:**
- [ ] Both files deleted

### Task 1.4: Delete Stale Log Files [P]
- [x] Delete `firebase-debug.log` (if exists)
- [x] Delete `firestore-debug.log` (if exists)
- [x] Delete `pubsub-debug.log` (if exists)
- [x] Delete `test-output.log` (if exists)
- [x] Delete `test_output.log` (if exists)

**Files:** `firebase-debug.log`, `firestore-debug.log`, `pubsub-debug.log`, `test-output.log`, `test_output.log`

**Acceptance Criteria:**
- [ ] All existing log files deleted

### Task 1.5: Delete Stale Root Documentation [P]
- [x] Delete tracked files: `BUG_REPORT.md`, `CLARIFICATION_FINAL_SUMMARY.md`, `CODE_CHANGES.md`, `CODEX.md`, `CRITICAL_FIXES_CODE_EXAMPLES.md`, `CRITICAL_FIXES_INDEX.md`, `CRITICAL_FIXES_QUICK_REFERENCE.md`, `CRITICAL_FIXES_SUMMARY.md`, `DELIVERABLES.md`, `FIXES_IMPLEMENTATION_STATUS.md`, `FIXES_SUMMARY.txt`, `IMPLEMENTATION_FIXES.md`, `IMPLEMENTATION_SUMMARY.txt`, `INDEX.md`, `QUICK_REFERENCE_NEW_USER_VS_NEW_HIRE.md`, `TEMPLATE_SYNC_IMPLEMENTATION.md`, `TEST_SUITE_SUMMARY.md`, `USER_CREATION_WORKFLOW_ANALYSIS.md`, `UX_IMPROVEMENTS_SUMMARY.md`, `VISUAL_CHANGES_REFERENCE.md`
- [x] Delete untracked files: `DEMO_ONE_PAGER.txt`, `DEMO_PRESENTATION.md`, `DEMO_PRESENTATION_SHORT.md`

**Files:** 23 root documentation files (20 tracked + 3 untracked)

**Acceptance Criteria:**
- [ ] All stale documentation files deleted
- [ ] `README.md`, `CLAUDE.md`, `mvp.md` preserved

### Task 1.6: Delete Stale Directories [P]
- [x] Delete `docs/` directory (contains only `profiles.md`)
- [x] Delete `project_status/` directory (contains only `tickets.md`)
- [x] Delete `tests/fixtures/` directory (had fixture files and README)

**Files:** `docs/`, `project_status/`, `tests/fixtures/`

**Acceptance Criteria:**
- [ ] All 3 directories removed
- [ ] No git tracking errors

---

## Phase 2: Update Dependencies

> Remove Firebase packages and scripts from package.json, then run npm install.

### Task 2.1: Remove Firebase from package.json
- [x] Remove `"firebase": "^12.6.0"` from `dependencies`
- [x] Remove `"firebase-tools": "^14.26.0"` from `devDependencies`
- [x] Remove 6 scripts: `firebase:emulator`, `firebase:emulator:import`, `firebase:emulator:export`, `docker:emulator`, `docker:emulator:down`, `seed:test-users`
- [x] Run `npm install` to update `package-lock.json`

**Files:** `package.json`, `package-lock.json`

**Acceptance Criteria:**
- [ ] `firebase` not in dependencies
- [ ] `firebase-tools` not in devDependencies
- [ ] All 6 Firebase/Docker scripts removed
- [ ] `npm install` completes without errors
- [ ] `package-lock.json` updated (no Firebase references in direct deps)

---

## Phase 3: Update Config Files

> Update environment templates, devcontainer, gitignore, and test setup.

### Task 3.1: Rewrite .env.template
- [x] Remove all Firebase configuration lines (VITE_FIREBASE_*, VITE_USE_FIREBASE_EMULATOR, VITE_FIRESTORE_EMULATOR_HOST, VITE_AUTH_EMULATOR_HOST, VITE_STORAGE_EMULATOR_HOST)
- [x] Rewrite as Supabase-only template with clear documentation comments
- [x] Include: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_USE_DEV_AUTH`
- [x] Add helpful comments explaining where to find Supabase values

**Files:** `.env.template`

**Acceptance Criteria:**
- [ ] No Firebase references in `.env.template`
- [ ] Contains only Supabase + dev auth env vars
- [ ] Comments guide new developers to Supabase project settings

### Task 3.2: Clean .env.local [P]
- [x] Remove lines 8-18 (all legacy Firebase config lines)
- [x] Keep lines 1-6 (Supabase config + dev auth)

**Files:** `.env.local`

**Acceptance Criteria:**
- [ ] No Firebase references in `.env.local`
- [ ] Supabase URL and anon key preserved
- [ ] Dev auth setting preserved

### Task 3.3: Update .devcontainer/devcontainer.json [P]
- [x] Remove `firebase-tools` from `postCreateCommand` (change `npm install && npm install -g firebase-tools && cp -n .env.template .env.local 2>/dev/null || true` to `npm install && cp -n .env.template .env.local 2>/dev/null || true`)
- [x] Remove Firebase emulator ports from `forwardPorts` (remove 4000, 8080, 9099, 9199; keep 5173)
- [x] Remove Java 17 feature (only needed for Firebase emulators)

**Files:** `.devcontainer/devcontainer.json`

**Acceptance Criteria:**
- [ ] No Firebase references in devcontainer config
- [ ] `postCreateCommand` runs npm install and copies env template
- [ ] Only port 5173 forwarded
- [ ] Java feature removed
- [ ] JSON is valid

### Task 3.4: Update .gitignore [P]
- [x] Remove the "Firebase Emulator" section (lines 139-145): `.firebase/`, `firebase_data/`, `ui-debug.log`, `database-debug.log`

**Files:** `.gitignore`

**Acceptance Criteria:**
- [ ] No Firebase section in `.gitignore`
- [ ] All other sections preserved

### Task 3.5: Update src/test/setup.ts [P]
- [x] Remove line 66: `(import.meta.env as any).VITE_FIREBASE_PROJECT_ID = '';`

**Files:** `src/test/setup.ts`

**Acceptance Criteria:**
- [ ] No Firebase references in test setup
- [ ] `VITE_USE_DEV_AUTH` line preserved (line 65)
- [ ] All tests still pass

---

## Phase 4: Update Source Code

> Rename Firestore aliases and update stale comments in source files.

### Task 4.1: Rename Firestore Aliases in roleClient.ts
- [x] Rename import alias `createRole as firestoreCreateRole` to `createRole as dbCreateRole` (line 10)
- [x] Rename import alias `updateRole as firestoreUpdateRole` to `updateRole as dbUpdateRole` (line 11)
- [x] Rename import alias `deleteRole as firestoreDeleteRole` to `deleteRole as dbDeleteRole` (line 12)
- [x] Update usage on line 209: `firestoreCreateRole` -> `dbCreateRole`
- [x] Update usage on line 263: `firestoreUpdateRole` -> `dbUpdateRole`
- [x] Update usage on line 288: `firestoreDeleteRole` -> `dbDeleteRole`
- [x] Update usage on line 319: `firestoreCreateRole` -> `dbCreateRole`

**Files:** `src/services/roleClient.ts`

**Acceptance Criteria:**
- [ ] Zero occurrences of `firestore` (case-insensitive) in file
- [ ] All `dbCreateRole`, `dbUpdateRole`, `dbDeleteRole` usages compile
- [ ] TypeScript compilation passes

### Task 4.2: Update roleClient.test.ts to Match Renames
- [x] Rename import alias `createRole as firestoreCreateRole` to `createRole as dbCreateRole` (line 22)
- [x] Rename import alias `updateRole as firestoreUpdateRole` to `updateRole as dbUpdateRole` (line 23)
- [x] Rename import alias `deleteRole as firestoreDeleteRole` to `deleteRole as dbDeleteRole` (line 24)
- [x] Replace all `firestoreCreateRole` references with `dbCreateRole` (~15 occurrences)
- [x] Replace all `firestoreUpdateRole` references with `dbUpdateRole` (~5 occurrences)
- [x] Replace all `firestoreDeleteRole` references with `dbDeleteRole` (~5 occurrences)
- [x] Update error message strings: "Firestore connection failed" -> "Database connection failed" (line 211)
- [x] Update error message strings: "Firestore error" -> "Database error" (lines 345, 348, 466, 469, 573, 606)
- [x] Update test description: "should return error on Firestore failure" -> "should return error on database failure" (line 209)
- [x] Update test description: "should handle Firestore creation errors" -> "should handle database creation errors" (line 343)
- [x] Update test description: "should handle Firestore deletion errors" -> "should handle database deletion errors" (line 464)
- [x] Update test description: "should handle Firestore errors gracefully" -> "should handle database errors gracefully" (line 605)

**Files:** `src/services/roleClient.test.ts`

**Acceptance Criteria:**
- [ ] Zero occurrences of `firestore` or `Firestore` in file
- [ ] All 45 tests in roleClient.test.ts pass
- [ ] Import aliases match roleClient.ts

### Task 4.3: Update Comments in src/types/index.ts [P]
- [x] Line 3: "These types mirror the Firestore schema structure" -> "These types mirror the Supabase database schema"
- [x] Line 17: "Maps to Firestore 'roles' collection" -> "Maps to Supabase 'roles' table"
- [x] Line 39: "Maps to Firestore 'profiles' collection" -> "Maps to Supabase 'profiles' table"
- [x] Line 53: "Maps to Firestore 'profileTemplates' collection" -> "Maps to Supabase 'profile_templates' table"
- [x] Line 116: "Maps to Firestore 'steps' collection documents" -> "Represents a single onboarding step/task"
- [x] Line 136: "Maps to Firestore 'suggestions' collection" -> "Maps to Supabase 'suggestions' table"
- [x] Line 242: "Maps to Firestore 'templates' collection" -> "Maps to Supabase 'templates' table"
- [x] Line 257: "Maps to Firestore 'onboarding_instances' collection" -> "Maps to Supabase 'onboarding_instances' table"
- [x] Line 82: "Maps to Firestore 'users' collection" -> "Maps to Supabase 'users' table"

**Files:** `src/types/index.ts`

**Acceptance Criteria:**
- [ ] Zero occurrences of "Firestore" in file
- [ ] All comments accurately reference Supabase table names
- [ ] TypeScript compilation passes

### Task 4.4: Update Comments in src/types/database.types.ts [P]
- [x] Line 38: "Firestore equivalent: 'users' collection." -> Remove "Firestore equivalent:" prefix, keep table description
- [x] Line 67: "Firestore equivalent: 'roles' collection." -> same
- [x] Line 96: "Firestore equivalent: 'profiles' collection." -> same
- [x] Line 122: "Firestore equivalent: 'templates' collection." -> same
- [x] Line 154: "Firestore equivalent: 'profileTemplates' collection." -> same
- [x] Line 192: "Firestore equivalent: 'onboarding_instances' collection." -> same
- [x] Line 239: "Firestore equivalent: 'suggestions' collection." -> same
- [x] Line 271: "Firestore equivalent: 'activities' collection." -> same
- [x] Line 310: "Firestore equivalent: Template.steps[] embedded array." -> "Steps belonging to a template."
- [x] Line 351: "Firestore equivalent: OnboardingInstance.steps[] embedded array." -> "Steps belonging to an onboarding instance."
- [x] Line 392: "Firestore equivalent: ProfileTemplate.steps[] embedded array." -> "Steps belonging to a profile template."
- [x] Line 437: "Firestore equivalent: User.roles[] embedded array." -> "User role assignments."
- [x] Line 454: "Firestore equivalent: User.profiles[] embedded array." -> "User profile assignments."
- [x] Line 471: "Firestore equivalent: Profile.roleTags[] embedded array." -> "Profile role tag assignments."
- [x] Line 488: "Firestore equivalent: OnboardingInstance.profileIds[] embedded array." -> "Instance profile assignments."
- [x] Line 505: "Firestore equivalent: OnboardingInstance.templateIds[] embedded array." -> "Instance template references."

**Files:** `src/types/database.types.ts`

**Acceptance Criteria:**
- [ ] Zero occurrences of "Firestore" in file
- [ ] All comments describe tables without referencing Firestore
- [ ] TypeScript compilation passes

### Task 4.5: Update Stale Comments in Other Source Files [P]
- [x] `src/config/supabase.ts` line 5: Remove "This module mirrors the pattern established in `firebase.ts` -- both read from VITE_* environment variables and export a configured client." -> "Reads from VITE_* environment variables and exports a configured client."
- [x] `src/App.tsx` line 106: "Manages Firebase auth state" -> "Manages Supabase auth state"
- [x] `src/data/mockData.ts` line 2: "Mock data simulating Firestore collections" -> "Mock data simulating database tables"
- [x] `src/components/OnboardingHub.tsx` line 3: "Now backed by real Firestore data" -> "Now backed by real Supabase data"
- [x] `src/services/roleOperations.test.ts` line 28: "from the old Firebase/localStorage era" -> "using localStorage-backed implementations"

**Files:** `src/config/supabase.ts`, `src/App.tsx`, `src/data/mockData.ts`, `src/components/OnboardingHub.tsx`, `src/services/roleOperations.test.ts`

**Acceptance Criteria:**
- [ ] Zero occurrences of "Firebase" or "Firestore" in modified lines
- [ ] Comments are accurate for current Supabase architecture
- [ ] TypeScript compilation passes

---

## Phase 5: Update Documentation

> Fill in CLAUDE.md placeholder sections with real project details.

### Task 5.1: Fill In CLAUDE.md Project Details
- [x] Replace placeholder "Project Overview" section with 2-3 sentence project description
- [x] Replace placeholder "Technical Stack" section with actual tech stack list
- [x] Replace placeholder "Build & Run Commands" section with real commands (npm install, npm run dev, npm test, npx tsc -b, npm run build)
- [x] Replace placeholder "Architecture" section with actual `src/` directory tree
- [x] Replace placeholder "Testing Requirements" section with Vitest + RTL details
- [x] Replace placeholder "Key Technical Details" section with lazy-init Supabase client, hash-based routing, service architecture details
- [x] Replace placeholder "Performance Targets" section (or note N/A)
- [x] Replace placeholder "Platform Permissions / Configuration" section with Supabase env var documentation

**Files:** `CLAUDE.md`

**Acceptance Criteria:**
- [ ] No HTML comment placeholders remain in customizable sections
- [ ] All sections contain accurate, up-to-date information
- [ ] Build commands are correct and tested

---

## Phase 6: Verification

> Run full test suite, TypeScript compiler, and production build to confirm zero regressions.

### Task 6.1: Run Full Test Suite
- [x] Run `npx vitest run`
- [x] Verify 650 tests pass (653 - 3 from deleted firebase.test.ts)
- [x] Verify zero test failures

**Acceptance Criteria:**
- [ ] 650 tests passing
- [ ] Zero failures
- [ ] Zero skipped tests (unless pre-existing)

### Task 6.2: Run TypeScript Compiler [P]
- [x] Run `npx tsc -b`
- [x] Verify zero TypeScript errors

**Acceptance Criteria:**
- [ ] Zero TypeScript compilation errors

### Task 6.3: Run Production Build [P]
- [x] Run `npx vite build`
- [x] Verify clean build with no warnings related to Firebase

**Acceptance Criteria:**
- [ ] Build succeeds
- [ ] No Firebase-related warnings

### Task 6.4: Verify No Firebase References Remain
- [x] Run `grep -ri "firebase" src/ --include="*.ts" --include="*.tsx"` -- expect zero results
- [x] Run `grep -ri "firestore" src/ --include="*.ts" --include="*.tsx"` -- expect zero results
- [x] Confirm no Firebase packages in `node_modules/.package-lock.json` direct dependencies

**Acceptance Criteria:**
- [ ] Zero occurrences of "firebase" in any src/ TypeScript file
- [ ] Zero occurrences of "firestore" in any src/ TypeScript file
- [ ] Firebase fully removed from dependency tree

---

## Handoff Checklist (for Test Agent)

- [x] All Phase 1-5 tasks marked complete
- [x] 650 tests passing (`npx vitest run`)
- [x] Zero TypeScript errors (`npx tsc -b`)
- [x] Production build succeeds (`npx vite build`)
- [x] Zero Firebase/Firestore references in `src/` directory
- [x] `package.json` has no firebase dependencies
- [x] `.env.template` is Supabase-only
- [x] `CLAUDE.md` has real project details (no placeholders)
