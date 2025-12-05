/**
 * ModalWrapper Component - Reusable modal container
 * Provides consistent styling, animation, and keyboard accessibility for modals
 */

import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { ModalWrapperProps } from '../../types';

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

/**
 * Renders a modal dialog with header, body, and optional footer
 * Supports keyboard accessibility (Escape key to close)
 * Prevents body scroll when modal is open
 * @param isOpen - Whether the modal is open
 * @param title - Modal title
 * @param children - Modal body content
 * @param footer - Optional footer content
 * @param onClose - Callback when closing the modal
 * @param size - Modal size variant
 */
export function ModalWrapper({
  isOpen,
  title,
  children,
  footer,
  onClose,
  size = 'md',
}: ModalWrapperProps) {
  const sizeClass = sizeMap[size];

  // Handle Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="presentation"
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${sizeClass} overflow-hidden animate-in fade-in zoom-in duration-200`}
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-start gap-4">
          <h3 id="modal-title" className="text-lg font-bold text-slate-900">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 rounded-lg p-1"
            aria-label="Close modal"
            title="Press Escape to close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - Scrollable when needed */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="bg-slate-50 p-4 border-t border-slate-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
