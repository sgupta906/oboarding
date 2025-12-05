# Role Management - Quick Reference Guide

## Quick Start

### Import the Hook
```typescript
import { useRoles } from '../hooks';
```

### Use in Component
```typescript
export function MyComponent() {
  const {
    roles,
    isLoading,
    error,
    createRole,
    updateRole,
    deleteRole
  } = useRoles(userId);

  // Handle loading
  if (isLoading) return <div>Loading roles...</div>;

  // Handle errors
  if (error) return <div className="text-red-600">Error: {error}</div>;

  // Use roles
  return (
    <select>
      {roles.map(role => (
        <option key={role.id} value={role.name}>
          {role.name}
        </option>
      ))}
    </select>
  );
}
```

## Role Structure
```typescript
interface CustomRole {
  id: string;              // Firestore document ID
  name: string;            // "Engineering", "Sales", etc.
  description?: string;    // "Engineering team members"
  createdAt: number;      // Unix timestamp
  updatedAt: number;      // Unix timestamp
  createdBy: string;      // User ID who created it
}
```

## Common Operations

### Create a Role
```typescript
try {
  const newRole = await createRole(
    'DevOps',
    'DevOps team members',
    userId
  );
  console.log('Created role:', newRole.id);
} catch (error) {
  console.error('Failed to create role:', error.message);
  // Error is also in hook.error
}
```

### Update a Role
```typescript
try {
  await updateRole('role-id', {
    name: 'DevOps Engineers',
    description: 'Senior DevOps team'
  });
  // Roles will auto-update via subscription
} catch (error) {
  console.error('Failed to update role:', error.message);
}
```

### Delete a Role
```typescript
try {
  await deleteRole('role-id');
  // Roles will auto-update via subscription
} catch (error) {
  // Likely "role is in use" error
  console.error('Cannot delete role:', error.message);
}
```

### Get Single Role
```typescript
const engineeringRole = roles.find(r => r.name === 'Engineering');
```

### Filter Roles
```typescript
const technicalRoles = roles.filter(r =>
  ['Engineering', 'DevOps', 'Design'].includes(r.name)
);
```

## Validation Rules

### Role Name
- **Length:** 2-50 characters
- **Pattern:** Alphanumeric, spaces, and hyphens only
- **Format:** No leading/trailing whitespace
- **Uniqueness:** Case-insensitive (can't have "Engineering" and "engineering")

Valid examples:
- "Engineering"
- "Senior Engineer"
- "Tech-Lead"
- "Level3 Manager"

Invalid examples:
- "E" (too short)
- "Engineer@Manager" (special characters)
- "Engineer_Manager" (underscore not allowed)
- "   " (whitespace only)

### Description
- **Max length:** 500 characters
- **Optional:** Can be undefined or empty string
- **Content:** Any characters allowed (no pattern restrictions)

## Default Roles

Automatically created on first app load:
1. Engineering
2. Sales
3. Product
4. HR
5. Operations
6. Design
7. Marketing

## Error Messages

### Validation Errors
```
"Role name must be at least 2 characters"
"Role name must not exceed 50 characters"
"Role name can only contain letters, numbers, spaces, and hyphens"
"Role name cannot be only whitespace"
"A role with name 'X' already exists (case-insensitive)"
"Role description must not exceed 500 characters"
```

### Operation Errors
```
"Cannot delete this role because it is in use by templates or instances"
"Failed to create role: [Firestore error details]"
"Failed to update role: [Firestore error details]"
```

## API Reference

### useRoles(userId?: string)
Returns `UseRolesReturn` object with:
- `roles: CustomRole[]` - Array of all roles
- `isLoading: boolean` - Initial load state
- `error: string | null` - Last error message
- `createRole(name, description?, createdBy?)` - Create new role
- `updateRole(roleId, updates)` - Update existing role
- `deleteRole(roleId)` - Delete role (with safety checks)
- `refetch()` - Manually trigger refresh

### Data Layer Functions (from dataClient)
- `listRoles()` - Fetch all roles (one-time fetch)
- `getRole(id)` - Fetch single role
- `subscribeToRoles(callback)` - Subscribe to real-time updates
- `roleNameExists(name)` - Check if name is taken
- `isRoleInUse(roleId)` - Check if role is referenced

### Validation Functions (from roleClient)
- `validateRoleName(name)` - Validate name format
- `validateRoleNameUniqueness(name)` - Check for duplicates
- `validateRoleDescription(description)` - Validate description
- `seedDefaultRoles(userId?)` - Initialize default roles
- `hasDefaultRoles()` - Check if initialized

## Real-time Updates

The hook automatically subscribes to role changes via Firestore:
```typescript
const { roles } = useRoles(); // Auto-subscribes

// When roles change in Firestore, this updates instantly
// No manual refetch needed in most cases
```

## Manual Refresh
```typescript
const { refetch } = useRoles();

// Click a button to manually refresh
<button onClick={refetch}>Refresh Roles</button>
```

## Testing

Create a test role:
```typescript
const role = await createRole('Test Role', 'A test', 'test-user');
expect(role.name).toBe('Test Role');
expect(role.id).toBeDefined();
```

Mock in tests:
```typescript
vi.mock('./dataClient', () => ({
  listRoles: vi.fn(() => Promise.resolve(mockRoles)),
  subscribeToRoles: vi.fn(),
  // ... other mocks
}));
```

## Performance Tips

1. **Use derived state** - Filter/sort on client, not in hook
```typescript
const sortedRoles = roles.sort((a, b) => a.name.localeCompare(b.name));
```

2. **Memoize callbacks** - Wrap create/update/delete in useCallback if passing to children
```typescript
const handleCreate = useCallback((name, desc) => createRole(name, desc, userId), [userId]);
```

3. **Avoid unnecessary re-renders** - Use loading state to prevent UI updates during operations
```typescript
<button disabled={isLoading}>Create Role</button>
```

4. **Handle async properly** - Always await operations before state changes
```typescript
await createRole(...);
// Now roles list will auto-update
```

## Common Patterns

### Select Dropdown
```typescript
<select onChange={e => setSelectedRole(e.target.value)}>
  <option value="">Select a role</option>
  {roles.map(role => (
    <option key={role.id} value={role.name}>
      {role.name}
    </option>
  ))}
</select>
```

### List with Actions
```typescript
{roles.map(role => (
  <div key={role.id} className="p-4 border rounded">
    <h3 className="font-bold">{role.name}</h3>
    <p className="text-gray-600">{role.description}</p>
    <div className="mt-2 space-x-2">
      <button onClick={() => handleEdit(role.id)}>Edit</button>
      <button onClick={() => handleDelete(role.id)}>Delete</button>
    </div>
  </div>
))}
```

### Form with Validation
```typescript
const [name, setName] = useState('');
const [error, setError] = useState('');

async function handleSubmit() {
  try {
    setError('');
    await createRole(name, undefined, userId);
    setName('');
  } catch (err) {
    setError(err.message);
  }
}

return (
  <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
    <input
      value={name}
      onChange={e => setName(e.target.value)}
      placeholder="Enter role name"
    />
    {error && <div className="text-red-600">{error}</div>}
    <button type="submit">Create</button>
  </form>
);
```

## Firestore Collection Structure

**Collection:** `roles`
```
roles/
  ├── engineering/
  │   ├── name: "Engineering"
  │   ├── description: "Engineering team members"
  │   ├── createdAt: 1234567890
  │   ├── updatedAt: 1234567890
  │   └── createdBy: "system"
  │
  ├── sales/
  │   ├── name: "Sales"
  │   ├── description: "Sales team members"
  │   ├── createdAt: 1234567890
  │   ├── updatedAt: 1234567890
  │   └── createdBy: "system"
  │
  └── ... (other roles)
```

## Security Notes

- All inputs are validated client-side and should be validated server-side (Firestore Rules)
- The `createdBy` field establishes audit trail (future: use for permission checks)
- Deletion checks prevent orphaned references
- Case-insensitive uniqueness prevents subtle duplicates
- Immutable fields (id, createdAt, createdBy) are protected from updates

## Troubleshooting

### Roles not loading?
```typescript
// Check if subscription is established
const { isLoading, error } = useRoles();
console.log('Loading:', isLoading, 'Error:', error);
```

### Duplicate role name not detected?
```typescript
// Ensure you're checking uniqueness correctly
const exists = roles.some(r => r.name.toLowerCase() === newName.toLowerCase());
```

### Role still showing after deletion?
```typescript
// Wait for auto-update, or manually call refetch
await deleteRole(id);
// roles will update automatically within seconds
```

### Changes not appearing in real-time?
```typescript
// Manual refresh
const { refetch } = useRoles();
refetch();
```
