# Profile Fixtures

This directory contains sample profiles and profile templates for testing the profile-based onboarding system.

## Directory Structure

```
tests/fixtures/profiles/
├── engineer.json              # Engineer profile definition
├── sales.json                 # Sales profile definition
├── templates/
│   ├── engineer-standard.json      # Standard engineer onboarding template
│   ├── engineer-accelerated.json   # Fast-track engineer onboarding template
│   └── sales-standard.json         # Standard sales onboarding template
└── README.md                  # This file
```

## Fixture Files

### Profiles

#### engineer.json
- **ID**: `local-profile-1`
- **Role Tags**: `["Engineering", "All"]`
- **Description**: Standard engineer profile
- **Used By**: engineer-standard.json, engineer-accelerated.json

#### sales.json
- **ID**: `local-profile-3`
- **Role Tags**: `["Sales", "All"]`
- **Description**: Sales representative profile
- **Used By**: sales-standard.json

### Templates

#### engineer-standard.json
- **Profile**: Engineer
- **Template ID**: `local-template-1`
- **Published**: Yes
- **Steps**: 4 (Dev setup, Repo access, Code review, First task)
- **Timeline**: 2-4 weeks
- **Target**: All new engineers

#### engineer-accelerated.json
- **Profile**: Engineer
- **Template ID**: `local-template-2`
- **Published**: Yes
- **Steps**: 4 (Dev setup, Repo access, Architecture dive, First task)
- **Timeline**: 1-2 weeks
- **Target**: Experienced engineers
- **Note**: Has different step 3 (Architecture Deep Dive instead of Code Review Training)

#### sales-standard.json
- **Profile**: Sales
- **Template ID**: `local-template-3`
- **Published**: Yes
- **Steps**: 4 (CRM training, Product knowledge, Sales methodology, First customer call)
- **Timeline**: 3-4 weeks
- **Target**: All new sales representatives

## Usage in Tests

### Loading Fixtures

```typescript
import engineerProfile from '../fixtures/profiles/engineer.json';
import engineerStandardTemplate from '../fixtures/profiles/templates/engineer-standard.json';

describe('Profile Template Operations', () => {
  it('should load engineer profile from fixture', () => {
    expect(engineerProfile.name).toBe('Engineer');
    expect(engineerProfile.roleTags).toContain('Engineering');
  });

  it('should load engineer standard template from fixture', () => {
    expect(engineerStandardTemplate.name).toBe('Engineer Standard Onboarding');
    expect(engineerStandardTemplate.steps).toHaveLength(4);
  });
});
```

### Multi-Profile Onboarding Test

```typescript
it('should merge steps from multiple profile templates', () => {
  const engineerTemplate = engineerStandardTemplate;
  const acceleratedTemplate = engineerAcceleratedTemplate;

  // Simulate assigning both profiles
  const templateSnapshots = {
    [engineerTemplate.id]: {
      profileId: 'local-profile-1',
      steps: engineerTemplate.steps,
      templateName: engineerTemplate.name,
      capturedAt: Date.now(),
    },
    [acceleratedTemplate.id]: {
      profileId: 'local-profile-1',
      steps: acceleratedTemplate.steps,
      templateName: acceleratedTemplate.name,
      capturedAt: Date.now(),
    },
  };

  // Steps 1, 2, 4 should be deduplicated (engineer-standard version kept)
  // Step 7 is unique to accelerated
  const mergedSteps = mergeTemplateSteps(templateSnapshots);
  expect(mergedSteps.length).toBe(4); // Steps 1, 2, 4, 7
});
```

## Extending Fixtures

### Adding a New Profile

1. Create a new JSON file in this directory (e.g., `marketing.json`)
2. Use a unique `id` (e.g., `local-profile-X`)
3. Add appropriate `roleTags` matching existing roles
4. Update this README with the new fixture

### Adding a New Template

1. Create a new JSON file in `templates/` (e.g., `marketing-standard.json`)
2. Set `profileId` to match the parent profile
3. Define `steps[]` with proper `id` numbering to avoid collisions
4. Set `isPublished: true` if it should be available for selection
5. Update this README with the new fixture

## Step ID Conventions

To avoid collisions when merging multi-profile templates, use ID ranges:

- **Engineering**: 1-9
- **Sales**: 10-19
- **Marketing**: 20-29
- **Operations**: 30-39
- **Product**: 40-49
- **Cross-functional**: 50-99

**Note**: Shared steps (like "Orientation" or "Safety Training") should use IDs from the most likely primary profile and be present in multiple templates.

## Maintenance

- Update fixtures when the schema changes (new fields, validation rules)
- Keep fixtures in sync with the default seeds in `src/services/dataClient.ts`
- Add new fixtures when introducing new profiles to the system
- Document any special test scenarios in the relevant test files

---

**Last Updated**: 2025-12-04
**Related**: `docs/profiles.md`, `src/services/dataClient.ts`, `src/types/index.ts`
