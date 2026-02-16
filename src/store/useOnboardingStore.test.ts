/**
 * useOnboardingStore Unit Tests
 * Tests for Zustand store: state management, subscription lifecycle, ref-counting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUnsubscribe = vi.fn();
const mockSubscribeToOnboardingInstances = vi.fn();
const mockStepsUnsubscribe = vi.fn();
const mockSubscribeToSteps = vi.fn();
const mockUpdateStepStatus = vi.fn();
const mockUsersUnsubscribe = vi.fn();
const mockSubscribeToUsers = vi.fn();
const mockCreateUser = vi.fn();
const mockUpdateUser = vi.fn();
const mockDeleteOnboardingInstance = vi.fn();
const mockDeleteUser = vi.fn();
const mockGetUser = vi.fn();
const mockActivitiesUnsubscribe = vi.fn();
const mockSubscribeToActivities = vi.fn();
const mockSuggestionsUnsubscribe = vi.fn();
const mockSubscribeToSuggestions = vi.fn();

vi.mock('../services/supabase', () => ({
  subscribeToOnboardingInstances: (...args: unknown[]) =>
    mockSubscribeToOnboardingInstances(...args),
  subscribeToSteps: (...args: unknown[]) => mockSubscribeToSteps(...args),
  updateStepStatus: (...args: unknown[]) => mockUpdateStepStatus(...args),
  deleteOnboardingInstance: (...args: unknown[]) =>
    mockDeleteOnboardingInstance(...args),
  subscribeToUsers: (...args: unknown[]) => mockSubscribeToUsers(...args),
  createUser: (...args: unknown[]) => mockCreateUser(...args),
  updateUser: (...args: unknown[]) => mockUpdateUser(...args),
  deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
  getUser: (...args: unknown[]) => mockGetUser(...args),
  subscribeToActivities: (...args: unknown[]) =>
    mockSubscribeToActivities(...args),
  subscribeToSuggestions: (...args: unknown[]) =>
    mockSubscribeToSuggestions(...args),
}));

import { useOnboardingStore, resetStoreInternals } from './useOnboardingStore';
import type {
  OnboardingInstance,
  Step,
  User,
  Activity,
  Suggestion,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeInstance = (
  id: string,
  email = 'test@example.com',
  createdAt = Date.now()
): OnboardingInstance => ({
  id,
  employeeName: 'Test User',
  employeeEmail: email,
  role: 'Engineering',
  department: 'Tech',
  templateId: 'tmpl-1',
  steps: [],
  createdAt,
  progress: 0,
  status: 'active',
});

const makeStep = (
  id: number,
  status: 'pending' | 'completed' | 'stuck' = 'pending'
): Step => ({
  id,
  title: `Step ${id}`,
  description: `Description for step ${id}`,
  role: 'All',
  owner: 'IT',
  expert: 'Expert',
  status,
  link: '',
});

const makeUser = (
  id: string,
  name = 'Test User',
  email = 'test@example.com'
): User => ({
  id,
  email,
  name,
  roles: ['employee'],
  profiles: ['Engineering'],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  createdBy: 'admin-1',
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useOnboardingStore', () => {
  beforeEach(() => {
    // Reset store state and module-level ref-counting between tests
    // Must happen BEFORE clearing mocks, since resetStoreInternals may
    // call the unsubscribe function from a prior test run.
    useOnboardingStore.setState({
      instances: [],
      instancesLoading: false,
      instancesError: null,
      stepsByInstance: {},
      stepsLoadingByInstance: {},
      stepsErrorByInstance: {},
      users: [],
      usersLoading: false,
      usersError: null,
      activities: [],
      activitiesLoading: false,
      activitiesError: null,
      suggestions: [],
      suggestionsLoading: false,
      suggestionsError: null,
    });
    resetStoreInternals();
    vi.clearAllMocks();

    // Default mock: returns an unsubscribe function
    mockSubscribeToOnboardingInstances.mockImplementation(() => {
      return mockUnsubscribe;
    });

    // Default steps mock: returns an unsubscribe function
    mockSubscribeToSteps.mockImplementation(() => {
      return mockStepsUnsubscribe;
    });

    mockUpdateStepStatus.mockResolvedValue(undefined);
    mockDeleteOnboardingInstance.mockResolvedValue(undefined);

    // Default users mocks
    mockSubscribeToUsers.mockImplementation(() => {
      return mockUsersUnsubscribe;
    });
    mockCreateUser.mockResolvedValue(undefined);
    mockUpdateUser.mockResolvedValue(undefined);
    mockDeleteUser.mockResolvedValue(undefined);
    mockGetUser.mockResolvedValue(null);

    // Default activities mock
    mockSubscribeToActivities.mockImplementation(() => {
      return mockActivitiesUnsubscribe;
    });

    // Default suggestions mock
    mockSubscribeToSuggestions.mockImplementation(() => {
      return mockSuggestionsUnsubscribe;
    });
  });

  it('initializes with empty state', () => {
    const state = useOnboardingStore.getState();

    expect(state.instances).toEqual([]);
    expect(state.instancesLoading).toBe(false);
    expect(state.instancesError).toBeNull();
    expect(typeof state._startInstancesSubscription).toBe('function');
  });

  it('_startInstancesSubscription calls subscribeToOnboardingInstances', () => {
    const cleanup = useOnboardingStore.getState()._startInstancesSubscription();

    expect(mockSubscribeToOnboardingInstances).toHaveBeenCalledTimes(1);
    expect(typeof cleanup).toBe('function');

    // Store should be in loading state
    expect(useOnboardingStore.getState().instancesLoading).toBe(true);
  });

  it('subscription callback updates instances and clears loading', () => {
    // Capture the callback passed to subscribeToOnboardingInstances
    let capturedCallback: ((instances: OnboardingInstance[]) => void) | null = null;
    mockSubscribeToOnboardingInstances.mockImplementation(
      (cb: (instances: OnboardingInstance[]) => void) => {
        capturedCallback = cb;
        return mockUnsubscribe;
      }
    );

    useOnboardingStore.getState()._startInstancesSubscription();

    expect(capturedCallback).not.toBeNull();

    // Simulate subscription firing with data
    const instances = [makeInstance('inst-1'), makeInstance('inst-2')];
    capturedCallback!(instances);

    const state = useOnboardingStore.getState();
    expect(state.instances).toEqual(instances);
    expect(state.instancesLoading).toBe(false);
  });

  it('subscription error sets error and clears loading', () => {
    const testError = new Error('Subscription failed');
    mockSubscribeToOnboardingInstances.mockImplementation(() => {
      throw testError;
    });

    useOnboardingStore.getState()._startInstancesSubscription();

    const state = useOnboardingStore.getState();
    expect(state.instancesError).toEqual(testError);
    expect(state.instancesLoading).toBe(false);
    expect(state.instances).toEqual([]);
  });

  it('second _startInstancesSubscription does not create duplicate subscription', () => {
    const cleanup1 = useOnboardingStore.getState()._startInstancesSubscription();
    const cleanup2 = useOnboardingStore.getState()._startInstancesSubscription();

    // subscribeToOnboardingInstances should only be called once
    expect(mockSubscribeToOnboardingInstances).toHaveBeenCalledTimes(1);

    // Both should return valid cleanup functions
    expect(typeof cleanup1).toBe('function');
    expect(typeof cleanup2).toBe('function');
  });

  it('cleanup decrements ref count', () => {
    // Start two consumers
    const cleanup1 = useOnboardingStore.getState()._startInstancesSubscription();
    const cleanup2 = useOnboardingStore.getState()._startInstancesSubscription();

    // First consumer cleans up
    cleanup1();

    // Unsubscribe should NOT have been called (still 1 consumer)
    expect(mockUnsubscribe).not.toHaveBeenCalled();

    // Clean up second consumer
    cleanup2();

    // NOW unsubscribe should be called (last consumer)
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('last cleanup unsubscribes and resets state', () => {
    // Capture the callback to populate data
    let capturedCallback: ((instances: OnboardingInstance[]) => void) | null = null;
    mockSubscribeToOnboardingInstances.mockImplementation(
      (cb: (instances: OnboardingInstance[]) => void) => {
        capturedCallback = cb;
        return mockUnsubscribe;
      }
    );

    const cleanup = useOnboardingStore.getState()._startInstancesSubscription();

    // Populate data
    capturedCallback!([makeInstance('inst-1')]);
    expect(useOnboardingStore.getState().instances).toHaveLength(1);

    // Clean up last consumer
    cleanup();

    // Unsubscribe should be called
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);

    // State should be reset
    const state = useOnboardingStore.getState();
    expect(state.instances).toEqual([]);
    expect(state.instancesLoading).toBe(false);
    expect(state.instancesError).toBeNull();
  });

  it('double cleanup is safe (idempotent)', () => {
    const cleanup = useOnboardingStore.getState()._startInstancesSubscription();

    cleanup();
    cleanup(); // Should not throw or double-decrement

    // Unsubscribe called exactly once
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('re-subscribe after full cleanup works', () => {
    // First subscription cycle
    const cleanup1 = useOnboardingStore.getState()._startInstancesSubscription();
    cleanup1();

    expect(mockSubscribeToOnboardingInstances).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);

    // Second subscription cycle
    const cleanup2 = useOnboardingStore.getState()._startInstancesSubscription();

    // Should start a new subscription
    expect(mockSubscribeToOnboardingInstances).toHaveBeenCalledTimes(2);
    expect(useOnboardingStore.getState().instancesLoading).toBe(true);

    cleanup2();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
  });

  // -------------------------------------------------------------------------
  // _addInstance
  // -------------------------------------------------------------------------

  describe('_addInstance', () => {
    it('is available as a function', () => {
      expect(typeof useOnboardingStore.getState()._addInstance).toBe('function');
    });

    it('appends instance to existing array', () => {
      const existing = makeInstance('inst-existing');
      useOnboardingStore.setState({ instances: [existing] });

      const newInstance = makeInstance('inst-new', 'new@example.com');
      useOnboardingStore.getState()._addInstance(newInstance);

      const { instances } = useOnboardingStore.getState();
      expect(instances).toHaveLength(2);
      expect(instances[0].id).toBe('inst-existing');
      expect(instances[1].id).toBe('inst-new');
    });

    it('works on empty instances array', () => {
      expect(useOnboardingStore.getState().instances).toHaveLength(0);

      const newInstance = makeInstance('inst-first');
      useOnboardingStore.getState()._addInstance(newInstance);

      const { instances } = useOnboardingStore.getState();
      expect(instances).toHaveLength(1);
      expect(instances[0].id).toBe('inst-first');
    });
  });

  // -------------------------------------------------------------------------
  // _removeInstance
  // -------------------------------------------------------------------------

  describe('_removeInstance', () => {
    it('is available as a function', () => {
      expect(typeof useOnboardingStore.getState()._removeInstance).toBe('function');
    });

    it('removes from array after server call', async () => {
      const inst1 = makeInstance('inst-1', 'alice@example.com');
      const inst2 = makeInstance('inst-2', 'bob@example.com');
      useOnboardingStore.setState({ instances: [inst1, inst2] });

      mockDeleteOnboardingInstance.mockResolvedValue(undefined);

      await useOnboardingStore.getState()._removeInstance('inst-1');

      expect(mockDeleteOnboardingInstance).toHaveBeenCalledWith('inst-1');
      const state = useOnboardingStore.getState();
      expect(state.instances).toHaveLength(1);
      expect(state.instances[0].id).toBe('inst-2');
    });

    it('throws and does not remove on server error', async () => {
      const inst1 = makeInstance('inst-1', 'alice@example.com');
      const inst2 = makeInstance('inst-2', 'bob@example.com');
      useOnboardingStore.setState({ instances: [inst1, inst2] });

      mockDeleteOnboardingInstance.mockRejectedValue(new Error('Delete failed'));

      await expect(
        useOnboardingStore.getState()._removeInstance('inst-1')
      ).rejects.toThrow('Delete failed');

      // Array should be unchanged
      const state = useOnboardingStore.getState();
      expect(state.instances).toHaveLength(2);
      expect(state.instances[0].id).toBe('inst-1');
      expect(state.instances[1].id).toBe('inst-2');
    });
  });

  // -------------------------------------------------------------------------
  // StepsSlice
  // -------------------------------------------------------------------------

  describe('StepsSlice', () => {
    it('initializes with empty steps state', () => {
      const state = useOnboardingStore.getState();

      expect(state.stepsByInstance).toEqual({});
      expect(state.stepsLoadingByInstance).toEqual({});
      expect(state.stepsErrorByInstance).toEqual({});
      expect(typeof state._startStepsSubscription).toBe('function');
      expect(typeof state._updateStepStatus).toBe('function');
    });

    it('_startStepsSubscription calls subscribeToSteps with instanceId', () => {
      const cleanup = useOnboardingStore
        .getState()
        ._startStepsSubscription('inst-1');

      expect(mockSubscribeToSteps).toHaveBeenCalledTimes(1);
      expect(mockSubscribeToSteps).toHaveBeenCalledWith(
        'inst-1',
        expect.any(Function)
      );
      expect(typeof cleanup).toBe('function');
    });

    it('_startStepsSubscription sets loading state for instanceId', () => {
      useOnboardingStore.getState()._startStepsSubscription('inst-1');

      const state = useOnboardingStore.getState();
      expect(state.stepsLoadingByInstance['inst-1']).toBe(true);
    });

    it('subscription callback updates stepsByInstance and clears loading', () => {
      // Capture the callback passed to subscribeToSteps
      let capturedCallback: ((steps: Step[]) => void) | null = null;
      mockSubscribeToSteps.mockImplementation(
        (_id: string, cb: (steps: Step[]) => void) => {
          capturedCallback = cb;
          return mockStepsUnsubscribe;
        }
      );

      useOnboardingStore.getState()._startStepsSubscription('inst-1');

      expect(capturedCallback).not.toBeNull();

      // Simulate subscription firing with data
      const steps = [makeStep(1), makeStep(2)];
      capturedCallback!(steps);

      const state = useOnboardingStore.getState();
      expect(state.stepsByInstance['inst-1']).toEqual(steps);
      expect(state.stepsLoadingByInstance['inst-1']).toBe(false);
    });

    it('subscription error sets error and clears loading', () => {
      const testError = new Error('Steps subscription failed');
      mockSubscribeToSteps.mockImplementation(() => {
        throw testError;
      });

      useOnboardingStore.getState()._startStepsSubscription('inst-1');

      const state = useOnboardingStore.getState();
      expect(state.stepsErrorByInstance['inst-1']).toEqual(testError);
      expect(state.stepsLoadingByInstance['inst-1']).toBe(false);
    });

    it('second start for same instanceId is no-op (subscribeToSteps called once)', () => {
      const cleanup1 = useOnboardingStore
        .getState()
        ._startStepsSubscription('inst-1');
      const cleanup2 = useOnboardingStore
        .getState()
        ._startStepsSubscription('inst-1');

      expect(mockSubscribeToSteps).toHaveBeenCalledTimes(1);
      expect(typeof cleanup1).toBe('function');
      expect(typeof cleanup2).toBe('function');
    });

    it('different instanceIds get separate subscriptions', () => {
      useOnboardingStore.getState()._startStepsSubscription('inst-1');
      useOnboardingStore.getState()._startStepsSubscription('inst-2');

      expect(mockSubscribeToSteps).toHaveBeenCalledTimes(2);
      expect(mockSubscribeToSteps).toHaveBeenCalledWith(
        'inst-1',
        expect.any(Function)
      );
      expect(mockSubscribeToSteps).toHaveBeenCalledWith(
        'inst-2',
        expect.any(Function)
      );
    });

    it('cleanup decrements ref count (2 consumers, first cleanup does not unsubscribe)', () => {
      const cleanup1 = useOnboardingStore
        .getState()
        ._startStepsSubscription('inst-1');
      const cleanup2 = useOnboardingStore
        .getState()
        ._startStepsSubscription('inst-1');

      // First consumer cleans up
      cleanup1();

      // Unsubscribe should NOT have been called (still 1 consumer)
      expect(mockStepsUnsubscribe).not.toHaveBeenCalled();

      // Clean up second consumer
      cleanup2();

      // NOW unsubscribe should be called
      expect(mockStepsUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('last cleanup unsubscribes and clears that instanceId state', () => {
      // Capture the callback to populate data
      let capturedCallback: ((steps: Step[]) => void) | null = null;
      mockSubscribeToSteps.mockImplementation(
        (_id: string, cb: (steps: Step[]) => void) => {
          capturedCallback = cb;
          return mockStepsUnsubscribe;
        }
      );

      const cleanup = useOnboardingStore
        .getState()
        ._startStepsSubscription('inst-1');

      // Populate data
      capturedCallback!([makeStep(1), makeStep(2)]);
      expect(useOnboardingStore.getState().stepsByInstance['inst-1']).toHaveLength(2);

      // Clean up last consumer
      cleanup();

      // Unsubscribe should be called
      expect(mockStepsUnsubscribe).toHaveBeenCalledTimes(1);

      // That instanceId's state should be cleared
      const state = useOnboardingStore.getState();
      expect(state.stepsByInstance['inst-1']).toBeUndefined();
      expect(state.stepsLoadingByInstance['inst-1']).toBeUndefined();
      expect(state.stepsErrorByInstance['inst-1']).toBeUndefined();
    });

    it('double cleanup is safe (idempotent)', () => {
      const cleanup = useOnboardingStore
        .getState()
        ._startStepsSubscription('inst-1');

      cleanup();
      cleanup(); // Should not throw or double-decrement

      expect(mockStepsUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('re-subscribe after full cleanup works', () => {
      // First subscription cycle
      const cleanup1 = useOnboardingStore
        .getState()
        ._startStepsSubscription('inst-1');
      cleanup1();

      expect(mockSubscribeToSteps).toHaveBeenCalledTimes(1);
      expect(mockStepsUnsubscribe).toHaveBeenCalledTimes(1);

      // Second subscription cycle
      const cleanup2 = useOnboardingStore
        .getState()
        ._startStepsSubscription('inst-1');

      // Should start a new subscription
      expect(mockSubscribeToSteps).toHaveBeenCalledTimes(2);
      expect(
        useOnboardingStore.getState().stepsLoadingByInstance['inst-1']
      ).toBe(true);

      cleanup2();
      expect(mockStepsUnsubscribe).toHaveBeenCalledTimes(2);
    });

    it('_updateStepStatus applies optimistic update immediately', async () => {
      // Pre-populate store with steps
      useOnboardingStore.setState({
        stepsByInstance: {
          'inst-1': [makeStep(1, 'pending'), makeStep(2, 'pending')],
        },
      });

      // Start update (don't await yet)
      const promise = useOnboardingStore
        .getState()
        ._updateStepStatus('inst-1', 1, 'completed');

      // Optimistic update should be applied synchronously
      const state = useOnboardingStore.getState();
      expect(state.stepsByInstance['inst-1'][0].status).toBe('completed');
      expect(state.stepsByInstance['inst-1'][1].status).toBe('pending');

      await promise;
    });

    it('_updateStepStatus rolls back on server error and re-throws', async () => {
      const serverError = new Error('Server error');
      mockUpdateStepStatus.mockRejectedValue(serverError);

      // Pre-populate store with steps
      useOnboardingStore.setState({
        stepsByInstance: {
          'inst-1': [makeStep(1, 'pending'), makeStep(2, 'pending')],
        },
      });

      await expect(
        useOnboardingStore
          .getState()
          ._updateStepStatus('inst-1', 1, 'completed')
      ).rejects.toThrow('Server error');

      // Should have rolled back
      const state = useOnboardingStore.getState();
      expect(state.stepsByInstance['inst-1'][0].status).toBe('pending');
      expect(state.stepsByInstance['inst-1'][1].status).toBe('pending');
    });

    it('resetStoreInternals clears steps ref-counting', () => {
      // Start a steps subscription
      useOnboardingStore.getState()._startStepsSubscription('inst-1');

      expect(mockSubscribeToSteps).toHaveBeenCalledTimes(1);

      // Reset
      resetStoreInternals();

      // Starting again should create a new subscription (not be a no-op)
      useOnboardingStore.getState()._startStepsSubscription('inst-1');
      expect(mockSubscribeToSteps).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // UsersSlice
  // -------------------------------------------------------------------------

  describe('UsersSlice', () => {
    it('initializes with empty users state', () => {
      const state = useOnboardingStore.getState();

      expect(state.users).toEqual([]);
      expect(state.usersLoading).toBe(false);
      expect(state.usersError).toBeNull();
      expect(typeof state._startUsersSubscription).toBe('function');
      expect(typeof state._createUser).toBe('function');
      expect(typeof state._editUser).toBe('function');
      expect(typeof state._removeUser).toBe('function');
      expect(typeof state._fetchUser).toBe('function');
      expect(typeof state._resetUsersError).toBe('function');
    });

    it('_startUsersSubscription calls subscribeToUsers', () => {
      const cleanup = useOnboardingStore.getState()._startUsersSubscription();

      expect(mockSubscribeToUsers).toHaveBeenCalledTimes(1);
      expect(typeof cleanup).toBe('function');

      // Store should be in loading state
      expect(useOnboardingStore.getState().usersLoading).toBe(true);
    });

    it('subscription callback updates users and clears loading', () => {
      // Capture the callback passed to subscribeToUsers
      let capturedCallback: ((users: User[]) => void) | null = null;
      mockSubscribeToUsers.mockImplementation(
        (cb: (users: User[]) => void) => {
          capturedCallback = cb;
          return mockUsersUnsubscribe;
        }
      );

      useOnboardingStore.getState()._startUsersSubscription();

      expect(capturedCallback).not.toBeNull();

      // Simulate subscription firing with data
      const users = [makeUser('u-1', 'Alice'), makeUser('u-2', 'Bob')];
      capturedCallback!(users);

      const state = useOnboardingStore.getState();
      expect(state.users).toEqual(users);
      expect(state.usersLoading).toBe(false);
    });

    it('subscription error sets error string and clears loading', () => {
      const testError = new Error('Users subscription failed');
      mockSubscribeToUsers.mockImplementation(() => {
        throw testError;
      });

      useOnboardingStore.getState()._startUsersSubscription();

      const state = useOnboardingStore.getState();
      expect(state.usersError).toBe('Users subscription failed');
      expect(state.usersLoading).toBe(false);
      expect(state.users).toEqual([]);
    });

    it('second start is no-op (subscribeToUsers called once)', () => {
      const cleanup1 = useOnboardingStore.getState()._startUsersSubscription();
      const cleanup2 = useOnboardingStore.getState()._startUsersSubscription();

      expect(mockSubscribeToUsers).toHaveBeenCalledTimes(1);
      expect(typeof cleanup1).toBe('function');
      expect(typeof cleanup2).toBe('function');
    });

    it('cleanup decrements ref count', () => {
      // Start two consumers
      const cleanup1 = useOnboardingStore.getState()._startUsersSubscription();
      const cleanup2 = useOnboardingStore.getState()._startUsersSubscription();

      // First consumer cleans up
      cleanup1();

      // Unsubscribe should NOT have been called (still 1 consumer)
      expect(mockUsersUnsubscribe).not.toHaveBeenCalled();

      // Clean up second consumer
      cleanup2();

      // NOW unsubscribe should be called (last consumer)
      expect(mockUsersUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('last cleanup unsubscribes and resets state', () => {
      // Capture the callback to populate data
      let capturedCallback: ((users: User[]) => void) | null = null;
      mockSubscribeToUsers.mockImplementation(
        (cb: (users: User[]) => void) => {
          capturedCallback = cb;
          return mockUsersUnsubscribe;
        }
      );

      const cleanup = useOnboardingStore.getState()._startUsersSubscription();

      // Populate data
      capturedCallback!([makeUser('u-1')]);
      expect(useOnboardingStore.getState().users).toHaveLength(1);

      // Clean up last consumer
      cleanup();

      // Unsubscribe should be called
      expect(mockUsersUnsubscribe).toHaveBeenCalledTimes(1);

      // State should be reset
      const state = useOnboardingStore.getState();
      expect(state.users).toEqual([]);
      expect(state.usersLoading).toBe(false);
      expect(state.usersError).toBeNull();
    });

    it('double cleanup is safe (idempotent)', () => {
      const cleanup = useOnboardingStore.getState()._startUsersSubscription();

      cleanup();
      cleanup(); // Should not throw or double-decrement

      // Unsubscribe called exactly once
      expect(mockUsersUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('re-subscribe after full cleanup works', () => {
      // First subscription cycle
      const cleanup1 = useOnboardingStore.getState()._startUsersSubscription();
      cleanup1();

      expect(mockSubscribeToUsers).toHaveBeenCalledTimes(1);
      expect(mockUsersUnsubscribe).toHaveBeenCalledTimes(1);

      // Second subscription cycle
      const cleanup2 = useOnboardingStore.getState()._startUsersSubscription();

      // Should start a new subscription
      expect(mockSubscribeToUsers).toHaveBeenCalledTimes(2);
      expect(useOnboardingStore.getState().usersLoading).toBe(true);

      cleanup2();
      expect(mockUsersUnsubscribe).toHaveBeenCalledTimes(2);
    });

    it('_createUser appends to array and returns user', async () => {
      const newUser = makeUser('u-new', 'New User', 'new@example.com');
      mockCreateUser.mockResolvedValue(newUser);

      // Pre-populate store with one user
      useOnboardingStore.setState({
        users: [makeUser('u-1', 'Existing', 'existing@example.com')],
      });

      const result = await useOnboardingStore
        .getState()
        ._createUser(
          { email: 'new@example.com', name: 'New User', roles: ['employee'] },
          'admin-1'
        );

      expect(result).toEqual(newUser);
      expect(useOnboardingStore.getState().users).toHaveLength(2);
      expect(useOnboardingStore.getState().users[1]).toEqual(newUser);
      expect(mockCreateUser).toHaveBeenCalledWith(
        {
          email: 'new@example.com',
          name: 'New User',
          roles: ['employee'],
          createdBy: 'admin-1',
        },
        'admin-1'
      );
    });

    it('_createUser sets error string on failure', async () => {
      mockCreateUser.mockRejectedValue(new Error('Email already exists'));

      await expect(
        useOnboardingStore
          .getState()
          ._createUser(
            { email: 'dup@example.com', name: 'Dup', roles: ['employee'] },
            'admin-1'
          )
      ).rejects.toThrow('Email already exists');

      expect(useOnboardingStore.getState().usersError).toBe(
        'Email already exists'
      );
    });

    it('_editUser applies optimistic update and rolls back on error', async () => {
      const user1 = makeUser('u-1', 'Alice', 'alice@example.com');
      const user2 = makeUser('u-2', 'Bob', 'bob@example.com');
      useOnboardingStore.setState({ users: [user1, user2] });

      // Server will fail
      mockUpdateUser.mockRejectedValue(new Error('Update failed'));

      const promise = useOnboardingStore
        .getState()
        ._editUser('u-1', { name: 'Alice Updated' });

      // Optimistic update should be applied synchronously
      expect(useOnboardingStore.getState().users[0].name).toBe(
        'Alice Updated'
      );
      // Other user unchanged
      expect(useOnboardingStore.getState().users[1].name).toBe('Bob');

      // Wait for server error and rollback
      await expect(promise).rejects.toThrow('Update failed');

      // Should have rolled back
      expect(useOnboardingStore.getState().users[0].name).toBe('Alice');
      expect(useOnboardingStore.getState().usersError).toBe('Update failed');
    });

    it('_removeUser removes from array after server call', async () => {
      const user1 = makeUser('u-1', 'Alice', 'alice@example.com');
      const user2 = makeUser('u-2', 'Bob', 'bob@example.com');
      useOnboardingStore.setState({ users: [user1, user2] });

      mockDeleteUser.mockResolvedValue(undefined);

      await useOnboardingStore.getState()._removeUser('u-1');

      expect(mockDeleteUser).toHaveBeenCalledWith('u-1');
      const state = useOnboardingStore.getState();
      expect(state.users).toHaveLength(1);
      expect(state.users[0].id).toBe('u-2');
    });

    it('_resetUsersError clears error', () => {
      useOnboardingStore.setState({ usersError: 'Some error' });

      useOnboardingStore.getState()._resetUsersError();

      expect(useOnboardingStore.getState().usersError).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // ActivitiesSlice
  // -------------------------------------------------------------------------

  describe('ActivitiesSlice', () => {
    const makeActivity = (
      id: string,
      action = 'test action'
    ): Activity => ({
      id,
      userInitials: 'TU',
      action,
      timeAgo: '1m ago',
      timestamp: Date.now(),
    });

    it('initializes with empty activities state', () => {
      const state = useOnboardingStore.getState();

      expect(state.activities).toEqual([]);
      expect(state.activitiesLoading).toBe(false);
      expect(state.activitiesError).toBeNull();
      expect(typeof state._startActivitiesSubscription).toBe('function');
    });

    it('_startActivitiesSubscription calls subscribeToActivities', () => {
      const cleanup = useOnboardingStore
        .getState()
        ._startActivitiesSubscription();

      expect(mockSubscribeToActivities).toHaveBeenCalledTimes(1);
      expect(typeof cleanup).toBe('function');

      // Store should be in loading state
      expect(useOnboardingStore.getState().activitiesLoading).toBe(true);
    });

    it('subscription callback updates activities and clears loading', () => {
      // Capture the callback passed to subscribeToActivities
      let capturedCallback: ((activities: Activity[]) => void) | null = null;
      mockSubscribeToActivities.mockImplementation(
        (cb: (activities: Activity[]) => void) => {
          capturedCallback = cb;
          return mockActivitiesUnsubscribe;
        }
      );

      useOnboardingStore.getState()._startActivitiesSubscription();

      expect(capturedCallback).not.toBeNull();

      // Simulate subscription firing with data
      const activities = [makeActivity('a-1'), makeActivity('a-2')];
      capturedCallback!(activities);

      const state = useOnboardingStore.getState();
      expect(state.activities).toEqual(activities);
      expect(state.activitiesLoading).toBe(false);
    });

    it('subscription error sets error and clears loading', () => {
      const testError = new Error('Activities subscription failed');
      mockSubscribeToActivities.mockImplementation(() => {
        throw testError;
      });

      useOnboardingStore.getState()._startActivitiesSubscription();

      const state = useOnboardingStore.getState();
      expect(state.activitiesError).toEqual(testError);
      expect(state.activitiesLoading).toBe(false);
      expect(state.activities).toEqual([]);
    });

    it('second start is no-op (subscribeToActivities called once)', () => {
      const cleanup1 = useOnboardingStore
        .getState()
        ._startActivitiesSubscription();
      const cleanup2 = useOnboardingStore
        .getState()
        ._startActivitiesSubscription();

      expect(mockSubscribeToActivities).toHaveBeenCalledTimes(1);
      expect(typeof cleanup1).toBe('function');
      expect(typeof cleanup2).toBe('function');
    });

    it('last cleanup unsubscribes and resets state', () => {
      // Capture the callback to populate data
      let capturedCallback: ((activities: Activity[]) => void) | null = null;
      mockSubscribeToActivities.mockImplementation(
        (cb: (activities: Activity[]) => void) => {
          capturedCallback = cb;
          return mockActivitiesUnsubscribe;
        }
      );

      const cleanup = useOnboardingStore
        .getState()
        ._startActivitiesSubscription();

      // Populate data
      capturedCallback!([makeActivity('a-1')]);
      expect(useOnboardingStore.getState().activities).toHaveLength(1);

      // Clean up last consumer
      cleanup();

      // Unsubscribe should be called
      expect(mockActivitiesUnsubscribe).toHaveBeenCalledTimes(1);

      // State should be reset
      const state = useOnboardingStore.getState();
      expect(state.activities).toEqual([]);
      expect(state.activitiesLoading).toBe(false);
      expect(state.activitiesError).toBeNull();
    });

    it('double cleanup is safe (idempotent)', () => {
      const cleanup = useOnboardingStore
        .getState()
        ._startActivitiesSubscription();

      cleanup();
      cleanup(); // Should not throw or double-decrement

      // Unsubscribe called exactly once
      expect(mockActivitiesUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // SuggestionsSlice
  // -------------------------------------------------------------------------

  describe('SuggestionsSlice', () => {
    const makeSuggestion = (
      id: number,
      status: 'pending' | 'reviewed' | 'implemented' = 'pending'
    ): Suggestion => ({
      id,
      stepId: 1,
      user: 'Test User',
      text: `Suggestion ${id}`,
      status,
    });

    it('initializes with empty suggestions state', () => {
      const state = useOnboardingStore.getState();

      expect(state.suggestions).toEqual([]);
      expect(state.suggestionsLoading).toBe(false);
      expect(state.suggestionsError).toBeNull();
      expect(typeof state._startSuggestionsSubscription).toBe('function');
      expect(typeof state._optimisticUpdateSuggestionStatus).toBe('function');
      expect(typeof state._optimisticRemoveSuggestion).toBe('function');
      expect(typeof state._rollbackSuggestions).toBe('function');
    });

    it('_startSuggestionsSubscription calls subscribeToSuggestions', () => {
      const cleanup = useOnboardingStore
        .getState()
        ._startSuggestionsSubscription();

      expect(mockSubscribeToSuggestions).toHaveBeenCalledTimes(1);
      expect(typeof cleanup).toBe('function');

      // Store should be in loading state
      expect(useOnboardingStore.getState().suggestionsLoading).toBe(true);
    });

    it('subscription callback updates suggestions and clears loading', () => {
      // Capture the callback passed to subscribeToSuggestions
      let capturedCallback: ((suggestions: Suggestion[]) => void) | null =
        null;
      mockSubscribeToSuggestions.mockImplementation(
        (cb: (suggestions: Suggestion[]) => void) => {
          capturedCallback = cb;
          return mockSuggestionsUnsubscribe;
        }
      );

      useOnboardingStore.getState()._startSuggestionsSubscription();

      expect(capturedCallback).not.toBeNull();

      // Simulate subscription firing with data
      const suggestions = [makeSuggestion(1), makeSuggestion(2)];
      capturedCallback!(suggestions);

      const state = useOnboardingStore.getState();
      expect(state.suggestions).toEqual(suggestions);
      expect(state.suggestionsLoading).toBe(false);
    });

    it('_optimisticUpdateSuggestionStatus changes status and returns snapshot', () => {
      const original = [
        makeSuggestion(1, 'pending'),
        makeSuggestion(2, 'pending'),
      ];
      useOnboardingStore.setState({ suggestions: original });

      const snapshot = useOnboardingStore
        .getState()
        ._optimisticUpdateSuggestionStatus(1, 'reviewed');

      // Snapshot should be the pre-mutation state
      expect(snapshot).toEqual(original);
      expect(snapshot[0].status).toBe('pending');

      // Store should have updated state
      const state = useOnboardingStore.getState();
      expect(state.suggestions[0].status).toBe('reviewed');
      expect(state.suggestions[1].status).toBe('pending');
    });

    it('_optimisticRemoveSuggestion removes suggestion and returns snapshot', () => {
      const original = [
        makeSuggestion(1),
        makeSuggestion(2),
        makeSuggestion(3),
      ];
      useOnboardingStore.setState({ suggestions: original });

      const snapshot = useOnboardingStore
        .getState()
        ._optimisticRemoveSuggestion(2);

      // Snapshot should be the pre-mutation state
      expect(snapshot).toEqual(original);
      expect(snapshot).toHaveLength(3);

      // Store should have removed the suggestion
      const state = useOnboardingStore.getState();
      expect(state.suggestions).toHaveLength(2);
      expect(state.suggestions.find((s) => s.id === 2)).toBeUndefined();
    });

    it('_rollbackSuggestions restores previous state', () => {
      const original = [
        makeSuggestion(1, 'pending'),
        makeSuggestion(2, 'pending'),
      ];
      useOnboardingStore.setState({ suggestions: original });

      // Perform an optimistic update
      const snapshot = useOnboardingStore
        .getState()
        ._optimisticUpdateSuggestionStatus(1, 'reviewed');

      // Verify state changed
      expect(useOnboardingStore.getState().suggestions[0].status).toBe(
        'reviewed'
      );

      // Rollback
      useOnboardingStore.getState()._rollbackSuggestions(snapshot);

      // Verify state restored
      const state = useOnboardingStore.getState();
      expect(state.suggestions[0].status).toBe('pending');
      expect(state.suggestions).toEqual(original);
    });

    it('last cleanup unsubscribes and resets state', () => {
      // Capture the callback to populate data
      let capturedCallback: ((suggestions: Suggestion[]) => void) | null =
        null;
      mockSubscribeToSuggestions.mockImplementation(
        (cb: (suggestions: Suggestion[]) => void) => {
          capturedCallback = cb;
          return mockSuggestionsUnsubscribe;
        }
      );

      const cleanup = useOnboardingStore
        .getState()
        ._startSuggestionsSubscription();

      // Populate data
      capturedCallback!([makeSuggestion(1)]);
      expect(useOnboardingStore.getState().suggestions).toHaveLength(1);

      // Clean up last consumer
      cleanup();

      // Unsubscribe should be called
      expect(mockSuggestionsUnsubscribe).toHaveBeenCalledTimes(1);

      // State should be reset
      const state = useOnboardingStore.getState();
      expect(state.suggestions).toEqual([]);
      expect(state.suggestionsLoading).toBe(false);
      expect(state.suggestionsError).toBeNull();
    });
  });
});
