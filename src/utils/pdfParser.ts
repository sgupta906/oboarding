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
 * Title comes from the bullet text; description is always empty (user fills in later).
 */
export interface ParsedStep {
  title: string;
  description: string;
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

/**
 * Parses raw text into template steps using a multi-pass heuristic.
 *
 * Algorithm:
 * 1. Split text on newlines, trim each line, filter empty lines
 * 2. Pass 1: Match lines against bullet/number regex (-, *, 1., ☐, etc.)
 * 3. Pass 2: Match lines starting with imperative verbs (catches checkbox items
 *    where the checkbox was a graphic, not extractable text)
 * 4. Fallback: if no steps found, each line between 8-200 chars becomes a step
 *
 * @param rawText - Raw text extracted from a PDF document
 * @returns Array of parsed steps (may be empty if no parseable content)
 */
export function parseBulletsToSteps(rawText: string): ParsedStep[] {
  const lines = rawText.split(/\n/).map((l) => l.trim()).filter(Boolean);

  const steps: ParsedStep[] = [];
  const seen = new Set<string>();

  // Pass 1: lines with explicit bullet/number prefixes
  for (const line of lines) {
    const match = line.match(BULLET_REGEX);
    if (match) {
      const title = match[1].trim();
      if (title && !seen.has(title)) {
        steps.push({ title, description: '' });
        seen.add(title);
      }
    }
  }

  // Pass 2: lines starting with imperative verbs (catches checkbox items
  // where the checkbox was a graphic, not extractable text)
  for (const line of lines) {
    if (
      line.length >= 8 &&
      line.length <= 200 &&
      !line.endsWith(':') &&
      IMPERATIVE_VERB_REGEX.test(line) &&
      !seen.has(line)
    ) {
      steps.push({ title: line, description: '' });
      seen.add(line);
    }
  }

  // Fallback: if still no steps, use each reasonably-sized line as a step
  if (steps.length === 0) {
    for (const line of lines) {
      if (line.length >= 8 && line.length <= 200) {
        steps.push({ title: line, description: '' });
      }
    }
  }

  return steps;
}

/**
 * Extracts all text content from a PDF file using pdfjs-dist.
 *
 * Processes each page sequentially, joining text items with spaces per page
 * and pages with newlines.
 *
 * @param file - A File object representing the PDF to extract text from
 * @returns Promise resolving to the full extracted text string
 * @throws Error if the PDF cannot be parsed (corrupt file, etc.)
 */
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

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Reconstruct line breaks from text item positions instead of joining with spaces.
      // PDF text items carry Y-position (transform[5]) and hasEOL markers that indicate
      // where visual line breaks occur in the document.
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
    }

    return pages.join('\n');
  } catch (error) {
    throw new Error(
      'Failed to extract text from PDF. The file may be corrupt or not a valid PDF.'
    );
  }
}
