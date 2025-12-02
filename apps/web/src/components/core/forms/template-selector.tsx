'use client';

/**
 * Template Selector - Uses server-provided template data
 */

import type { Database } from '@heyclaude/database-types';
import { ChevronDown, FileText } from '@heyclaude/web-runtime/icons';
import {
  cluster,
  flexDir,
  iconSize,
  alignItems,
  justify,
  marginTop,
  muted,
  opacityLevel,
  padding,
  size,
  weight,
  dropdownWidth,
} from '@heyclaude/web-runtime/design-system';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@heyclaude/web-runtime/ui';

// Use generated type directly from @heyclaude/database-types
type ContentTemplatesResult = Database['public']['Functions']['get_content_templates']['Returns'];
type ContentTemplateItem = NonNullable<NonNullable<ContentTemplatesResult['templates']>[number]>;

// Type representing the merged structure (matches what getContentTemplates returns)
type MergedTemplateItem = ContentTemplateItem & {
  templateData: ContentTemplateItem['template_data'];
} & (ContentTemplateItem['template_data'] extends Record<string, unknown>
    ? ContentTemplateItem['template_data']
    : Record<string, unknown>);

interface TemplateSelectorProps {
  templates: MergedTemplateItem[];
  onSelect: (template: MergedTemplateItem) => void;
}

/**
 * Renders a template picker button that opens a dropdown list of templates and invokes `onSelect` when a template is chosen.
 *
 * If `templates` is empty, this component renders nothing.
 *
 * @param props.templates - Array of template objects to display. Each item should include `id`, `name`, and `description`.
 * @param props.onSelect - Callback invoked with the selected template when a dropdown item is clicked.
 * @returns The dropdown menu UI for selecting a template, or `null` when no templates are provided.
 *
 * @see DropdownMenu
 * @see DropdownMenuTrigger
 * @see DropdownMenuContent
 * @see DropdownMenuItem
 * @see Button
 */
export function TemplateSelector({ templates, onSelect }: TemplateSelectorProps) {
  if (templates.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild={true}>
        <Button variant="outline" className={`w-full ${justify.between}`} type="button">
          <span className={cluster.compact}>
            <FileText className={iconSize.sm} />
            Use Template
          </span>
          <ChevronDown className={`${iconSize.sm} ${opacityLevel[50]}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={`${dropdownWidth.sm} sm:${dropdownWidth.md}`}
      >
        {templates.map((template) => (
          <DropdownMenuItem
            key={template.id}
            onClick={() => onSelect(template)}
            className={`cursor-pointer ${flexDir.col} ${alignItems.start} ${padding.yCompact}`}
          >
            <div className={weight.medium}>{template.name}</div>
            <div className={`${marginTop.micro} ${muted.default} ${size.xs}`}>{template.description}</div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}