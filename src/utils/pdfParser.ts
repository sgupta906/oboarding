/**
 * PDF Parser Utility
 * Extracts text from PDF files using pdfjs-dist and parses bullet/numbered lists
 * into template steps for the PDF template import feature.
 *
 * Uses dynamic import pattern -- this module is only loaded when the user
 * clicks "Import from PDF" to keep the main bundle small.
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure the PDF.js worker via CDN (matches the installed library version)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Represents a single parsed step extracted from a PDF document.
 */
export interface ParsedStep {
  title: string;
  description: string;
  link: string;
}

/** Link extracted from a PDF annotation */
export interface PdfLink {
  url: string;
  /** Y-position on the page (PDF coordinates, origin at bottom-left) */
  y: number;
  pageNum: number;
}

/** Full extraction result from a PDF */
export interface PdfContent {
  text: string;
  links: PdfLink[];
}

/**
 * Regex that matches common bullet and numbered list patterns found in PDFs.
 *
 * Supported patterns:
 * - Unicode bullets: bullet, triangular bullet, white bullet, hyphen bullet, bullet operator
 * - ASCII bullets: -, *, +
 * - Arrow markers: >
 * - Numbered lists: 1. or 1)
 * - Lettered lists: a. or a)
 * - Checkbox markers: ballot box, checked ballot box, crossed ballot box, white/black square
 * - Period bullets: . (period followed by space — common PDF rendering of bullet glyphs)
 */
const BULLET_REGEX =
  /^(?:[\u2022\u2023\u25E6\u2043\u2219\-\*\+>]|\d+[.)]\s|[a-zA-Z][.)]\s|\.\s|[\u2610\u2611\u2612\u25A1\u25A0])\s*(.+)/;

/**
 * Common imperative verbs that start onboarding task items.
 * Used as a secondary heuristic to capture checkbox/task items where the
 * checkbox was rendered as a graphic (not extractable text) rather than
 * a Unicode character.
 */
const IMPERATIVE_VERB_REGEX =
  /^(?:complete|sign|fill|set|work|follow|coordinate|join|send|upload|review|log|verify|make|schedule|read|watch|meet|configure|install|create|update|check|submit|register|request|contact|prepare|attend|obtain|download|print|bring|collect|gather|provide|pick|order|setup)\b/i;

/** Matches bare URLs in text */
const URL_REGEX = /^https?:\/\/\S+$/i;

/**
 * Extracts meaningful keywords from a URL for matching against step text.
 * e.g., "https://idco.dmdc.osd.mil/idco/locator" → ["idco", "dmdc", "locator"]
 */
function extractUrlKeywords(url: string): string[] {
  try {
    const u = new URL(url);
    const parts = (u.hostname + u.pathname)
      .split(/[./\-_]/)
      .filter((p) => p.length >= 3)
      .map((p) => p.toLowerCase());
    // Filter out generic TLDs/subdomains
    const generic = new Set(['www', 'com', 'org', 'net', 'gov', 'mil', 'edu', 'https', 'http', 'html', 'htm', 'index', 'php', 'aspx']);
    return parts.filter((p) => !generic.has(p));
  } catch {
    return [];
  }
}

/**
 * Splits a title on em-dash or double-hyphen separator into title + description.
 * "Complete Security Training — At a minimum, you must..." becomes:
 *   title: "Complete Security Training"
 *   description: "At a minimum, you must..."
 */
function splitTitleDescription(text: string): { title: string; description: string } {
  // Try em-dash first, then double-hyphen with spaces
  for (const sep of [' — ', ' -- ']) {
    const idx = text.indexOf(sep);
    if (idx > 0) {
      return {
        title: text.substring(0, idx).trim(),
        description: text.substring(idx + sep.length).trim(),
      };
    }
  }
  return { title: text, description: '' };
}

/**
 * Classifies a line as a step, header, continuation text, URL, or skip.
 */
function classifyLine(line: string): 'bullet' | 'verb' | 'header' | 'url' | 'continuation' | 'skip' {
  if (URL_REGEX.test(line)) return 'url';
  if (BULLET_REGEX.test(line)) return 'bullet';
  if (line.length >= 8 && line.length <= 200 && IMPERATIVE_VERB_REGEX.test(line) && !line.endsWith(':')) return 'verb';
  // Headers must start with uppercase/digit (filters out sentence fragments like
  // "steps will prevent you from obtaining your CAC card:")
  if (line.endsWith(':') && line.length >= 8 && line.length <= 80 && /^[A-Z\d]/.test(line)) return 'header';
  if (line.length >= 15 && line.length <= 300) return 'continuation';
  return 'skip';
}

/**
 * Parses raw text into template steps using a single-pass streaming algorithm.
 *
 * Features:
 * - Bullet/numbered list detection (-, *, 1., ☐, etc.)
 * - Imperative verb detection for graphical-checkbox PDFs
 * - Em-dash title/description splitting ("Task — Details" → title + description)
 * - Header-to-step conversion ("Billable Time:" → step with following text as description)
 * - Continuation line accumulation (non-step text → previous step's description)
 * - Bare URL detection → previous step's link field
 * - PDF annotation link matching by Y-position proximity
 *
 * @param rawText - Raw text extracted from a PDF document
 * @param links - Optional array of PDF annotation links for matching
 * @returns Array of parsed steps (may be empty if no parseable content)
 */
export function parseBulletsToSteps(rawText: string, links?: PdfLink[]): ParsedStep[] {
  const lines = rawText.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const steps: ParsedStep[] = [];
  // Pending context from non-actionable headers — flows into next step's description
  let pendingContext = '';

  for (const line of lines) {
    const type = classifyLine(line);

    switch (type) {
      case 'bullet': {
        const match = line.match(BULLET_REGEX);
        if (match) {
          const raw = match[1].trim();
          const { title, description } = splitTitleDescription(raw);
          if (title) {
            const desc = pendingContext
              ? (pendingContext + (description ? ' ' + description : ''))
              : description;
            steps.push({ title, description: desc, link: '' });
            pendingContext = '';
          }
        }
        break;
      }

      case 'verb': {
        const { title, description } = splitTitleDescription(line);
        const desc = pendingContext
          ? (pendingContext + (description ? ' ' + description : ''))
          : description;
        steps.push({ title, description: desc, link: '' });
        pendingContext = '';
        break;
      }

      case 'header': {
        // Strip trailing colon for the title
        const headerText = line.slice(0, -1).trim();
        if (headerText.length >= 5) {
          // Actionable headers (contain imperative verb) become steps
          // Non-actionable headers become context for the next step
          if (IMPERATIVE_VERB_REGEX.test(headerText)) {
            steps.push({ title: headerText, description: pendingContext, link: '' });
            pendingContext = '';
          } else {
            // Non-actionable: accumulate as context or append to previous step
            if (steps.length > 0) {
              const prev = steps[steps.length - 1];
              prev.description = prev.description
                ? prev.description + ' ' + headerText + '.'
                : headerText + '.';
            } else {
              pendingContext = pendingContext
                ? pendingContext + ' ' + headerText + '.'
                : headerText + '.';
            }
          }
        }
        break;
      }

      case 'url': {
        // Assign URL to previous step's link field
        if (steps.length > 0 && !steps[steps.length - 1].link) {
          steps[steps.length - 1].link = line;
        }
        break;
      }

      case 'continuation': {
        // Append to previous step's description
        if (steps.length > 0) {
          const prev = steps[steps.length - 1];
          prev.description = prev.description
            ? prev.description + ' ' + line
            : line;
        } else {
          // No step yet — accumulate as pending context
          pendingContext = pendingContext
            ? pendingContext + ' ' + line
            : line;
        }
        break;
      }

      // 'skip' — ignore (short headers like "First Day", fragments, etc.)
    }
  }

  // Fallback: if no steps found, each reasonably-sized line becomes a step
  if (steps.length === 0) {
    for (const line of lines) {
      if (line.length >= 8 && line.length <= 200) {
        const { title, description } = splitTitleDescription(line);
        steps.push({ title, description, link: '' });
      }
    }
  }

  // Associate PDF annotation links with steps.
  // Strategy: try to match link URL domain/path keywords to step text.
  // Unmatched links are distributed to linkless steps in order (better than nothing).
  if (links && links.length > 0) {
    const unmatched: PdfLink[] = [];

    for (const link of links) {
      // Extract keywords from URL path for text matching
      const urlKeywords = extractUrlKeywords(link.url);

      // Try to find the best matching step by keyword overlap
      let bestStep: ParsedStep | null = null;
      let bestScore = 0;

      for (const step of steps) {
        if (step.link) continue; // Already has a link
        const stepText = (step.title + ' ' + step.description).toLowerCase();
        let score = 0;
        for (const kw of urlKeywords) {
          if (stepText.includes(kw)) score++;
        }
        if (score > bestScore) {
          bestScore = score;
          bestStep = step;
        }
      }

      if (bestStep && bestScore > 0) {
        bestStep.link = link.url;
      } else {
        unmatched.push(link);
      }
    }

    // Distribute remaining unmatched links to linkless steps in order
    let linkIdx = 0;
    for (const step of steps) {
      if (linkIdx >= unmatched.length) break;
      if (!step.link) {
        step.link = unmatched[linkIdx].url;
        linkIdx++;
      }
    }
  }

  return steps;
}

/**
 * Reads a File as an ArrayBuffer, using file.arrayBuffer() where available
 * and falling back to FileReader for environments that don't support it.
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extracts text content and link annotations from a PDF file.
 *
 * Text extraction uses Y-position and hasEOL markers from pdf.js text items
 * to reconstruct line breaks. Link extraction pulls URLs from PDF annotations.
 *
 * @param file - A File object representing the PDF to extract from
 * @returns Promise resolving to text content and link annotations
 * @throws Error if the PDF cannot be parsed
 */
export async function extractPdfContent(file: File): Promise<PdfContent> {
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pages: string[] = [];
    const allLinks: PdfLink[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);

      // Extract text with line break reconstruction
      const textContent = await page.getTextContent();
      let pageText = '';
      let lastY: number | null = null;

      for (const item of textContent.items) {
        if (!('str' in item)) continue;
        const textItem = item as {
          str: string;
          transform?: number[];
          hasEOL?: boolean;
        };
        const str = textItem.str;
        const currentY = textItem.transform?.[5];

        // Y-position changed significantly → new line
        if (
          lastY !== null &&
          currentY !== undefined &&
          Math.abs(currentY - lastY) > 2
        ) {
          if (pageText.length > 0 && !pageText.endsWith('\n')) {
            pageText += '\n';
          }
        }

        pageText += str;

        if (currentY !== undefined) {
          lastY = currentY;
        }

        // Explicit end-of-line marker from pdf.js
        if (textItem.hasEOL && !pageText.endsWith('\n')) {
          pageText += '\n';
        }
      }

      pages.push(pageText.trimEnd());

      // Extract link annotations
      try {
        const annotations = await page.getAnnotations();
        for (const annot of annotations) {
          if (annot.subtype === 'Link' && annot.url) {
            const y = annot.rect?.[1] ?? 0;
            allLinks.push({ url: annot.url, y, pageNum: i });
          }
        }
      } catch {
        // Link extraction is best-effort — don't fail the whole import
      }
    }

    return {
      text: pages.join('\n'),
      links: allLinks,
    };
  } catch (error) {
    throw new Error(
      'Failed to extract text from PDF. The file may be corrupt or not a valid PDF.'
    );
  }
}

/**
 * Legacy function — extracts only text (no links).
 * Kept for backward compatibility with existing callers and tests.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const content = await extractPdfContent(file);
  return content.text;
}
