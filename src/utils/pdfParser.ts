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
 */
const BULLET_REGEX =
  /^(?:[\u2022\u2023\u25E6\u2043\u2219\-\*\+>]|\d+[.)]\s|[a-zA-Z][.)]\s|[\u2610\u2611\u2612\u25A1\u25A0])\s*(.+)/;

/**
 * Parses raw text into template steps by detecting bullet and numbered list patterns.
 *
 * Algorithm:
 * 1. Split text on newlines, trim each line, filter empty lines
 * 2. Match each line against the bullet regex
 * 3. If bullets found, return them as ParsedStep[] with empty descriptions
 * 4. Fallback: if no bullets detected, each line between 6-200 chars becomes a step
 *
 * @param rawText - Raw text extracted from a PDF document
 * @returns Array of parsed steps (may be empty if no parseable content)
 */
export function parseBulletsToSteps(rawText: string): ParsedStep[] {
  const lines = rawText.split(/\n/).map((l) => l.trim()).filter(Boolean);

  const steps: ParsedStep[] = [];

  for (const line of lines) {
    const match = line.match(BULLET_REGEX);
    if (match) {
      const title = match[1].trim();
      if (title) {
        steps.push({ title, description: '' });
      }
    }
  }

  // Fallback: if no bullets found, use each reasonably-sized line as a step
  if (steps.length === 0) {
    for (const line of lines) {
      if (line.length >= 6 && line.length <= 200) {
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
      const pageText = textContent.items
        .map((item) => ('str' in item ? (item as { str: string }).str : ''))
        .join(' ');
      pages.push(pageText);
    }

    return pages.join('\n');
  } catch (error) {
    throw new Error(
      'Failed to extract text from PDF. The file may be corrupt or not a valid PDF.'
    );
  }
}
