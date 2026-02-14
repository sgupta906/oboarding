---
description: Validate feature implementation - runs full test suite and creates pass/fail report
---

# Test Feature

Validate that a feature implementation works correctly through unit, integration, and E2E testing. This command triggers the test-agent AFTER implementation is complete.

## Usage

```
/test <feature-name>
```

## Prerequisites

**Implementation must be complete first!** Run `/implement` before `/test`.

The test workflow expects to find:

- `.claude/features/<feature-name>/*_research.md`
- `.claude/features/<feature-name>/*_plan.md`
- `.claude/features/<feature-name>/tasks.md`
- `.claude/active-work/<feature-name>/implementation.md`

## Examples

```
/test user-auth
/test notifications
```

## What This Does

1. **Reads implementation summary** from `.claude/active-work/<feature-name>/implementation.md`
2. **Runs test suite systematically** (using commands from CLAUDE.md):
   - Unit tests
   - Integration tests (if applicable)
   - E2E tests (if applicable)
3. **Validates quality gates**:
   - All tests passing
   - No console errors
   - Build succeeds
4. **Creates test report**:
   - Success: `.claude/active-work/<feature-name>/test-success.md`
   - Failure: `.claude/active-work/<feature-name>/test-failure.md`

## Test Report Outcomes

### Success Report (`test-success.md`)

```markdown
# Test Success: <feature-name>

## Summary
- **Status:** PASS
- **Timestamp:** <timestamp>
- **Tests Run:** <count>
- **Tests Passed:** <count>

## Test Results
### Unit Tests
- [x] test_file_1 - PASS
- [x] test_file_2 - PASS

## Quality Checks
- [x] Build succeeds
- [x] No console errors
- [x] All acceptance criteria met

## Recommendation
READY FOR FINALIZE AGENT - Run `/finalize <feature-name>`
```

### Failure Report (`test-failure.md`)

```markdown
# Test Failure: <feature-name>

## Summary
- **Status:** FAIL
- **Timestamp:** <timestamp>
- **Tests Failed:** <count>

## Failed Tests
### <test-file>
- **Error:** <error message>
- **Expected:** <expected>
- **Actual:** <actual>
- **Stack Trace:** ...

## Root Cause Hypothesis
[What might be causing this]

## Recommendation
NEEDS DIAGNOSIS - Run `/diagnose <feature-name>`
```

## Pipeline Flow

```
                    ┌─────────────┐
                    │   /test     │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
    ┌─────────────────┐      ┌─────────────────┐
    │  test-success.md │      │  test-failure.md │
    │                 │      │                 │
    │  → /finalize    │      │  → /diagnose    │
    └─────────────────┘      └─────────────────┘
```

## User Input

$ARGUMENTS
