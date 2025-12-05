/**
 * Changelog Accordion Sections Component
 *
 * Parses git-cliff generated markdown content to extract and display
 * Technical Details and Deployment sections as collapsible accordions.
 *
 * Database-first: Content comes from entry.content field in database.
 */

'use client';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@heyclaude/web-runtime/ui';
import { ChevronDown, ChevronUp } from '@heyclaude/web-runtime/icons';
import { UI_CLASSES, ANIMATION_CONSTANTS } from '@heyclaude/web-runtime/ui';
import { memo, useState, useEffect } from 'react';
import { SanitizedHTML } from './sanitized-html';

export interface AccordionSection {
  title: string;
  content: string;
  itemCount: number;
}

/**
 * Extracts "Technical Details" and "Deployment" sections from a markdown string as accordion-ready objects.
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
  const sectionRegex = /### (Technical Details|Deployment)([\s\S]*?)(?=### |$)/g;
  const matches = Array.from(content.matchAll(sectionRegex));

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
    <div className={`${UI_CLASSES.MARGIN_TOP_RELAXED} ${UI_CLASSES.FORM_SECTION_SPACING}`}>
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
  const [isOpen, setIsOpen] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>('');

  // Convert markdown to HTML on client side
  useEffect(() => {
    if (typeof window !== 'undefined' && section.content) {
      import('marked').then(({ marked }) => {
        try {
          // Configure marked for GitHub Flavored Markdown (GFM) support
          marked.use({
            gfm: true,
            breaks: false,
            pedantic: false,
          });
          const html = marked.parse(section.content, { async: false }) as string;
          setHtmlContent(html);
        } catch (error) {
          // Fallback to empty string on error
          console.error('[AccordionSectionItem] Failed to parse markdown', error);
          setHtmlContent('');
        }
      }).catch((error) => {
        // Fallback if marked fails to load
        console.error('[AccordionSectionItem] Failed to load marked', error);
        setHtmlContent('');
      });
    } else {
      setHtmlContent('');
    }
  }, [section.content]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4">
      <CollapsibleTrigger
        className={`${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} w-full ${UI_CLASSES.PADDING_Y_COMPACT} ${UI_CLASSES.PADDING_X_DEFAULT} rounded-lg border border-border bg-card hover:bg-accent/5 ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} text-left`}
      >
        <span className={`${UI_CLASSES.TEXT_BODY_DEFAULT} font-semibold`}>
          {section.title}
        </span>
        {isOpen ? (
          <ChevronUp className={`${UI_CLASSES.ICON_SM} text-muted-foreground`} />
        ) : (
          <ChevronDown className={`${UI_CLASSES.ICON_SM} text-muted-foreground`} />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className={`${UI_CLASSES.PADDING_X_DEFAULT} ${UI_CLASSES.PADDING_Y_DEFAULT}`}>
        <div className="prose prose-slate dark:prose-invert max-w-none prose-sm prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
          <SanitizedHTML html={htmlContent} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}