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
import { memo, useState } from 'react';
import { SanitizedHTML } from './sanitized-html';

export interface AccordionSection {
  title: string;
  content: string;
  itemCount: number;
}

/**
 * Extracts "Technical Details" and "Deployment" sections from markdown and returns them as accordion-ready objects.
 *
 * The parser looks for level-3 headers (`### Technical Details` or `### Deployment`) and captures each section's
 * content up to the next `###` header or the end of the string. For each non-empty section it computes the number
 * of bullet items (lines starting with `- `) and includes that count in the returned `title`.
 *
 * @param content - Markdown string to parse; falsy or non-string values produce an empty result.
 * @returns An array of `AccordionSection` objects for each found section. Returns an empty array if no matching sections are found or input is invalid.
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
 * Renders a single collapsible accordion item for a changelog section.
 *
 * Displays the section title in the trigger and the section's sanitized HTML content in the collapsible panel.
 *
 * @param section - The accordion section data to render (title, HTML content, and bullet item count).
 * @returns The accordion item element for the provided section.
 *
 * @see AccordionSection
 * @see ChangelogAccordionSections
 */
function AccordionSectionItem({ section }: AccordionSectionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

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
          <SanitizedHTML html={section.content} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}