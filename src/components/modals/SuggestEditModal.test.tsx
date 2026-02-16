/**
 * Unit tests for SuggestEditModal component
 * Tests rendering, dark mode class presence, and light mode regression
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuggestEditModal } from './SuggestEditModal';
import type { Step } from '../../types';

// ============================================================================
// Mock Data
// ============================================================================

const mockStep: Step = {
  id: 1,
  title: 'Setup Dev Environment',
  description: 'Install required development tools',
  role: 'Engineering',
  owner: 'DevOps',
  expert: 'John Doe',
  status: 'pending',
  link: 'https://example.com/setup',
};

const defaultProps = {
  step: mockStep,
  isOpen: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  isSubmitting: false,
};

// ============================================================================
// Tests
// ============================================================================

describe('SuggestEditModal', () => {
  it('renders without error with required props', () => {
    render(<SuggestEditModal {...defaultProps} />);
    expect(screen.getByText(/Suggest an Edit/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Found an issue with/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Suggestion text')).toBeInTheDocument();
  });

  it('textarea contains dark mode classes', () => {
    render(<SuggestEditModal {...defaultProps} />);
    const textarea = screen.getByLabelText('Suggestion text');
    expect(textarea.className).toContain('dark:border-slate-600');
    expect(textarea.className).toContain('dark:bg-slate-700');
    expect(textarea.className).toContain('dark:text-white');
    expect(textarea.className).toContain('dark:placeholder-slate-400');
  });

  it('description paragraph contains dark:text-slate-400', () => {
    render(<SuggestEditModal {...defaultProps} />);
    const description = screen.getByText(/Found an issue with/i);
    expect(description.className).toContain('dark:text-slate-400');
  });

  it('cancel button contains dark mode classes', () => {
    render(<SuggestEditModal {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton.className).toContain('dark:text-slate-300');
    expect(cancelButton.className).toContain('dark:hover:bg-slate-600');
  });

  it('validation warning banner contains dark:bg-amber-900/20', async () => {
    const user = userEvent.setup();
    const { container } = render(<SuggestEditModal {...defaultProps} />);

    const textarea = screen.getByLabelText('Suggestion text');
    // Type fewer than 10 characters to trigger validation
    await user.type(textarea, 'short');

    // Submit the form directly to trigger showValidation state
    const form = container.querySelector('form')!;
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    // Wait for the amber warning banner to appear
    const warningText = await screen.findByText(/Please provide at least/i);
    const warningBanner = warningText.closest('div');
    expect(warningBanner).not.toBeNull();
    expect(warningBanner!.className).toContain('dark:bg-amber-900/20');
    expect(warningBanner!.className).toContain('dark:border-amber-700');
  });

  it('success banner contains dark:bg-emerald-900/20', async () => {
    const user = userEvent.setup();
    render(<SuggestEditModal {...defaultProps} />);

    const textarea = screen.getByLabelText('Suggestion text');
    // Type >= 10 characters to trigger success state
    await user.type(textarea, 'This is a valid suggestion with enough text');

    // The emerald success banner should appear
    const successText = screen.getByText(/Looks good!/i);
    const successBanner = successText.closest('div');
    expect(successBanner).not.toBeNull();
    expect(successBanner!.className).toContain('dark:bg-emerald-900/20');
    expect(successBanner!.className).toContain('dark:border-emerald-700');
  });

  it('character count contains dark:text-slate-400', async () => {
    const user = userEvent.setup();
    render(<SuggestEditModal {...defaultProps} />);

    const textarea = screen.getByLabelText('Suggestion text');
    await user.type(textarea, 'hello');

    // Character count should be visible
    const charCount = screen.getByText(/5\/500 characters/i);
    expect(charCount.className).toContain('dark:text-slate-400');
  });

  it('light mode classes are still present (regression check)', () => {
    render(<SuggestEditModal {...defaultProps} />);
    const textarea = screen.getByLabelText('Suggestion text');
    // Verify original light mode classes are unchanged
    expect(textarea.className).toContain('border-slate-200');
    expect(textarea.className).toContain('focus:ring-brand-500');

    const description = screen.getByText(/Found an issue with/i);
    expect(description.className).toContain('text-slate-600');

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton.className).toContain('text-slate-600');
    expect(cancelButton.className).toContain('hover:bg-slate-100');
  });
});
