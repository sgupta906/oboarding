# Quick Reference: "New User" vs "New Hire"

## At a Glance

| Aspect | New Hire | New User |
|--------|----------|----------|
| **Location** | Dashboard header (prominent) | Users tab (secondary) |
| **Purpose** | Onboard new employees | Add system users (admins, managers) |
| **Creates** | OnboardingInstance + User | User only |
| **Employee sees** | "Quest Log" with steps | Manager dashboard (if role permits) |
| **Use when** | Someone is joining as employee | Adding manager, admin, or contractor |
| **Modal title** | Add New Employee Onboarding | Add System User |
| **Info card** | Blue (informational) | Amber (warning) |

## Decision Tree

```
Is this person starting as an employee who needs onboarding?
├─ YES → Click "New Hire" on Dashboard
│        ├─ Provide: Name, Email, Role, Department
│        └─ Select: Onboarding Template (Engineer, Sales, etc.)
│
└─ NO → Click "New User" in Users tab
         ├─ Provide: Email, Name
         └─ Select: System Roles (Manager, Admin, etc.)
```

## For Managers

### Use "New Hire" When:
- A new employee is joining the company
- You want to assign them onboarding steps
- They need to complete a "Quest Log" of tasks
- You want to track their progress
- Examples: New engineer, new sales rep, new intern

### Use "New User" When:
- You're adding a manager or admin
- Adding a team lead who doesn't need onboarding
- Setting up a contractor without onboarding path
- The person is managing other employees
- Examples: New manager, admin, team lead

## Common Mistakes & Fixes

### Mistake 1: Used "New User" but meant to onboard them
**Fix:** Go to Dashboard and click "New Hire" to create their onboarding

### Mistake 2: Used "New Hire" for a manager
**Fix:** That's okay - they'll have both onboarding AND system access
(You can adjust their roles in Users tab if needed)

### Mistake 3: Not sure which to use
**Go to the Users tab and look at the info banner:**
- "Tip: Use 'New User' to add managers, admins, or contractors."
- "Use 'New Hire' on the Dashboard to onboard employees..."

## Button Tooltips

### "New Hire" (Dashboard)
**Hover tooltip:** "Add a new employee onboarding. Creates guided onboarding steps for the new hire."

### "New User" (Users Tab)
**Hover tooltip:** "Add a manager, admin, or contractor. For onboarding employees, use 'New Hire' on the Dashboard."

## Modal Help Text

### New Hire Modal
> "This creates a guided onboarding journey for a new employee. Select a role-based template to get started. The employee will see a 'Quest Log' with tasks to complete."

### New User Modal
> "Add a manager, admin, or contractor to the system. This does NOT create an onboarding journey. If you're onboarding a new employee, go back to the Dashboard and click 'New Hire' instead."

## What Gets Created

### New Hire Creates:
1. **OnboardingInstance** - Tracks progress through steps
2. **User** record - System account
3. **Auth credentials** - Can sign in
4. **Profile** - Default role set to 'employee'

### New User Creates:
1. **User** record - System account
2. **Auth credentials** - Can sign in
3. **Roles** - Whatever you selected (manager, admin, etc.)

No OnboardingInstance created - so employee won't see quest log.

## FAQ

**Q: Can I use "New Hire" for a manager?**
A: Yes, it's fine. They'll get an onboarding AND be a manager.

**Q: What if I used the wrong button?**
A: You can edit the user in the Users tab to change their roles.

**Q: Are there other differences?**
A: Yes - "New Hire" automatically creates an OnboardingInstance (the tracker), while "New User" only creates the account.

**Q: Which is the primary workflow?**
A: "New Hire" is the primary workflow for most new employees. "New User" is for special cases (managers, admins).

## When to Ask for Help

If you're unsure:
1. Check the info banner in Users tab
2. Hover over the button to see the tooltip
3. Look at the info card when you open the modal
4. Ask: "Is this person an employee who needs to complete onboarding steps?"

---

**Need more details?** See:
- `USER_CREATION_WORKFLOW_ANALYSIS.md` - Full technical analysis
- `UX_IMPROVEMENTS_SUMMARY.md` - All changes made
- `CLARIFICATION_FINAL_SUMMARY.md` - Implementation details
