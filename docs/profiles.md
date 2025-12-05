# Profile Schema & Assignment Guide

## Overview

Profiles are role-based onboarding templates that organize company-specific employee journeys by discipline or department. A profile (e.g., "Engineer", "Sales") contains one or more profile-specific templates, each with a checklist of steps tailored to that role. Managers assign profiles to new hires, and employees complete their assigned profile's steps during onboarding.

## Schema

### Entity Relationship Diagram (ERD)

```
┌────────────────────────────────────────────────────────────────┐
│                    FIRESTORE COLLECTIONS                        │
└────────────────────────────────────────────────────────────────┘

users (employees/managers/admins)
  ├─ id: string (Firestore doc ID)
  ├─ email: string (unique)
  ├─ name: string
  ├─ roles: string[] (e.g., ["manager", "admin"])
  └─ profiles?: string[] ─────┐
                              │
                    ┌─────────▼─────────┐
                    │    profiles       │
                    │   (collection)    │
                    ├─────────────────┤
                    │ id: string      │
                    │ name: string    │ ◄────┐
                    │ description?    │      │
                    │ roleTags[]      │      │
                    │ createdAt       │      │
                    │ createdBy       │      │
                    └────────┬────────┘      │
                             │               │
                             │ profileId     │
                    ┌────────▼────────┐      │
                    │profileTemplates │      │
                    │  (collection)   │      │
                    ├────────────────┤      │
                    │ id: string     │      │
                    │ profileId ─────┼──────┘
                    │ name: string   │
                    │ description?   │
                    │ steps[]        │
                    │ createdAt      │
                    │ updatedAt      │
                    │ createdBy      │
                    │ version        │
                    │ isPublished    │
                    └────────┬───────┘
                             │
                             │ templateIds[]
                    ┌────────▼──────────────┐
                    │onboarding_instances   │
                    │   (collection)        │
                    ├──────────────────────┤
                    │ id: string           │
                    │ employeeName         │
                    │ employeeEmail        │
                    │ profileIds?: string[]│
                    │ templateIds?: str[]  │
                    │ templateSnapshots    │
                    │ steps: Step[]        │
                    │ progress: number     │
                    │ status               │
                    └──────────────────────┘
```

### collections/profiles

Primary collection that defines company roles and disciplines.

```typescript
{
  id: string;                    // Firestore document ID (auto-generated)
  name: string;                  // Profile name (e.g., "Engineer", "Sales", "Accountant")
  description?: string;          // Optional description of the profile
  roleTags: string[];            // Array of role tags (must reference existing roles)
  createdAt: number;             // Unix timestamp
  createdBy: string;             // User ID who created the profile
}
```

**Example Document:**
```json
{
  "id": "profile_engineer_abc123",
  "name": "Engineer",
  "description": "Software engineer onboarding pathway",
  "roleTags": ["Engineering", "All"],
  "createdAt": 1638360000000,
  "createdBy": "user_manager_001"
}
```

### collections/profileTemplates

Profile-specific templates containing steps for a particular profile. One profile can have multiple templates (e.g., "Standard" vs "Accelerated").

```typescript
{
  id: string;                    // Firestore document ID (auto-generated)
  profileId: string;             // Foreign key: reference to parent profile ID
  name: string;                  // Template name (e.g., "Engineer Standard Onboarding")
  description?: string;          // Optional template description
  steps: Step[];                 // Array of Step objects for this template
  createdAt: number;             // Unix timestamp
  updatedAt?: number;            // Last modified timestamp
  createdBy: string;             // User ID who created the template
  version: number;               // Version counter for schema migrations
  isPublished: boolean;          // Draft vs live template gate
}
```

**Example Document:**
```json
{
  "id": "template_engineer_std_xyz789",
  "profileId": "profile_engineer_abc123",
  "name": "Engineer Standard Onboarding",
  "description": "Core steps for all new engineers",
  "steps": [
    {
      "id": 1,
      "title": "Set Up Development Environment",
      "description": "Clone repo and install dependencies",
      "role": "Engineering",
      "owner": "DevOps",
      "expert": "Alice Smith",
      "status": "pending",
      "link": "https://wiki.company.com/dev-setup"
    }
  ],
  "createdAt": 1638360000000,
  "updatedAt": 1638360000000,
  "createdBy": "user_manager_001",
  "version": 1,
  "isPublished": true
}
```

### collections/onboarding_instances (Extended)

When a manager creates an onboarding run, steps from assigned profile templates are merged and captured as a snapshot.

```typescript
{
  // Existing fields (backward compatible)
  id: string;
  employeeName: string;
  employeeEmail: string;
  role: string;
  department: string;
  templateId: string;            // Legacy: single template ID
  steps: Step[];                 // Merged steps from all profiles
  progress: number;              // 0-100 percentage
  status: 'active' | 'completed' | 'on_hold';
  createdAt: number;

  // New profile-template fields (optional)
  profileIds?: string[];         // Array of profile IDs assigned to this run
  templateIds?: string[];        // Array of template IDs used
  templateSnapshots?: {
    [templateId: string]: {
      profileId: string;
      steps: Step[];
      templateName: string;
      capturedAt: number;
    }
  }
}
```

**Example with Multiple Profiles:**
```json
{
  "id": "instance_emp_001_2025",
  "employeeName": "Bob Johnson",
  "employeeEmail": "bob@company.com",
  "profileIds": ["profile_engineer_abc123", "profile_team_lead_def456"],
  "templateIds": ["template_engineer_std_xyz789", "template_lead_std_uvw012"],
  "templateSnapshots": {
    "template_engineer_std_xyz789": {
      "profileId": "profile_engineer_abc123",
      "templateName": "Engineer Standard Onboarding",
      "capturedAt": 1640000000000,
      "steps": [...]
    },
    "template_lead_std_uvw012": {
      "profileId": "profile_team_lead_def456",
      "templateName": "Team Lead Onboarding",
      "capturedAt": 1640000000000,
      "steps": [...]
    }
  },
  "steps": [
    // Merged and deduplicated steps from all templates
  ],
  "progress": 25,
  "status": "active",
  "createdAt": 1640000000000
}
```

## Validation Rules

### Profile Constraints

1. **Unique Names**: Profile names must be unique per profile (case-insensitive)
2. **Role Tags**: All `roleTags` must reference existing roles in the `roles` collection
3. **In-Use Check**: Profiles cannot be deleted if referenced by active onboarding instances or users
4. **Immutable Creation**: `id` and `createdAt` are immutable; cannot be updated

### ProfileTemplate Constraints

1. **Parent Reference**: `profileId` must reference an existing profile document
2. **Name Uniqueness**: Template names should be unique within a profile
3. **Version Tracking**: `version` field must be incremented for migrations
4. **Published Gate**: `isPublished: false` templates cannot be selected for new onboarding runs
5. **In-Use Check**: Published templates cannot be deleted if referenced by active instances

### OnboardingInstance Constraints

1. **Step Deduplication**: If multiple profiles have overlapping steps (same `id`), merge them and keep the first occurrence
2. **Snapshot Immutability**: `templateSnapshots` should be set at instantiation and not modified
3. **Progress Calculation**: Progress is calculated as `(completed steps / total steps) * 100`

## Data Relationships

### User → Profile Assignment (N:M)

```typescript
// User document with profile assignments
{
  id: "user_emp_001",
  email: "alice@company.com",
  name: "Alice Engineer",
  roles: ["employee"],
  profiles: ["profile_engineer_abc123"]  // Single profile in onboarding
}

// User document with multiple profiles
{
  id: "user_emp_002",
  email: "bob@company.com",
  name: "Bob Manager",
  roles: ["employee"],
  profiles: ["profile_engineer_abc123", "profile_team_lead_def456"]  // Multi-profile
}
```

### Profile → ProfileTemplate (1:N)

Each profile can have multiple templates:

```
Profile: "Engineer"
├─ Template: "Engineer Standard Onboarding" (published)
├─ Template: "Engineer Accelerated Track" (draft)
└─ Template: "Engineer Contractor Setup" (published)

Profile: "Sales"
├─ Template: "Sales Standard Onboarding" (published)
└─ Template: "Sales Enterprise Account Track" (published)
```

### ProfileTemplate → OnboardingInstance (1:N)

Multiple onboarding instances can draw from the same template:

```
Template: "Engineer Standard Onboarding"
├─ Instance: Alice's onboarding
├─ Instance: Bob's onboarding
└─ Instance: Charlie's onboarding
```

### Multi-Profile Merging (N:N)

When an employee is assigned multiple profiles, their onboarding instance merges steps:

```
Employee: Bob (assigned 2 profiles)
├─ Profile 1: Engineer
│  └─ Template: Engineer Standard (steps 1-10)
└─ Profile 2: Team Lead
   └─ Template: Team Lead Onboarding (steps 5-15)

Result Onboarding Instance:
└─ Merged Steps: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
   (Step 5 deduplicated: kept Engineer version)
```

## Firestore Queries

### List all profiles for filtering

```javascript
const profiles = await listProfiles();
// Returns all profiles for Employee view dropdown filter
```

### Get profile templates for a specific profile

```javascript
const templates = await listProfileTemplates(profileId);
// Returns all templates for "Engineer" profile
// Used in Manager UI when building onboarding runs
```

### Get a single template by ID

```javascript
const template = await getProfileTemplate(templateId);
// Returns full template with steps for preview/editing
```

### Subscribe to real-time profile template updates

```javascript
const unsubscribe = subscribeToProfileTemplates(
  profileId,
  (templates) => {
    console.log("Templates updated:", templates);
  }
);
// Clean up when component unmounts
unsubscribe();
```

### Filter onboarding instances by profile

```javascript
const instances = await listOnboardingInstances();
const engineerInstances = instances.filter((inst) =>
  inst.profileIds?.includes(profileId)
);
// Returns all active engineer onboardings
```

## Step Deduplication Logic

When merging multiple profile templates, steps are deduplicated by `step.id`:

```javascript
function mergeTemplateSteps(
  profileIds: string[],
  templateSnapshots: { [key: string]: TemplateSnapshot }
): Step[] {
  const stepMap = new Map<number, Step>();

  for (const [templateId, snapshot] of Object.entries(templateSnapshots)) {
    for (const step of snapshot.steps) {
      // Keep first occurrence if step ID already exists
      if (!stepMap.has(step.id)) {
        stepMap.set(step.id, step);
      }
    }
  }

  // Return steps sorted by ID
  return Array.from(stepMap.values()).sort((a, b) => a.id - b.id);
}
```

**Example:**

```
Template 1: Engineer Standard
  Steps: [1: Setup Dev Env, 2: Access Repo, 3: Code Review, 4: First Task]

Template 2: Team Lead Onboarding
  Steps: [3: Code Review, 5: 1:1 with Manager, 6: Team Goals]

Merged Result:
  Steps: [1, 2, 3, 4, 5, 6]
  (Step 3 deduplicated: Engineer version kept)
```

## Best Practices for Managers

### Creating a New Profile

1. **Name**: Use clear, recognizable names (e.g., "Software Engineer", "Sales Development Rep")
2. **Role Tags**: Assign relevant tags for filtering (e.g., ["Engineering", "All"] for engineers)
3. **Description**: Write a brief description for clarity in the Manager UI

### Creating Profile Templates

1. **Naming**: Use descriptive names including track (e.g., "Engineer Standard Onboarding", "Engineer Contractor Fast-Track")
2. **Draft First**: Create templates as drafts (`isPublished: false`) before enabling them
3. **Step Organization**: Organize steps in logical phases (setup, training, first assignment)
4. **SME Assignment**: Always assign subject matter experts to steps for escalation support
5. **Link References**: Provide links to wiki pages, forms, or documentation

### Assigning Profiles to Employees

1. **Single Profile**: Most hires get one profile (e.g., "Engineer" for software engineers)
2. **Multi-Profile**: Use for compound roles (e.g., Engineer + Team Lead, Sales + Account Manager)
3. **Role Overlap**: The system automatically deduplicates overlapping steps

## Migration Guide (Future Schema Updates)

### Schema Version Evolution

The `version` field in ProfileTemplate enables future schema migrations:

```typescript
// Version 1: Current version
version: 1;

// Future: Version 2 (hypothetical)
// Add estimated completion time per step
interface Step {
  id: number;
  title: string;
  estimatedHours?: number; // NEW in v2
}

// Migration logic in dataClient.ts:
// if (template.version < 2) {
//   template.steps = migrateToVersion2(template.steps);
//   template.version = 2;
// }
```

### Soft Delete Support

Profiles support soft-delete via an optional `isActive` field:

```typescript
interface Profile {
  id: string;
  name: string;
  // ... other fields
  isActive: boolean; // future: support soft deletes
}

// Query: list only active profiles
const activeProfiles = profiles.filter((p) => p.isActive !== false);
```

## Fixtures & Examples

See `tests/fixtures/profiles/` for pre-built examples:

- `engineer.json` - Standard engineer profile with templates
- `sales.json` - Sales representative profile
- `templates/engineer-standard.json` - Full example template
- `templates/engineer-accelerated.json` - Shortened onboarding for experienced hires

## Security Considerations

### Firestore Rules (Production)

```javascript
// Only authenticated users can read profiles
match /profiles/{document=**} {
  allow read: if request.auth != null;
  allow create, update, delete: if request.auth.uid == resource.data.createdBy
                                    || hasManagerRole(request.auth.uid);
}

// Profile templates inherit parent profile permissions
match /profileTemplates/{document=**} {
  allow read: if request.auth != null;
  allow create, update, delete: if hasManagerRole(request.auth.uid);
}
```

### Current Development (Emulator)

- Firestore Emulator is permissive; all authenticated requests succeed
- localStorage fallback for offline development uses no validation

## FAQ

**Q: Can an employee have zero profiles?**
A: No. At least one profile must be assigned during onboarding creation. This ensures every employee has defined steps.

**Q: What happens if I delete a profile template that's in use?**
A: The system prevents deletion if the template is referenced by active instances. Soft-delete support (via `isActive` flag) is planned for future versions to archive templates.

**Q: Can I edit steps in a template after onboarding starts?**
A: Yes. Changes to templates don't affect in-progress instances (they use captured snapshots). New instances will use the updated steps.

**Q: What if a profile has no templates?**
A: The Manager UI will show a "No templates published" message. The profile can still be created for future use, but onboarding runs cannot select it until a template is published.

**Q: How are step IDs managed across profiles?**
A: Step IDs are integers assigned manually when creating templates. Managers should be aware of ID collisions when designing multi-profile onboarding to ensure proper deduplication.

---

**Last Updated:** 2025-12-04
**Maintained By:** OnboardingHub Team
**Related:** `CLAUDE.md` (data model), `README.md`/`CODEX.md` (development conventions)
