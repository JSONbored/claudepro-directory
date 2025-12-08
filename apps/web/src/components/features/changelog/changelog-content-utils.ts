/**
 * Changelog Content Utilities
 *
 * Server-safe utility functions for parsing changelog content.
 * These functions can be called from server components.
 */

/**
 * Remove "Technical Details", "Deployment", and "Statistics" accordion sections and their content from markdown.
 *
 * Collapses runs of three or more consecutive newlines into two and trims leading/trailing whitespace.
 * If `content` is falsy or not a string, returns the input unchanged.
 *
 * @param content - The markdown content to sanitize
 * @returns The cleaned markdown with the specified accordion sections removed
 */
export function removeAccordionSectionsFromContent(content: string): string {
  if (!content || typeof content !== 'string') return content;

  // Match ### Technical Details, ### Deployment, and ### Statistics sections
  const sectionRegex = /### (Technical Details|Deployment|Statistics)([\s\S]*?)(?=### |## |$)/g;

  // Remove all matches
  return content
    .replaceAll(sectionRegex, '')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Remove top-level changelog category sections and their content from markdown.
 *
 * Strips sections headed by `## Added`, `## Changed`, `## Fixed`, `## Removed`, `## Deprecated`, and `## Security` along with their following content so those changes are not duplicated when structured change data is rendered separately.
 *
 * @param {string} content - The markdown content to sanitize; if falsy or not a string, the original input is returned unchanged.
 * @returns {string} The sanitized markdown string with matching category sections removed and runs of three or more newlines collapsed to two; returns the original input unchanged for invalid input.
 * @see removeAccordionSectionsFromContent
 */
export function removeCategorySectionsFromContent(content: string): string {
  if (!content || typeof content !== 'string') return content;

  // Match ## Category headers and their content until next ## or ### or end
  // Categories: Added, Changed, Fixed, Removed, Deprecated, Security
  const categoryRegex =
    /^## (Added|Changed|Fixed|Removed|Deprecated|Security)([\s\S]*?)(?=^## |^### |$)/gm;

  // Remove all category sections
  let cleaned = content.replaceAll(categoryRegex, '');

  // Clean up extra newlines
  cleaned = cleaned.replaceAll(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}
