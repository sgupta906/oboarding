/**
 * pdfParser Unit Tests
 * Tests for parseBulletsToSteps (pure function)
 * Written BEFORE implementation (TDD red phase)
 */

import { describe, it, expect, vi } from 'vitest';

// Use vi.hoisted() to declare mock references that are accessible inside vi.mock factory
const { mockGetDocument, mockWorkerOptions } = vi.hoisted(() => ({
  mockGetDocument: vi.fn(),
  mockWorkerOptions: { workerSrc: '' },
}));

// Mock pdfjs-dist before importing pdfParser
vi.mock('pdfjs-dist', () => {
  return {
    default: {
      getDocument: mockGetDocument,
      GlobalWorkerOptions: mockWorkerOptions,
      version: '5.0.0',
    },
    getDocument: mockGetDocument,
    GlobalWorkerOptions: mockWorkerOptions,
    version: '5.0.0',
  };
});

import { parseBulletsToSteps } from './pdfParser';

describe('parseBulletsToSteps', () => {
  // =========================================================================
  // Bullet pattern recognition
  // =========================================================================

  it('parses dash-prefixed bullets', () => {
    const input = '- Setup laptop\n- Install IDE\n- Configure VPN';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(3);
    expect(result[0].title).toBe('Setup laptop');
    expect(result[1].title).toBe('Install IDE');
    expect(result[2].title).toBe('Configure VPN');
  });

  it('parses asterisk-prefixed bullets', () => {
    const input = '* Read handbook\n* Sign NDA';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Read handbook');
    expect(result[1].title).toBe('Sign NDA');
  });

  it('parses plus-prefixed bullets', () => {
    const input = '+ Meet your buddy\n+ Tour the office';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Meet your buddy');
    expect(result[1].title).toBe('Tour the office');
  });

  it('parses numbered lists with dots', () => {
    const input = '1. Complete HR paperwork\n2. Setup email\n3. Join Slack channels';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(3);
    expect(result[0].title).toBe('Complete HR paperwork');
    expect(result[1].title).toBe('Setup email');
    expect(result[2].title).toBe('Join Slack channels');
  });

  it('parses numbered lists with parens', () => {
    const input = '1) Read documentation\n2) Watch training videos';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Read documentation');
    expect(result[1].title).toBe('Watch training videos');
  });

  it('parses lettered lists with dots', () => {
    const input = 'a. First task\nb. Second task';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('First task');
    expect(result[1].title).toBe('Second task');
  });

  it('parses lettered lists with parens', () => {
    const input = 'a) First step\nb) Second step\nc) Third step';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(3);
    expect(result[0].title).toBe('First step');
    expect(result[1].title).toBe('Second step');
    expect(result[2].title).toBe('Third step');
  });

  it('parses unicode bullet characters', () => {
    const input = '\u2022 Setup workstation\n\u2022 Order equipment';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Setup workstation');
    expect(result[1].title).toBe('Order equipment');
  });

  it('parses arrow markers', () => {
    const input = '> Complete orientation\n> Submit tax forms';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Complete orientation');
    expect(result[1].title).toBe('Submit tax forms');
  });

  it('parses checkbox markers', () => {
    const input = '\u2610 Sign employment contract\n\u2610 Complete benefits enrollment';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Sign employment contract');
    expect(result[1].title).toBe('Complete benefits enrollment');
  });

  it('parses period-prefix bullets (common PDF glyph rendering)', () => {
    const input =
      '. Complete Security Training\n. Sign SF312\n. Employee Paperwork';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(3);
    expect(result[0].title).toBe('Complete Security Training');
    expect(result[1].title).toBe('Sign SF312');
    expect(result[2].title).toBe('Employee Paperwork');
  });

  it('captures lines starting with imperative verbs (graphical checkbox items)', () => {
    const input = [
      'Onboarding Checklist',
      'First Day',
      'Work with Haley to get all of your accounts set up',
      'Set up your Signature Block',
      'Coordinate with Haley to get your company photo taken',
      'Join some Slack channels (#company_announcements, #dev_lounge)',
      'The Lincoln location is recommended for your convenience.',
      'Preferred Location:',
    ].join('\n');
    const result = parseBulletsToSteps(input);
    // 4 verb steps; "The Lincoln..." becomes description; "Preferred Location:" is non-actionable header → context
    expect(result).toHaveLength(4);
    expect(result[0].title).toContain('Work with Haley');
    expect(result[1].title).toContain('Signature Block');
    expect(result[2].title).toContain('Coordinate');
    expect(result[3].title).toContain('Slack channels');
    // "The Lincoln..." becomes description of previous step, plus "Preferred Location." as context
    expect(result[3].description).toContain('Lincoln location');
  });

  it('converts actionable header-with-colon lines into steps', () => {
    const input = [
      'Complete these first few trainings:',
      'Complete the New Hire Survey',
      'Review your benefits package:',
      'Review BCBS in Gusto.',
    ].join('\n');
    const result = parseBulletsToSteps(input);
    // Actionable headers (imperative verbs: Complete, Review) become steps
    expect(result).toHaveLength(4);
    expect(result[0].title).toBe('Complete these first few trainings');
    expect(result[1].title).toBe('Complete the New Hire Survey');
    expect(result[2].title).toBe('Review your benefits package');
    expect(result[3].title).toBe('Review BCBS in Gusto.');
  });

  it('converts non-actionable headers into context for next step', () => {
    const input = [
      'Prerequisites:',
      'Complete Security Training',
      'Billing Info:',
      'The drive time is billable.',
    ].join('\n');
    const result = parseBulletsToSteps(input);
    // "Prerequisites:" is non-actionable → becomes context for next step
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Complete Security Training');
    expect(result[0].description).toContain('Prerequisites.');
    // "Billing Info:" has no following step → appended to last step description
  });

  it('combines bullet items and imperative verb items without duplicates', () => {
    const input = [
      '1. Complete Security Training',
      '2. Sign SF-312',
      'Work with Haley to get all of your accounts set up',
      'Upload course certificates in training tracker profile',
      'The drive time to Lincoln is considered billable.',
    ].join('\n');
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(4);
    expect(result[0].title).toBe('Complete Security Training');
    expect(result[1].title).toBe('Sign SF-312');
    expect(result[2].title).toContain('Work with Haley');
    expect(result[3].title).toContain('Upload course certificates');
  });

  it('parses BB-Shyft onboarding format (mixed bullets + graphical checkboxes)', () => {
    const input = [
      'Shyft Onboarding',
      'First Day',
      'First Things First (G&A Onboarding)',
      // These lines had graphical checkboxes (not text) in the PDF:
      'Work with Haley to get all of your accounts set up (except Guideline)',
      'Follow along on the Handy Links page',
      'Set up your Signature Block',
      'Coordinate with Haley to get your company photo taken',
      'Join some Slack channels (#company_announcements, #dev_lounge)',
      'Send your supervisor a direct message in Slack',
      // These have text bullet prefixes:
      '1. Complete Security Training',
      '2. Sign SF-312',
      'Fill Out Forms (G&A Onboarding)',
      'Complete the New Hire Survey',
      'Complete the Media Release',
      'Upload course certificates in training tracker profile',
      'Review the Timesheet Cheat Sheet',
      'Log your time in Unanet for the day',
    ].join('\n');
    const result = parseBulletsToSteps(input);
    // Should capture numbered items + imperative verb items
    expect(result.length).toBeGreaterThanOrEqual(14);
    // Numbered items (Pass 1)
    expect(result.some((s) => s.title.includes('Security Training'))).toBe(
      true
    );
    expect(result.some((s) => s.title.includes('SF-312'))).toBe(true);
    // Imperative verb items (Pass 2)
    expect(result.some((s) => s.title.includes('Work with Haley'))).toBe(true);
    expect(result.some((s) => s.title.includes('Signature Block'))).toBe(true);
    expect(result.some((s) => s.title.includes('New Hire Survey'))).toBe(true);
    expect(result.some((s) => s.title.includes('Timesheet Cheat Sheet'))).toBe(
      true
    );
    // Headers should NOT be included
    expect(result.some((s) => s.title === 'First Day')).toBe(false);
    expect(result.some((s) => s.title === 'Shyft Onboarding')).toBe(false);
  });

  // =========================================================================
  // Filtering and edge cases
  // =========================================================================

  it('ignores non-bullet text like headers and paragraphs', () => {
    const input = 'Onboarding Checklist\nWelcome to the team!\n- Setup laptop\n- Install IDE\nThank you';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Setup laptop');
    expect(result[1].title).toBe('Install IDE');
  });

  it('handles mixed bullet styles in one document', () => {
    const input = '- First task\n* Second task\n1. Third task\na) Fourth task';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(4);
    expect(result[0].title).toBe('First task');
    expect(result[1].title).toBe('Second task');
    expect(result[2].title).toBe('Third task');
    expect(result[3].title).toBe('Fourth task');
  });

  it('trims whitespace from extracted titles', () => {
    const input = '-   Setup laptop   \n-  Install IDE  ';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Setup laptop');
    expect(result[1].title).toBe('Install IDE');
  });

  it('returns empty array for empty string input', () => {
    const result = parseBulletsToSteps('');
    expect(result).toEqual([]);
  });

  it('returns empty array for whitespace-only input', () => {
    const result = parseBulletsToSteps('   \n  \n   ');
    expect(result).toEqual([]);
  });

  // =========================================================================
  // Fallback mode
  // =========================================================================

  it('falls back to line-per-step when no bullets are detected', () => {
    const input = 'Setup your laptop computer\nInstall development tools\nConfigure your VPN access';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(3);
    expect(result[0].title).toBe('Setup your laptop computer');
    expect(result[1].title).toBe('Install development tools');
    expect(result[2].title).toBe('Configure your VPN access');
  });

  it('fallback ignores very short lines (< 8 chars)', () => {
    const input = 'Hi\nOK\nSetup your development environment\nConfigure your email';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Setup your development environment');
    expect(result[1].title).toBe('Configure your email');
  });

  it('fallback ignores very long lines (> 200 chars)', () => {
    const longLine = 'A'.repeat(201);
    const input = `Setup your laptop\n${longLine}\nInstall IDE`;
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Setup your laptop');
    expect(result[1].title).toBe('Install IDE');
  });

  // =========================================================================
  // Multi-page and description
  // =========================================================================

  it('handles multi-page text separated by newlines', () => {
    const input = '- Page 1 step 1\n- Page 1 step 2\n\n- Page 2 step 1\n- Page 2 step 2';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(4);
  });

  it('sets empty description for all parsed steps', () => {
    const input = '- Step one\n- Step two\n- Step three';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(3);
    for (const step of result) {
      expect(step.description).toBe('');
    }
  });

  // =========================================================================
  // Link association
  // =========================================================================

  it('assigns bare URLs to previous step link field', () => {
    const input = '- Complete Security Training\nhttps://example.com/training\n- Sign SF-312';
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(2);
    expect(result[0].link).toBe('https://example.com/training');
    expect(result[1].link).toBe('');
  });

  it('matches PDF annotation links to steps by URL keywords', () => {
    const input = '- Complete Security Training\n- Sign SF-312';
    const links = [
      { url: 'https://example.com/security/training', y: 100, pageNum: 1 },
    ];
    const result = parseBulletsToSteps(input, links);
    expect(result[0].link).toBe('https://example.com/security/training');
    expect(result[1].link).toBe('');
  });

  it('distributes unmatched links to linkless steps in order', () => {
    const input = '- Step one\n- Step two\n- Step three';
    const links = [
      { url: 'https://example.com/generic', y: 100, pageNum: 1 },
    ];
    const result = parseBulletsToSteps(input, links);
    // No keyword match → assigned to first linkless step
    expect(result[0].link).toBe('https://example.com/generic');
  });

  it('does not assign duplicate links when keyword matching works', () => {
    const input = '- Complete Security Training\n- Review benefits package';
    const links = [
      { url: 'https://example.com/security', y: 100, pageNum: 1 },
      { url: 'https://example.com/benefits', y: 200, pageNum: 1 },
    ];
    const result = parseBulletsToSteps(input, links);
    expect(result[0].link).toBe('https://example.com/security');
    expect(result[1].link).toBe('https://example.com/benefits');
  });

  it('does not overwrite bare URL links with annotation links', () => {
    const input = '- Complete Security Training\nhttps://inline.com/link\n- Step two';
    const links = [
      { url: 'https://annotation.com/link', y: 100, pageNum: 1 },
    ];
    const result = parseBulletsToSteps(input, links);
    // Bare URL was already assigned to step 1
    expect(result[0].link).toBe('https://inline.com/link');
    // Annotation link goes to step 2 (no keyword match → sequential fallback)
    expect(result[1].link).toBe('https://annotation.com/link');
  });
});
