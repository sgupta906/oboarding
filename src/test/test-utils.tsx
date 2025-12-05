/**
 * Custom render function and test utilities
 * Re-exports React Testing Library utilities
 */

import React from 'react';
import {
  render as rtlRender,
  RenderOptions,
  RenderResult,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Custom render function that can be extended with providers
 * For now, just wraps the standard RTL render
 */
function render(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult {
  return rtlRender(ui, options);
}

/**
 * Re-export everything from React Testing Library
 */
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';

/**
 * Override render method with our custom one
 */
export { render, userEvent };
