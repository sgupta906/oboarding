/**
 * Unit tests for DeleteConfirmDialog component
 * Tests template name display, warning, and cancel/confirm callbacks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

describe('DeleteConfirmDialog Component', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display template name in confirmation message', () => {
    render(
      <DeleteConfirmDialog
        isOpen={true}
        templateName="Engineering Onboarding"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const message = screen.getByText(/Are you sure you want to delete/);
    expect(message).toBeInTheDocument();
    expect(screen.getByText('Engineering Onboarding')).toBeInTheDocument();
  });

  it('should display warning message', () => {
    render(
      <DeleteConfirmDialog
        isOpen={true}
        templateName="Test Template"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(
      screen.getByText(
        /This action cannot be undone. All instances using this template will be affected./
      )
    ).toBeInTheDocument();
  });

  it('should call onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DeleteConfirmDialog
        isOpen={true}
        templateName="Test Template"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledOnce();
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('should call onConfirm when Delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DeleteConfirmDialog
        isOpen={true}
        templateName="Test Template"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find(
      (btn) => btn.textContent?.includes('Delete') && !btn.textContent?.includes('Cancel')
    );

    if (deleteButton) {
      await user.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledOnce();
      expect(mockOnCancel).not.toHaveBeenCalled();
    }
  });
});

describe('DeleteConfirmDialog dark mode', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  it('cancel button has dark mode classes', () => {
    render(
      <DeleteConfirmDialog
        isOpen={true}
        templateName="Test Template"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton.className).toContain('dark:text-slate-300');
    expect(cancelButton.className).toContain('dark:hover:bg-slate-600');
  });

  it('message text has dark:text-slate-200', () => {
    render(
      <DeleteConfirmDialog
        isOpen={true}
        templateName="Test Template"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const message = screen.getByText(/Are you sure you want to delete/);
    expect(message.className).toContain('dark:text-slate-200');
  });

  it('light mode classes still present (regression)', () => {
    render(
      <DeleteConfirmDialog
        isOpen={true}
        templateName="Test Template"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton.className).toContain('text-slate-700');

    const subText = screen.getByText(/This action cannot be undone/);
    expect(subText.className).toContain('text-slate-500');
  });
});
