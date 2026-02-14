/**
 * Mock data simulating database tables
 * This structure mirrors what would be stored in a real backend
 */

import type { Step, Suggestion } from '../types';

/**
 * Initial steps for a new employee's onboarding journey
 * These represent the standard flow for all or specific roles
 */
export const INITIAL_STEPS: Step[] = [
  {
    id: 1,
    title: 'Setup Corporate Gmail',
    description:
      'Your temporary password is in your personal email. Log in and set up 2FA immediately.',
    role: 'All',
    owner: 'IT Support',
    expert: 'Sarah J.',
    status: 'completed',
    link: '#',
  },
  {
    id: 2,
    title: 'Install VS Code & Extensions',
    description:
      "Download VS Code. Please install the 'Prettier' and 'ESLint' extensions using the company profile.",
    role: 'Engineering',
    owner: 'DevOps',
    expert: 'Mike T.',
    status: 'pending',
    link: '#',
  },
  {
    id: 3,
    title: 'Configure VPN Access',
    description:
      'Download the Cisco AnyConnect client. Use the server address: `vpn.company.internal`. You will need your RSA token.',
    role: 'All',
    owner: 'NetSec',
    expert: 'Alex R.',
    status: 'pending',
    link: '#',
  },
  {
    id: 4,
    title: 'Join Slack Channels',
    description:
      'Join #general, #engineering, and #random. Say hello in #general!',
    role: 'All',
    owner: 'HR',
    expert: 'Lisa M.',
    status: 'pending',
    link: '#',
  },
];

/**
 * Initial suggestions/feedback from employees
 * These would typically be submitted through the modal interface
 */
export const INITIAL_SUGGESTIONS: Suggestion[] = [
  {
    id: 101,
    stepId: 1,
    user: 'Jane Doe',
    text: 'The link to 2FA setup in the doc is broken. It should point to the new Okta portal.',
    status: 'pending',
  },
];

/**
 * Mock activity log for manager dashboard
 * Shows recent actions from employees during onboarding
 */
export const MOCK_ACTIVITIES = [
  {
    id: '1',
    userInitials: 'JD',
    action: 'completed "Setup AWS"',
    timeAgo: '24 mins ago',
  },
  {
    id: '2',
    userInitials: 'MK',
    action: 'reported stuck on "VPN Configuration"',
    timeAgo: '1 hour ago',
  },
  {
    id: '3',
    userInitials: 'AR',
    action: 'submitted suggestion for "Gmail Setup"',
    timeAgo: '2 hours ago',
  },
];

/**
 * KPI values for the manager dashboard
 * In a real app, these would be computed from the database
 */
export const MOCK_KPI_VALUES = {
  activeOnboardings: 12,
  stuckEmployees: 2,
  docFeedback: 3,
  stuckEmployeeNames: ['Alex R', 'John D'],
};
