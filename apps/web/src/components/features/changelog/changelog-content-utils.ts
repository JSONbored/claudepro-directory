/**
 * Changelog Content Utilities
 *
 * Server-safe utility functions for parsing changelog content.
 * These functions can be called from server components.
 */

/**
 * Remove "Technical Details" and "Deployment" accordion sections and their content from markdown.
 *
 * Collapses runs of three or more consecutive newlines into two and trims leading/trailing whitespace.
 * If `content` is falsy or not a string, returns the input unchanged.
 *
 * @param content - The markdown content to sanitize
 * @returns The cleaned markdown with the specified accordion sections removed
 */
export function removeAccordionSectionsFromContent(content: string): string {
  if (!content || typeof content !== 'string') return content;

  // Match ### Technical Details and ### Deployment sections
  const sectionRegex = /### (Technical Details|Deployment)([\s\S]*?)(?=### |## |$)/g;
  
  // Remove all matches
  return content.replace(sectionRegex, '').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Remove top-level changelog category sections and their content from markdown.
 *
 * This strips sections headed by "## Added", "## Changed", "## Fixed", "## Removed", "## Deprecated", and "## Security" along with their following content so the same changes are not shown twice when structured change data is rendered separately.
 *
 * @param content - The markdown content to sanitize. If falsy or not a string, the input is returned unchanged.
 * @returns The sanitized markdown string with matching category sections removed and excess blank lines collapsed.
 * @see removeAccordionSectionsFromContent
 */
export function removeCategorySectionsFromContent(content: string): string {
  if (!content || typeof content !== 'string') return content;

  // Match ## Category headers and their content until next ## or ### or end
  // Categories: Added, Changed, Fixed, Removed, Deprecated, Security
  const categoryRegex = /^## (Added|Changed|Fixed|Removed|Deprecated|Security)([\s\S]*?)(?=^## |^### |$)/gm;
  
  // Remove all category sections
  let cleaned = content.replace(categoryRegex, '');
  
  // Clean up extra newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  
  return cleaned;
}