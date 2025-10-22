/**
 * Changelog JSON Parser
 *
 * Converts markdown changelog entries to structured JSON format
 * with beautiful components (tabs, accordions, infoboxes).
 *
 * Architecture:
 * - Takes parsed ChangelogEntry (markdown content)
 * - Converts to ChangelogJson (structured sections)
 * - Creates tabs for Added/Changed/Fixed categories
 * - Wraps TL;DR in InfoBox component
 * - Handles technical details as accordions
 */

import type {
  ChangelogEntry,
  ChangelogJson,
  ChangelogJsonMetadata,
} from '@/src/lib/schemas/changelog.schema';
import type { ContentSection } from '@/src/lib/schemas/content/guide.schema';

/**
 * Parse list items from markdown
 * Extracts bullet points and converts to array of strings
 */
function parseListItems(markdown: string): ContentSection[] {
  const lines = markdown.split('\n');
  const items: string[] = [];
  let currentItem = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      if (currentItem) {
        items.push(currentItem.trim());
      }
      currentItem = trimmed.slice(1).trim();
    } else if (trimmed && currentItem) {
      currentItem += ` ${trimmed}`;
    }
  }

  if (currentItem) {
    items.push(currentItem.trim());
  }

  return [
    {
      type: 'list',
      ordered: false,
      items, // Array of strings
    } as ContentSection,
  ];
}

/**
 * Parse category content into list sections
 * Handles both lists and paragraph content
 */
function parseCategoryContent(markdown: string): ContentSection[] {
  if (!markdown.trim()) return [];

  // Check if it's a list
  if (markdown.trim().match(/^[-*]\s/m)) {
    return parseListItems(markdown);
  }

  // Otherwise treat as paragraph
  return [
    {
      type: 'paragraph',
      content: markdown.trim(),
    } as ContentSection,
  ];
}

/**
 * Extract category sections from markdown content
 * Finds ### Added, ### Changed, etc. sections
 */
function extractCategorySections(content: string): Record<string, string> {
  const categories: Record<string, string> = {};
  const categoryNames = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];

  for (const category of categoryNames) {
    // Match category heading followed by content until next heading or separator
    const regex = new RegExp(
      `###\\s+${category}\\s*\n([\\s\\S]*?)(?=\n###\\s+[A-Z]|\n##\\s+|$)`,
      'i'
    );
    const match = content.match(regex);
    if (match?.[1]) {
      const categoryContent = match[1].trim();
      // Only include if there's actual content
      if (categoryContent && categoryContent.length > 0) {
        categories[category] = categoryContent;
      }
    }
  }

  return categories;
}

/**
 * Extract "What Changed" summary section
 */
function extractWhatChanged(content: string): string | null {
  const match = content.match(/###\s+What Changed\s*\n([\s\S]*?)(?=\n###|\n---|\n##|$)/i);
  return match?.[1]?.trim() || null;
}

/**
 * Extract Technical Details section
 */
function extractTechnicalDetails(content: string): string | null {
  const match = content.match(/###\s+Technical Details\s*\n([\s\S]*?)(?=\n---|\n##|$)/i);
  return match?.[1]?.trim() || null;
}

/**
 * Parse technical details section into structured sections
 * Creates accordions from h4 headers if present
 */
function parseTechnicalDetailsSection(markdown: string): ContentSection[] {
  const sections: ContentSection[] = [];

  // Split by h4 headers (####) to create accordion items
  const h4Regex = /####\s+(.+?)\n([\s\S]*?)(?=####|$)/g;
  const items: Array<{ title: string; content: string }> = [];
  let match: RegExpExecArray | null = h4Regex.exec(markdown);

  while (match !== null) {
    items.push({
      title: match[1]?.trim() || '',
      content: match[2]?.trim() || '',
    });
    match = h4Regex.exec(markdown);
  }

  if (items.length > 0) {
    // Create accordion for technical details
    sections.push({
      type: 'component',
      component: 'UnifiedContentBox',
      props: {
        contentType: 'accordion',
        items: items.map((item) => ({
          title: item.title,
          content: item.content,
        })),
      },
    } as ContentSection);
  } else {
    // No h4 headers, treat as paragraph
    sections.push({
      type: 'paragraph',
      content: markdown,
    } as ContentSection);
  }

  return sections;
}

/**
 * Convert markdown changelog entry to structured JSON
 *
 * Creates beautiful structured layout:
 * 1. TL;DR as InfoBox
 * 2. "What Changed" summary
 * 3. Categories as tabbed interface
 * 4. Technical details as accordion
 */
export function convertChangelogEntryToJson(entry: ChangelogEntry): ChangelogJson {
  const sections: ContentSection[] = [];

  // 1. TL;DR as InfoBox
  if (entry.tldr) {
    sections.push({
      type: 'component',
      component: 'UnifiedContentBox',
      props: {
        contentType: 'infobox',
        variant: 'info',
        title: 'TL;DR',
        children: entry.tldr,
      },
    } as ContentSection);
  }

  // 2. "What Changed" summary
  const whatChanged = extractWhatChanged(entry.content);
  if (whatChanged) {
    sections.push({
      type: 'component',
      component: 'UnifiedContentBox',
      props: {
        contentType: 'accordion',
        items: [
          {
            title: 'What Changed',
            content: whatChanged,
          },
        ],
      },
    } as ContentSection);
  }

  // 3. Categories as Tabs
  const categorySections = extractCategorySections(entry.content);
  const tabs: Array<{ label: string; content: ContentSection[] }> = [];

  const categoryOrder = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'] as const;

  for (const category of categoryOrder) {
    const categoryContent = categorySections[category];
    const count = entry.categories[category]?.length || 0;

    if (categoryContent && count > 0) {
      tabs.push({
        label: `${category} (${count})`,
        content: parseCategoryContent(categoryContent),
      });
    }
  }

  if (tabs.length > 0) {
    sections.push({
      type: 'component',
      component: 'UnifiedContentBlock',
      props: {
        variant: 'content-tabs',
        tabs,
      },
    } as ContentSection);
  }

  // 4. Technical Details as Accordion
  const technicalDetails = extractTechnicalDetails(entry.content);
  if (technicalDetails) {
    sections.push(
      {
        type: 'heading',
        level: 3,
        text: 'Technical Details',
        id: 'technical-details',
      } as ContentSection,
      ...parseTechnicalDetailsSection(technicalDetails)
    );
  }

  // 5. Build metadata with category counts
  const metadata: ChangelogJsonMetadata = {
    slug: entry.slug,
    date: entry.date,
    title: entry.title,
    tldr: entry.tldr,
    categories: {
      Added: entry.categories.Added.length,
      Changed: entry.categories.Changed.length,
      Deprecated: entry.categories.Deprecated.length,
      Removed: entry.categories.Removed.length,
      Fixed: entry.categories.Fixed.length,
      Security: entry.categories.Security.length,
    },
  };

  return {
    metadata,
    content: {
      sections,
    },
  };
}

/**
 * Convert all changelog entries to JSON format
 */
export function convertChangelogEntriesToJson(entries: ChangelogEntry[]): ChangelogJson[] {
  return entries.map((entry) => convertChangelogEntryToJson(entry));
}
