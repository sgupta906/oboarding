/**
 * Card Component - Reusable container with consistent styling
 * Used throughout the app for content cards, modals, and data containers
 */

import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  children: ReactNode;
}

/**
 * Renders a styled card container with white background, border, and shadow
 * Supports dark mode with automatic color transitions
 * @param children - Content to display inside the card
 * @param className - Additional Tailwind classes for customization
 * @param props - Additional HTML attributes for event handlers and styling
 */
export function Card({
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
