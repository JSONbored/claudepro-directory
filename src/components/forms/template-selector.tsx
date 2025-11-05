'use client';

/**
 * Template Selector - Fetches curated starter templates from database via get_content_templates RPC
 */

import { useEffect, useState } from 'react';
import { Button } from '@/src/components/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/primitives/dropdown-menu';
import type { SubmissionContentType } from '@/src/lib/forms/types';
import { ChevronDown, FileText } from '@/src/lib/icons';
import { createClient } from '@/src/lib/supabase/client';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export interface Template {
  id: string;
  type: string;
  name: string;
  description: string;
  category?: string;
  tags?: string;
  [key: string]: unknown;
}

interface TemplateSelectorProps {
  contentType: SubmissionContentType;
  onSelect: (template: Template) => void;
}

export function TemplateSelector({ contentType, onSelect }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchTemplates() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_content_templates', {
          p_category: contentType,
        });

        if (error) throw error;

        if (isMounted && data) {
          setTemplates(Array.isArray(data) ? (data as Template[]) : []);
        }
      } catch {
        if (isMounted) {
          setTemplates([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchTemplates().catch(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [contentType]);

  if (isLoading || templates.length === 0) {
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
