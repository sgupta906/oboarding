# Tasks: pdf-template-import

## Metadata
- **Feature:** pdf-template-import
- **Created:** 2026-02-17T20:30
- **Status:** tasks-ready
- **Based on:** 2026-02-17T20:30_plan.md

## Execution Rules

- Tasks are numbered by phase (e.g., 1.1, 2.1)
- Tasks within a phase are sequential unless marked with **[P]**
- **[P]** = parallelizable with other [P] tasks in the same phase
- Follow TDD: write tests (Phase 2) before implementation (Phase 3)
- Mark tasks complete with `[x]` when done
- Each task lists files affected and acceptance criteria

---

## Phase 1: Setup

### Task 1.1: Install pdfjs-dist dependency
- [x] Run `npm install pdfjs-dist`
- [x] Verify package added to `package.json` dependencies
- [x] Verify `node_modules/pdfjs-dist` exists and contains `build/pdf.min.mjs`
- [x] Run `npx tsc -b` to verify no type errors introduced
- [x] Run `npx vitest run` to verify no existing tests broken

**Files:** `package.json`, `package-lock.json`

**Acceptance Criteria:**
- [x] `pdfjs-dist` appears in `package.json` dependencies section (v5.4.624)
- [x] `npx tsc -b` passes with no errors
- [x] All existing tests still pass (`npx vitest run`) -- 563/563

---

## Phase 2: Tests (TDD -- Write Tests First)

### Task 2.1: Write unit tests for `parseBulletsToSteps`
- [x] Create `src/utils/pdfParser.test.ts`
- [x] Write tests for dash-prefixed bullets (`- Step one`)
- [x] Write tests for asterisk-prefixed bullets (`* Step one`)
- [x] Write tests for plus-prefixed bullets (`+ Step one`)
- [x] Write tests for numbered lists with dots (`1. Step one`)
- [x] Write tests for numbered lists with parens (`1) Step one`)
- [x] Write tests for lettered lists with dots (`a. Step one`)
- [x] Write tests for lettered lists with parens (`a) Step one`)
- [x] Write tests for unicode bullet characters
- [x] Write tests for arrow markers (`> Step one`)
- [x] Write tests for checkbox markers
- [x] Write test that non-bullet text (headers, paragraphs) is ignored
- [x] Write test for mixed bullet styles in one document
- [x] Write test that whitespace is trimmed from titles
- [x] Write test that empty string input returns empty array
- [x] Write test that whitespace-only input returns empty array
- [x] Write test for fallback mode (no bullets detected, lines become steps)
- [x] Write test that fallback ignores very short lines (< 6 chars)
- [x] Write test that fallback ignores very long lines (> 200 chars)
- [x] Write test for multi-page text (newline-separated pages)
- [x] Write test that all parsed steps have empty description

**Files:** `src/utils/pdfParser.test.ts`

**Acceptance Criteria:**
- [x] Test file created with 20 test cases covering all bullet formats and edge cases
- [x] Tests FAIL at this point (implementation not written yet) -- expected TDD red phase

### Task 2.2: Write unit tests for `extractTextFromPdf` [P]
- [x] Add tests to `src/utils/pdfParser.test.ts` (same file as 2.1)
- [x] Mock `pdfjs-dist` module using `vi.mock('pdfjs-dist')`
- [x] Write test: returns extracted text from single-page PDF
- [x] Write test: returns text from multi-page PDF joined by newlines
- [x] Write test: returns empty string for PDF with no text
- [x] Write test: throws error for corrupt/invalid file
- [x] Write test: configures worker source

**Files:** `src/utils/pdfParser.test.ts`

**Acceptance Criteria:**
- [x] 5 test cases for PDF extraction with mocked pdfjs-dist
- [x] Tests FAIL at this point (implementation not written yet) -- expected TDD red phase

### Task 2.3: Write component tests for TemplateModal `initialSteps` prop [P]
- [x] Add new `describe` block in `src/components/templates/TemplateModal.test.tsx`
- [x] Write test: pre-fills step titles from `initialSteps` when in create mode
- [x] Write test: pre-fills empty descriptions for imported steps
- [x] Write test: shows info banner with step count and filename when `pdfFileName` is provided
- [x] Write test: does not show info banner when `pdfFileName` is absent
- [x] Write test: still validates form (name, role required) even with pre-filled steps
- [x] Write test: allows editing pre-filled step titles before saving

**Files:** `src/components/templates/TemplateModal.test.tsx`

**Acceptance Criteria:**
- [x] 6 new test cases in the TemplateModal test suite
- [x] Tests FAIL at this point (props not implemented yet) -- expected TDD red phase

---

## Phase 3: Core Implementation

### Task 3.1: Implement `parseBulletsToSteps` in pdfParser.ts
- [x] Create `src/utils/pdfParser.ts`
- [x] Export `ParsedStep` interface with `title: string` and `description: string`
- [x] Implement `parseBulletsToSteps(rawText: string): ParsedStep[]`
- [x] Implement bullet regex matching for all supported patterns:
  - Unicode bullets, ASCII bullets (`-`, `*`, `+`)
  - Numbered lists (`1.`, `1)`)
  - Lettered lists (`a.`, `a)`)
  - Arrow markers (`>`)
  - Checkbox markers
- [x] Implement fallback logic: if zero bullets found, use line-per-step (lines 6-200 chars)
- [x] Trim whitespace from titles
- [x] Set empty description for all steps
- [x] Run `parseBulletsToSteps` tests from Task 2.1 -- all 20 pass

**Files:** `src/utils/pdfParser.ts`

**Acceptance Criteria:**
- [x] All 20 `parseBulletsToSteps` tests from Task 2.1 pass
- [x] `npx tsc -b` passes with no type errors
- [x] Function handles all bullet patterns listed in research doc

### Task 3.2: Implement `extractTextFromPdf` in pdfParser.ts
- [x] Import `pdfjs-dist` at top of `src/utils/pdfParser.ts`
- [x] Configure `GlobalWorkerOptions.workerSrc` to CDN URL using `pdfjsLib.version`
- [x] Implement `extractTextFromPdf(file: File): Promise<string>`
  - Convert File to ArrayBuffer (with FileReader fallback for jsdom compat)
  - Load with `pdfjsLib.getDocument({ data: arrayBuffer }).promise`
  - Iterate all pages, extract text content items
  - Join items with spaces per page, pages with newlines
  - Return combined text
- [x] Add error handling for corrupt/invalid PDFs
- [x] Run `extractTextFromPdf` tests from Task 2.2 -- all 5 pass

**Files:** `src/utils/pdfParser.ts`

**Acceptance Criteria:**
- [x] All 5 `extractTextFromPdf` tests from Task 2.2 pass
- [x] `npx tsc -b` passes with no type errors
- [x] Worker source configured to CDN URL matching library version

### Task 3.3: Add `initialSteps` and `pdfFileName` props to TemplateModal
- [x] Add `initialSteps?: Array<{ title: string; description: string }>` to `TemplateModalProps`
- [x] Add `pdfFileName?: string` to `TemplateModalProps`
- [x] Destructure new props in component function signature
- [x] Update create-mode `useEffect`:
  - If `initialSteps` is provided and non-empty, map to `TemplateStep[]` with `_uid`, empty `owner`/`expert`
  - If `initialSteps` is absent or empty, fall back to existing single-empty-step default
- [x] Add info banner in form JSX (after error messages block):
  - Conditionally render when `pdfFileName` is truthy
  - Blue info box: "N steps imported from [filename]"
  - Use `bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700` styling
- [x] Run TemplateModal tests from Task 2.3 -- all 6 pass
- [x] Run ALL existing TemplateModal tests -- all 23 pass (no regressions)

**Files:** `src/components/templates/TemplateModal.tsx`

**Acceptance Criteria:**
- [x] All 6 new `initialSteps` tests from Task 2.3 pass
- [x] All existing TemplateModal tests still pass (no regressions)
- [x] `npx tsc -b` passes with no type errors
- [x] Info banner renders with correct step count and filename
- [x] Modal behavior unchanged when `initialSteps` is not provided

---

## Phase 4: Integration

### Task 4.1: Add "Import from PDF" button and handler to TemplatesView
- [x] Add imports: `FileUp` from `lucide-react`, `useRef` from `react`
- [x] Add state variables:
  - `importLoading: boolean` (default `false`)
  - `importedSteps: Array<{ title: string; description: string }> | null` (default `null`)
  - `pdfFileName: string | null` (default `null`)
  - `importError: string | null` (default `null`)
- [x] Add `fileInputRef = useRef<HTMLInputElement>(null)`
- [x] Add hidden `<input type="file" accept=".pdf" ref={fileInputRef} onChange={handlePdfImport} />` in JSX
- [x] Add "Import from PDF" button next to "Create Template" button
- [x] Implement `handlePdfImport` async handler with dynamic import, validation, error handling
- [x] Update create modal `onClose` handler to also clear `importedSteps` and `pdfFileName`
- [x] Pass `initialSteps` and `pdfFileName` to create-mode `TemplateModal`
- [x] Reset file input value after processing so same file can be re-selected

**Files:** `src/views/TemplatesView.tsx`

**Acceptance Criteria:**
- [x] "Import from PDF" button renders next to "Create Template"
- [x] Clicking button opens native file picker (`.pdf` filter)
- [x] File > 10 MB shows error message
- [x] Successful parse opens TemplateModal with pre-filled steps
- [x] Empty parse result shows error message
- [x] Loading spinner shows on button during processing
- [x] `npx tsc -b` passes
- [x] All 594 tests pass (no regressions)

---

## Phase 5: Polish

### Task 5.1: Dark mode and accessibility audit [P]
- [x] Verify all new elements in TemplatesView have `dark:` variants
- [x] Verify info banner in TemplateModal has `dark:` variants
- [x] Verify "Import from PDF" button has `aria-label`
- [x] Verify hidden file input has appropriate attributes (`aria-hidden`, `tabIndex={-1}`)
- [x] Verify error messages are announced to screen readers (`role="alert"`)
- [x] Test visual appearance in both light and dark modes

**Files:** `src/views/TemplatesView.tsx`, `src/components/templates/TemplateModal.tsx`

**Acceptance Criteria:**
- [x] All new UI elements have both light and dark mode styles
- [x] All interactive elements have `aria-label` attributes
- [x] No accessibility violations in new elements

### Task 5.2: Error handling edge cases [P]
- [x] Verify error when non-PDF file somehow bypasses `accept=".pdf"` filter (extractTextFromPdf throws)
- [x] Verify error when PDF extraction throws (corrupt file) -- caught by try/catch
- [x] Verify error when dynamic import of pdfParser fails (network issue) -- caught by try/catch
- [x] Verify file input resets after error so user can retry -- in finally block
- [x] Verify cancel/close of modal after import does not leave stale state -- onClose clears state

**Files:** `src/views/TemplatesView.tsx`, `src/utils/pdfParser.ts`

**Acceptance Criteria:**
- [x] All error paths show user-friendly messages
- [x] File input resets after error
- [x] No stale state after modal close

### Task 5.3: Verify build and bundle size [P]
- [x] Run `npx vite build` and verify it succeeds
- [x] Check that `pdfjs-dist` is in a separate chunk (pdfParser-DpxB5w4r.js: 404KB / 120KB gzipped)
- [x] Verify main bundle size has not increased significantly (index-yftbqDPa.js: 496KB / 132KB gzipped)
- [x] Run `npx tsc -b` -- passes

**Files:** (no file changes, build verification only)

**Acceptance Criteria:**
- [x] `npx vite build` succeeds
- [x] `pdfjs-dist` is code-split into a separate chunk
- [x] `npx tsc -b` passes

---

## Phase 6: Ready for Test Agent

### Task 6.1: Final verification
- [x] Run `npx vitest run` -- ALL 594 tests pass (563 existing + 31 new)
- [x] Run `npx tsc -b` -- no type errors
- [x] Run `npx vite build` -- production build succeeds
- [x] Verify test count increased by exactly 31 tests (563 -> 594)
- [x] Document known limitations in implementation.md

**Acceptance Criteria:**
- [x] All unit tests pass (594 total, up from 563)
- [x] TypeScript compiles without errors
- [x] Production build succeeds
- [x] No regressions in existing functionality

---

## Handoff Checklist for Test Agent

- [x] All tests passing (`npx vitest run`) -- 594/594
- [x] TypeScript compiles (`npx tsc -b`)
- [x] Build succeeds (`npx vite build`)
- [x] New test file: `src/utils/pdfParser.test.ts` (25 tests)
- [x] Modified test file: `src/components/templates/TemplateModal.test.tsx` (+6 tests)
- [x] New source file: `src/utils/pdfParser.ts`
- [x] Modified source: `src/components/templates/TemplateModal.tsx` (initialSteps prop)
- [x] Modified source: `src/views/TemplatesView.tsx` (Import button + handler)
- [x] New dependency: `pdfjs-dist` (v5.4.624) in `package.json`
- [ ] Manual testing recommended: upload a real PDF and verify steps are parsed

---

## Task Dependency Graph

```
Phase 1: 1.1 (install dep)
              |
Phase 2: 2.1 [P] 2.2 [P] 2.3   (write tests, all parallel)
              |     |      |
Phase 3: 3.1 --- 3.2      3.3   (3.1 before 3.2; 3.3 parallel to 3.1/3.2)
              |     |      |
Phase 4:     4.1 (depends on 3.1, 3.2, 3.3)
              |
Phase 5: 5.1 [P] 5.2 [P] 5.3   (all parallel)
              |     |      |
Phase 6:        6.1              (final verification)
```
