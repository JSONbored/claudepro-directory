/**
 * Changelog SEO Utilities
 *
 * Shared utilities for generating SEO-optimized metadata for changelog entries.
 * Used by both the sync API and Inngest functions.
 *
 * @see {@link apps/web/src/app/api/changelog/sync/route.ts | Sync API}
 * @see {@link packages/web-runtime/src/inngest/functions/changelog/process.ts | Inngest Function}
 */

/**
 * Changelog sections format from sync API (git-cliff output)
 */
export interface ChangelogSections {
  Added?: string[];
  Changed?: string[];
  Fixed?: string[];
  Removed?: string[];
  Deprecated?: string[];
  Security?: string[];
  [key: string]: string[] | undefined;
}

/**
 * Generate SEO-optimized title (53-60 chars) from changelog title and sections
 *
 * Ensures title is within optimal SEO length range for search engines.
 * If title is too short, enhances with category info. If too long, truncates intelligently.
 *
 * @param originalTitle - The original changelog title (e.g., version or title from changelog)
 * @param sections - Changelog sections object (from git-cliff)
 * @returns SEO-optimized title (53-60 chars)
 *
 * @example
 * ```ts
 * generateOptimizedTitle("1.2.0", { Added: ["..."], Fixed: ["..."] })
 * // Returns: "1.2.0 - Features & Bug Fixes" (if within 53-60 chars)
 * ```
 */
export function generateOptimizedTitle(
  originalTitle: string,
  sections: ChangelogSections
): string {
  // If title is already in optimal range (53-60 chars), use it
  if (originalTitle.length >= 53 && originalTitle.length <= 60) {
    return originalTitle;
  }

  // If title is too long, truncate intelligently
  if (originalTitle.length > 60) {
    // Try to truncate at word boundary
    const truncated = originalTitle.slice(0, 57);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 45) {
      return truncated.slice(0, lastSpace) + '...';
    }
    return truncated + '...';
  }

  // If title is too short, enhance with category info
  if (originalTitle.length < 53) {
    const categoryLabels: string[] = [];
    if (sections.Added && sections.Added.length > 0) {
      categoryLabels.push('Features');
    }
    if (sections.Fixed && sections.Fixed.length > 0) {
      categoryLabels.push('Bug Fixes');
    }
    if (sections.Changed && sections.Changed.length > 0) {
      categoryLabels.push('Improvements');
    }
    if (sections.Security && sections.Security.length > 0) {
      categoryLabels.push('Security');
    }

    // Build enhanced title
    if (categoryLabels.length > 0) {
      const categoryPart = categoryLabels.length === 1
        ? categoryLabels[0]
        : categoryLabels.slice(0, 2).join(' & ');
      const enhanced = `${originalTitle} - ${categoryPart}`;
      if (enhanced.length <= 60) {
        return enhanced;
      }
    }

    // Fallback: add "Update" suffix if still too short
    if (originalTitle.length < 45) {
      const withUpdate = `${originalTitle} Update`;
      if (withUpdate.length <= 60) {
        return withUpdate;
      }
    }
  }

  return originalTitle;
}

/**
 * Generate optimized SEO description (150-160 chars) from changelog sections
 *
 * Format: "Added X features, Changed Y systems, Fixed Z bugs. Released [date]."
 * Ensures description is within optimal SEO length range (150-160 chars).
 *
 * @param sections - Changelog sections object (from git-cliff)
 * @param releaseDate - Release date in YYYY-MM-DD format
 * @returns SEO-optimized description (150-160 chars)
 *
 * @example
 * ```ts
 * generateOptimizedDescription(
 *   { Added: ["..."], Fixed: ["..."] },
 *   "2025-12-07"
 * )
 * // Returns: "Added 1 feature, Fixed 2 bugs. Released December 7, 2025."
 * ```
 */
export function generateOptimizedDescription(
  sections: ChangelogSections,
  releaseDate: string
): string {
  // Count items by category
  const categoryCounts: Record<string, number> = {};
  if (sections.Added) categoryCounts['Added'] = sections.Added.length;
  if (sections.Changed) categoryCounts['Changed'] = sections.Changed.length;
  if (sections.Fixed) categoryCounts['Fixed'] = sections.Fixed.length;
  if (sections.Removed) categoryCounts['Removed'] = sections.Removed.length;
  if (sections.Security) categoryCounts['Security'] = sections.Security.length;
  if (sections.Deprecated) categoryCounts['Deprecated'] = sections.Deprecated.length;

  // Build description parts
  const parts: string[] = [];
  if (categoryCounts['Added']) {
    parts.push(
      `Added ${categoryCounts['Added']} feature${categoryCounts['Added'] > 1 ? 's' : ''}`
    );
  }
  if (categoryCounts['Changed']) {
    parts.push(
      `Changed ${categoryCounts['Changed']} system${categoryCounts['Changed'] > 1 ? 's' : ''}`
    );
  }
  if (categoryCounts['Fixed']) {
    parts.push(
      `Fixed ${categoryCounts['Fixed']} bug${categoryCounts['Fixed'] > 1 ? 's' : ''}`
    );
  }
  if (categoryCounts['Security']) {
    parts.push(
      `${categoryCounts['Security']} security update${categoryCounts['Security'] > 1 ? 's' : ''}`
    );
  }
  if (categoryCounts['Removed']) {
    parts.push(
      `Removed ${categoryCounts['Removed']} feature${categoryCounts['Removed'] > 1 ? 's' : ''}`
    );
  }

  // Fallback if no categorized changes
  if (parts.length === 0) {
    const totalItems = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
    if (totalItems > 0) {
      parts.push(`${totalItems} update${totalItems > 1 ? 's' : ''}`);
    } else {
      parts.push('Updates and improvements');
    }
  }

  // Format date
  const date = new Date(releaseDate);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Build description (target: 150-160 chars)
  let description = `${parts.join(', ')}. Released ${formattedDate}.`;

  // Trim or pad to optimal length (150-160 chars)
  if (description.length > 160) {
    // Truncate intelligently
    description = description.slice(0, 157) + '...';
  } else if (description.length < 150) {
    // Add context if too short (but don't exceed 160)
    const remaining = Math.min(160 - description.length, 10);
    if (remaining > 5) {
      description = `Claude Pro Directory update: ${description}`;
      if (description.length > 160) {
        description = description.slice(0, 157) + '...';
      }
    }
  }

  return description;
}

/**
 * Extract SEO keywords from changelog sections
 *
 * Returns array of relevant keywords for SEO, including:
 * - Base keywords (changelog, release notes, updates)
 * - Category keywords (features, bug fixes, etc.)
 * - Extracted terms from section items (limited to avoid spam)
 *
 * @param sections - Changelog sections object (from git-cliff)
 * @returns Array of SEO keywords (max 10)
 *
 * @example
 * ```ts
 * extractKeywords({ Added: ["New feature"], Fixed: ["Bug fix"] })
 * // Returns: ["changelog", "release notes", "updates", "features", "bug fixes", ...]
 * ```
 */
export function extractKeywords(sections: ChangelogSections): string[] {
  const keywords = new Set<string>();

  // Add base keywords
  keywords.add('changelog');
  keywords.add('release notes');
  keywords.add('updates');

  // Add category keywords from sections
  if (sections.Added && sections.Added.length > 0) {
    keywords.add('features');
  }
  if (sections.Fixed && sections.Fixed.length > 0) {
    keywords.add('bug fixes');
  }
  if (sections.Changed && sections.Changed.length > 0) {
    keywords.add('improvements');
  }
  if (sections.Security && sections.Security.length > 0) {
    keywords.add('security');
  }
  if (sections.Removed && sections.Removed.length > 0) {
    keywords.add('deprecations');
  }
  if (sections.Deprecated && sections.Deprecated.length > 0) {
    keywords.add('deprecations');
  }

  // Extract keywords from section items (common terms)
  const commonTerms = new Set<string>();
  const allItems = [
    ...(sections.Added || []),
    ...(sections.Changed || []),
    ...(sections.Fixed || []),
    ...(sections.Security || []),
    ...(sections.Removed || []),
    ...(sections.Deprecated || []),
  ];

  for (const item of allItems) {
    const words = item.toLowerCase().split(/\s+/);
    for (const word of words) {
      // Extract meaningful words (3+ chars, not common stop words)
      if (
        word.length >= 3 &&
        !['the', 'and', 'for', 'with', 'this', 'that', 'from', 'into', 'added', 'fixed', 'changed', 'removed'].includes(word)
      ) {
        // Clean word (remove punctuation)
        const cleanWord = word.replace(/[^\w]/g, '');
        if (cleanWord.length >= 3) {
          commonTerms.add(cleanWord);
        }
      }
    }
  }

  // Add top 5 most common terms as keywords (limit to avoid spam)
  const sortedTerms = Array.from(commonTerms).slice(0, 5);
  for (const term of sortedTerms) {
    keywords.add(term);
  }

  // Limit total keywords to 10 (SEO best practice)
  return Array.from(keywords).slice(0, 10);
}
