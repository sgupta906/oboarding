/**
 * CreateUserModal Component - Form for creating new users
 * Allows managers to add new users with roles and profiles
 */

import { useState } from 'react';
import { ModalWrapper } from '../ui';
import { useRoles } from '../../hooks';
import type { UserFormData } from '../../types';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  isSubmitting?: boolean;
  error?: string | null;
}

interface FieldErrors {
  [key: string]: string;
}

/**
 * Renders a modal form for creating new users
 * Validates all required fields with client-side error feedback
 * @param isOpen - Whether modal is open
 * @param onClose - Callback to close modal
 * @param onSubmit - Callback with user data
 * @param isSubmitting - Whether submission is in progress
 * @param error - Server-side error message to display
 */
export function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  error = null,
}: CreateUserModalProps) {
  const { roles, isLoading: rolesLoading } = useRoles();

  // Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);

  // Validation state
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Validation logic
  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
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
    setEmail('');
    setName('');
    setSelectedRoles([]);
    setSelectedProfiles([]);
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
    } catch (err) {
      // Error handling is done by parent component
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      title="Add System User"
      onClose={handleClose}
      size="lg"
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Cancel creating user"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rolesLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            aria-label="Create user"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              'Create User'
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Intro Section */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
          <p className="text-sm text-amber-900 font-medium">
            Add a manager, admin, or contractor to the system.
          </p>
          <p className="text-xs text-amber-800">
            This does NOT create an onboarding journey. If you're onboarding a new employee,
            go back to the Dashboard and click "New Hire" instead.
          </p>
        </div>
        {/* Server Error Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="user-email" className="block text-sm font-medium text-slate-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., john.doe@company.com"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-indigo-500 outline-none transition-colors ${
              hasAttemptedSubmit && fieldErrors.email
                ? 'border-red-300 bg-red-50 focus:ring-red-500'
                : 'border-slate-300 focus:ring-indigo-500'
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
            <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Name */}
        <div>
          <label htmlFor="user-name" className="block text-sm font-medium text-slate-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="user-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., John Doe"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-indigo-500 outline-none transition-colors ${
              hasAttemptedSubmit && fieldErrors.name
                ? 'border-red-300 bg-red-50 focus:ring-red-500'
                : 'border-slate-300 focus:ring-indigo-500'
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
            <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
              {fieldErrors.name}
            </p>
          )}
        </div>

        {/* Roles */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            System Roles <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-600 mb-3">
            Select which features and dashboards this user can access (e.g., Manager to see team dashboard).
            This is different from employee onboarding roles.
          </p>
          {rolesLoading ? (
            <div className="text-slate-500 text-sm">Loading roles...</div>
          ) : roles.length > 0 ? (
            <div className="space-y-2">
              {roles.map((role) => (
                <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.name)}
                    onChange={() => handleRoleChange(role.name)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    aria-label={`Select role: ${role.name}`}
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-slate-700">{role.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
              No roles available. Please create a role first.
            </p>
          )}
          {hasAttemptedSubmit && fieldErrors.roles && (
            <p className="mt-1 text-sm text-red-600" role="alert">
              {fieldErrors.roles}
            </p>
          )}
        </div>

        {/* Profiles (Optional) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Profiles <span className="text-slate-500">(Optional)</span>
          </label>
          <div className="space-y-2">
            {['Engineering', 'Sales', 'Product', 'HR', 'All'].map((profile) => (
              <label key={profile} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedProfiles.includes(profile)}
                  onChange={() => handleProfileChange(profile)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  aria-label={`Select profile: ${profile}`}
                  disabled={isSubmitting}
                />
                <span className="text-sm text-slate-700">{profile}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Select which departments or teams this user should have access to.
          </p>
        </div>
      </form>
    </ModalWrapper>
  );
}
