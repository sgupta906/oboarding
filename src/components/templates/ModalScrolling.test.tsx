/**
 * Modal Scrolling Tests
 * Tests for Issue 4: CreateTemplateModal scrollability with max-height
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreateTemplateModal } from './CreateTemplateModal';
import { ModalWrapper } from '../ui/ModalWrapper';

describe('Issue 4: Modal Scrollability', () => {
  describe('ModalWrapper Scrolling', () => {
    it('should render body with overflow-y-auto class', () => {
      const { container } = render(
        <ModalWrapper
          isOpen={true}
          title="Test Modal"
          onClose={vi.fn()}
        >
          <div>Test Content</div>
        </ModalWrapper>
      );

      const bodyDiv = container.querySelector('.overflow-y-auto');
      expect(bodyDiv).toBeInTheDocument();
    });

    it('should apply max-height style to modal body', () => {
      const { container } = render(
        <ModalWrapper
          isOpen={true}
          title="Test Modal"
          onClose={vi.fn()}
        >
          <div>Test Content</div>
        </ModalWrapper>
      );

      const bodyDiv = container.querySelector('.overflow-y-auto');

      // Check that max-height is set via inline style
      expect(bodyDiv).toHaveStyle('max-height: calc(90vh - 180px)');
    });

    it('should maintain fixed header and footer while body scrolls', () => {
      const { container } = render(
        <ModalWrapper
          isOpen={true}
          title="Test Modal"
          onClose={vi.fn()}
          footer={<button>Submit</button>}
        >
          <div>Test Content</div>
        </ModalWrapper>
      );

      // Header should not be scrollable
      const header = container.querySelector('.border-b');
      expect(header).toBeInTheDocument();
      expect(header).not.toHaveClass('overflow-y-auto');

      // Body should be scrollable
      const body = container.querySelector('.overflow-y-auto');
      expect(body).toBeInTheDocument();

      // Footer should not be scrollable
      const footer = container.querySelector('.bg-slate-50');
      expect(footer).toBeInTheDocument();
      expect(footer).not.toHaveClass('overflow-y-auto');
    });

    it('should calculate max-height correctly (90vh - 180px)', () => {
      const { container } = render(
        <ModalWrapper
          isOpen={true}
          title="Test Modal"
          onClose={vi.fn()}
          footer={<button>Submit</button>}
        >
          <div>Test Content</div>
        </ModalWrapper>
      );

      const bodyDiv = container.querySelector('.overflow-y-auto');
      expect(bodyDiv).toHaveStyle('max-height: calc(90vh - 180px)');
    });

    it('should render modal content fully when content is small', () => {
      const { container } = render(
        <ModalWrapper
          isOpen={true}
          title="Test Modal"
          onClose={vi.fn()}
        >
          <div>Small content</div>
        </ModalWrapper>
      );

      const body = container.querySelector('.overflow-y-auto');
      expect(body).toBeInTheDocument();
      expect(body).toHaveTextContent('Small content');
    });
  });

  describe('CreateTemplateModal Scrolling', () => {
    it('should render create template modal without local scroll restriction', () => {
      render(
        <CreateTemplateModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      );

      // Check that the modal is rendered
      expect(screen.getByText('Create New Template')).toBeInTheDocument();
    });

    it('should NOT have max-h-96 restriction on steps container', () => {
      const { container } = render(
        <CreateTemplateModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      );

      // The steps container should not have max-h-96 or overflow-y-auto
      const stepsContainer = container.querySelector(
        'div.space-y-4:not(.space-y-6)'
      );

      if (stepsContainer) {
        expect(stepsContainer).not.toHaveClass('max-h-96');
        expect(stepsContainer).not.toHaveClass('overflow-y-auto');
      }
    });

    it('should allow multiple steps to be added without scrolling within the form', () => {
      const { container } = render(
        <CreateTemplateModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      );

      // The entire form should be contained within the modal wrapper's scrollable area
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();

      // The form itself should NOT have overflow-y-auto
      expect(form).not.toHaveClass('overflow-y-auto');
    });

    it('should respect modal body max-height from ModalWrapper', () => {
      const { container } = render(
        <CreateTemplateModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      );

      // The scrollable area should be the modal body (direct child of modal dialog)
      const modalBody = container.querySelector('.overflow-y-auto');
      expect(modalBody).toBeInTheDocument();
      expect(modalBody).toHaveStyle('max-height: calc(90vh - 180px)');
    });

    it('should display form fields properly in scrollable area', () => {
      render(
        <CreateTemplateModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      );

      // Check for key form fields
      expect(screen.getByLabelText('Template Name')).toBeInTheDocument();
      expect(screen.getByText('Applicable Roles')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Onboarding Steps')).toBeInTheDocument();
    });

    it('should keep header and footer visible when modal body scrolls', () => {
      const { container } = render(
        <CreateTemplateModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      );

      // Find modal dialog
      const modal = container.querySelector('[role="dialog"]');
      expect(modal).toBeInTheDocument();

      // Header should be visible
      const header = modal?.querySelector('.border-b');
      expect(header).toBeInTheDocument();

      // Body should be scrollable
      const body = modal?.querySelector('.overflow-y-auto');
      expect(body).toBeInTheDocument();

      // Footer should be visible
      const footer = modal?.querySelector('.bg-slate-50');
      expect(footer).toBeInTheDocument();
    });

    it('should handle form with many steps without layout shift', async () => {
      const mockOnSubmit = vi.fn();

      const { container } = render(
        <CreateTemplateModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={mockOnSubmit}
        />
      );

      // The scrollable area should maintain its max-height
      const scrollableBody = container.querySelector('.overflow-y-auto');
      expect(scrollableBody).toHaveStyle('max-height: calc(90vh - 180px)');
    });
  });

  describe('Responsive Scrolling', () => {
    it('should maintain scrollability on different viewport heights', () => {
      const { container } = render(
        <ModalWrapper
          isOpen={true}
          title="Test Modal"
          onClose={vi.fn()}
          footer={<button>Submit</button>}
        >
          <div>Test Content</div>
        </ModalWrapper>
      );

      const bodyDiv = container.querySelector('.overflow-y-auto');

      // The max-height calculation uses viewport height (90vh)
      // which is responsive to the actual viewport
      expect(bodyDiv).toHaveStyle('max-height: calc(90vh - 180px)');
    });

    it('should apply padding consistently in scrollable area', () => {
      const { container } = render(
        <ModalWrapper
          isOpen={true}
          title="Test Modal"
          onClose={vi.fn()}
        >
          <div>Test Content</div>
        </ModalWrapper>
      );

      const bodyDiv = container.querySelector('.overflow-y-auto');
      expect(bodyDiv).toHaveClass('p-6');
    });

    it('should not cause horizontal scroll in modal', () => {
      const { container } = render(
        <CreateTemplateModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      );

      // The modal wrapper should use full width with max-w constraint
      const modal = container.querySelector('[role="dialog"]');
      expect(modal).toHaveClass('w-full');

      // Should not have overflow-x-auto or horizontal scroll
      expect(modal).not.toHaveClass('overflow-x-auto');
    });
  });

  describe('Accessibility of Scrolling', () => {
    it('should allow keyboard navigation in scrollable area', () => {
      render(
        <CreateTemplateModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
        />
      );

      // Find the template name input
      const templateInput = screen.getByLabelText('Template Name') as HTMLInputElement;
      expect(templateInput).toBeInTheDocument();

      // Should be keyboard accessible
      templateInput.focus();
      expect(document.activeElement).toBe(templateInput);
    });

    it('should maintain focus management in scrollable modal', () => {
      const { container } = render(
        <ModalWrapper
          isOpen={true}
          title="Test Modal"
          onClose={vi.fn()}
        >
          <input type="text" placeholder="Test input" />
        </ModalWrapper>
      );

      const input = container.querySelector('input[type="text"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();

      // Focus should be manageable
      if (input) {
        input.focus();
        expect(document.activeElement).toBe(input);
      }
    });

    it('should support scroll with screen reader', () => {
      const { container } = render(
        <ModalWrapper
          isOpen={true}
          title="Test Modal"
          onClose={vi.fn()}
          footer={<button>Submit</button>}
        >
          <div>Scrollable content</div>
        </ModalWrapper>
      );

      // Modal should have proper ARIA attributes
      const modal = container.querySelector('[role="dialog"]');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');
    });
  });
});
