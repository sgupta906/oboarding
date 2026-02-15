/**
 * ActionBar Tests - Verify loading/disabled state behavior
 * Tests: buttons disabled when loading, spinner visible, click handlers blocked
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionBar } from './ActionBar';
import type { Step } from '../../types';

const pendingStep: Step = {
  id: 1,
  title: 'Test Step',
  description: 'Test description',
  role: 'All',
  owner: 'IT',
  expert: 'Expert',
  status: 'pending',
  link: '',
};

const completedStep: Step = {
  ...pendingStep,
  status: 'completed',
};

const defaultHandlers = {
  onStatusChange: vi.fn(),
  onSuggestEdit: vi.fn(),
  onReportStuck: vi.fn(),
};

describe('ActionBar loading state', () => {
  it('disables buttons when isLoading is true (pending step)', () => {
    render(
      <ActionBar
        step={pendingStep}
        {...defaultHandlers}
        isLoading={true}
      />
    );

    const markDoneButton = screen.getByLabelText(/Mark .* as done/);
    expect(markDoneButton).toBeDisabled();

    const stuckButton = screen.getByLabelText(/Report stuck/);
    expect(stuckButton).toBeDisabled();

    const suggestEditButton = screen.getByLabelText(/Suggest edit/);
    expect(suggestEditButton).toBeDisabled();
  });

  it('shows loading spinner on primary button when isLoading is true', () => {
    render(
      <ActionBar
        step={pendingStep}
        {...defaultHandlers}
        isLoading={true}
      />
    );

    // The loading spinner should be visible via animate-spin class
    const markDoneButton = screen.getByLabelText(/Mark .* as done/);
    const spinner = markDoneButton.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('click handlers are not called when isLoading is true', async () => {
    const user = userEvent.setup();

    render(
      <ActionBar
        step={pendingStep}
        {...defaultHandlers}
        isLoading={true}
      />
    );

    const markDoneButton = screen.getByLabelText(/Mark .* as done/);
    await user.click(markDoneButton);

    expect(defaultHandlers.onStatusChange).not.toHaveBeenCalled();
  });

  it('disables mark as incomplete when isLoading is true (completed step)', () => {
    render(
      <ActionBar
        step={completedStep}
        {...defaultHandlers}
        isLoading={true}
      />
    );

    const incompleteButton = screen.getByLabelText(/Mark .* as incomplete/);
    expect(incompleteButton).toBeDisabled();
  });

  it('buttons are enabled when isLoading is false or undefined', () => {
    render(
      <ActionBar
        step={pendingStep}
        {...defaultHandlers}
      />
    );

    const markDoneButton = screen.getByLabelText(/Mark .* as done/);
    expect(markDoneButton).not.toBeDisabled();
  });
});
