/**
 * Changelog Content Utilities
 *
 * Server-safe utility functions for parsing changelog content.
 * These functions can be called from server components.
 */

/**
 * Remove accordion sections (Technical Details, Deployment) from content
 * to avoid duplication when displaying accordions separately.
 * 
 * Server-safe: Can be called from server components
 */
export function removeAccordionSectionsFromContent(content: string): string {
  if (!content || typeof content !== 'string') return content;

  // Match ### Technical Details and ### Deployment sections
  const sectionRegex = /### (Technical Details|Deployment)([\s\S]*?)(?=### |## |$)/g;
  
  // Remove all matches
  return content.replace(sectionRegex, '').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Remove category sections (## Added, ## Changed, ## Fixed, etc.) from content
 * to avoid duplication when displaying structured changes.
 * 
 * When we have structured changes from the JSONB field, we don't want to
 * also display the raw markdown category sections.
 * 
 * Server-safe: Can be called from server components
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
