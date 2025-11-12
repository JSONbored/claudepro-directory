import type { CategoryId } from '@/src/lib/config/category-config.types';
import type { LucideIcon } from '@/src/lib/icons';
import type { ContentItem } from '@/src/lib/types/component.types';

type BaseProps = { className?: string };

export type ListProps = BaseProps & {
  variant: 'list';
  title: string;
  description: string;
  items: string[];
  category?: CategoryId;
  icon?: LucideIcon;
  dotColor?: string;
};

export type EnhancedListProps = BaseProps & {
  variant: 'enhanced-list';
  title: string;
  description?: string;
  items: Array<string | { issue: string; solution: string }>;
  icon?: LucideIcon;
  dotColor?: string;
};

export type CodeProps = BaseProps & {
  variant: 'code';
  title: string;
  description?: string;
  html: string;
  code: string;
  language: string;
  filename: string;
  icon?: LucideIcon;
};

export type ExamplesProps = BaseProps & {
  variant: 'examples';
  examples: Array<{
    title: string;
    description?: string;
    html: string;
    code: string;
    language: string;
    filename: string;
  }>;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  maxLines?: number;
  showLineNumbers?: boolean;
};

export type ConfigProps = BaseProps &
  (
    | {
        variant: 'configuration';
        format: 'json';
        html: string;
        code: string;
        filename: string;
      }
    | {
        variant: 'configuration';
        format: 'multi';
        configs: Array<{ key: string; html: string; code: string; filename: string }>;
      }
    | {
        variant: 'configuration';
        format: 'hook';
        hookConfig: { html: string; code: string; filename: string } | null;
        scriptContent: { html: string; code: string; filename: string } | null;
      }
  );

export type InstallProps = BaseProps & {
  variant: 'installation';
  installationData: {
    claudeCode?: {
      steps: Array<{ type: 'command'; html: string; code: string } | { type: 'text'; text: string }>;
      configPath?: Record<string, string>;
    } | null;
    claudeDesktop?: {
      steps: Array<{ type: 'command'; html: string; code: string } | { type: 'text'; text: string }>;
      configPath?: Record<string, string>;
    } | null;
    sdk?: {
      steps: Array<{ type: 'command'; html: string; code: string } | { type: 'text'; text: string }>;
    } | null;
    requirements?: string[];
  };
  item: ContentItem;
};

export type UnifiedSectionProps =
  | ListProps
  | EnhancedListProps
  | CodeProps
  | ExamplesProps
  | ConfigProps
  | InstallProps;
