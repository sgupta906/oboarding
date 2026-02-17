/**
 * instanceService Tests - Verify updateStepStatus status revert logic
 * Tests that instance status correctly transitions between 'active' and 'completed'
 * based on step progress calculations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock: supabase client
// ---------------------------------------------------------------------------

let updateStepResult: any;
let fetchStepsResult: any;
let updateInstanceResult: any;

const mockUpdate = vi.fn();

vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'instance_steps') {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => updateStepResult),
              })),
            })),
          })),
          select: vi.fn(() => ({
            eq: vi.fn(() => fetchStepsResult),
          })),
        };
      }
      if (table === 'onboarding_instances') {
        return {
          update: vi.fn((data: any) => {
            mockUpdate(data);
            return {
              eq: vi.fn(() => updateInstanceResult),
            };
          }),
        };
      }
      return {};
    }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('../../utils/debounce', () => ({
  debounce: vi.fn((fn: any) => {
    const debounced = (...args: any[]) => fn(...args);
    debounced.cancel = vi.fn();
    return debounced;
  }),
}));

vi.mock('./subscriptionManager', () => ({
  createSharedSubscription: vi.fn((_key: string, subscribeFn: any) => ({
    subscribe: (callback: any) => {
      return subscribeFn(callback);
    },
  })),
}));

import { updateStepStatus, createOnboardingRunFromTemplate } from './instanceService';

// ---------------------------------------------------------------------------
// Mock: userService (spy on dynamic import to detect unwanted calls)
// ---------------------------------------------------------------------------

const mockAddUserToAuthCredentials = vi.fn();
const mockUserEmailExists = vi.fn().mockResolvedValue(false);
const mockCreateUser = vi.fn().mockResolvedValue({});

vi.mock('./userService', () => ({
  addUserToAuthCredentials: (...args: any[]) => mockAddUserToAuthCredentials(...args),
  userEmailExists: (...args: any[]) => mockUserEmailExists(...args),
  createUser: (...args: any[]) => mockCreateUser(...args),
}));

// ---------------------------------------------------------------------------
// Mock: templateService (needed for createOnboardingRunFromTemplate)
// ---------------------------------------------------------------------------

const mockGetTemplate = vi.fn();

vi.mock('./templateService', () => ({
  getTemplate: (...args: any[]) => mockGetTemplate(...args),
}));

describe('createOnboardingRunFromTemplate - hire/user separation (Bug #38)', () => {
  it('does not call userService functions when creating an onboarding run', async () => {
    // Clear mocks for this test only
    mockAddUserToAuthCredentials.mockClear();
    mockUserEmailExists.mockClear();
    mockCreateUser.mockClear();

    // Arrange: mock template with steps
    mockGetTemplate.mockResolvedValue({
      id: 'tmpl-1',
      name: 'Test Template',
      steps: [
        {
          id: 1,
          title: 'Step 1',
          description: 'First step',
          role: 'employee',
          owner: 'Employee',
          expert: 'Manager',
          status: 'pending',
          link: null,
        },
      ],
    });

    // Mock supabase insert for onboarding_instances
    const { supabase } = await import('../../config/supabase');
    const fromFn = supabase.from as ReturnType<typeof vi.fn>;
    const originalImpl = fromFn.getMockImplementation();

    // Override from() to handle insert chain for onboarding_instances creation
    fromFn.mockImplementation((table: string) => {
      if (table === 'onboarding_instances') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({
                data: { id: 'inst-new-1' },
                error: null,
              })),
            })),
          })),
          update: vi.fn((_data: any) => ({
            eq: vi.fn(() => ({ error: null })),
          })),
        };
      }
      if (table === 'instance_steps') {
        return {
          insert: vi.fn(() => ({ error: null })),
        };
      }
      return {};
    });

    try {
      // Act
      const result = await createOnboardingRunFromTemplate({
        employeeName: 'Test User',
        employeeEmail: 'test@example.com',
        role: 'Engineer',
        department: 'Engineering',
        templateId: 'tmpl-1',
      });

      // Assert: onboarding instance was created
      expect(result).toBeDefined();
      expect(result.id).toBe('inst-new-1');
      expect(result.employeeEmail).toBe('test@example.com');

      // Assert: userService was NOT called (Bug #38 regression check)
      expect(mockAddUserToAuthCredentials).not.toHaveBeenCalled();
      expect(mockUserEmailExists).not.toHaveBeenCalled();
      expect(mockCreateUser).not.toHaveBeenCalled();
    } finally {
      // Restore original mock so other tests are not affected
      if (originalImpl) {
        fromFn.mockImplementation(originalImpl);
      } else {
        fromFn.mockReset();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: getInstanceByEmployeeEmail
// ---------------------------------------------------------------------------

describe('getInstanceByEmployeeEmail', () => {
  let getInstanceByEmployeeEmail: typeof import('./instanceService').getInstanceByEmployeeEmail;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamic import to get the function after mocks are set up
    const mod = await import('./instanceService');
    getInstanceByEmployeeEmail = mod.getInstanceByEmployeeEmail;
  });

  it('returns instance data when email matches', async () => {
    const { supabase } = await import('../../config/supabase');
    const fromFn = supabase.from as ReturnType<typeof vi.fn>;
    const originalImpl = fromFn.getMockImplementation();

    fromFn.mockImplementation((table: string) => {
      if (table === 'onboarding_instances') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  data: [{ id: 'inst-42', employee_name: 'Delaney Smith' }],
                  error: null,
                })),
              })),
            })),
          })),
        };
      }
      return {};
    });

    try {
      const result = await getInstanceByEmployeeEmail('delaney@gmail.com');
      expect(result).toEqual({ instanceId: 'inst-42', employeeName: 'Delaney Smith' });
    } finally {
      if (originalImpl) fromFn.mockImplementation(originalImpl);
    }
  });

  it('returns null when no instance found', async () => {
    const { supabase } = await import('../../config/supabase');
    const fromFn = supabase.from as ReturnType<typeof vi.fn>;
    const originalImpl = fromFn.getMockImplementation();

    fromFn.mockImplementation((table: string) => {
      if (table === 'onboarding_instances') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  data: [],
                  error: null,
                })),
              })),
            })),
          })),
        };
      }
      return {};
    });

    try {
      const result = await getInstanceByEmployeeEmail('nobody@example.com');
      expect(result).toBeNull();
    } finally {
      if (originalImpl) fromFn.mockImplementation(originalImpl);
    }
  });

  it('returns null on Supabase error (graceful failure)', async () => {
    const { supabase } = await import('../../config/supabase');
    const fromFn = supabase.from as ReturnType<typeof vi.fn>;
    const originalImpl = fromFn.getMockImplementation();

    fromFn.mockImplementation((table: string) => {
      if (table === 'onboarding_instances') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  data: null,
                  error: { message: 'Connection refused' },
                })),
              })),
            })),
          })),
        };
      }
      return {};
    });

    try {
      const result = await getInstanceByEmployeeEmail('delaney@gmail.com');
      expect(result).toBeNull();
    } finally {
      if (originalImpl) fromFn.mockImplementation(originalImpl);
    }
  });

  it('normalizes email to lowercase', async () => {
    const { supabase } = await import('../../config/supabase');
    const fromFn = supabase.from as ReturnType<typeof vi.fn>;
    const originalImpl = fromFn.getMockImplementation();

    let capturedEmail: string | undefined;
    fromFn.mockImplementation((table: string) => {
      if (table === 'onboarding_instances') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((_col: string, email: string) => {
              capturedEmail = email;
              return {
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    data: [{ id: 'inst-99', employee_name: 'Delaney' }],
                    error: null,
                  })),
                })),
              };
            }),
          })),
        };
      }
      return {};
    });

    try {
      await getInstanceByEmployeeEmail('Delaney@Gmail.COM');
      expect(capturedEmail).toBe('delaney@gmail.com');
    } finally {
      if (originalImpl) fromFn.mockImplementation(originalImpl);
    }
  });
});

describe('updateStepStatus - status revert logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateInstanceResult = { error: null };
  });

  it('sets status to completed and completed_at when progress reaches 100%', async () => {
    // All steps completed
    updateStepResult = { data: [{ position: 1 }], error: null };
    fetchStepsResult = {
      data: [
        { status: 'completed' },
        { status: 'completed' },
      ],
      error: null,
    };

    await updateStepStatus('inst-1', 1, 'completed');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: 100,
        status: 'completed',
        completed_at: expect.any(String),
      })
    );
  });

  it('sets status to active and completed_at to null when progress drops below 100%', async () => {
    // One of two steps completed (50%)
    updateStepResult = { data: [{ position: 1 }], error: null };
    fetchStepsResult = {
      data: [
        { status: 'completed' },
        { status: 'pending' },
      ],
      error: null,
    };

    await updateStepStatus('inst-1', 1, 'pending');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: 50,
        status: 'active',
        completed_at: null,
      })
    );
  });

  it('sets status to active and progress to 0 when no steps are completed', async () => {
    // Zero of two steps completed (0%)
    updateStepResult = { data: [{ position: 1 }], error: null };
    fetchStepsResult = {
      data: [
        { status: 'pending' },
        { status: 'pending' },
      ],
      error: null,
    };

    await updateStepStatus('inst-1', 1, 'pending');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: 0,
        status: 'active',
        completed_at: null,
      })
    );
  });
});
