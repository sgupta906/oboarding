/**
 * Unit tests for WelcomeHeader component
 * Tests rendering, option element styling, and regression
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WelcomeHeader } from './WelcomeHeader';
import type { Profile } from '../../types';

const mockProfiles: Profile[] = [
  {
    id: 'p1',
    name: 'Engineer',
    roleTags: ['Engineering', 'All'],
    createdAt: Date.now(),
    createdBy: 'admin',
  },
  {
    id: 'p2',
    name: 'Designer',
    roleTags: ['Design', 'All'],
    createdAt: Date.now(),
    createdBy: 'admin',
  },
];

describe('WelcomeHeader', () => {
  it('renders welcome message and progress', () => {
    render(
      <WelcomeHeader
        employeeName="Alice"
        team="Engineering"
        progress={50}
      />
    );

    expect(screen.getByText(/Welcome to the Team, Alice/)).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('option elements have explicit text-slate-900 bg-white', () => {
    const { container } = render(
      <WelcomeHeader
        employeeName="Alice"
        team="Engineering"
        progress={50}
        profiles={mockProfiles}
        onProfileChange={vi.fn()}
      />
    );

    const options = container.querySelectorAll('option');
    expect(options.length).toBeGreaterThan(0);

    options.forEach((option) => {
      expect(option.className).toContain('text-slate-900');
      expect(option.className).toContain('bg-white');
    });
  });

  it('select element retains text-white for gradient background (regression)', () => {
    render(
      <WelcomeHeader
        employeeName="Alice"
        team="Engineering"
        progress={50}
        profiles={mockProfiles}
        onProfileChange={vi.fn()}
      />
    );

    const select = screen.getByLabelText('Filter steps by profile');
    expect(select.className).toContain('text-white');
  });
});
