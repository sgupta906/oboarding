# Templates, Profiles, and Roles: A Comprehensive Guide

## Overview

OnboardingHub uses three interconnected but distinct systems to determine what onboarding steps an employee sees:

1. **Templates** - Step blueprints that are copied at instance creation time
2. **Profiles** - Role-based onboarding journey bundles (Engineer, Sales, etc.)
3. **Roles** - System access levels (admin, manager, employee)

This guide explains how each system works, how they interact, current limitations, and future capabilities.

---

## System 1: Roles (Access Control)

### Purpose
Roles control **system access permissions**, not onboarding content. They determine who can perform actions in the app.

### Current Roles

```typescript
// System-level roles (stored in auth/Firestore 'users' collection)
type SystemRole = 'admin' | 'manager' | 'employee';
```

### Where Roles Are Used

- **Employee**: Can view their own onboarding timeline, mark steps complete, and submit suggestions
- **Manager**: Can view all employee timelines, create new onboarding runs, manage templates, manage users, and review suggestions
- **Admin**: Full system access (currently same as manager in MVP)

### Role vs Profile Example

```typescript
// User document
{
  id: "user_alice_001",
  email: "alice@company.com",
  name: "Alice Engineer",
  roles: ["employee"],           // ← ROLE: Controls what she can do in the app
  profiles: ["profile_engineer"] // ← PROFILE: Determines her onboarding content
}

// User document
{
  id: "user_bob_001",
  email: "bob@company.com",
  name: "Bob Manager",
  roles: ["manager"],            // ← ROLE: Allows him to create onboarding runs
  profiles: ["profile_manager"]  // ← PROFILE: His personal onboarding (optional)
}
```

### Key Insight
**Roles and profiles are completely independent.** A manager (`roles: ["manager"]`) can still be assigned onboarding profiles for their own training, but their role determines UI access.

---

## System 2: Profiles (Onboarding Content Organization)

### Purpose
Profiles are **role-based onboarding journey templates** that organize company-specific paths by discipline or department.

### What Is a Profile?

```typescript
interface Profile {
  id: string;                   // e.g., "profile_engineer_abc123"
  name: string;                 // e.g., "Engineer", "Sales Rep", "Intern"
  description?: string;         // e.g., "Software engineer onboarding pathway"
  roleTags: string[];           // e.g., ["Engineering", "All"]
  createdAt: number;
  createdBy: string;
}
```

### Profiles in the Data Model

```
┌─────────────┐
│   Profile   │ (e.g., "Engineer")
│             │
│ roleTags: [│
│  "Engineering",
│  "All"      │
└─────────────┘
       │
       │ contains many templates
       ▼
┌──────────────────────────────┐
│  ProfileTemplate             │
│  "Engineer Standard"         │
│                              │
│  steps: Step[]               │
│  - Setup Dev Env             │
│  - Access GitHub             │
│  - Code Review               │
└──────────────────────────────┘
```

### Current Profiles (Pre-Seeded)

- **Engineer** - Software engineer onboarding (roleTags: `["Engineering", "All"]`)
- **Intern** - Intern onboarding (roleTags: `["All"]`)
- **Sales** - Sales team onboarding (roleTags: `["Sales", "All"]`)
- **Product Manager** - Product manager onboarding (roleTags: `["Product", "All"]`)

### Profiles in UI Filtering

**Employee View:**
- WelcomeHeader displays a profile dropdown
- Employees can filter steps by profile (All + selected profile)
- Only steps matching `roleTags` are shown

**Manager View:**
- KPI cards include a profile filter dropdown
- Metrics (completion rate, stuck count) are segmented by profile

### Key Insight
**Profiles don't directly assign onboarding.** Instead, they provide metadata for filtering and organization. The actual assignment happens through **templates** and **onboarding instances**.

---

## System 3: Templates (Step Blueprints)

### Purpose
Templates contain reusable step lists. When a manager creates an onboarding run, **steps are copied from the template into the instance**, creating an immutable snapshot.

### What Is a Template?

```typescript
interface Template {
  id: string;                   // e.g., "template_engineer_std_xyz789"
  name: string;                 // e.g., "Engineer Standard Onboarding"
  description: string;
  role: string;                 // e.g., "Engineering"
  steps: Step[];                // The actual checklist
  createdAt: number;
  updatedAt?: number;
  isActive: boolean;
}
```

### Modern Alternative: ProfileTemplate

For Milestone 4+, we also have:

```typescript
interface ProfileTemplate {
  id: string;
  profileId: string;            // ← Links to a Profile
  name: string;                 // e.g., "Engineer Standard Onboarding"
  steps: Step[];
  createdAt: number;
  updatedAt?: number;
  createdBy: string;
  version: number;
  isPublished: boolean;         // Draft vs live gate
}
```

### The Critical Difference: Copy vs Link

**Templates are COPIED at instance creation time, not live-linked.**

```typescript
// When a manager creates an onboarding run for Alice:
const employeeData = {
  employeeName: "Alice",
  employeeEmail: "alice@company.com",
  templateId: "template_engineer_std_xyz789"
};

// dataClient.ts calls:
const template = await getTemplate(employeeData.templateId);

// Then COPIES the steps:
const newInstanceData = {
  employeeName: "Alice",
  templateId: "template_engineer_std_xyz789",
  steps: template.steps,  // ← COPY, not reference!
  progress: 0,
  status: 'active'
};

// Saved to onboarding_instances collection
```

### Why Copy and Not Link?

1. **Immutability** - Template updates don't affect in-progress onboarding
2. **Audit Trail** - Instance captures exact steps + versions at creation time
3. **Progress Safety** - Employee progress persists even if template is deleted
4. **Historical Accuracy** - Future analysis can see what each hire saw at their start date

---

## Data Flow: How Steps Get to an Employee

### Step 1: Template Creation (Manager)

Manager creates a template with steps:

```typescript
// Template in Firestore
{
  id: "template_engineer_std_xyz789",
  name: "Engineer Standard Onboarding",
  role: "Engineering",
  steps: [
    { id: 1, title: "Setup Dev Env", ... },
    { id: 2, title: "Access GitHub", ... },
    { id: 3, title: "Code Review", ... }
  ]
}
```

### Step 2: Onboarding Instance Creation (Manager)

Manager clicks "New Onboarding" and selects the template:

```typescript
// Manager selects:
// - Employee: "Alice Smith"
// - Template: "Engineer Standard Onboarding"

// System calls:
const instance = await createOnboardingRunFromTemplate({
  employeeName: "Alice Smith",
  employeeEmail: "alice@smith.com",
  role: "Engineering",
  department: "Engineering",
  templateId: "template_engineer_std_xyz789"
});
```

### Step 3: Steps Copied to Instance

Inside `createOnboardingRunFromTemplate`:

```typescript
// Step 2: Fetch the template
const template = await getTemplate(employeeData.templateId);

// Step 3: Create instance with COPIED steps
const newInstanceData = {
  employeeName: "Alice Smith",
  employeeEmail: "alice@smith.com",
  role: "Engineering",
  department: "Engineering",
  templateId: "template_engineer_std_xyz789",
  steps: template.steps,  // ← COPY from template
  progress: 0,
  status: 'active'
};

// Saved to Firestore onboarding_instances collection
```

### Step 4: Employee Sees Steps

When Alice logs in:

```typescript
// useEmployeeOnboarding hook fetches:
const instance = await getOnboardingInstance(alice_instance_id);

// Employee view renders:
instance.steps.map(step => <StepCard step={step} ... />)
```

**Key Point:** Alice sees `instance.steps`, NOT the live template.

### Step 5: Template Updates Don't Affect Alice

If a manager edits the template later:

```typescript
// Manager updates template:
await updateTemplate("template_engineer_std_xyz789", {
  steps: [/* new steps */]
});
```

**Alice's onboarding is unaffected.** Her instance still has the original copied steps.

### Step 6: Sync New Steps Only

There is a function `syncTemplateStepsToInstances` that can add new steps to existing instances:

```typescript
export async function syncTemplateStepsToInstances(
  templateId: string,
  onlyAddNew: boolean = true
): Promise<void> {
  // Fetches all instances using this template
  // Adds any NEW steps from the updated template
  // NEVER removes or modifies existing steps
  // Preserves employee progress
}
```

**This is additive only** - it cannot remove steps or break progress tracking.

---

## Current Architecture: Single Template per Instance

### OnboardingInstance Structure (Current)

```typescript
interface OnboardingInstance {
  id: string;
  employeeName: string;
  employeeEmail: string;
  role: string;
  department: string;
  templateId: string;           // ← Single template only
  steps: Step[];                // ← Copied from template
  progress: number;
  status: 'active' | 'completed' | 'on_hold';
  createdAt: number;

  // Profile-template support (optional for Milestone 4+)
  profileIds?: string[];
  templateIds?: string[];
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

### Current Limitations

1. **No Template Switching** - Once created, an instance uses one template
2. **No Profile Selection in UI** - Current onboarding modal doesn't expose profile selection
3. **Single-Profile Onboarding** - Managers can't assign multiple profiles in one run
4. **Manual Template Updates** - Template changes are manual (not auto-assigned)

---

## Future Capability: Multiple Templates per Instance (Milestone 4+)

### Vision

When a manager creates an onboarding run for "Bob" (a new Engineering Manager):

```typescript
// Manager selects:
// - Employee: "Bob Johnson"
// - Profiles: ["Engineer", "Team Lead"]  ← Multiple!

// System should:
// 1. Fetch templates for Engineer profile
// 2. Fetch templates for Team Lead profile
// 3. Merge steps (deduplicate by step.id)
// 4. Create instance with merged steps
// 5. Store snapshots for audit trail
```

### Data Structure for Multiple Templates

```typescript
interface OnboardingInstance {
  // ... existing fields ...

  profileIds: ["profile_engineer_abc123", "profile_team_lead_def456"],
  templateIds: [
    "template_engineer_std_xyz789",
    "template_lead_std_uvw012"
  ],

  templateSnapshots: {
    "template_engineer_std_xyz789": {
      profileId: "profile_engineer_abc123",
      templateName: "Engineer Standard Onboarding",
      steps: [
        { id: 1, title: "Setup Dev Env", ... },
        { id: 2, title: "Access GitHub", ... },
        { id: 3, title: "Code Review", ... }
      ],
      capturedAt: 1640000000000
    },
    "template_lead_std_uvw012": {
      profileId: "profile_team_lead_def456",
      templateName: "Team Lead Onboarding",
      steps: [
        { id: 3, title: "Code Review", ... },  // Duplicate!
        { id: 4, title: "Hiring & Feedback", ... },
        { id: 5, title: "Budget Planning", ... }
      ],
      capturedAt: 1640000000000
    }
  },

  // Final merged steps (deduplicated)
  steps: [
    { id: 1, title: "Setup Dev Env", ... },
    { id: 2, title: "Access GitHub", ... },
    { id: 3, title: "Code Review", ... },     // From Engineer (first occurrence)
    { id: 4, title: "Hiring & Feedback", ... },
    { id: 5, title: "Budget Planning", ... }
  ]
}
```

### Step Deduplication Algorithm

When merging multiple templates:

```typescript
function mergeTemplateSteps(
  templateSnapshots: { [templateId: string]: TemplateSnapshot }
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

---

## Complete Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    MANAGER CREATES ONBOARDING                    │
└──────────────────────────────────────────────────────────────────┘

Manager Input:
┌─────────────────────────────────────────────────────────────────┐
│ CreateOnboardingModal                                           │
│                                                                 │
│ Employee Name:    "Alice Smith"                                │
│ Email:            "alice@smith.com"                            │
│ Role:             "Engineer"   ← System role                   │
│ Department:       "Engineering"                                 │
│ Template:         "Engineer Standard"                          │
│ [Profiles]:       "Engineer" ← Future: multi-profile selection │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────┐
│ createOnboardingRunFromTemplate()         │
│                                          │
│ 1. Validate input                        │
│ 2. Fetch Template (or ProfileTemplate)   │
│ 3. Copy steps into instance              │
│ 4. Create OnboardingInstance in DB       │
│ 5. Create User record                    │
└──────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────┐
│  Firestore Collections                   │
│                                          │
│  templates (or profileTemplates):        │
│  ├─ id: "template_engineer_std_xyz789"  │
│  └─ steps: [Step1, Step2, ...]          │
│                                          │
│  onboarding_instances:                   │
│  ├─ id: "instance_alice_2025"           │
│  ├─ templateId: "template_engineer..." │
│  └─ steps: [Step1, Step2, ...]  ← COPY  │
│                                          │
│  users:                                  │
│  └─ email: "alice@smith.com"            │
│     roles: ["employee"]   ← ACCESS CTRL │
│     profiles: ["engineer"] ← CONTENT    │
└──────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────┐
│  EMPLOYEE LOGS IN & VIEWS ONBOARDING    │
│                                          │
│  useEmployeeOnboarding(instanceId)       │
│  fetches instance.steps                  │
│                                          │
│  Employee sees timeline with steps       │
│  Steps remain unchanged even if          │
│  template is later modified              │
└──────────────────────────────────────────┘
```

---

## Comparison Table: Roles vs Profiles vs Templates

| Concept | Purpose | Where Stored | Level | Example |
|---------|---------|--------------|-------|---------|
| **Role** | System access control | User.roles | User | "manager", "employee", "admin" |
| **Profile** | Onboarding content organization | Profiles collection | Organization | "Engineer", "Sales", "Intern" |
| **Template** | Step blueprint | Templates collection | Template | "Engineer Standard Onboarding" |
| **Instance** | Employee's personal copy | Onboarding_instances | Individual | "Alice's onboarding run" |

---

## FAQ

### Q: What determines which template an employee sees?

**A:** When creating an onboarding instance, the manager explicitly chooses the `templateId`. The steps shown come from `OnboardingInstance.steps` (a copy from the template at creation time). They are NOT determined by role or profile automatically.

### Q: Can an employee see different templates?

**A:** No, not in the current implementation. Once an instance is created with a template, the employee always sees those copied steps. There is no "switch template" function.

**Future (Milestone 4+):** Managers will be able to assign multiple profiles, which will automatically select their corresponding templates and merge the steps.

### Q: What happens if I edit a template after an employee starts?

**A:** The employee's onboarding is unaffected. Their instance has its own copy of the steps. The live template can be edited without breaking their progress.

If you want to add new steps to existing instances, use `syncTemplateStepsToInstances()`, which adds only new steps and never removes or breaks progress.

### Q: Can an employee have zero profiles?

**A:** Technically yes, but it's not recommended. Profiles provide filtering and metadata. An employee with no profiles will see all steps tagged "All".

### Q: Why are steps copied instead of live-linked?

**A:** To preserve immutability and audit trails. If steps were live-linked, template edits could break an in-progress onboarding. Copying ensures each employee has a stable, auditable checklist.

### Q: How do profiles differ from roles?

**A:**
- **Roles** (`roles: ["manager"]`) control **system access** - what UI a user can see and what actions they can take.
- **Profiles** (`profiles: ["engineer"]`) control **onboarding content** - which steps appear in their checklist.

A manager can have `roles: ["manager"]` AND `profiles: ["engineer"]` if they're doing their own onboarding.

### Q: When should I use profiles vs templates?

**A:**
- Use **profiles** for organizational grouping (departments, disciplines)
- Use **templates** as blueprints for steps within a profile
- Create **instances** when assigning onboarding to a specific employee

Example:
```
Profile "Engineer"
├─ Template "Engineer Standard" (steps 1-10)
├─ Template "Engineer Accelerated" (steps 1-5, 11-15)
└─ Template "Engineer Contractor" (steps 1-3, 6-8)

When Alice (new grad) starts:
└─ Create Instance with "Engineer Standard"

When Bob (experienced hire) starts:
└─ Create Instance with "Engineer Accelerated"
```

---

## Code Locations

### Key Functions

- **Create Onboarding:** `src/services/dataClient.ts` → `createOnboardingRunFromTemplate()`
- **Fetch Steps:** `src/hooks/useEmployeeOnboarding.ts` → Hook subscribing to instance
- **Profile Filtering:** `src/utils/filterUtils.ts` → `filterStepsByProfile()`
- **Template Sync:** `src/services/dataClient.ts` → `syncTemplateStepsToInstances()`

### Key Type Definitions

- **Role:** `src/types/index.ts` → System role types
- **Profile:** `src/types/index.ts` → `Profile` interface
- **Template:** `src/types/index.ts` → `Template` interface
- **Instance:** `src/types/index.ts` → `OnboardingInstance` interface

### Key UI Components

- **Create Modal:** `src/components/modals/CreateOnboardingModal.tsx`
- **Employee View:** `src/views/EmployeeView.tsx`
- **Manager View:** `src/views/ManagerView.tsx`
- **Profile Filter:** `src/components/onboarding/WelcomeHeader.tsx`

---

## Development Roadmap

### Milestone 4: Profile Templates & Assignment (Current)

- [x] Define ProfileTemplate schema
- [ ] Build Manager Profiles panel UI
- [ ] Update onboarding modal for multiple profile selection
- [ ] Merge profiles in Employee timelines
- [ ] Add fixtures and documentation

### Milestone 5+: Template Switching & Advanced Features

- [ ] Support switching templates for existing instances
- [ ] Implement template versioning
- [ ] Add template preview/comparison UI
- [ ] Support templating inheritance (base + specializations)

---

## Summary

**Templates, Profiles, and Roles each serve distinct purposes:**

1. **Roles** = Access Control (who can do what in the app)
2. **Profiles** = Content Organization (grouping steps by discipline)
3. **Templates** = Step Blueprints (reusable checklists)
4. **Instances** = Personal Copies (employee's onboarding checklist)

**The data flow is:**
- Manager selects Template → System copies steps → Employee sees copy → Changes to template don't affect employee

**Current limitations:**
- One template per instance (no switching)
- Manual profile selection (not automatic)
- No multi-profile merging (yet)

**Future capabilities (Milestone 4+):**
- Multiple templates per instance
- Automatic profile-based template selection
- Step deduplication across profiles
- Multi-profile merged timelines

---

**Last Updated:** 2025-12-05
**Document Version:** 1.0
**Related:** `CLAUDE.md` (data model), `docs/profiles.md` (schema details), `README.md`
