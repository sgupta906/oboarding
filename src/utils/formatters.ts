/**
 * Shared formatting utilities
 */

/**
 * Extracts up to 2 uppercase initials from a name string.
 * Examples: "John Doe" -> "JD", "alice" -> "A", "" -> ""
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
