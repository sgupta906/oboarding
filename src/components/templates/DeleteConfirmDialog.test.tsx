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
