/**
 * Changelog Accordion Sections Component
 *
 * Parses git-cliff generated markdown content to extract and display
 * Technical Details and Deployment sections as collapsible accordions.
 *
 * Database-first: Content comes from entry.content field in database.
 */

'use client';

import { ChevronDown, ChevronUp } from '@heyclaude/web-runtime/icons';
import { logClientError, normalizeError } from '@heyclaude/web-runtime/logging/client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from '@heyclaude/web-runtime/ui';
import { memo, useState, useEffect } from 'react';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';

import { SanitizedHTML } from './sanitized-html';

export interface AccordionSection {
  content: string;
  itemCount: number;
  title: string;
}

/**
 * Extracts "Technical Details", "Deployment", and "Statistics" sections from a markdown string as accordion-ready objects.
 *
 * Each returned section includes its text content, the number of bullet items it contains, and a title
 * that appends the item count in parentheses when the count is greater than zero.
 *
 * @param content - Markdown string to parse; falsy or non-string values produce an empty array.
 * @returns An array of AccordionSection objects for each found non-empty section, or an empty array if none are found.
 *
 * @see AccordionSection
 * @see ChangelogAccordionSections
 */
function parseAccordionSections(content: string): AccordionSection[] {
  if (!content || typeof content !== 'string') return [];

  const sections: AccordionSection[] = [];

  // Match ### Section headers and their content
  // Pattern: ### Section Title followed by content until next ### or end
  // Includes: Technical Details, Deployment, Statistics
  const sectionRegex = /### (Technical Details|Deployment|Statistics)([\s\S]*?)(?=### |$)/g;
  const matches = [...content.matchAll(sectionRegex)];

  for (const match of matches) {
    const title = match[1];
    const sectionContent = match[2]?.trim() || '';

    // Count bullet points (lines starting with -)
    const itemCount = (sectionContent.match(/^- /gm) || []).length;

    if (sectionContent) {
      sections.push({
        title: `${title}${itemCount > 0 ? ` (${itemCount})` : ''}`,
        content: sectionContent,
        itemCount,
      });
    }
  }

  return sections;
}

interface ChangelogAccordionSectionsProps {
  content: string;
}

/**
 * ChangelogAccordionSections Component
 *
 * Displays Technical Details and Deployment sections as collapsible accordions
 */
export const ChangelogAccordionSections = memo(({ content }: ChangelogAccordionSectionsProps) => {
  const sections = parseAccordionSections(content);

  if (sections.length === 0) return null;

  return (
    <div className="mt-8 space-y-6">
      {sections.map((section, index) => (
        <AccordionSectionItem key={`${section.title}-${index}`} section={section} />
      ))}
    </div>
  );
});

ChangelogAccordionSections.displayName = 'ChangelogAccordionSections';

interface AccordionSectionItemProps {
  section: AccordionSection;
}

/**
 * Render a single collapsible accordion item for a changelog section.
 *
 * @param section - Accordion section data containing the display title, HTML content to render, and bullet item count
 * @returns The accordion item element for the given section
 *
 * @see AccordionSection
 * @see ChangelogAccordionSections
 */
function AccordionSectionItem({ section }: AccordionSectionItemProps) {
  const { value: isOpen, setValue: setIsOpen } = useBoolean();
  const [htmlContent, setHtmlContent] = useState<string>('');

  // Convert markdown to HTML on client side
  useEffect(() => {
    if (globalThis.window !== undefined && section.content) {
      import('marked')
        .then(({ marked }) => {
          try {
            // Configure marked for GitHub Flavored Markdown (GFM) support
            marked.use({
              gfm: true,
              breaks: false,
              pedantic: false,
            });
            const html = marked.parse(section.content, { async: false });
            setHtmlContent(html);
          } catch (error) {
            // Fallback to empty string on error
            const normalized = normalizeError(error, 'Failed to parse markdown');
            logClientError(
              '[Changelog] Failed to parse markdown',
              normalized,
              'AccordionSectionItem.parseMarkdown',
              {
                component: 'AccordionSectionItem',
                action: 'parse-markdown',
                category: 'changelog',
              }
            );
            setHtmlContent('');
          }
        })
        .catch((error) => {
          // Fallback if marked fails to load
          const normalized = normalizeError(error, 'Failed to load marked');
          logClientError(
            '[Changelog] Failed to load marked',
            normalized,
            'AccordionSectionItem.loadMarked',
            {
              component: 'AccordionSectionItem',
              action: 'load-marked',
              category: 'changelog',
            }
          );
          setHtmlContent('');
        });
    } else {
      setHtmlContent('');
    }
  }, [section.content]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4">
      <CollapsibleTrigger
        className="flex items-center justify-between w-full py-3 px-4 border-border bg-card hover:bg-accent/5 card-base transition-all duration-200 ease-out text-left"
      >
        <span className="text-base leading-normal font-semibold">{section.title}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent
        className="px-4 py-4"
      >
        <div className={cn('prose prose-slate dark:prose-invert prose-sm prose-headings:font-semibold prose-headings:text-foreground', 'prose-headings:mt-4', 'prose-headings:mb-2', 'prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-p:text-foreground/90 prose-p:leading-relaxed', 'prose-p:my-2', 'prose-ul:my-2', 'prose-ol:my-2', 'prose-li:my-0.5 prose-li:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-strong:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-muted prose-pre:text-foreground', 'prose-pre:p-3', 'prose-pre:rounded prose-pre:overflow-x-auto prose-blockquote:border-l-2 prose-blockquote:border-primary', 'prose-blockquote:pl-2', 'prose-blockquote:italic', 'prose-blockquote:my-2', 'max-w-none')}>
          <SanitizedHTML html={htmlContent} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
