'use client';

/**
 * Template Selector - Uses server-provided template data
 */

import { Button } from '@/src/components/primitives/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/primitives/ui/dropdown-menu';
import type { Template } from '@/src/lib/data/content/templates';
import { ChevronDown, FileText } from '@/src/lib/icons';
import { DIMENSIONS, UI_CLASSES } from '@/src/lib/ui-constants';

interface TemplateSelectorProps {
  templates: Template[];
  onSelect: (template: Template) => void;
}

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
            <div className={'mt-0.5 text-muted-foreground text-xs'}>{template.description}</div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
