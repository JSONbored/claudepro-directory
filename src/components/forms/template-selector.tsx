'use client';

import { Button } from '@/src/components/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/primitives/dropdown-menu';
import { TEMPLATES, type Template } from '@/src/lib/config/templates';
import { ChevronDown, FileText } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Template Selector Component
 *
 * Config-driven dropdown for pre-filling forms with curated templates.
 * Templates are defined in JSON files (src/lib/config/templates/*.json)
 * and validated with Zod schemas for type safety.
 *
 * Architecture:
 * - Templates extracted to JSON for easy maintenance
 * - Zod validation ensures runtime type safety
 * - TypeScript types inferred from Zod schemas
 * - Supports all 7 content types: agents, mcp, rules, commands, hooks, statuslines, skills
 *
 * Benefits:
 * - Configuration-driven: Non-developers can add templates via JSON
 * - Maintainability: Separate data from logic
 * - Scalability: Easy to add templates without code changes
 * - Type Safety: Runtime validation + compile-time types
 */

// Re-export Template type for consumer components
export type { Template };

type ContentType = 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks' | 'statuslines' | 'skills';

interface TemplateSelectorProps {
  contentType: ContentType;
  onSelect: (template: Template) => void;
}

export function TemplateSelector({ contentType, onSelect }: TemplateSelectorProps) {
  const templates = TEMPLATES[contentType] || [];

  if (templates.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between" type="button">
          <span className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <FileText className="h-4 w-4" />
            Use Template
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px] sm:w-[320px]">
        {templates.map((template) => (
          <DropdownMenuItem
            key={template.id}
            onClick={() => onSelect(template)}
            className="flex-col items-start py-3 cursor-pointer"
          >
            <div className="font-medium">{template.name}</div>
            <div className={'text-xs text-muted-foreground mt-0.5'}>{template.description}</div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
