/**
 * UserModal Component - Unified create/edit modal for system users
 * Features: Email/name/roles/profiles form, validation, error handling,
 * loading state, pre-fill (edit), and full a11y support
 */

import { useState, useEffect } from 'react';
import { ModalWrapper } from '../ui';
import { ErrorAlert } from '../ui/ErrorAlert';
import type { User, UserFormData, CustomRole } from '../../types';
import { EMAIL_REGEX } from '../../utils/validation';
import type { FieldErrors } from '../../utils/validation';

interface UserModalProps {
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
  roles?: CustomRole[];
  rolesLoading?: boolean;
  user?: User | null;
}

/**
 * Renders a modal form for creating or editing system users
 * In create mode: empty form with intro section
 * In edit mode: pre-filled from user prop, no intro section
 */
export function UserModal({
  mode,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  error = null,
  roles = [],
  rolesLoading = false,
  user,
}: UserModalProps) {
  const isEdit = mode === 'edit';

  // Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Reset form when modal opens in create mode (defense-in-depth for Bug #28)
  useEffect(() => {
    if (isOpen && !isEdit) {
      resetForm();
    }
  }, [isOpen, isEdit]);

  // Pre-fill form when user data changes (edit mode)
  useEffect(() => {
    if (isEdit && user && isOpen) {
      setEmail(user.email);
      setName(user.name);
      setSelectedRoles(user.roles);
      setSelectedProfiles(user.profiles || []);
      setFieldErrors({});
      setHasAttemptedSubmit(false);
    }
  }, [user, isOpen, isEdit]);

  // Validation logic
  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else {
      if (!EMAIL_REGEX.test(email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (!name.trim()) {
      errors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (selectedRoles.length === 0) {
      errors.roles = 'Please select at least one role';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    if (isEdit && user) {
      setEmail(user.email);
      setName(user.name);
      setSelectedRoles(user.roles);
      setSelectedProfiles(user.profiles || []);
    } else {
      setEmail('');
      setName('');
      setSelectedRoles([]);
      setSelectedProfiles([]);
    }
    setFieldErrors({});
    setHasAttemptedSubmit(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleRoleChange = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const handleProfileChange = (profileName: string) => {
    setSelectedProfiles((prev) =>
      prev.includes(profileName)
        ? prev.filter((p) => p !== profileName)
        : [...prev, profileName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!validateForm()) {
      return;
    }

    try {
      const formData: UserFormData = {
        email: email.trim(),
        name: name.trim(),
        roles: selectedRoles,
        profiles: selectedProfiles.length > 0 ? selectedProfiles : undefined,
      };

      await onSubmit(formData);
      resetForm();
    } catch {
      // Error handling is done by parent component
    }
  };

  // Edit mode guard
  if (isEdit && !user) {
    return null;
  }

  const title = isEdit ? `Edit User: ${user!.name}` : 'Add System User';
  const submitLabel = isEdit ? 'Save Changes' : 'Create User';
  const loadingLabel = isEdit ? 'Saving...' : 'Creating...';
  const cancelAriaLabel = isEdit ? 'Cancel editing user' : 'Cancel creating user';
  const submitAriaLabel = isEdit ? 'Save user changes' : 'Create user';

  return (
    <ModalWrapper
      isOpen={isOpen}
      title={title}
      onClose={handleClose}
      size="lg"
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={cancelAriaLabel}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rolesLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            aria-label={submitAriaLabel}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {loadingLabel}
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Intro Section (create mode only) */}
        {!isEdit && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg space-y-2">
            <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">
              Add a manager, admin, or contractor to the system.
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              This does NOT create an onboarding journey. If you're onboarding a new employee,
              go back to the Dashboard and click "New Hire" instead.
            </p>
          </div>
        )}

        {/* Server Error Messages */}
        {error && <ErrorAlert message={error} />}

        {/* Email */}
        <div>
          <label htmlFor="user-email" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., john.doe@company.com"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-brand-500 outline-none transition-colors ${
              hasAttemptedSubmit && fieldErrors.email
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-brand-500'
            }`}
            required
            aria-required="true"
            aria-label="User email"
            aria-describedby={
              hasAttemptedSubmit && fieldErrors.email ? 'email-error' : undefined
            }
            disabled={isSubmitting}
          />
          {hasAttemptedSubmit && fieldErrors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Name */}
        <div>
          <label htmlFor="user-name" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="user-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., John Doe"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-brand-500 outline-none transition-colors ${
              hasAttemptedSubmit && fieldErrors.name
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600 focus:ring-red-500'
                : 'border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-brand-500'
            }`}
            required
            aria-required="true"
            aria-label="User name"
            aria-describedby={
              hasAttemptedSubmit && fieldErrors.name ? 'name-error' : undefined
            }
            disabled={isSubmitting}
          />
          {hasAttemptedSubmit && fieldErrors.name && (
            <p id="name-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {fieldErrors.name}
            </p>
          )}
        </div>

        {/* Roles */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            {isEdit ? 'Roles' : 'System Roles'} <span className="text-red-500">*</span>
          </label>
          {!isEdit && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Select which features and dashboards this user can access (e.g., Manager to see team dashboard).
              This is different from employee onboarding roles.
            </p>
          )}
          {rolesLoading ? (
            <div className="text-slate-500 dark:text-slate-400 text-sm">Loading roles...</div>
          ) : roles.length > 0 ? (
            <div className="space-y-2">
              {roles.map((role) => (
                <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.name)}
                    onChange={() => handleRoleChange(role.name)}
                    className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    aria-label={`Select role: ${role.name}`}
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{role.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 p-2 rounded">
              No roles available. Please create a role first.
            </p>
          )}
          {hasAttemptedSubmit && fieldErrors.roles && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {fieldErrors.roles}
            </p>
          )}
        </div>

        {/* Profiles (Optional) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
            Profiles <span className="text-slate-500 dark:text-slate-400">(Optional)</span>
          </label>
          <div className="space-y-2">
            {['Engineering', 'Sales', 'Product', 'HR', 'All'].map((profile) => (
              <label key={profile} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedProfiles.includes(profile)}
                  onChange={() => handleProfileChange(profile)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  aria-label={`Select profile: ${profile}`}
                  disabled={isSubmitting}
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{profile}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Select which departments or teams this user should have access to.
          </p>
        </div>
      </form>
    </ModalWrapper>
  );
}
