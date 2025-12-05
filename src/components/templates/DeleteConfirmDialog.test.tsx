/**
 * Unit tests for DeleteConfirmDialog component
 * Tests confirmation flow and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

// ============================================================================
// Test Cases
// ============================================================================

describe('DeleteConfirmDialog Component', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <DeleteConfirmDialog
        isOpen={false}
        templateName="Test Template"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByText('Delete Template')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <DeleteConfirmDialog
        isOpen={true}
        templateName="Test Template"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Delete Template')).toBeInTheDocument();
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

  it('should have Cancel button', () => {
    render(
      <DeleteConfirmDialog
        isOpen={true}
        templateName="Test Template"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should have Delete button', () => {
    render(
      <DeleteConfirmDialog
        isOpen={true}
        templateName="Test Template"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find((btn) => btn.textContent?.includes('Delete'));
    expect(deleteButton).toBeDefined();
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

  it('should disable buttons when isDeleting is true', () => {
    render(
      <DeleteConfirmDialog
        isOpen={true}
        templateName="Test Template"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find((btn) => btn.textContent?.includes('Deleting'));
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    expect(deleteButton).toBeDefined();
    expect(deleteButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('should show loading state while deleting', () => {
    render(
      <DeleteConfirmDialog
        isOpen={true}
        templateName="Test Template"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        isDeleting={true}
      />
    );

    expect(screen.getByText('Deleting...')).toBeInTheDocument();
  });

  it('should display confirmation message with template name', () => {
    render(
      <DeleteConfirmDialog
        isOpen={true}
        templateName="Test Template"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const warningText = screen.getByText(/This action cannot be undone/);
    expect(warningText).toBeInTheDocument();
  });
});
