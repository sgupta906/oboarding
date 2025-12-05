# Visual Reference - All Changes at a Glance

## File: src/services/userOperations.ts

### New Function Added (Lines 335-362)
```typescript
/**
 * Removes a user from auth credentials storage
 * CRITICAL SECURITY: Called during user deletion
 */
export function removeUserFromAuthCredentials(email: string): void {
  try {
    const stored = localStorage.getItem(AUTH_CREDENTIALS_KEY);
    if (!stored) return;

    const credentials = JSON.parse(stored);
    const updatedCredentials = credentials.filter(
      (cred: { email: string }) => cred.email.toLowerCase() !== email.toLowerCase()
    );

    localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify(updatedCredentials));
  } catch (error) {
    console.error('Failed to remove user from auth credentials:', error);
  }
}
```

### Enhanced deleteUser() (Lines 437-480)

**BEFORE:**
```typescript
export async function deleteUser(userId: string): Promise<void> {
  if (isFirestoreAvailable()) {
    try {
      const docRef = doc(firestore, USERS_COLLECTION, userId);
      await deleteDoc(docRef);
      return;
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  const localUsers = getLocalUsers();
  const filteredUsers = localUsers.filter((u) => u.id !== userId);
  saveLocalUsers(filteredUsers);
}
```

**AFTER:**
```typescript
export async function deleteUser(userId: string): Promise<void> {
  // NEW: Step 1: Fetch the user to ensure they exist
  const user = await getUser(userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // NEW: Step 2: Check for active onboarding instances
  const onboardingInstances = getLocalOnboardingInstances();
  const activeInstances = onboardingInstances.filter(
    (instance) =>
      instance.employeeEmail.toLowerCase() === user.email.toLowerCase() &&
      instance.status === 'active'
  );

  if (activeInstances.length > 0) {
    throw new Error(
      `Cannot delete user "${user.name}" (${user.email}): they have ${activeInstances.length} active onboarding instance(s) in progress. ` +
      `Complete or cancel their onboarding before deleting.`
    );
  }

  // Step 3: Delete from Firestore if available
  if (isFirestoreAvailable()) {
    try {
      const docRef = doc(firestore, USERS_COLLECTION, userId);
      await deleteDoc(docRef);
    } catch (error) {
      console.warn('Firestore unavailable, using localStorage fallback:', error);
    }
  }

  // Step 4: Delete from localStorage
  const localUsers = getLocalUsers();
  const filteredUsers = localUsers.filter((u) => u.id !== userId);
  saveLocalUsers(filteredUsers);

  // NEW: Step 5: Clean up auth credentials
  removeUserFromAuthCredentials(user.email);
}
```

### New Helper + Fixed subscribeToUsers (Lines 483-609)

**NEW HELPER (Lines 483-519):**
```typescript
function areUsersEqual(users1: User[] | null, users2: User[]): boolean {
  if (users1 === null) {
    return false;
  }

  if (users1.length !== users2.length) {
    return false;
  }

  return users1.every((user1, index) => {
    const user2 = users2[index];
    return (
      user1.id === user2.id &&
      user1.email === user2.email &&
      user1.name === user2.name &&
      JSON.stringify(user1.roles) === JSON.stringify(user2.roles) &&
      JSON.stringify(user1.profiles) === JSON.stringify(user2.profiles) &&
      user1.createdAt === user2.createdAt &&
      user1.updatedAt === user2.updatedAt &&
      user1.createdBy === user2.createdBy
    );
  });
}
```

**KEY CHANGE IN subscribeToUsers (Line 576):**
```diff
  // OLD (BUGGY):
- if (lastEmittedUsers !== localUsers) {
+ // NEW (FIXED):
+ if (!areUsersEqual(lastEmittedUsers, localUsers)) {
    lastEmittedUsers = localUsers;
    callback(localUsers);
  }
```

---

## File: src/services/dataClient.ts

### Enhanced updateStepStatus (Lines 430-485)

**BEFORE:**
```typescript
export async function updateStepStatus(
  instanceId: string,
  stepId: number,
  status: StepStatus
): Promise<void> {
  const instance = await getOnboardingInstance(instanceId);
  if (!instance) {
    throw new Error(`Onboarding instance not found: ${instanceId}`);
  }

  const updatedSteps = instance.steps.map((step) =>
    step.id === stepId ? { ...step, status } : step
  );

  const completedCount = updatedSteps.filter((step) => step.status === 'completed').length;
  const progress = updatedSteps.length === 0
    ? 0
    : Math.round((completedCount / updatedSteps.length) * 100);

  await updateOnboardingInstance(instanceId, {
    steps: updatedSteps,
    progress,
  });
}
```

**AFTER:**
```typescript
export async function updateStepStatus(
  instanceId: string,
  stepId: number,
  status: StepStatus
): Promise<void> {
  // Step 1: Fetch the instance
  const instance = await getOnboardingInstance(instanceId);
  if (!instance) {
    throw new Error(`Onboarding instance not found: ${instanceId}`);
  }

  // NEW: Step 2: Validate that stepId exists
  const stepExists = instance.steps.some((step) => step.id === stepId);
  if (!stepExists) {
    throw new Error(
      `Step with ID ${stepId} not found in onboarding instance ${instanceId}. ` +
      `Available step IDs: ${instance.steps.map((s) => s.id).join(', ')}`
    );
  }

  // Step 3: Update the step (now we know it exists)
  const updatedSteps = instance.steps.map((step) =>
    step.id === stepId ? { ...step, status } : step
  );

  // Step 4: Recalculate progress
  const completedCount = updatedSteps.filter((step) => step.status === 'completed').length;
  const progress = updatedSteps.length === 0
    ? 0
    : Math.round((completedCount / updatedSteps.length) * 100);

  // Step 5: Update the instance
  await updateOnboardingInstance(instanceId, {
    steps: updatedSteps,
    progress,
  });
}
```

---

## Summary of Changes

| Bug | File | Lines | Change Type |
|-----|------|-------|------------|
| #2 | userOperations.ts | 335-362 | NEW FUNCTION |
| #1 | userOperations.ts | 437-480 | ENHANCED |
| #3 | userOperations.ts | 483-609 | FIXED + NEW HELPER |
| #4 | dataClient.ts | 430-485 | ENHANCED |

---

## Code Size Impact

**Additions:**
- removeUserFromAuthCredentials(): 30 lines
- areUsersEqual(): 40 lines
- deleteUser() validation: 25 new lines
- updateStepStatus() validation: 8 new lines

**Total:** ~100 lines added (all necessary and well-commented)

---

## Complexity Analysis

| Function | Before | After | Complexity |
|----------|--------|-------|------------|
| deleteUser() | O(n) | O(n) | Same |
| removeUserFromAuthCredentials() | N/A | O(n) | New |
| subscribeToUsers() | O(1)* | O(n) | Slight increase |
| updateStepStatus() | O(n) | O(n) | Same |

*Old version was broken (infinite loops), new version is correct

---

## Testing Impact

### New Test Cases Needed
1. deleteUser() with non-existent user
2. deleteUser() with active onboarding
3. deleteUser() removes auth credentials
4. updateStepStatus() with invalid stepId
5. subscribeToUsers() doesn't loop infinitely

### Tests That May Fail (Expected)
- Tests expecting silent deleteUser() success
- Tests expecting silent updateStepStatus() failure
- Tests monitoring subscribeToUsers() callback frequency

---

## Migration Checklist

- [ ] Review all CRITICAL_FIXES_* documents
- [ ] Update error handling in components using deleteUser()
- [ ] Update error handling in components using updateStepStatus()
- [ ] Test new error scenarios
- [ ] Monitor browser console for new errors
- [ ] Verify auth credential cleanup in localStorage
- [ ] Run full test suite
- [ ] Deploy to staging
- [ ] Monitor for increased error rates (expected)
- [ ] Deploy to production
