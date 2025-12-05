/**
 * Unit tests for onboarding run creation (createOnboardingRunFromTemplate)
 * Tests validation, template fetching, error handling, and data integrity
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Template, Step } from '../types';

// Mock firebase/firestore module
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  getDoc: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));

// Mock firebase config
vi.mock('../config/firebase', () => ({
  firestore: {},
}));

import { addDoc, getDoc, doc, collection, getDocs, query, where } from 'firebase/firestore';

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

const mockStep2: Step = {
  id: 2,
  title: 'First Day Meeting',
  description: 'Meet with manager and team',
  role: 'All',
  owner: 'HR',
  expert: 'Jane Smith',
  status: 'pending',
  link: 'https://example.com/meeting',
};

const mockTemplate: Template = {
  id: 'template-engineering-001',
  name: 'Engineering Onboarding',
  description: 'Complete onboarding for engineers',
  role: 'Engineering',
  steps: [mockStep, mockStep2],
  createdAt: Date.now() - 86400000,
  isActive: true,
};

const validEmployeeData = {
  employeeName: 'John Smith',
  employeeEmail: 'john.smith@example.com',
  role: 'Engineering',
  department: 'Platform',
  templateId: 'template-engineering-001',
};

const validEmployeeDataWithStartDate = {
  employeeName: 'Jane Doe',
  employeeEmail: 'jane.doe@example.com',
  role: 'Sales',
  department: 'Revenue',
  templateId: 'template-engineering-001',
  startDate: Date.now() + 604800000,
};

// ============================================================================
// Tests
// ============================================================================

describe('createOnboardingRunFromTemplate - Successful Creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Seed localStorage with mock templates for fallback when Firestore is unavailable
    const templates = [mockTemplate];
    localStorage.setItem('onboardinghub_templates', JSON.stringify(templates));
    // Setup default mocks for all Firestore functions
    vi.mocked(query).mockReturnValue({} as any);
    vi.mocked(where).mockReturnValue({} as any);
    vi.mocked(getDocs).mockResolvedValue({ empty: true, docs: [] } as any);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should create onboarding instance with valid employee data', async () => {
    const { createOnboardingRunFromTemplate } = await import('./dataClient');
    const result = await createOnboardingRunFromTemplate(validEmployeeData);

    expect(result).toBeDefined();
    // Uses localStorage fallback since Firestore is unavailable in tests
    expect(result.id).toMatch(/^local-instance-/);
    expect(result.employeeName).toBe('John Smith');
    expect(result.employeeEmail).toBe('john.smith@example.com');
    expect(result.role).toBe('Engineering');
  });

  it('should initialize progress to 0 and status to active', async () => {
    const { createOnboardingRunFromTemplate } = await import('./dataClient');
    const result = await createOnboardingRunFromTemplate(validEmployeeData);

    expect(result.progress).toBe(0);
    expect(result.status).toBe('active');
  });

  it('should copy template steps into the instance', async () => {
    const { createOnboardingRunFromTemplate } = await import('./dataClient');
    const result = await createOnboardingRunFromTemplate(validEmployeeData);

    expect(result.steps).toHaveLength(2);
    expect(result.steps[0]).toEqual(mockStep);
    expect(result.steps[1]).toEqual(mockStep2);
  });

  it('should include optional startDate in instance when provided', async () => {
    const { createOnboardingRunFromTemplate } = await import('./dataClient');
    const result = await createOnboardingRunFromTemplate(validEmployeeDataWithStartDate);

    expect(result.startDate).toBeDefined();
    expect(result.startDate).toBe(validEmployeeDataWithStartDate.startDate);
  });

  it('should set createdAt timestamp on instance creation', async () => {
    const beforeCreation = Date.now();

    const { createOnboardingRunFromTemplate } = await import('./dataClient');
    const result = await createOnboardingRunFromTemplate(validEmployeeData);

    const afterCreation = Date.now();

    expect(result.createdAt).toBeGreaterThanOrEqual(beforeCreation);
    expect(result.createdAt).toBeLessThanOrEqual(afterCreation);
  });
});

describe('createOnboardingRunFromTemplate - Validation Errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mocks for all Firestore functions
    vi.mocked(query).mockReturnValue({} as any);
    vi.mocked(where).mockReturnValue({} as any);
    vi.mocked(getDocs).mockResolvedValue({ empty: true, docs: [] } as any);
    // Note: Validation errors are caught before template lookup
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should reject missing employeeName field', async () => {
    const invalidData = { ...validEmployeeData, employeeName: '' };

    const { createOnboardingRunFromTemplate, OnboardingValidationError } = await import(
      './dataClient'
    );

    await expect(createOnboardingRunFromTemplate(invalidData)).rejects.toThrow(
      OnboardingValidationError
    );

    await expect(createOnboardingRunFromTemplate(invalidData)).rejects.toThrow(
      'employeeName is required'
    );
  });

  it('should reject whitespace-only employeeName', async () => {
    const invalidData = { ...validEmployeeData, employeeName: '   ' };

    const { createOnboardingRunFromTemplate, OnboardingValidationError } = await import(
      './dataClient'
    );

    await expect(createOnboardingRunFromTemplate(invalidData)).rejects.toThrow(
      OnboardingValidationError
    );
  });

  it('should reject invalid email format', async () => {
    const invalidData = {
      ...validEmployeeData,
      employeeEmail: 'not-an-email',
    };

    const { createOnboardingRunFromTemplate, OnboardingValidationError } = await import(
      './dataClient'
    );

    await expect(createOnboardingRunFromTemplate(invalidData)).rejects.toThrow(
      OnboardingValidationError
    );

    await expect(createOnboardingRunFromTemplate(invalidData)).rejects.toThrow(
      'must be a valid email address'
    );
  });

  it('should reject missing employeeEmail field', async () => {
    const invalidData = { ...validEmployeeData, employeeEmail: '' };

    const { createOnboardingRunFromTemplate, OnboardingValidationError } = await import(
      './dataClient'
    );

    await expect(createOnboardingRunFromTemplate(invalidData)).rejects.toThrow(
      OnboardingValidationError
    );
  });

  it('should reject missing role field', async () => {
    const invalidData = { ...validEmployeeData, role: '' };

    const { createOnboardingRunFromTemplate, OnboardingValidationError } = await import(
      './dataClient'
    );

    await expect(createOnboardingRunFromTemplate(invalidData)).rejects.toThrow(
      OnboardingValidationError
    );

    await expect(createOnboardingRunFromTemplate(invalidData)).rejects.toThrow(
      'role is required'
    );
  });

  it('should reject missing department field', async () => {
    const invalidData = { ...validEmployeeData, department: '' };

    const { createOnboardingRunFromTemplate, OnboardingValidationError } = await import(
      './dataClient'
    );

    await expect(createOnboardingRunFromTemplate(invalidData)).rejects.toThrow(
      OnboardingValidationError
    );

    await expect(createOnboardingRunFromTemplate(invalidData)).rejects.toThrow(
      'department is required'
    );
  });

  it('should reject missing templateId field', async () => {
    const invalidData = { ...validEmployeeData, templateId: '' };

    const { createOnboardingRunFromTemplate, OnboardingValidationError } = await import(
      './dataClient'
    );

    await expect(createOnboardingRunFromTemplate(invalidData)).rejects.toThrow(
      OnboardingValidationError
    );

    await expect(createOnboardingRunFromTemplate(invalidData)).rejects.toThrow(
      'templateId is required'
    );
  });

  it('should reject invalid startDate (negative number)', async () => {
    const invalidData = {
      ...validEmployeeData,
      startDate: -1000,
    };

    const { createOnboardingRunFromTemplate, OnboardingValidationError } = await import(
      './dataClient'
    );

    await expect(createOnboardingRunFromTemplate(invalidData)).rejects.toThrow(
      OnboardingValidationError
    );

    await expect(createOnboardingRunFromTemplate(invalidData)).rejects.toThrow(
      'startDate must be a valid Unix timestamp'
    );
  });
});

describe('createOnboardingRunFromTemplate - Template Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mocks for all Firestore functions
    vi.mocked(query).mockReturnValue({} as any);
    vi.mocked(where).mockReturnValue({} as any);
    vi.mocked(getDocs).mockResolvedValue({ empty: true, docs: [] } as any);
    // Clear localStorage to test template not found cases
    localStorage.clear();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should throw error when template does not exist', async () => {
    const mockDocSnap = {
      exists: () => false,
    };

    vi.mocked(doc).mockReturnValue({} as any);
    vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

    const { createOnboardingRunFromTemplate, OnboardingValidationError } = await import(
      './dataClient'
    );

    await expect(createOnboardingRunFromTemplate(validEmployeeData)).rejects.toThrow(
      OnboardingValidationError
    );

    await expect(createOnboardingRunFromTemplate(validEmployeeData)).rejects.toThrow(
      'Template not found'
    );
  });

  it('should throw meaningful error with templateId when template not found', async () => {
    const templateId = 'nonexistent-template-xyz';
    const data = { ...validEmployeeData, templateId };

    const mockDocSnap = {
      exists: () => false,
    };

    vi.mocked(doc).mockReturnValue({} as any);
    vi.mocked(getDoc).mockResolvedValue(mockDocSnap as any);

    const { createOnboardingRunFromTemplate } = await import('./dataClient');

    await expect(createOnboardingRunFromTemplate(data)).rejects.toThrow(templateId);
  });
});

describe('createOnboardingRunFromTemplate - Firestore Errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mocks for all Firestore functions
    vi.mocked(query).mockReturnValue({} as any);
    vi.mocked(where).mockReturnValue({} as any);
    vi.mocked(getDocs).mockResolvedValue({ empty: true, docs: [] } as any);

    // Seed localStorage with mock templates for fallback
    const templates = [mockTemplate];
    localStorage.setItem('onboardinghub_templates', JSON.stringify(templates));
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should handle template creation using localStorage fallback', async () => {
    // Since Firestore is unavailable in tests, this verifies the localStorage path works
    const { createOnboardingRunFromTemplate } = await import('./dataClient');

    // Should succeed with localStorage fallback
    const result = await createOnboardingRunFromTemplate(validEmployeeData);

    // Verify it returned a valid instance with localStorage ID pattern
    expect(result).toBeDefined();
    expect(result.id).toMatch(/^local-instance-/);
    expect(result.employeeName).toBe(validEmployeeData.employeeName);
    expect(result.steps).toHaveLength(2);
  });

  it('should verify employee data is preserved through localStorage fallback', async () => {
    const { createOnboardingRunFromTemplate } = await import('./dataClient');

    // Should succeed and fall back to localStorage
    const result = await createOnboardingRunFromTemplate(validEmployeeData);

    expect(result).toBeDefined();
    // Verify all employee data is preserved
    expect(result.employeeName).toBe(validEmployeeData.employeeName);
    expect(result.employeeEmail).toBe(validEmployeeData.employeeEmail);
    expect(result.role).toBe(validEmployeeData.role);
    expect(result.department).toBe(validEmployeeData.department);
    expect(result.templateId).toBe(validEmployeeData.templateId);
  });

  it('should initialize status as active for all instances', async () => {
    const { createOnboardingRunFromTemplate } = await import('./dataClient');

    // Should succeed with localStorage fallback
    const result = await createOnboardingRunFromTemplate(validEmployeeData);

    expect(result).toBeDefined();
    expect(result.id).toMatch(/^local-instance-/);
    expect(result.employeeName).toBe(validEmployeeData.employeeName);
    // Verify status is correctly initialized
    expect(result.status).toBe('active');
    expect(result.progress).toBe(0);
  });
});

describe('createOnboardingRunFromTemplate - Type Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Seed localStorage with mock templates
    const templates = [mockTemplate];
    localStorage.setItem('onboardinghub_templates', JSON.stringify(templates));
    // Setup default mocks for all Firestore functions
    vi.mocked(query).mockReturnValue({} as any);
    vi.mocked(where).mockReturnValue({} as any);
    vi.mocked(getDocs).mockResolvedValue({ empty: true, docs: [] } as any);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return properly typed OnboardingInstance', async () => {
    const { createOnboardingRunFromTemplate } = await import('./dataClient');
    const result: OnboardingInstance = await createOnboardingRunFromTemplate(validEmployeeData);

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.employeeName).toBeDefined();
    expect(typeof result.employeeName).toBe('string');
    expect(result.employeeEmail).toBeDefined();
    expect(typeof result.employeeEmail).toBe('string');
    expect(result.role).toBeDefined();
    expect(result.department).toBeDefined();
    expect(result.templateId).toBeDefined();
    expect(Array.isArray(result.steps)).toBe(true);
    expect(typeof result.createdAt).toBe('number');
    expect(typeof result.progress).toBe('number');
    expect(['active', 'completed', 'on_hold']).toContain(result.status);
  });

  it('should preserve all employee data fields without modification', async () => {
    const testData = {
      employeeName: 'Test User Name',
      employeeEmail: 'test.user@company.io',
      role: 'Custom Role',
      department: 'Special Department',
      templateId: 'template-engineering-001',
    };

    const { createOnboardingRunFromTemplate } = await import('./dataClient');
    const result = await createOnboardingRunFromTemplate(testData);

    expect(result.employeeName).toBe(testData.employeeName);
    expect(result.employeeEmail).toBe(testData.employeeEmail);
    expect(result.role).toBe(testData.role);
    expect(result.department).toBe(testData.department);
    expect(result.templateId).toBe(testData.templateId);
  });
});

describe('createOnboardingRunFromTemplate - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Seed localStorage with mock templates
    const templates = [mockTemplate];
    localStorage.setItem('onboardinghub_templates', JSON.stringify(templates));
    // Setup default mocks for all Firestore functions
    vi.mocked(query).mockReturnValue({} as any);
    vi.mocked(where).mockReturnValue({} as any);
    vi.mocked(getDocs).mockResolvedValue({ empty: true, docs: [] } as any);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should handle template with empty steps array', async () => {
    const emptyTemplate: Template = {
      ...mockTemplate,
      steps: [],
    };

    // Override the beforeEach localStorage to have the empty template
    localStorage.setItem('onboardinghub_templates', JSON.stringify([emptyTemplate]));

    const { createOnboardingRunFromTemplate } = await import('./dataClient');
    const result = await createOnboardingRunFromTemplate(validEmployeeData);

    expect(result.steps).toEqual([]);
    expect(result.steps).toHaveLength(0);
  });

  it('should accept email with special characters in local part', async () => {
    const validData = {
      ...validEmployeeData,
      employeeEmail: 'john.smith+team@example.com',
    };

    const { createOnboardingRunFromTemplate } = await import('./dataClient');
    const result = await createOnboardingRunFromTemplate(validData);

    expect(result.employeeEmail).toBe(validData.employeeEmail);
  });

  it('should handle startDate of 0 (epoch time)', async () => {
    const validData = {
      ...validEmployeeData,
      startDate: 0,
    };

    const { createOnboardingRunFromTemplate } = await import('./dataClient');
    const result = await createOnboardingRunFromTemplate(validData);

    expect(result.startDate).toBe(0);
  });
});
