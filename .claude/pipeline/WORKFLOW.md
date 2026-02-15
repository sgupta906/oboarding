# Development Pipeline

> **CRITICAL:** This pipeline is MANDATORY. Claude MUST follow these steps in order.
> Skipping steps or working outside the pipeline is NOT ALLOWED.

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HAPPY PATH FLOW                                  │
│                                                                            │
│   /research → /plan → /implement → /test → /finalize                      │
│    (visual)     │          │          │          │                         │
│       │         ▼          ▼          ▼          ▼                         │
│       ▼       plan.md   impl.md   success.md  PR Created                  │
│   research.md tasks.md                                                     │
│   screenshots/                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           FAILURE PATH FLOW                                │
│                                                                            │
│   /test (fails) → /diagnose → /plan → /implement → /test → /finalize      │
│        │              │          │          │          │          │         │
│        ▼              ▼          ▼          ▼          ▼          ▼         │
│   failure.md    diagnosis.md  plan.md   impl.md   success.md  PR Created  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           REWORK PATH FLOW                                 │
│                                                                            │
│   User: "try different approach" → /rework → /plan → /implement → ...     │
│                                       │          │                         │
│                                       ▼          ▼                         │
│                                  rework.md   new plan.md                   │
│                                  (archives old approach)                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
.claude/
├── pipeline/
│   ├── STATUS.md              # Current pipeline state (read first every session)
│   └── WORKFLOW.md            # This file - pipeline rules
├── features/                  # Committed to git - design docs
│   └── <feature-name>/
│       ├── YYYY-MM-DDTHH:MM_research.md
│       ├── YYYY-MM-DDTHH:MM_plan.md
│       └── tasks.md
├── active-work/               # NOT committed - working files
│   └── <feature-name>/
│       ├── implementation.md
│       ├── test-success.md    # OR
│       ├── test-failure.md
│       └── diagnosis.md
├── agents/                    # Agent definitions
│   ├── research-agent.md
│   ├── plan-agent.md
│   ├── execute-agent.md
│   ├── test-agent.md
│   ├── diagnose-agent.md
│   └── finalize-agent.md
└── commands/                  # Slash command definitions
    ├── research.md
    ├── plan.md
    ├── implement.md
    ├── test.md
    ├── diagnose.md
    ├── finalize.md
    ├── status.md
    └── rework.md
```

## Pipeline Steps (MUST Follow In Order)

### Step 1: Research (`/research <feature-name>`)

**Purpose:** Gather all context before planning

**Agent:** research-agent + Playwright visual agent (parallel)

**Visual Reproduction (NEW):**
Before or during research, Claude MUST launch a sub-agent that uses Playwright MCP
to visually reproduce the current state of the affected area. This gives concrete
"before" screenshots and helps identify issues that code analysis alone might miss.

The visual agent:
1. Navigates to the app (dev server must be running)
2. Screenshots the relevant views/components
3. Documents what's working, what's broken, what's slow
4. Saves screenshots to `.claude/features/<feature-name>/screenshots/`

The research-agent runs in parallel and includes the visual findings in its report.

**Inputs:**
- Feature name from user
- Project specs / requirements
- CLAUDE.md (project conventions)
- Existing codebase
- Playwright visual screenshots (from parallel agent)

**Outputs:**
- `.claude/features/<feature-name>/YYYY-MM-DDTHH:MM_research.md`
- `.claude/features/<feature-name>/screenshots/` (before screenshots)

**Gate:** Research is complete when:
- [ ] Visual reproduction captured (screenshots)
- [ ] All requirements extracted
- [ ] Existing code analyzed
- [ ] Constraints documented
- [ ] Open questions resolved (all `[x]`)
- [ ] Status = `research-complete`

**CANNOT proceed to /plan until gate passes.**

---

### Step 2: Plan (`/plan <feature-name>`)

**Purpose:** Design architecture and break into tasks

**Agent:** plan-agent

**Inputs:**
- `.claude/features/<feature-name>/*_research.md` (REQUIRED)
- CLAUDE.md

**Outputs:**
- `.claude/features/<feature-name>/YYYY-MM-DDTHH:MM_plan.md`
- `.claude/features/<feature-name>/tasks.md`

**Gate:** Planning is complete when:
- [ ] Architecture designed with diagrams
- [ ] File structure mapped
- [ ] Tasks broken into discrete, testable units
- [ ] Tasks ordered by dependencies
- [ ] Testing strategy defined

**CANNOT proceed to /implement until gate passes.**

---

### Step 3: Implement (`/implement <feature-name>`)

**Purpose:** Execute tasks following TDD

**Agent:** execute-agent

**Inputs:**
- `.claude/features/<feature-name>/tasks.md` (REQUIRED)
- `.claude/features/<feature-name>/*_plan.md` (REQUIRED)
- `.claude/features/<feature-name>/*_research.md`

**Outputs:**
- `.claude/active-work/<feature-name>/implementation.md`
- Actual code changes
- Updated `tasks.md` with checkmarks

**Gate:** Implementation is complete when:
- [ ] All tasks marked `[x]` in tasks.md
- [ ] All unit tests passing
- [ ] Build succeeds
- [ ] `implementation.md` created

**CANNOT proceed to /test until gate passes.**

---

### Step 4: Test (`/test <feature-name>`)

**Purpose:** Validate feature works end-to-end

**Agent:** test-agent + Playwright visual verification agent

**Testing has TWO phases:**

**Phase A — Automated tests (test-agent):**
- Run full test suite (`npx vitest run`)
- Run type check (`npx tsc -b`)
- Run build check (`npx vite build`)
- Create pass/fail report

**Phase B — Playwright visual verification (parallel or after Phase A):**
- Launch a sub-agent with Playwright MCP
- Navigate the app and test all affected views
- Verify the feature works visually in the browser
- Compare with "before" screenshots from research phase
- Document any visual regressions or broken flows
- Save screenshots to `.claude/active-work/<feature-name>/screenshots/`

**Both phases must pass for the feature to proceed to /finalize.**

**Inputs:**
- `.claude/active-work/<feature-name>/implementation.md` (REQUIRED)
- `.claude/features/<feature-name>/tasks.md`
- `.claude/features/<feature-name>/screenshots/` (before screenshots from research)

**Outputs (ONE of):**
- `.claude/active-work/<feature-name>/test-success.md` → proceed to /finalize
- `.claude/active-work/<feature-name>/test-failure.md` → proceed to /diagnose

**Gate:** Testing is complete when:
- [ ] All automated tests pass
- [ ] Playwright visual verification passes
- [ ] Report created with screenshots
- [ ] Clear next step identified

---

### Step 5a: Finalize (`/finalize <feature-name>`) - On Success

**Purpose:** Prepare feature for release

**Agent:** finalize-agent

**Inputs:**
- `.claude/active-work/<feature-name>/test-success.md` (REQUIRED)
- `.claude/active-work/<feature-name>/implementation.md`

**Outputs:**
- Documentation cleanup
- Git commit
- Pull request

**Gate:** Finalization is complete when:
- [ ] All quality checks pass
- [ ] Documentation TODOs removed
- [ ] Commit created
- [ ] PR opened (or committed to main)

---

### Step 5b: Diagnose (`/diagnose <feature-name>`) - On Failure

**Purpose:** Find root cause of test failures

**Agent:** diagnose-agent

**Inputs:**
- `.claude/active-work/<feature-name>/test-failure.md` (REQUIRED)
- Error logs, stack traces

**Outputs:**
- `.claude/active-work/<feature-name>/diagnosis.md`

**Gate:** Diagnosis is complete when:
- [ ] Issue reproduced
- [ ] Root cause identified
- [ ] Fix plan created with file:line changes

**After diagnosis → return to /plan with fix plan**

---

## Enforcement Rules

### Rule 1: No Skipping Steps

```
FORBIDDEN:
- Starting implementation without research
- Starting implementation without plan
- Finalizing without testing
- Committing without passing tests

REQUIRED:
- Follow pipeline order exactly
- Check for required input files before proceeding
- Create output files before marking step complete
```

### Rule 2: No Working Outside Pipeline

```
FORBIDDEN:
- Making code changes without going through /implement
- Writing tests without a plan
- Creating PRs without /finalize

REQUIRED:
- All code work goes through the pipeline
- Use appropriate commands for each phase
- Let agents do their specialized work
```

### Rule 3: Handoff Files Are Mandatory

```
Each step MUST read input files and create output files:

/research  →  creates research.md
/plan      →  reads research.md, creates plan.md + tasks.md
/implement →  reads plan.md + tasks.md, creates implementation.md
/test      →  reads implementation.md, creates success.md or failure.md
/finalize  →  reads success.md, creates commit + PR
/diagnose  →  reads failure.md, creates diagnosis.md
```

### Rule 4: Gates Must Pass

```
Before proceeding to next step, verify:

□ Required input files exist
□ Previous step's gate conditions met
□ Output files created with required content
```

## Quick Reference

| Command | Agent | Input Files | Output Files |
|---------|-------|-------------|--------------|
| /research | research-agent | spec, codebase | research.md |
| /plan | plan-agent | research.md | plan.md, tasks.md |
| /implement | execute-agent | plan.md, tasks.md | implementation.md |
| /test | test-agent | implementation.md | success.md OR failure.md |
| /finalize | finalize-agent | success.md | commit, PR |
| /diagnose | diagnose-agent | failure.md | diagnosis.md |

## Error Recovery

### If stuck in any phase:

1. Check if required input files exist
2. Check if previous gate conditions were met
3. If files missing, go back to previous step
4. If unclear, ask user for clarification

### If tests keep failing:

```
/test → failure → /diagnose → diagnosis.md → /plan (with fix) → /implement → /test
```

Loop until tests pass, then proceed to /finalize.
