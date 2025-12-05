/**
 * SuggestEditModal Component - Modal for submitting step suggestions
 * Allows employees to provide feedback and improvements on onboarding steps
 * Includes validation, character count, and accessibility features
 */

import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { ModalWrapper } from '../ui';
import type { SuggestEditModalProps } from '../../types';

const MIN_LENGTH = 10;
const MAX_LENGTH = 500;

/**
 * Renders a modal for suggesting edits to a step
 * Includes form validation, character counter, and keyboard support
 * @param step - The step being suggested on
 * @param isOpen - Whether the modal is open
 * @param onClose - Callback to close the modal
 * @param onSubmit - Callback when submitting the suggestion text
 * @param isSubmitting - Whether the form is currently submitting
 */
export function SuggestEditModal({
  step,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: SuggestEditModalProps) {
  const [text, setText] = React.useState('');
  const [showValidation, setShowValidation] = React.useState(false);

  const isTooShort = text.trim().length > 0 && text.trim().length < MIN_LENGTH;
  const isValid = text.trim().length >= MIN_LENGTH && text.trim().length <= MAX_LENGTH;
  const charCount = text.length;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setShowValidation(true);

    if (isValid) {
      onSubmit(text);
      setText('');
      setShowValidation(false);
    }
  };

  const handleClose = () => {
    setText('');
    setShowValidation(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Ctrl/Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isValid && !isSubmitting) {
      handleSubmit();
    }
  };

  const footer = (
    <div className="flex justify-between items-center gap-3">
      <div className="text-xs text-slate-500">
        {charCount > 0 && (
          <>
            {charCount}/{MAX_LENGTH} characters
            {isTooShort && (
              <span className="text-amber-600 ml-2">
                (minimum {MIN_LENGTH} required)
              </span>
            )}
          </>
        )}
      </div>
      <div className="flex justify-end gap-3">
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          aria-label="Cancel and close modal"
        >
          Cancel
        </button>
        <button
          onClick={(e) => handleSubmit(e)}
          disabled={!isValid || isSubmitting}
          className={`px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 ${
            isValid && !isSubmitting
              ? 'text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95'
              : 'text-white bg-indigo-400 opacity-60 cursor-not-allowed'
          }`}
          aria-label={isSubmitting ? 'Submitting suggestion' : 'Submit suggestion'}
          title={!isValid ? 'Suggestion must be between 10 and 500 characters' : undefined}
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin">⏳</span>
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              Submit Suggestion
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      title="Suggest an Edit"
      onClose={handleClose}
      footer={footer}
    >
      <p className="text-sm text-slate-600 mb-4">
        Found an issue with <strong>"{step.title}"</strong>? Help us improve it for the next hire!
      </p>

      <form onSubmit={handleSubmit}>
        <div className="relative mb-2">
          <textarea
            className={`w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 min-h-[120px] transition-colors duration-200 resize-none ${
              showValidation && isTooShort
                ? 'border-amber-300 bg-amber-50 focus:ring-amber-500'
                : isValid || text.length === 0
                  ? 'border-slate-200 focus:ring-indigo-500 focus:border-transparent'
                  : 'border-slate-200 focus:ring-indigo-500 focus:border-transparent'
            }`}
            placeholder="e.g., The screenshot is outdated, the button is actually green... (minimum 10 characters)"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (showValidation) {
                setShowValidation(true);
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            autoFocus
            aria-label="Suggestion text"
            aria-describedby="suggestion-help"
            maxLength={MAX_LENGTH}
            required
          />
        </div>

        {/* Validation feedback */}
        {showValidation && isTooShort && text.trim().length > 0 && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p id="suggestion-help" className="text-sm text-amber-700">
              Please provide at least {MIN_LENGTH} characters (currently{' '}
              <strong>{text.trim().length}</strong>)
            </p>
          </div>
        )}

        {/* Success state when valid */}
        {isValid && text.trim().length > 0 && (
          <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2">
            <CheckCircle size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-700">
              Looks good! Your suggestion will help improve onboarding. (Tip: Press Ctrl+Enter to submit)
            </p>
          </div>
        )}
      </form>
    </ModalWrapper>
  );
}
