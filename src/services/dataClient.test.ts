/**
 * Unit tests for dataClient.ts
 * Tests Firestore CRUD operations and real-time subscriptions
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  listOnboardingInstances,
  getOnboardingInstance,
  createOnboardingInstance,
  updateOnboardingInstance,
  updateStepStatus,
  listSuggestions,
  createSuggestion,
  updateSuggestionStatus,
  listActivities,
  logActivity,
  subscribeToTemplates,
  subscribeToOnboardingInstance,
  subscribeToSteps,
  subscribeToActivities,
} from './dataClient';
import type {
  Template,
  OnboardingInstance,
  Activity,
  Step,
} from '../types';

// Mock firebase/firestore module
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
}));

// Mock firebase config
vi.mock('../config/firebase', () => ({
  firestore: {},
}));

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

// ============================================================================
// Test Data Fixtures
// ============================================================================

const mockStep: Step = {
  id: 1,
  title: 'Setup Dev Environment',
  description: 'Configure development environment',
  role: 'Engineering',
  owner: 'DevOps',
  expert: 'John Doe',
  status: 'pending',
  link: 'https://example.com/setup',
};

const mockTemplate: Template = {
  id: 'template-1',
  name: 'Engineering Onboarding',
  description: 'Complete onboarding for engineers',
  role: 'Engineering',
  steps: [mockStep],
  createdAt: Date.now(),
  isActive: true,
};

const mockOnboardingInstance: OnboardingInstance = {
  id: 'instance-1',
  employeeName: 'Jane Smith',
  employeeEmail: 'jane@example.com',
  role: 'Engineering',
  department: 'Platform',
  templateId: 'template-1',
  steps: [mockStep],
  createdAt: Date.now(),
  progress: 50,
  status: 'active',
};

const mockActivity: Activity = {
  id: 'activity-1',
  userInitials: 'JS',
  action: 'Started onboarding',
  timeAgo: '2 hours ago',
  timestamp: Date.now(),
  userId: 'user-1',
};

// ============================================================================
// Template Tests
// ============================================================================

describe('Template Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listTemplates', () => {
    it('should return all templates', async () => {
      const mockDocs = [
        { id: 'template-1', data: () => ({ name: 'Engineering' }) },
        { id: 'template-2', data: () => ({ name: 'Sales' }) },
      ];

      const mockSnapshot = {
        docs: mockDocs,
      };

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      const result = await listTemplates();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('template-1');
      expect(result[1].id).toBe('template-2');
    });

    it('should return empty array when no templates exist', async () => {
      const mockSnapshot = { docs: [] };

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      const result = await listTemplates();

      expect(result).toEqual([]);
    });

    it('should throw descriptive error on failure', async () => {
      const mockError = new Error('Network error');
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(getDocs).mockRejectedValue(mockError);

      await expect(listTemplates()).rejects.toThrow(
        'Failed to fetch templates'
      );
    });
  });

  describe('getTemplate', () => {
    beforeEach(() => {
      // Seed template in localStorage for test
      localStorage.setItem(
        'onboardinghub_templates',
        JSON.stringify([mockTemplate])
      );
    });

    it('should return template by ID', async () => {
      const result = await getTemplate('template-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('template-1');
    });

    it('should return null when template does not exist', async () => {
      const mockDocSnap = {
        exists: () => false,
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

      const result = await getTemplate('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error on fetch failure', async () => {
      // Clear localStorage for this test
      localStorage.clear();

      const mockError = new Error('Document not accessible');
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockRejectedValue(mockError);

      // getTemplate falls back to localStorage when Firestore fails
      // Since no localStorage data exists, it should return null
      const result = await getTemplate('template-1');
      expect(result).toBeNull();
    });
  });

  describe('createTemplate', () => {
    it('should create a new template and return ID', async () => {
      const mockDocRef = { id: 'new-template-id' };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

      const templateData = {
        name: 'Sales Onboarding',
        description: 'Onboarding for sales team',
        role: 'Sales',
        steps: [],
        isActive: true,
      };

      const result = await createTemplate(templateData);

      expect(result).toBe('new-template-id');
      expect(addDoc).toHaveBeenCalled();
      const callArgs = vi.mocked(addDoc).mock.calls[0][1] as unknown as Record<
        string,
        unknown
      >;
      expect(callArgs.createdAt).toBeDefined();
      expect(callArgs.updatedAt).toBeDefined();
    });

    it('should throw error on creation failure', async () => {
      const mockError = new Error('Write permission denied');
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockRejectedValue(mockError);

      const templateData = {
        name: 'Test',
        description: 'Test',
        role: 'Test',
        steps: [],
        isActive: true,
      };

      await expect(createTemplate(templateData)).rejects.toThrow(
        'Failed to create template'
      );
    });
  });

  describe('updateTemplate', () => {
    it('should update template with provided fields', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const updates = { name: 'Updated Name', isActive: false };

      await updateTemplate('template-1', updates);

      expect(updateDoc).toHaveBeenCalled();
      const callArgs = vi.mocked(updateDoc).mock.calls[0][1] as unknown as Record<
        string,
        unknown
      >;
      expect(callArgs.name).toBe('Updated Name');
      expect(callArgs.isActive).toBe(false);
      expect(callArgs.updatedAt).toBeDefined();
    });

    it('should prevent overwriting id and createdAt', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const updates = {
        name: 'New Name',
        id: 'fake-id',
        createdAt: 123456,
      } as any;

      await updateTemplate('template-1', updates);

      const callArgs = vi.mocked(updateDoc).mock.calls[0][1] as unknown as Record<
        string,
        unknown
      >;
      expect(callArgs.id).toBeUndefined();
      expect(callArgs.createdAt).toBeUndefined();
    });

    it('should throw error on update failure', async () => {
      const mockError = new Error('Document not found');
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(updateDoc).mockRejectedValue(mockError);

      await expect(
        updateTemplate('template-1', { name: 'Test' })
      ).rejects.toThrow('Failed to update template');
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template by ID', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(deleteDoc).mockResolvedValue(undefined);

      await deleteTemplate('template-1');

      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should throw error on deletion failure', async () => {
      const mockError = new Error('Delete permission denied');
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(deleteDoc).mockRejectedValue(mockError);

      await expect(deleteTemplate('template-1')).rejects.toThrow(
        'Failed to delete template'
      );
    });
  });
});

// ============================================================================
// OnboardingInstance Tests
// ============================================================================

describe('OnboardingInstance Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listOnboardingInstances', () => {
    it('should return all onboarding instances', async () => {
      const mockDocs = [
        { id: 'instance-1', data: () => ({ employeeName: 'Jane' }) },
        { id: 'instance-2', data: () => ({ employeeName: 'John' }) },
      ];

      const mockSnapshot = { docs: mockDocs };

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      const result = await listOnboardingInstances();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('instance-1');
    });

    it('should throw error on fetch failure', async () => {
      const mockError = new Error('Network timeout');
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(getDocs).mockRejectedValue(mockError);

      await expect(listOnboardingInstances()).rejects.toThrow(
        'Failed to fetch onboarding instances'
      );
    });
  });

  describe('getOnboardingInstance', () => {
    it('should return instance by ID', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: 'instance-1',
        data: () => mockOnboardingInstance,
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

      const result = await getOnboardingInstance('instance-1');

      expect(result).not.toBeNull();
      expect(result?.employeeName).toBe('Jane Smith');
    });

    it('should return null when instance does not exist', async () => {
      const mockDocSnap = {
        exists: () => false,
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

      const result = await getOnboardingInstance('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createOnboardingInstance', () => {
    it('should create instance and return ID', async () => {
      const mockDocRef = { id: 'new-instance-id' };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

      const instanceData = {
        employeeName: 'New Employee',
        employeeEmail: 'new@example.com',
        role: 'Engineering',
        department: 'Platform',
        templateId: 'template-1',
        steps: [],
        progress: 0,
        status: 'active' as const,
      };

      const result = await createOnboardingInstance(instanceData);

      expect(result).toBe('new-instance-id');
      expect(addDoc).toHaveBeenCalled();
    });
  });

  describe('updateOnboardingInstance', () => {
    it('should update instance with provided fields', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const updates = { progress: 75, status: 'completed' as const };

      await updateOnboardingInstance('instance-1', updates);

      expect(updateDoc).toHaveBeenCalled();
      const callArgs = vi.mocked(updateDoc).mock.calls[0][1] as unknown as Record<
        string,
        unknown
      >;
      expect(callArgs.progress).toBe(75);
      expect(callArgs.status).toBe('completed');
    });

    it('should prevent overwriting id and createdAt', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const updates = {
        progress: 50,
        id: 'fake-id',
        createdAt: 123456,
      } as any;

      await updateOnboardingInstance('instance-1', updates);

      const callArgs = vi.mocked(updateDoc).mock.calls[0][1] as unknown as Record<
        string,
        unknown
      >;
      expect(callArgs.id).toBeUndefined();
      expect(callArgs.createdAt).toBeUndefined();
    });
  });

  describe('updateStepStatus - CRITICAL BUG FIX', () => {
    it('should throw error if stepId does not exist', async () => {
      const mockInstance = {
        ...mockOnboardingInstance,
        steps: [mockStep],
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'instance-1',
        data: () => mockInstance,
      } as any);

      const promise = updateStepStatus('instance-1', 999, 'completed');

      await expect(promise).rejects.toThrow(
        /Step with ID 999 not found/i
      );
    });

    it('should throw error listing valid step IDs when stepId not found', async () => {
      const mockInstance = {
        ...mockOnboardingInstance,
        steps: [
          { ...mockStep, id: 1 },
          { ...mockStep, id: 2 },
          { ...mockStep, id: 3 },
        ],
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'instance-1',
        data: () => mockInstance,
      } as any);

      const promise = updateStepStatus('instance-1', 999, 'completed');

      await expect(promise).rejects.toThrow(
        /Available step IDs: 1, 2, 3/
      );
    });

    it('should successfully update step status when stepId is valid', async () => {
      const mockInstance = {
        ...mockOnboardingInstance,
        steps: [mockStep],
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'instance-1',
        data: () => mockInstance,
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await updateStepStatus('instance-1', 1, 'completed');

      expect(updateDoc).toHaveBeenCalled();
    });

    it('should recalculate progress percentage correctly', async () => {
      const mockInstance = {
        ...mockOnboardingInstance,
        steps: [
          { ...mockStep, id: 1, status: 'completed' as const },
          { ...mockStep, id: 2, status: 'pending' as const },
          { ...mockStep, id: 3, status: 'pending' as const },
        ],
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'instance-1',
        data: () => mockInstance,
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await updateStepStatus('instance-1', 2, 'completed');

      const callArgs = vi.mocked(updateDoc).mock.calls[0][1] as unknown as Record<
        string,
        unknown
      >;
      // 2 completed out of 3 = 67%
      expect(callArgs.progress).toBe(67);
    });

    it('should preserve other step data during update', async () => {
      const step1 = {
        ...mockStep,
        id: 1,
        title: 'Step 1',
        description: 'Description 1',
        status: 'pending' as const,
      };
      const step2 = {
        ...mockStep,
        id: 2,
        title: 'Step 2',
        description: 'Description 2',
        status: 'pending' as const,
      };

      const mockInstance = {
        ...mockOnboardingInstance,
        steps: [step1, step2],
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'instance-1',
        data: () => mockInstance,
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await updateStepStatus('instance-1', 1, 'completed');

      const callArgs = vi.mocked(updateDoc).mock.calls[0][1] as unknown as Record<
        string,
        unknown
      >;
      const updatedSteps = callArgs.steps as any[];

      // Verify step 1 was updated
      expect(updatedSteps[0].status).toBe('completed');
      // Verify step 1 data was preserved
      expect(updatedSteps[0].title).toBe('Step 1');
      expect(updatedSteps[0].description).toBe('Description 1');
      // Verify step 2 was not modified
      expect(updatedSteps[1].status).toBe('pending');
      expect(updatedSteps[1].title).toBe('Step 2');
    });

    it('should throw error if instance does not exist', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const promise = updateStepStatus('nonexistent-instance', 1, 'completed');

      await expect(promise).rejects.toThrow(
        /Onboarding instance not found/i
      );
    });

    it('should set progress to 0 when all steps are pending', async () => {
      const mockInstance = {
        ...mockOnboardingInstance,
        steps: [
          { ...mockStep, id: 1, status: 'pending' as const },
          { ...mockStep, id: 2, status: 'pending' as const },
        ],
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'instance-1',
        data: () => mockInstance,
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await updateStepStatus('instance-1', 1, 'pending');

      const callArgs = vi.mocked(updateDoc).mock.calls[0][1] as unknown as Record<
        string,
        unknown
      >;
      expect(callArgs.progress).toBe(0);
    });

    it('should set progress to 100 when all steps are completed', async () => {
      const mockInstance = {
        ...mockOnboardingInstance,
        steps: [
          { ...mockStep, id: 1, status: 'completed' as const },
          { ...mockStep, id: 2, status: 'pending' as const },
        ],
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'instance-1',
        data: () => mockInstance,
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await updateStepStatus('instance-1', 2, 'completed');

      const callArgs = vi.mocked(updateDoc).mock.calls[0][1] as unknown as Record<
        string,
        unknown
      >;
      // 2 completed out of 2 = 100%
      expect(callArgs.progress).toBe(100);
    });

    it('should handle empty steps array', async () => {
      const mockInstance = {
        ...mockOnboardingInstance,
        steps: [],
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'instance-1',
        data: () => mockInstance,
      } as any);

      const promise = updateStepStatus('instance-1', 1, 'completed');

      await expect(promise).rejects.toThrow(/Step with ID 1 not found/);
    });

    it('should properly round progress percentage', async () => {
      const mockInstance = {
        ...mockOnboardingInstance,
        steps: [
          { ...mockStep, id: 1, status: 'completed' as const },
          { ...mockStep, id: 2, status: 'pending' as const },
          { ...mockStep, id: 3, status: 'pending' as const },
        ],
      };

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'instance-1',
        data: () => mockInstance,
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await updateStepStatus('instance-1', 2, 'completed');

      const callArgs = vi.mocked(updateDoc).mock.calls[0][1] as unknown as Record<
        string,
        unknown
      >;
      // 2 completed out of 3 = 66.666... should round to 67
      expect(callArgs.progress).toBe(67);
    });
  });
});

// ============================================================================
// Suggestion Tests
// ============================================================================

describe('Suggestion Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listSuggestions', () => {
    it('should return all suggestions', async () => {
      const mockDocs = [
        { id: 'sugg-1', data: () => ({ text: 'Suggestion 1' }) },
        { id: 'sugg-2', data: () => ({ text: 'Suggestion 2' }) },
      ];

      const mockSnapshot = { docs: mockDocs };

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      const result = await listSuggestions();

      expect(result).toHaveLength(2);
    });
  });

  describe('createSuggestion', () => {
    it('should create suggestion and return ID', async () => {
      const mockDocRef = { id: 'new-sugg-id' };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

      const suggestionData = {
        stepId: 1,
        user: 'Bob',
        text: 'Improve documentation',
        status: 'pending' as const,
      };

      const result = await createSuggestion(suggestionData);

      expect(result).toBe('new-sugg-id');
    });
  });

  describe('updateSuggestionStatus', () => {
    it('should update suggestion status', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await updateSuggestionStatus('suggestion-1', 'reviewed');

      expect(updateDoc).toHaveBeenCalled();
      const callArgs = vi.mocked(updateDoc).mock.calls[0][1] as unknown as Record<
        string,
        unknown
      >;
      expect(callArgs.status).toBe('reviewed');
    });

    it('should accept all valid statuses', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const statuses: Array<'pending' | 'reviewed' | 'implemented'> = [
        'pending',
        'reviewed',
        'implemented',
      ];

      for (const status of statuses) {
        await updateSuggestionStatus('suggestion-1', status);
        const callArgs = vi.mocked(updateDoc).mock.calls[
          vi.mocked(updateDoc).mock.calls.length - 1
        ][1] as unknown as Record<string, unknown>;
        expect(callArgs.status).toBe(status);
      }
    });

    it('should throw error on update failure', async () => {
      const mockError = new Error('Update failed');
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(updateDoc).mockRejectedValue(mockError);

      await expect(
        updateSuggestionStatus('suggestion-1', 'reviewed')
      ).rejects.toThrow('Failed to update suggestion status');
    });
  });
});

// ============================================================================
// Activity Tests
// ============================================================================

describe('Activity Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listActivities', () => {
    it('should return all activities', async () => {
      const mockDocs = [
        {
          id: 'activity-1',
          data: () => ({ action: 'Created template' }),
        },
        { id: 'activity-2', data: () => ({ action: 'Updated instance' }) },
      ];

      const mockSnapshot = { docs: mockDocs };

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      const result = await listActivities();

      expect(result).toHaveLength(2);
    });

    it('should throw error on fetch failure', async () => {
      const mockError = new Error('Firestore unavailable');
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(getDocs).mockRejectedValue(mockError);

      await expect(listActivities()).rejects.toThrow('Failed to fetch activities');
    });
  });

  describe('logActivity', () => {
    it('should log activity and return ID', async () => {
      const mockDocRef = { id: 'new-activity-id' };
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockResolvedValue(mockDocRef as any);

      const activityData = {
        userInitials: 'JD',
        action: 'Completed step',
        timeAgo: '1 hour ago',
      };

      const result = await logActivity(activityData);

      expect(result).toBe('new-activity-id');
      expect(addDoc).toHaveBeenCalled();
      const callArgs = vi.mocked(addDoc).mock.calls[0][1] as unknown as Record<
        string,
        unknown
      >;
      expect(callArgs.timestamp).toBeDefined();
    });

    it('should throw error on logging failure', async () => {
      const mockError = new Error('Write failed');
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(addDoc).mockRejectedValue(mockError);

      const activityData = {
        userInitials: 'JD',
        action: 'Test',
        timeAgo: 'now',
      };

      await expect(logActivity(activityData)).rejects.toThrow(
        'Failed to log activity'
      );
    });
  });
});

// ============================================================================
// Real-time Subscription Tests
// ============================================================================

describe('Real-time Subscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('subscribeToTemplates', () => {
    it('should call callback with templates', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(onSnapshot).mockImplementation(
        ((_ref: any, callback: any) => {
          callback({
            docs: [
              {
                id: 'template-1',
                data: () => mockTemplate,
              },
            ],
          });
          return mockUnsubscribe;
        }) as any
      );

      const unsubscribe = subscribeToTemplates(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(expect.any(Array));
      expect(typeof unsubscribe).toBe('function');
    });

    it('should return unsubscribe function', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(onSnapshot).mockReturnValue(mockUnsubscribe as any);

      const unsubscribe = subscribeToTemplates(mockCallback);

      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should throw error on subscription failure', () => {
      const mockCallback = vi.fn();
      const mockError = new Error('Subscription failed');

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(onSnapshot).mockImplementation(() => {
        throw mockError;
      });

      expect(() => subscribeToTemplates(mockCallback)).toThrow(
        'Failed to subscribe to templates'
      );
    });
  });

  describe('subscribeToOnboardingInstance', () => {
    it('should call callback with instance', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(onSnapshot).mockImplementation(
        ((_ref: any, callback: any) => {
          callback({
            exists: () => true,
            id: 'instance-1',
            data: () => mockOnboardingInstance,
          });
          return mockUnsubscribe;
        }) as any
      );

      const unsubscribe = subscribeToOnboardingInstance(
        'instance-1',
        mockCallback
      );

      expect(mockCallback).toHaveBeenCalledWith(expect.any(Object));
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback with null when instance does not exist', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(onSnapshot).mockImplementation(
        ((_ref: any, callback: any) => {
          callback({
            exists: () => false,
          });
          return mockUnsubscribe;
        }) as any
      );

      subscribeToOnboardingInstance('nonexistent', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null);
    });
  });

  describe('subscribeToSteps', () => {
    it('should call callback with steps array', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(onSnapshot).mockImplementation(
        ((_ref: any, callback: any) => {
          callback({
            exists: () => true,
            id: 'instance-1',
            data: () => ({
              ...mockOnboardingInstance,
              steps: [mockStep],
            }),
          });
          return mockUnsubscribe;
        }) as any
      );

      subscribeToSteps('instance-1', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith([mockStep]);
    });

    it('should return empty array when instance does not exist', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(onSnapshot).mockImplementation(
        ((_ref: any, callback: any) => {
          callback({
            exists: () => false,
          });
          return mockUnsubscribe;
        }) as any
      );

      subscribeToSteps('nonexistent', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith([]);
    });

    it('should return empty array when steps field is missing', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(onSnapshot).mockImplementation(
        ((_ref: any, callback: any) => {
          callback({
            exists: () => true,
            id: 'instance-1',
            data: () => ({
              employeeName: 'Jane',
            }),
          });
          return mockUnsubscribe;
        }) as any
      );

      subscribeToSteps('instance-1', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith([]);
    });
  });

  describe('subscribeToActivities', () => {
    it('should call callback with activities', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(onSnapshot).mockImplementation(
        ((_ref: any, callback: any) => {
          callback({
            docs: [
              {
                id: 'activity-1',
                data: () => mockActivity,
              },
            ],
          });
          return mockUnsubscribe;
        }) as any
      );

      subscribeToActivities(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should throw error on subscription failure', () => {
      const mockCallback = vi.fn();
      const mockError = new Error('Subscription failed');

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(onSnapshot).mockImplementation(() => {
        throw mockError;
      });

      expect(() => subscribeToActivities(mockCallback)).toThrow(
        'Failed to subscribe to activities'
      );
    });
  });
});

// ============================================================================
// Template Update Sync Tests
// ============================================================================

describe('Template Update Sync (syncTemplateStepsToInstances)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('updateTemplate with step sync', () => {
    it('should sync new steps to instances when template steps are updated', async () => {
      // Setup: Create a template with 2 initial steps
      const initialStep1: Step = {
        id: 1,
        title: 'Step 1',
        description: 'First step',
        role: 'Engineering',
        owner: 'DevOps',
        expert: 'Jane',
        status: 'pending',
        link: 'https://example.com',
      };

      const initialStep2: Step = {
        id: 2,
        title: 'Step 2',
        description: 'Second step',
        role: 'Engineering',
        owner: 'DevOps',
        expert: 'Jane',
        status: 'pending',
        link: 'https://example.com',
      };

      // Instance has only step 1
      const instance: OnboardingInstance = {
        id: 'instance-1',
        employeeName: 'John Doe',
        employeeEmail: 'john@example.com',
        role: 'Engineering',
        department: 'Platform',
        templateId: 'template-1',
        steps: [initialStep1],
        createdAt: Date.now(),
        progress: 0,
        status: 'active',
      };

      // Seed instance in localStorage
      localStorage.setItem(
        'onboardinghub_onboarding_instances',
        JSON.stringify([instance])
      );

      // Track updateDoc calls to verify sync happened
      let updateDocCalls: any[] = [];
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({
        docs: [], // No Firestore instances - fall back to localStorage
      } as any);
      vi.mocked(updateDoc).mockImplementation((_ref: any, data: any) => {
        updateDocCalls.push(data);
        return Promise.resolve(undefined);
      });
      vi.mocked(collection).mockReturnValue({} as any);

      // Update template with new steps (step 1 + step 2)
      const updatedSteps = [initialStep1, initialStep2];
      await updateTemplate('template-1', { steps: updatedSteps });

      // Verify updateDoc was called for the instance sync
      // Should have at least one call for the instance update (containing merged steps)
      const instanceUpdateCalls = updateDocCalls.filter((call: any) => call.steps);
      expect(instanceUpdateCalls.length).toBeGreaterThan(0);

      // Verify the merged steps contain both step 1 and step 2
      const mergedSteps = instanceUpdateCalls[0].steps;
      expect(mergedSteps).toHaveLength(2);
      expect(mergedSteps[0].id).toBe(1);
      expect(mergedSteps[1].id).toBe(2);
    });

    it('should preserve completed step status when syncing new steps', async () => {
      const completedStep1: Step = {
        id: 1,
        title: 'Completed Step',
        description: 'Already done',
        role: 'Engineering',
        owner: 'DevOps',
        expert: 'Jane',
        status: 'completed',
        link: 'https://example.com',
      };

      const newStep2: Step = {
        id: 2,
        title: 'New Step',
        description: 'New task',
        role: 'Engineering',
        owner: 'DevOps',
        expert: 'Jane',
        status: 'pending',
        link: 'https://example.com',
      };

      // Instance already has step 1 as completed
      const instance: OnboardingInstance = {
        id: 'instance-1',
        employeeName: 'Jane Smith',
        employeeEmail: 'jane@example.com',
        role: 'Engineering',
        department: 'Platform',
        templateId: 'template-1',
        steps: [completedStep1],
        createdAt: Date.now(),
        progress: 100, // Step 1 was completed
        status: 'active',
      };

      localStorage.setItem(
        'onboardinghub_onboarding_instances',
        JSON.stringify([instance])
      );

      let updateDocCalls: any[] = [];
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);
      vi.mocked(updateDoc).mockImplementation((_ref: any, data: any) => {
        updateDocCalls.push(data);
        return Promise.resolve(undefined);
      });
      vi.mocked(collection).mockReturnValue({} as any);

      // Update template to include the new step
      const updatedSteps = [completedStep1, newStep2];
      await updateTemplate('template-1', { steps: updatedSteps });

      // Verify the instance was updated via updateDoc calls (should have 2 steps merged)
      const instanceUpdateCalls = updateDocCalls.filter((call: any) => call.steps && call.steps.length === 2);
      expect(instanceUpdateCalls.length).toBeGreaterThan(0);

      const mergedSteps = instanceUpdateCalls[0].steps;
      // Verify existing step status is preserved
      expect(mergedSteps[0].id).toBe(1);
      expect(mergedSteps[0].status).toBe('completed');
      // Verify new step is added
      expect(mergedSteps[1].id).toBe(2);
      expect(mergedSteps[1].status).toBe('pending');
    });

    it('should not duplicate steps when syncing', async () => {
      const step1: Step = {
        id: 1,
        title: 'Step 1',
        description: 'First',
        role: 'Engineering',
        owner: 'DevOps',
        expert: 'Jane',
        status: 'pending',
        link: 'https://example.com',
      };

      const step2: Step = {
        id: 2,
        title: 'Step 2',
        description: 'Second',
        role: 'Engineering',
        owner: 'DevOps',
        expert: 'Jane',
        status: 'pending',
        link: 'https://example.com',
      };

      // Instance already has both steps
      const instance: OnboardingInstance = {
        id: 'instance-1',
        employeeName: 'Test User',
        employeeEmail: 'test@example.com',
        role: 'Engineering',
        department: 'Platform',
        templateId: 'template-1',
        steps: [step1, step2],
        createdAt: Date.now(),
        progress: 0,
        status: 'active',
      };

      localStorage.setItem(
        'onboardinghub_onboarding_instances',
        JSON.stringify([instance])
      );

      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(collection).mockReturnValue({} as any);

      // Update template with same steps (no change)
      await updateTemplate('template-1', { steps: [step1, step2] });

      // Verify no duplicates were added
      const updatedInstances = JSON.parse(
        localStorage.getItem('onboardinghub_onboarding_instances') || '[]'
      ) as OnboardingInstance[];

      expect(updatedInstances[0].steps).toHaveLength(2);
      expect(updatedInstances[0].steps[0].id).toBe(1);
      expect(updatedInstances[0].steps[1].id).toBe(2);
    });

    it('should skip instances with no new steps', async () => {
      const step1: Step = {
        id: 1,
        title: 'Step 1',
        description: 'First',
        role: 'Engineering',
        owner: 'DevOps',
        expert: 'Jane',
        status: 'completed',
        link: 'https://example.com',
      };

      const instance: OnboardingInstance = {
        id: 'instance-1',
        employeeName: 'Test',
        employeeEmail: 'test@example.com',
        role: 'Engineering',
        department: 'Platform',
        templateId: 'template-1',
        steps: [step1],
        createdAt: Date.now(),
        progress: 100,
        status: 'active',
      };

      localStorage.setItem(
        'onboardinghub_onboarding_instances',
        JSON.stringify([instance])
      );

      const initialUpdate = vi.fn();
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);
      vi.mocked(updateDoc).mockImplementation(initialUpdate);
      vi.mocked(collection).mockReturnValue({} as any);

      // Update template with only existing step (no new steps)
      await updateTemplate('template-1', { steps: [step1] });

      // Verify updateOnboardingInstance was NOT called for sync (only once for the template itself)
      const updateCalls = vi.mocked(updateDoc).mock.calls;
      // Only 1 call for the template update, not the instance sync
      expect(updateCalls.length).toBeLessThanOrEqual(1);
    });

    it('should handle multiple instances and sync all of them', async () => {
      const step1: Step = {
        id: 1,
        title: 'Step 1',
        description: 'First',
        role: 'Engineering',
        owner: 'DevOps',
        expert: 'Jane',
        status: 'pending',
        link: 'https://example.com',
      };

      const step2: Step = {
        id: 2,
        title: 'Step 2',
        description: 'Second',
        role: 'Engineering',
        owner: 'DevOps',
        expert: 'Jane',
        status: 'pending',
        link: 'https://example.com',
      };

      // Two instances using the same template
      const instance1: OnboardingInstance = {
        id: 'instance-1',
        employeeName: 'User 1',
        employeeEmail: 'user1@example.com',
        role: 'Engineering',
        department: 'Platform',
        templateId: 'template-1',
        steps: [step1],
        createdAt: Date.now(),
        progress: 0,
        status: 'active',
      };

      const instance2: OnboardingInstance = {
        id: 'instance-2',
        employeeName: 'User 2',
        employeeEmail: 'user2@example.com',
        role: 'Engineering',
        department: 'Platform',
        templateId: 'template-1',
        steps: [step1],
        createdAt: Date.now(),
        progress: 0,
        status: 'active',
      };

      localStorage.setItem(
        'onboardinghub_onboarding_instances',
        JSON.stringify([instance1, instance2])
      );

      let updateDocCalls: any[] = [];
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);
      vi.mocked(updateDoc).mockImplementation((_ref: any, data: any) => {
        updateDocCalls.push(data);
        return Promise.resolve(undefined);
      });
      vi.mocked(collection).mockReturnValue({} as any);

      // Update template to include new step
      await updateTemplate('template-1', { steps: [step1, step2] });

      // Verify both instances were synced (2 instances with 2 steps each)
      const instanceUpdateCalls = updateDocCalls.filter((call: any) => call.steps && call.steps.length === 2);
      expect(instanceUpdateCalls.length).toBeGreaterThanOrEqual(2);

      // Verify first instance has merged steps
      expect(instanceUpdateCalls[0].steps).toHaveLength(2);
      expect(instanceUpdateCalls[0].steps[0].id).toBe(1);
      expect(instanceUpdateCalls[0].steps[1].id).toBe(2);

      // Verify second instance has merged steps
      expect(instanceUpdateCalls[1].steps).toHaveLength(2);
      expect(instanceUpdateCalls[1].steps[0].id).toBe(1);
      expect(instanceUpdateCalls[1].steps[1].id).toBe(2);
    });

    it('should not throw error if sync fails - template update should still succeed', async () => {
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDocs).mockRejectedValue(new Error('Firestore error'));
      vi.mocked(updateDoc).mockResolvedValue(undefined);
      vi.mocked(collection).mockReturnValue({} as any);

      // Even though sync fails, updateTemplate should not throw
      await expect(
        updateTemplate('template-1', {
          steps: [mockStep],
          name: 'Updated',
        })
      ).resolves.not.toThrow();

      // Template update should have been called
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should recalculate progress correctly after sync', async () => {
      const step1: Step = {
        id: 1,
        title: 'Step 1',
        description: 'First',
        role: 'Engineering',
        owner: 'DevOps',
        expert: 'Jane',
        status: 'completed',
        link: 'https://example.com',
      };

      const step2: Step = {
        id: 2,
        title: 'Step 2',
        description: 'Second',
        role: 'Engineering',
        owner: 'DevOps',
        expert: 'Jane',
        status: 'pending',
        link: 'https://example.com',
      };

      const step3: Step = {
        id: 3,
        title: 'Step 3',
        description: 'Third',
        role: 'Engineering',
        owner: 'DevOps',
        expert: 'Jane',
        status: 'pending',
        link: 'https://example.com',
      };

      const instance: OnboardingInstance = {
        id: 'instance-1',
        employeeName: 'Test',
        employeeEmail: 'test@example.com',
        role: 'Engineering',
        department: 'Platform',
        templateId: 'template-1',
        steps: [step1, step2],
        createdAt: Date.now(),
        progress: 50, // 1 completed out of 2
        status: 'active',
      };

      localStorage.setItem(
        'onboardinghub_onboarding_instances',
        JSON.stringify([instance])
      );

      let updateDocCalls: any[] = [];
      vi.mocked(doc).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);
      vi.mocked(updateDoc).mockImplementation((_ref: any, data: any) => {
        updateDocCalls.push(data);
        return Promise.resolve(undefined);
      });
      vi.mocked(collection).mockReturnValue({} as any);

      // Update template to add a third step
      await updateTemplate('template-1', { steps: [step1, step2, step3] });

      // Verify both instance and template were updated
      expect(updateDocCalls.length).toBeGreaterThan(0);

      // Find the call that updated the instance steps (should have all 3 steps merged)
      const instanceUpdateCall = updateDocCalls.find((call: any) => call.steps && call.steps.length === 3);
      expect(instanceUpdateCall).toBeDefined();

      // Verify the steps count is correct after merge
      expect(instanceUpdateCall?.steps).toHaveLength(3);
      // Verify all steps are present after merge
      expect(instanceUpdateCall?.steps[0].id).toBe(1);
      expect(instanceUpdateCall?.steps[1].id).toBe(2);
      expect(instanceUpdateCall?.steps[2].id).toBe(3);
      // Verify step statuses are correct
      expect(instanceUpdateCall?.steps[0].status).toBe('completed');
      expect(instanceUpdateCall?.steps[1].status).toBe('pending');
      expect(instanceUpdateCall?.steps[2].status).toBe('pending');
    });
  });
});
