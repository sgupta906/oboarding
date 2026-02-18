/**
 * Tests for ErrorAlert component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorAlert } from './ErrorAlert';

describe('ErrorAlert', () => {
  it('renders the error message', () => {
    render(<ErrorAlert message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('has alert role for accessibility', () => {
    render(<ErrorAlert message="Error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('applies additional className', () => {
    render(<ErrorAlert message="Error" className="mb-4" />);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('mb-4');
  });
});
