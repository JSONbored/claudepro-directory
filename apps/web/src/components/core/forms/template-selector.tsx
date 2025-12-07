'use client';

/**
 * Template Selector - Uses server-provided template data
 */

import { type Database } from '@heyclaude/database-types';
import { ChevronDown, FileText } from '@heyclaude/web-runtime/icons';
import {
  DIMENSIONS,
  UI_CLASSES,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@heyclaude/web-runtime/ui';

// Use generated type directly from @heyclaude/database-types
type ContentTemplatesResult = Database['public']['Functions']['get_content_templates']['Returns'];
type ContentTemplateItem = NonNullable<NonNullable<ContentTemplatesResult['templates']>[number]>;

// Type representing the merged structure (matches what getContentTemplates returns)
type MergedTemplateItem = ContentTemplateItem &
  (ContentTemplateItem['template_data'] extends Record<string, unknown>
    ? ContentTemplateItem['template_data']
    : Record<string, unknown>) & {
    templateData: ContentTemplateItem['template_data'];
  };

interface TemplateSelectorProps {
  onSelect: (template: MergedTemplateItem) => void;
  templates: MergedTemplateItem[];
}

/**
 * Render a dropdown menu allowing the user to choose a content template.
 *
 * Renders nothing when the `templates` array is empty.
 *
 * @param templates - Array of template items to display in the menu; each item is shown with its name and description.
 * @param onSelect - Called with the selected template item when a menu entry is clicked.
 * @returns The dropdown menu element or `null` when no templates are available.
 *
 * @see DropdownMenu
 * @see MergedTemplateItem
 */
export function TemplateSelector({ templates, onSelect }: TemplateSelectorProps) {
  if (templates.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between" type="button">
          <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <FileText className={UI_CLASSES.ICON_SM} />
            Use Template
          </span>
          <ChevronDown className={`${UI_CLASSES.ICON_SM} opacity-50`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={`${DIMENSIONS.DROPDOWN_SM} sm:${DIMENSIONS.DROPDOWN_MD}`}
      >
        {templates.map((template) => (
          <DropdownMenuItem
            key={template.id}
            onClick={() => onSelect(template)}
            className="cursor-pointer flex-col items-start py-3"
          >
            <div className="font-medium">{template.name}</div>
            <div className="text-muted-foreground mt-0.5 text-xs">{template.description}</div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}