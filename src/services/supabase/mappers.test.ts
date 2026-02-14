/**
 * Unit tests for Supabase mappers
 * Tests type conversion between database rows and application types.
 */

import { describe, it, expect } from 'vitest';
import {
  toUnixMs,
  toISO,
  toOptionalUnixMs,
  toStep,
  toTemplate,
  toInstance,
  toSuggestion,
  toActivity,
  toRole,
  toProfile,
  toProfileTemplate,
  toUser,
} from './mappers';

describe('Timestamp Helpers', () => {
  it('toUnixMs converts valid ISO string to Unix milliseconds', () => {
    const iso = '2026-01-15T10:30:00.000Z';
    const result = toUnixMs(iso);
    expect(result).toBe(new Date(iso).getTime());
    expect(typeof result).toBe('number');
  });

  it('toUnixMs returns 0 for null', () => {
    expect(toUnixMs(null)).toBe(0);
  });

  it('toISO converts Unix milliseconds to ISO string', () => {
    const ms = 1705312200000;
    const result = toISO(ms);
    expect(result).toBe(new Date(ms).toISOString());
  });

  it('toOptionalUnixMs returns undefined for null', () => {
    expect(toOptionalUnixMs(null)).toBeUndefined();
  });

  it('toOptionalUnixMs returns undefined for undefined', () => {
    expect(toOptionalUnixMs(undefined)).toBeUndefined();
  });

  it('toOptionalUnixMs converts valid ISO string', () => {
    const iso = '2026-06-01T00:00:00.000Z';
    expect(toOptionalUnixMs(iso)).toBe(new Date(iso).getTime());
  });
});

describe('toStep', () => {
  it('maps position to id and all other fields', () => {
    const row = {
      id: 'uuid-123',
      template_id: 'tpl-1',
      position: 3,
      title: 'Setup Environment',
      description: 'Install tools',
      role: 'Engineering',
      owner: 'DevOps',
      expert: 'John',
      status: 'pending',
      link: 'https://example.com',
    };

    const step = toStep(row);
    expect(step.id).toBe(3); // position -> id
    expect(step.title).toBe('Setup Environment');
    expect(step.description).toBe('Install tools');
    expect(step.role).toBe('Engineering');
    expect(step.owner).toBe('DevOps');
    expect(step.expert).toBe('John');
    expect(step.status).toBe('pending');
    expect(step.link).toBe('https://example.com');
  });

  it('handles null link field', () => {
    const row = {
      id: 'uuid-456',
      template_id: 'tpl-1',
      position: 1,
      title: 'Step',
      description: 'Desc',
      role: 'All',
      owner: 'HR',
      expert: 'Jane',
      status: 'completed',
      link: null,
    };

    const step = toStep(row);
    expect(step.link).toBe('');
  });
});

describe('toTemplate', () => {
  it('maps template row with steps array', () => {
    const row = {
      id: 'tpl-1',
      name: 'Eng Onboarding',
      description: 'Engineering template',
      role: 'Engineering',
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    };

    const stepRows = [
      { id: 'step-2', template_id: 'tpl-1', position: 2, title: 'Step 2', description: 'D2', role: 'All', owner: 'HR', expert: 'E2', status: 'pending', link: null },
      { id: 'step-1', template_id: 'tpl-1', position: 1, title: 'Step 1', description: 'D1', role: 'All', owner: 'HR', expert: 'E1', status: 'pending', link: 'https://link' },
    ];

    const template = toTemplate(row, stepRows);
    expect(template.id).toBe('tpl-1');
    expect(template.name).toBe('Eng Onboarding');
    expect(template.isActive).toBe(true);
    expect(template.createdAt).toBe(new Date('2026-01-01T00:00:00.000Z').getTime());
    expect(template.updatedAt).toBe(new Date('2026-01-02T00:00:00.000Z').getTime());
    // Steps should be sorted by position
    expect(template.steps[0].id).toBe(1);
    expect(template.steps[1].id).toBe(2);
  });

  it('maps template with empty steps array', () => {
    const row = {
      id: 'tpl-2',
      name: 'Empty',
      description: 'No steps',
      role: 'Sales',
      is_active: false,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: null,
    };

    const template = toTemplate(row, []);
    expect(template.steps).toEqual([]);
    expect(template.updatedAt).toBeUndefined();
  });
});

describe('toInstance', () => {
  it('maps instance row with full data including optional fields', () => {
    const row = {
      id: 'inst-1',
      employee_name: 'Alice',
      employee_email: 'alice@co.com',
      role: 'Engineering',
      department: 'Platform',
      template_id: 'tpl-1',
      progress: 50,
      status: 'active',
      created_at: '2026-01-01T00:00:00.000Z',
      start_date: '2026-02-01T00:00:00.000Z',
      completed_at: null,
      template_snapshots: null,
    };

    const stepRows = [
      { id: 's1', instance_id: 'inst-1', position: 1, title: 'S1', description: 'D1', role: 'All', owner: 'HR', expert: 'E', status: 'completed', link: null },
      { id: 's2', instance_id: 'inst-1', position: 2, title: 'S2', description: 'D2', role: 'All', owner: 'HR', expert: 'E', status: 'pending', link: null },
    ];

    const inst = toInstance(row, stepRows);
    expect(inst.id).toBe('inst-1');
    expect(inst.employeeName).toBe('Alice');
    expect(inst.employeeEmail).toBe('alice@co.com');
    expect(inst.templateId).toBe('tpl-1');
    expect(inst.progress).toBe(50);
    expect(inst.status).toBe('active');
    expect(inst.startDate).toBe(new Date('2026-02-01T00:00:00.000Z').getTime());
    expect(inst.completedAt).toBeUndefined();
    expect(inst.steps).toHaveLength(2);
  });
});

describe('toSuggestion', () => {
  it('maps user_name to user and step_id to stepId', () => {
    const row = {
      id: 'sug-1',
      step_id: 3,
      user_name: 'Bob',
      text: 'Improve this step',
      status: 'pending',
      created_at: '2026-01-01T00:00:00.000Z',
      instance_id: 'inst-1',
    };

    const sugg = toSuggestion(row);
    expect(sugg.id).toBe('sug-1');
    expect(sugg.stepId).toBe(3);
    expect(sugg.user).toBe('Bob');
    expect(sugg.text).toBe('Improve this step');
    expect(sugg.status).toBe('pending');
    expect(sugg.instanceId).toBe('inst-1');
  });
});

describe('toActivity', () => {
  it('maps all camelCase fields correctly', () => {
    const row = {
      id: 'act-1',
      user_initials: 'JD',
      action: 'Created template',
      time_ago: '2 hours ago',
      timestamp: '2026-01-01T10:00:00.000Z',
      user_id: 'user-1',
      resource_type: 'template',
      resource_id: 'tpl-1',
    };

    const act = toActivity(row);
    expect(act.id).toBe('act-1');
    expect(act.userInitials).toBe('JD');
    expect(act.action).toBe('Created template');
    expect(act.timeAgo).toBe('2 hours ago');
    expect(act.userId).toBe('user-1');
    expect(act.resourceType).toBe('template');
    expect(act.resourceId).toBe('tpl-1');
  });

  it('handles null optional fields', () => {
    const row = {
      id: 'act-2',
      user_initials: 'AB',
      action: 'Logged in',
      time_ago: null,
      timestamp: null,
      user_id: null,
      resource_type: null,
      resource_id: null,
    };

    const act = toActivity(row);
    expect(act.timeAgo).toBe('');
    expect(act.timestamp).toBeUndefined();
    expect(act.userId).toBeUndefined();
    expect(act.resourceType).toBeUndefined();
    expect(act.resourceId).toBeUndefined();
  });
});

describe('toRole', () => {
  it('maps timestamps and description', () => {
    const row = {
      id: 'role-1',
      name: 'Engineering',
      description: 'Eng team',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
      created_by: 'user-1',
    };

    const role = toRole(row);
    expect(role.id).toBe('role-1');
    expect(role.name).toBe('Engineering');
    expect(role.description).toBe('Eng team');
    expect(role.createdAt).toBe(new Date('2026-01-01T00:00:00.000Z').getTime());
    expect(role.updatedAt).toBe(new Date('2026-01-02T00:00:00.000Z').getTime());
    expect(role.createdBy).toBe('user-1');
  });

  it('handles null description and created_by', () => {
    const row = {
      id: 'role-2',
      name: 'Sales',
      description: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      created_by: null,
    };

    const role = toRole(row);
    expect(role.description).toBeUndefined();
    expect(role.createdBy).toBe('system');
  });
});

describe('toProfile', () => {
  it('maps roleTags from junction rows', () => {
    const row = {
      id: 'prof-1',
      name: 'Engineer',
      description: 'Engineering profile',
      created_at: '2026-01-01T00:00:00.000Z',
      created_by: 'admin',
    };

    const roleTagRows = [
      { profile_id: 'prof-1', role_tag: 'Engineering' },
      { profile_id: 'prof-1', role_tag: 'All' },
    ];

    const profile = toProfile(row, roleTagRows);
    expect(profile.id).toBe('prof-1');
    expect(profile.name).toBe('Engineer');
    expect(profile.roleTags).toEqual(['Engineering', 'All']);
    expect(profile.createdBy).toBe('admin');
  });
});

describe('toProfileTemplate', () => {
  it('maps steps and isPublished', () => {
    const row = {
      id: 'pt-1',
      profile_id: 'prof-1',
      name: 'Eng Standard',
      description: 'Standard template',
      version: 2,
      is_published: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-05T00:00:00.000Z',
      created_by: 'admin',
    };

    const stepRows = [
      { id: 'ps-1', profile_template_id: 'pt-1', position: 1, title: 'Step 1', description: 'D1', role: 'All', owner: 'HR', expert: 'E', status: 'pending', link: null },
    ];

    const pt = toProfileTemplate(row, stepRows);
    expect(pt.id).toBe('pt-1');
    expect(pt.profileId).toBe('prof-1');
    expect(pt.isPublished).toBe(true);
    expect(pt.version).toBe(2);
    expect(pt.steps).toHaveLength(1);
    expect(pt.steps[0].id).toBe(1);
  });
});

describe('toUser', () => {
  it('maps roles and profiles from junction rows', () => {
    const row = {
      id: 'user-1',
      email: 'john@co.com',
      name: 'John',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
      created_by: 'system',
    };

    const roleRows = [
      { user_id: 'user-1', role_name: 'admin' },
      { user_id: 'user-1', role_name: 'manager' },
    ];

    const profileRows = [
      { user_id: 'user-1', profile_name: 'Engineering' },
    ];

    const user = toUser(row, roleRows, profileRows);
    expect(user.id).toBe('user-1');
    expect(user.email).toBe('john@co.com');
    expect(user.name).toBe('John');
    expect(user.roles).toEqual(['admin', 'manager']);
    expect(user.profiles).toEqual(['Engineering']);
    expect(user.createdBy).toBe('system');
  });

  it('handles empty junction rows', () => {
    const row = {
      id: 'user-2',
      email: 'jane@co.com',
      name: 'Jane',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      created_by: null,
    };

    const user = toUser(row, [], []);
    expect(user.roles).toEqual([]);
    expect(user.profiles).toEqual([]);
    expect(user.createdBy).toBe('system');
  });
});
