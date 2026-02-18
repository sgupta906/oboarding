/**
 * SignInView Tests
 * Tests for sign-in page including Google OAuth button, email form, and dev-auth buttons
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import { SignInView } from './SignInView';

// Mock auth service
const mockSignInWithGoogle = vi.fn();
const mockSignInWithEmailLink = vi.fn();

vi.mock('../services/authService', () => ({
  signInWithGoogle: (...args: unknown[]) => mockSignInWithGoogle(...args),
  signInWithEmailLink: (...args: unknown[]) => mockSignInWithEmailLink(...args),
}));

// Mock authContext
vi.mock('../config/authContext', () => ({
  useAuth: () => ({
    user: null,
    role: null,
    loading: false,
    isAuthenticated: false,
    signOut: vi.fn(),
  }),
  impersonateUserForQA: vi.fn(),
}));

describe('SignInView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithGoogle.mockResolvedValue(undefined);
    mockSignInWithEmailLink.mockResolvedValue(undefined);
  });

  it('renders "Sign in with Google" button', () => {
    render(<SignInView />);

    expect(
      screen.getByRole('button', { name: /sign in with google/i }),
    ).toBeInTheDocument();
  });

  it('calls signInWithGoogle when Google button is clicked', async () => {
    const user = userEvent.setup();
    render(<SignInView />);

    await user.click(
      screen.getByRole('button', { name: /sign in with google/i }),
    );

    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('renders email form alongside Google button', () => {
    render(<SignInView />);

    // Google button should exist
    expect(
      screen.getByRole('button', { name: /sign in with google/i }),
    ).toBeInTheDocument();

    // Email input should also exist
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();

    // Sign in submit button should exist
    expect(
      screen.getByRole('button', { name: /^sign in$/i }),
    ).toBeInTheDocument();
  });

  it('hides dev-auth quick-login buttons when VITE_USE_DEV_AUTH is not true', () => {
    // In test env, VITE_USE_DEV_AUTH is set to 'false' via setup.ts
    // Quick login buttons should NOT be rendered
    render(<SignInView />);

    expect(
      screen.queryByText('Quick Login (Dev Mode):'),
    ).not.toBeInTheDocument();
  });
});
