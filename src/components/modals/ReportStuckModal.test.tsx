/**
 * Unit tests for ReportStuckModal component
 * Tests rendering, dark mode class presence, and light mode regression
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportStuckModal } from './ReportStuckModal';
import type { Step } from '../../types';

const mockStep: Step = {
  id: 1,
  title: 'Setup Dev Environment',
  description: 'Install required development tools',
  role: 'Engineering',
  owner: 'DevOps',
  expert: 'Jane Smith',
  status: 'stuck',
  link: 'https://example.com/setup',
};

const defaultProps = {
  step: mockStep,
  isOpen: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  isSubmitting: false,
};

describe('ReportStuckModal', () => {
  it('renders modal content', () => {
    render(<ReportStuckModal {...defaultProps} />);

    expect(screen.getByText('Report Blocker')).toBeInTheDocument();
    expect(screen.getByText('Setup Dev Environment')).toBeInTheDocument();
    // Jane Smith appears in both expert name and info text, so use getAllByText
    expect(screen.getAllByText(/Jane Smith/).length).toBeGreaterThanOrEqual(1);
  });

  it('cancel button has dark mode classes', () => {
    render(<ReportStuckModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton.className).toContain('dark:text-slate-300');
    expect(cancelButton.className).toContain('dark:hover:bg-slate-600');
  });

  it('rose alert has dark mode classes', () => {
    render(<ReportStuckModal {...defaultProps} />);

    const alertTitle = screen.getByText("You're stuck on a step");
    const alertContainer = alertTitle.closest('div.flex.items-start');
    expect(alertContainer).not.toBeNull();
    expect(alertContainer!.className).toContain('dark:bg-rose-900/20');
    expect(alertContainer!.className).toContain('dark:border-rose-800');

    // Alert title text
    expect(alertTitle.className).toContain('dark:text-rose-200');
  });

  it('blue info box has dark mode classes', () => {
    render(<ReportStuckModal {...defaultProps} />);

    const infoText = screen.getByText(/will be notified immediately/);
    const infoContainer = infoText.closest('div.flex.items-start');
    expect(infoContainer).not.toBeNull();
    expect(infoContainer!.className).toContain('dark:bg-blue-900/20');
    expect(infoContainer!.className).toContain('dark:border-blue-800');

    // Info text
    expect(infoText.className).toContain('dark:text-blue-300');
  });

  it('light mode classes still present (regression)', () => {
    render(<ReportStuckModal {...defaultProps} />);

    // Rose alert
    const alertTitle = screen.getByText("You're stuck on a step");
    const alertContainer = alertTitle.closest('div.flex.items-start');
    expect(alertContainer!.className).toContain('bg-rose-50');

    // Cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton.className).toContain('text-slate-600');
  });
});
