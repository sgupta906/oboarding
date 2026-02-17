/**
 * pdfParser Unit Tests
 * Tests for parseBulletsToSteps (pure function) and extractTextFromPdf (mocked pdfjs-dist)
 * Written BEFORE implementation (TDD red phase)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import { parseBulletsToSteps, extractTextFromPdf } from './pdfParser';

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
    expect(result).toHaveLength(4);
    expect(result[0].title).toContain('Work with Haley');
    expect(result[1].title).toContain('Signature Block');
    expect(result[2].title).toContain('Coordinate');
    expect(result[3].title).toContain('Slack channels');
  });

  it('skips imperative verb lines ending with colon (section headers)', () => {
    const input = [
      'Complete these first few trainings:',
      'Complete the New Hire Survey',
      'Review your benefits package:',
      'Review BCBS in Gusto.',
    ].join('\n');
    const result = parseBulletsToSteps(input);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Complete the New Hire Survey');
    expect(result[1].title).toBe('Review BCBS in Gusto.');
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
});

// ===========================================================================
// extractTextFromPdf tests (mocked pdfjs-dist)
// ===========================================================================

describe('extractTextFromPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createMockFile(name = 'test.pdf'): File {
    const blob = new Blob(['fake pdf content'], { type: 'application/pdf' });
    return new File([blob], name, { type: 'application/pdf' });
  }

  interface MockTextItem {
    str: string;
    transform?: number[];
    hasEOL?: boolean;
  }

  function createMockPdfDocument(pages: (string[] | MockTextItem[])[]) {
    return {
      numPages: pages.length,
      getPage: vi.fn().mockImplementation((pageNum: number) =>
        Promise.resolve({
          getTextContent: vi.fn().mockResolvedValue({
            items: pages[pageNum - 1].map((item) =>
              typeof item === 'string' ? { str: item } : item
            ),
          }),
        })
      ),
    };
  }

  it('returns extracted text from single-page PDF', async () => {
    const mockDoc = createMockPdfDocument([['Hello', ' ', 'World']]);
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve(mockDoc),
    } as any);

    const file = createMockFile();
    const result = await extractTextFromPdf(file);
    expect(result).toBe('Hello World');
  });

  it('returns text from multi-page PDF joined by newlines', async () => {
    const mockDoc = createMockPdfDocument([
      ['Page 1 text'],
      ['Page 2 text'],
    ]);
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve(mockDoc),
    } as any);

    const file = createMockFile();
    const result = await extractTextFromPdf(file);
    expect(result).toBe('Page 1 text\nPage 2 text');
  });

  it('returns empty string for PDF with no text', async () => {
    const mockDoc = createMockPdfDocument([[]]);
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve(mockDoc),
    } as any);

    const file = createMockFile();
    const result = await extractTextFromPdf(file);
    expect(result).toBe('');
  });

  it('throws error for corrupt/invalid file', async () => {
    mockGetDocument.mockImplementation(() => ({
      promise: new Promise((_, reject) =>
        reject(new Error('Invalid PDF structure'))
      ),
    }));

    const file = createMockFile();
    await expect(extractTextFromPdf(file)).rejects.toThrow(
      'Failed to extract text from PDF'
    );
  });

  it('preserves line breaks using hasEOL markers', async () => {
    const mockDoc = createMockPdfDocument([
      [
        { str: '☐ Work with Haley', hasEOL: true },
        { str: '☐ Set up Signature Block', hasEOL: true },
        { str: '☐ Join Slack channels', hasEOL: true },
      ] as MockTextItem[],
    ]);
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve(mockDoc),
    } as any);

    const file = createMockFile();
    const result = await extractTextFromPdf(file);
    expect(result).toContain('☐ Work with Haley\n');
    expect(result).toContain('☐ Set up Signature Block\n');
    expect(result).toContain('☐ Join Slack channels');
  });

  it('preserves line breaks using Y-position changes', async () => {
    const mockDoc = createMockPdfDocument([
      [
        { str: '☐ First item', transform: [0, 0, 0, 0, 50, 700] },
        { str: '☐ Second item', transform: [0, 0, 0, 0, 50, 680] },
        { str: '☐ Third item', transform: [0, 0, 0, 0, 50, 660] },
      ] as MockTextItem[],
    ]);
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve(mockDoc),
    } as any);

    const file = createMockFile();
    const result = await extractTextFromPdf(file);
    const lines = result.split('\n').filter(Boolean);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('☐ First item');
    expect(lines[1]).toBe('☐ Second item');
    expect(lines[2]).toBe('☐ Third item');
  });

  it('concatenates items on the same Y-position', async () => {
    const mockDoc = createMockPdfDocument([
      [
        { str: 'Hello ', transform: [0, 0, 0, 0, 50, 700] },
        { str: 'World', transform: [0, 0, 0, 0, 100, 700] },
      ] as MockTextItem[],
    ]);
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve(mockDoc),
    } as any);

    const file = createMockFile();
    const result = await extractTextFromPdf(file);
    expect(result).toBe('Hello World');
  });

  it('configures worker source', () => {
    // Worker source is configured at module load time when pdfParser is imported.
    // Verify it was set using the CDN URL pattern with the pdfjs-dist version.
    expect(mockWorkerOptions.workerSrc).toContain('pdf.worker.min.mjs');
  });
});
