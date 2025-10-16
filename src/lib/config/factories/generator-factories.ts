/**
 * Generator Factory Functions
 *
 * Consolidates repeated generator patterns across content-type-configs.
 * Provides flexible, reusable generator creation for use cases, troubleshooting, and more.
 *
 * Architecture:
 * - Factory functions return generator functions (item) => output
 * - Support for tag-based, title-based, and fallback generation modes
 * - Type-safe with full TypeScript inference
 * - Tree-shakeable: only imported factories included in bundle
 *
 * Benefits:
 * - DRY: Eliminates 8× repeated use case fallback logic
 * - Flexible: Supports multiple generation strategies
 * - Maintainable: Single source of truth for generator patterns
 * - Extensible: Easy to add new generator types
 *
 * @module lib/config/factories/generator-factories
 * @see lib/config/content-type-configs.tsx - Consumer of these factories
 */

import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import type { GeneratorConfig, TroubleshootingItem } from '@/src/lib/types/content-type-config';
import { getDisplayTitle } from '@/src/lib/utils';

/**
 * Tag-based use case mapping type
 * Maps content tags to relevant use cases
 */
export type TagUseCaseMapping = Record<string, string[]>;

/**
 * Use cases generator options
 */
export interface UseCasesGeneratorOptions {
  /**
   * Use getDisplayTitle() to personalize use cases with item title
   * Replaces {title} placeholder in default use cases
   *
   * @example
   * defaults: ['Apply {title} in workflows']
   * With useDisplayTitle: true → 'Apply API Builder Agent in workflows'
   */
  useDisplayTitle?: boolean;

  /**
   * Tag-based use case mapping (rules pattern)
   * Generates use cases based on item.tags
   *
   * @example
   * tagMapping: {
   *   api: ['Design and review RESTful APIs'],
   *   security: ['Conduct security reviews']
   * }
   */
  tagMapping?: TagUseCaseMapping;

  /**
   * Priority order for generation strategies
   * Default: ['item', 'tags', 'title', 'defaults']
   */
  strategy?: Array<'item' | 'tags' | 'title' | 'defaults'>;
}

/**
 * Create a use cases generator function
 *
 * Consolidates the pattern used by all 8 categories with intelligent fallback.
 * Supports three generation modes:
 * 1. Item-based: Use item.useCases if present
 * 2. Tag-based: Generate from item.tags using mapping (rules pattern)
 * 3. Title-based: Personalize defaults with item title (commands/skills pattern)
 * 4. Fallback: Return provided defaults
 *
 * @param defaults - Default use cases when item doesn't provide any
 * @param options - Generation options (tag mapping, title personalization)
 * @returns Generator function compatible with GeneratorConfig['useCases']
 *
 * @example
 * ```typescript
 * // Simple fallback (agents, hooks, mcp, statuslines, collections)
 * useCases: createUseCasesGenerator([
 *   'Automate specialized development workflows',
 *   'Provide expert guidance in specific domains',
 * ])
 *
 * // With title personalization (commands, skills)
 * useCases: createUseCasesGenerator(
 *   ['Execute {title} to automate repetitive tasks'],
 *   { useDisplayTitle: true }
 * )
 *
 * // With tag-based generation (rules)
 * useCases: createUseCasesGenerator(
 *   ['Improve code quality and consistency'],
 *   {
 *     tagMapping: {
 *       api: ['Design and review RESTful APIs'],
 *       security: ['Conduct security reviews'],
 *     }
 *   }
 * )
 * ```
 */
export function createUseCasesGenerator(
  defaults: string[],
  options: UseCasesGeneratorOptions = {}
): NonNullable<GeneratorConfig['useCases']> {
  const {
    useDisplayTitle = false,
    tagMapping,
    strategy = ['item', 'tags', 'title', 'defaults'],
  } = options;

  return (item: UnifiedContentItem): string[] => {
    // Process strategies in order
    for (const strat of strategy) {
      switch (strat) {
        case 'item': {
          // Strategy 1: Use item.useCases if present
          if ('useCases' in item && Array.isArray(item.useCases) && item.useCases.length > 0) {
            return item.useCases;
          }
          break;
        }

        case 'tags': {
          // Strategy 2: Tag-based generation (rules pattern)
          if (tagMapping && item.tags && item.tags.length > 0) {
            const generatedUseCases: string[] = [];
            for (const tag of item.tags) {
              const tagUseCases = tagMapping[tag];
              if (tagUseCases && tagUseCases.length > 0) {
                generatedUseCases.push(...tagUseCases);
              }
            }
            if (generatedUseCases.length > 0) {
              return generatedUseCases;
            }
          }
          break;
        }

        case 'title': {
          // Strategy 3: Title-based personalization (commands/skills pattern)
          if (useDisplayTitle) {
            const displayTitle = getDisplayTitle({
              title: item.title,
              name: item.name,
              slug: item.slug,
              category: item.category,
            });
            return defaults.map((useCase) => useCase.replace('{title}', displayTitle));
          }
          break;
        }

        case 'defaults': {
          // Strategy 4: Return defaults
          return defaults;
        }
      }
    }

    // Fallback (should never reach if 'defaults' in strategy)
    return defaults;
  };
}

/**
 * Troubleshooting generator options
 */
export interface TroubleshootingGeneratorOptions {
  /**
   * Use getDisplayTitle() to personalize issues/solutions
   * Replaces {title} placeholder in template
   */
  useDisplayTitle?: boolean;

  /**
   * Additional static troubleshooting items to append
   */
  additionalItems?: TroubleshootingItem[];
}

/**
 * Create a troubleshooting generator function
 *
 * Consolidates the pattern used by commands, hooks, mcp, and statuslines.
 * Supports static templates with optional title personalization.
 *
 * @param template - Base troubleshooting items (issue/solution pairs)
 * @param options - Generation options (title personalization, additional items)
 * @returns Generator function compatible with GeneratorConfig['troubleshooting']
 *
 * @example
 * ```typescript
 * // Static template (hooks, mcp, statuslines)
 * troubleshooting: createTroubleshootingGenerator([
 *   {
 *     issue: 'Hook script not executing',
 *     solution: 'Verify script has executable permissions...',
 *   },
 * ])
 *
 * // With title personalization (commands)
 * troubleshooting: createTroubleshootingGenerator(
 *   [
 *     {
 *       issue: '{title} command not recognized',
 *       solution: 'Ensure Claude Code is properly installed...',
 *     },
 *   ],
 *   { useDisplayTitle: true }
 * )
 * ```
 */
export function createTroubleshootingGenerator(
  template: TroubleshootingItem[],
  options: TroubleshootingGeneratorOptions = {}
): NonNullable<GeneratorConfig['troubleshooting']> {
  const { useDisplayTitle = false, additionalItems = [] } = options;

  return (item: UnifiedContentItem): TroubleshootingItem[] => {
    // Check if item has custom troubleshooting
    if (
      'troubleshooting' in item &&
      Array.isArray(item.troubleshooting) &&
      item.troubleshooting.length > 0
    ) {
      return item.troubleshooting as TroubleshootingItem[];
    }

    // Use template
    let items = [...template];

    // Personalize with title if requested
    if (useDisplayTitle) {
      const displayTitle = getDisplayTitle({
        title: item.title || '',
        name: item.name || '',
        slug: item.slug,
        category: item.category,
      });

      items = items.map((troubleshootingItem) => ({
        issue: troubleshootingItem.issue.replace('{title}', displayTitle),
        solution: troubleshootingItem.solution.replace('{title}', displayTitle),
      }));
    }

    // Append additional items if provided
    if (additionalItems.length > 0) {
      items.push(...additionalItems);
    }

    return items;
  };
}

/**
 * Pre-configured generator factories for common patterns
 *
 * Provides ready-to-use generators with standard defaults.
 * Reduces boilerplate for common category patterns.
 */
export const commonGenerators = {
  /**
   * Generic use cases generator (agents, hooks, mcp, statuslines, collections)
   * Uses simple fallback strategy
   */
  genericUseCases: (defaults: string[]) => createUseCasesGenerator(defaults),

  /**
   * Tag-based use cases generator (rules pattern)
   * Generates from tags, falls back to defaults
   */
  tagBasedUseCases: (defaults: string[], tagMapping: TagUseCaseMapping) =>
    createUseCasesGenerator(defaults, { tagMapping }),

  /**
   * Title-personalized use cases generator (commands, skills pattern)
   * Personalizes defaults with item title
   */
  titleBasedUseCases: (defaults: string[]) =>
    createUseCasesGenerator(defaults, { useDisplayTitle: true }),

  /**
   * Standard troubleshooting generator (hooks, mcp, statuslines)
   * Static template, no personalization
   */
  staticTroubleshooting: (template: TroubleshootingItem[]) =>
    createTroubleshootingGenerator(template),

  /**
   * Personalized troubleshooting generator (commands)
   * Personalizes template with item title
   */
  personalizedTroubleshooting: (template: TroubleshootingItem[]) =>
    createTroubleshootingGenerator(template, { useDisplayTitle: true }),
} as const;
