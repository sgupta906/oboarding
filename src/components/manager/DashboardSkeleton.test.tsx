/**
 * DashboardSkeleton Component Tests
 * Verifies skeleton structure, accessibility, and animation classes
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardSkeleton } from './DashboardSkeleton';

describe('DashboardSkeleton', () => {
  it('renders skeleton structure with pulse-animated elements', () => {
    render(<DashboardSkeleton />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();

    // Should contain multiple animated skeleton elements
    const pulseElements = status.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('has role="status" and aria-label="Loading dashboard" for accessibility', () => {
    render(<DashboardSkeleton />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-label', 'Loading dashboard');
  });

  it('skeleton elements use animate-pulse class', () => {
    render(<DashboardSkeleton />);

    const status = screen.getByRole('status');
    // KPI skeleton cards + content grid blocks should all use animate-pulse
    const pulseElements = status.querySelectorAll('.animate-pulse');
    // At minimum: 3 KPI cards + 2 content grid cards = 5
    expect(pulseElements.length).toBeGreaterThanOrEqual(5);
  });
});
