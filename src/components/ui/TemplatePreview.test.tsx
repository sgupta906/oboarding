/**
 * Tests for TemplatePreview component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TemplatePreview } from './TemplatePreview';
import type { Template } from '../../types';

const mockTemplate: Template = {
  id: 't1',
  name: 'Engineering Onboarding',
  description: 'Standard engineering setup',
  role: 'Engineering',
  steps: [
    { id: 1, title: 'Setup Laptop', description: '', role: 'All', owner: 'IT', expert: 'Alice', status: 'pending', link: '' },
    { id: 2, title: 'Install IDE', description: '', role: 'Engineering', owner: 'DevOps', expert: 'Bob', status: 'pending', link: '' },
  ],
  createdAt: Date.now(),
  isActive: true,
};

describe('TemplatePreview', () => {
  it('renders the template name', () => {
    render(<TemplatePreview template={mockTemplate} />);
    expect(screen.getByText('Engineering Onboarding')).toBeInTheDocument();
  });

  it('renders the template description', () => {
    render(<TemplatePreview template={mockTemplate} />);
    expect(screen.getByText('Standard engineering setup')).toBeInTheDocument();
  });

  it('renders step count and step titles', () => {
    render(<TemplatePreview template={mockTemplate} />);
    expect(screen.getByText(/2 steps/)).toBeInTheDocument();
    expect(screen.getByText(/Setup Laptop/)).toBeInTheDocument();
    expect(screen.getByText(/Install IDE/)).toBeInTheDocument();
  });

  it('handles empty description gracefully', () => {
    const noDescTemplate = { ...mockTemplate, description: '' };
    render(<TemplatePreview template={noDescTemplate} />);
    expect(screen.getByText('Engineering Onboarding')).toBeInTheDocument();
  });
});
