/**
 * Action Factory Functions
 *
 * Consolidates repeated action handler patterns across content-type-configs.
 * Eliminates duplication while maintaining type safety and flexibility.
 *
 * Architecture:
 * - Factory functions return ActionButtonConfig objects
 * - Support for copy, scroll, notification, and GitHub link actions
 * - Type-safe with full TypeScript inference
 * - Tree-shakeable: only imported factories included in bundle
 *
 * Benefits:
 * - DRY: Eliminates 8× repeated handler patterns
 * - Type-safe: Full TypeScript validation
 * - Maintainable: Single source of truth for common actions
 * - Extensible: Easy to add new action types
 *
 * @module lib/config/factories/action-factories
 * @see lib/config/content-type-configs.tsx - Consumer of these factories
 */

import type { ReactNode } from 'react';
import { BookOpen, Layers, Server, Terminal, Webhook } from '@/src/lib/icons';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import type { ActionButtonConfig } from '@/src/lib/types/content-type-config';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { toasts } from '@/src/lib/utils/toast.utils';

/**
 * Content extractor function type
 * Extracts content string from UnifiedContentItem for copying
 */
export type ContentExtractor = (item: UnifiedContentItem) => string;

/**
 * Create a copy-to-clipboard action handler
 *
 * Consolidates the pattern used by commands and statuslines categories.
 * Extracts content via provided extractor function and copies to clipboard.
 *
 * @param label - Button label text (e.g., "Copy Command", "Copy Script")
 * @param icon - React icon component to display
 * @param contentExtractor - Function to extract content from item
 * @param successTitle - Toast notification title
 * @param successDescription - Toast notification description
 * @returns ActionButtonConfig with copy handler
 *
 * @example
 * ```tsx
 * // commands category
 * primaryAction: createCopyAction(
 *   'Copy Command',
 *   <Terminal className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
 *   (item) => ('content' in item && typeof item.content === 'string' ? item.content : ''),
 *   'Copied!',
 *   'Command content has been copied to your clipboard.'
 * )
 * ```
 */
export function createCopyAction(
  label: string,
  icon: ReactNode,
  contentExtractor: ContentExtractor,
  successTitle: string,
  successDescription: string
): ActionButtonConfig {
  return {
    label,
    icon,
    handler: async (item: UnifiedContentItem) => {
      const content = contentExtractor(item);
      await navigator.clipboard.writeText(content);
      toasts.raw.success(successTitle, {
        description: successDescription,
      });
    },
  };
}

/**
 * Create a scroll-to-section action handler
 *
 * Consolidates the pattern used by mcp, collections, and skills categories.
 * Scrolls viewport to specified section using smooth animation.
 *
 * @param label - Button label text (e.g., "View Configuration", "View Collection")
 * @param icon - React icon component to display
 * @param sectionId - data-section attribute value to scroll to
 * @returns ActionButtonConfig with scroll handler
 *
 * @example
 * ```tsx
 * // mcp category
 * primaryAction: createScrollAction(
 *   'View Configuration',
 *   <Server className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
 *   'configuration'
 * )
 * ```
 */
export function createScrollAction(
  label: string,
  icon: ReactNode,
  sectionId: string
): ActionButtonConfig {
  return {
    label,
    icon,
    handler: () => {
      const section = document.querySelector(`[data-section="${sectionId}"]`);
      section?.scrollIntoView({ behavior: 'smooth' });
    },
  };
}

/**
 * Create a notification-only action handler
 *
 * Consolidates the pattern used by agents and rules categories.
 * Shows toast notification without performing other actions.
 *
 * @param label - Button label text (e.g., "Deploy Agent", "Use Rule")
 * @param icon - React icon component to display
 * @param notificationTitle - Toast notification title
 * @param notificationDescription - Toast notification description
 * @returns ActionButtonConfig with notification handler
 *
 * @example
 * ```tsx
 * // agents category
 * primaryAction: createNotificationAction(
 *   'Deploy Agent',
 *   <Bot className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
 *   'Agent Deployment',
 *   'Copy the agent content and follow the installation instructions.'
 * )
 * ```
 */
export function createNotificationAction(
  label: string,
  icon: ReactNode,
  notificationTitle: string,
  notificationDescription: string
): ActionButtonConfig {
  return {
    label,
    icon,
    handler: () => {
      toasts.raw.success(notificationTitle, {
        description: notificationDescription,
      });
    },
  };
}

/**
 * Create a GitHub link action handler
 *
 * Standardizes GitHub repository link opening pattern.
 * Opens content file in new tab using provided path template.
 *
 * @param label - Button label text (default: "View on GitHub")
 * @param icon - React icon component to display (default: Webhook)
 * @param pathTemplate - GitHub path template with {slug} placeholder
 * @returns ActionButtonConfig with GitHub link handler
 *
 * @example
 * ```tsx
 * // hooks category
 * primaryAction: createGitHubLinkAction(
 *   'View on GitHub',
 *   <Webhook className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
 *   'https://github.com/JSONbored/claudepro-directory/blob/main/content/hooks/{slug}.json'
 * )
 * ```
 */
export function createGitHubLinkAction(
  label = 'View on GitHub',
  icon: ReactNode = <Webhook className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
  pathTemplate: string
): ActionButtonConfig {
  return {
    label,
    icon,
    handler: (item: UnifiedContentItem) => {
      if ('slug' in item && item.slug) {
        const url = pathTemplate.replace('{slug}', item.slug);
        window.open(url, '_blank');
      }
    },
  };
}

/**
 * Pre-configured action factories for common patterns
 *
 * Provides ready-to-use actions with standard icons and messages.
 * Reduces boilerplate for common category patterns.
 */
export const commonActions = {
  /**
   * Copy command content action (for commands category)
   */
  copyCommand: () =>
    createCopyAction(
      'Copy Command',
      <Terminal className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
      (item) => ('content' in item && typeof item.content === 'string' ? item.content : ''),
      'Copied!',
      'Command content has been copied to your clipboard.'
    ),

  /**
   * Copy script content action (for statuslines category)
   */
  copyScript: () =>
    createCopyAction(
      'Copy Script',
      <Terminal className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
      (item) =>
        'configuration' in item &&
        typeof item.configuration === 'object' &&
        item.configuration &&
        'scriptContent' in item.configuration &&
        typeof item.configuration.scriptContent === 'string'
          ? item.configuration.scriptContent
          : '',
      'Copied!',
      'Statusline script has been copied to your clipboard.'
    ),

  /**
   * View configuration action (for mcp category)
   */
  viewConfiguration: () =>
    createScrollAction(
      'View Configuration',
      <Server className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
      'configuration'
    ),

  /**
   * View collection action (for collections category)
   */
  viewCollection: () =>
    createScrollAction(
      'View Collection',
      <Layers className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
      'items'
    ),

  /**
   * Use skill action (for skills category)
   */
  useSkill: () =>
    createScrollAction(
      'Use Skill',
      <BookOpen className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
      'content'
    ),

  /**
   * View hooks on GitHub action (for hooks category)
   */
  viewHookOnGitHub: () =>
    createGitHubLinkAction(
      'View on GitHub',
      <Webhook className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
      'https://github.com/JSONbored/claudepro-directory/blob/main/content/hooks/{slug}.json'
    ),
} as const;
