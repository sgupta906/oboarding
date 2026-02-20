/**
 * LoadingSpinner Component Tests
 * Verifies size variants, label display, and accessibility attributes
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props (md size, "Loading..." sr-only text)', () => {
    render(<LoadingSpinner />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();

    // Default sr-only text
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Default size is md: spinner should have w-8 h-8
    const spinner = status.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('renders sm size spinner with w-4 h-4 dimensions class', () => {
    render(<LoadingSpinner size="sm" />);

    const status = screen.getByRole('status');
    const spinner = status.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  it('renders lg size spinner with w-12 h-12 dimensions class', () => {
    render(<LoadingSpinner size="lg" />);

    const status = screen.getByRole('status');
    const spinner = status.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('w-12', 'h-12');
  });

  it('displays custom label text when label prop provided', () => {
    render(<LoadingSpinner label="Loading your onboarding..." />);

    expect(screen.getByText('Loading your onboarding...')).toBeInTheDocument();
  });

  it('has role="status" attribute on wrapper for accessibility', () => {
    render(<LoadingSpinner />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
  });
});
