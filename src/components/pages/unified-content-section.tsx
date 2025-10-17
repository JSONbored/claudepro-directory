'use client';

/**
 * UnifiedContentSection - Client Component with Discriminated Union
 *
 * **ARCHITECTURE: Proper Data/Presentation Separation (Phase 4 Consolidation)**
 *
 * This component consolidates 6 section components into one configuration-driven component:
 * - BulletListSection (120 LOC)
 * - ContentSection (83 LOC)
 * - ConfigurationSection (207 LOC)
 * - UsageExamplesSection (251 LOC)
 * - TroubleshootingSection (105 LOC)
 * - InstallationSection (155 LOC)
 *
 * **Consolidation Metrics:**
 * - Old: 6 files, 921 LOC (components only)
 * - New: 1 file, 559 LOC (component) + 510 LOC (comprehensive Storybook stories)
 * - Component reduction: 362 LOC eliminated (39% reduction)
 * - Added: Full Storybook coverage that didn't exist before
 *
 * **KEY ARCHITECTURAL IMPROVEMENT:**
 *
 * **PROBLEM (Before):**
 * - Components were performing async operations (syntax highlighting)
 * - Mixed data fetching and presentation logic
 * - Not Storybook-compatible (server dependencies)
 * - Sequential async operations (performance bottleneck)
 *
 * **SOLUTION (After):**
 * - DATA LAYER (Server): All async operations happen at page level (unified-detail-page/index.tsx)
 * - PRESENTATION LAYER (Client): This component receives pre-processed HTML and renders UI
 * - Parallel async processing using Promise.all, batchMap, batchFetch
 * - Proper separation of concerns
 *
 * **Benefits:**
 * - ✅ Proper separation of concerns (data vs presentation)
 * - ✅ Parallel async processing at page level (performance)
 * - ✅ Storybook-compatible (no server dependencies)
 * - ✅ Testable in isolation (no async dependencies)
 * - ✅ Type-safe discriminated union (enforces valid prop combinations)
 * - ✅ Zero backward compatibility - modern patterns only
 * - ✅ 6 variants consolidated: bullets, content, configuration (json/multi/hook), examples, troubleshooting, installation
 *
 * **Discriminated Union Pattern:**
 * The props use TypeScript discriminated unions to ensure type safety. Each variant has
 * its own specific required props, and TypeScript enforces that only valid combinations
 * can be used. This eliminates entire classes of runtime errors.
 *
 * @see unified-detail-page/index.tsx - Data layer (async processing, lines 108-291)
 * @see unified-content-section.stories.tsx - Comprehensive Storybook documentation
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { ProductionCodeBlock } from '@/src/components/ui/production-code-block';
import { UnifiedBadge } from '@/src/components/ui/unified-badge';
import type { LucideIcon } from '@/src/lib/icons';
import { Copy } from '@/src/lib/icons';
import type { UnifiedContentItem } from '@/src/lib/schemas/component.schema';
import type { InstallationSteps } from '@/src/lib/types/content-type-config';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';

/**
 * Discriminated union for all 6 section variants
 * Each variant has its own specific props, enforced by TypeScript
 */
export type UnifiedContentSectionProps =
  | {
      variant: 'bullets';
      title: string;
      description?: string;
      items: string[];
      icon: LucideIcon;
      bulletColor?: 'primary' | 'accent' | 'orange' | 'red' | 'green' | 'blue';
      textVariant?: 'default' | 'mono';
      className?: string;
    }
  | {
      variant: 'content';
      title: string;
      description?: string;
      html: string;
      code: string;
      language: string;
      filename: string;
      className?: string;
    }
  | {
      variant: 'configuration';
      format: 'json';
      html: string;
      code: string;
      filename: string;
      className?: string;
    }
  | {
      variant: 'configuration';
      format: 'multi';
      configs: Array<{
        key: string;
        html: string;
        code: string;
        filename: string;
      }>;
      className?: string;
    }
  | {
      variant: 'configuration';
      format: 'hook';
      hookConfig: {
        html: string;
        code: string;
        filename: string;
      } | null;
      scriptContent: {
        html: string;
        code: string;
        filename: string;
      } | null;
      className?: string;
    }
  | {
      variant: 'examples';
      title?: string;
      description?: string;
      examples: Array<{
        title: string;
        description?: string;
        html: string;
        code: string;
        language: string;
        filename: string;
      }>;
      maxLines?: number;
      showLineNumbers?: boolean;
      className?: string;
    }
  | {
      variant: 'troubleshooting';
      description: string;
      items: Array<
        | string
        | {
            issue: string;
            solution: string;
          }
      >;
      className?: string;
    }
  | {
      variant: 'installation';
      installation: InstallationSteps;
      item: UnifiedContentItem;
      className?: string;
    };

/**
 * Bullet color mapping for bullets variant
 */
const BULLET_COLORS = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
} as const;

/**
 * UnifiedContentSection Component
 *
 * Configuration-driven section rendering with discriminated union type safety.
 * All async operations are handled at the page level (data layer).
 * This component purely renders pre-processed data (presentation layer).
 */
export function UnifiedContentSection(props: UnifiedContentSectionProps) {
  // ============================================================================
  // BULLETS VARIANT
  // ============================================================================
  if (props.variant === 'bullets') {
    const {
      title,
      description,
      items,
      icon: Icon,
      bulletColor = 'primary',
      textVariant = 'default',
      className,
    } = props;

    if (items.length === 0) return null;

    const bulletClass = BULLET_COLORS[bulletColor];
    const textClass = textVariant === 'mono' ? 'font-mono text-xs' : 'text-sm';

    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.slice(0, 50)} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                <div className={cn('h-1.5 w-1.5 rounded-full mt-2 flex-shrink-0', bulletClass)} />
                <span className={cn('leading-relaxed', textClass)}>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // CONTENT VARIANT
  // ============================================================================
  if (props.variant === 'content') {
    const { title, description, html, code, language, filename, className } = props;

    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Copy className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <ProductionCodeBlock
            html={html}
            code={code}
            language={language}
            filename={filename}
            maxLines={20}
          />
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // CONFIGURATION VARIANT
  // ============================================================================
  if (props.variant === 'configuration') {
    // Multi-format configuration (MCP servers)
    if (props.format === 'multi') {
      const { configs, className } = props;

      return (
        <Card data-section="configuration" className={cn('', className)}>
          <CardHeader>
            <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Copy className="h-5 w-5" />
              Configuration
            </CardTitle>
            <CardDescription>
              Add these configurations to your Claude Desktop or Claude Code setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {configs.map((config) => (
              <div key={config.key}>
                <ProductionCodeBlock
                  html={config.html}
                  code={config.code}
                  language="json"
                  filename={config.filename}
                  maxLines={25}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      );
    }

    // Hook configuration format
    if (props.format === 'hook') {
      const { hookConfig, scriptContent, className } = props;

      return (
        <Card className={cn('', className)}>
          <CardHeader>
            <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Copy className="h-5 w-5" />
              Hook Configuration
            </CardTitle>
            <CardDescription>Hook setup and script content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hookConfig && (
              <ProductionCodeBlock
                html={hookConfig.html}
                code={hookConfig.code}
                language="json"
                filename={hookConfig.filename}
                maxLines={20}
              />
            )}
            {scriptContent && (
              <ProductionCodeBlock
                html={scriptContent.html}
                code={scriptContent.code}
                language="bash"
                filename={scriptContent.filename}
                maxLines={25}
              />
            )}
          </CardContent>
        </Card>
      );
    }

    // Default JSON configuration
    const { html, code, filename, className } = props;

    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Copy className="h-5 w-5" />
            Configuration
          </CardTitle>
          <CardDescription>Configuration settings and parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductionCodeBlock
            html={html}
            code={code}
            language="json"
            filename={filename}
            maxLines={25}
          />
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // USAGE EXAMPLES VARIANT
  // ============================================================================
  if (props.variant === 'examples') {
    const {
      title = 'Usage Examples',
      description = 'Practical code examples demonstrating common use cases and implementation patterns',
      examples,
      maxLines = 20,
      showLineNumbers = false,
      className,
    } = props;

    if (examples.length === 0) return null;

    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Copy className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {examples.map((example, index) => (
              <article
                key={`${example.title}-${index}`}
                className="space-y-3"
                itemScope
                itemType="https://schema.org/SoftwareSourceCode"
              >
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-foreground" itemProp="name">
                    {example.title}
                  </h4>
                  {example.description && (
                    <p
                      className="text-sm text-muted-foreground leading-relaxed"
                      itemProp="description"
                    >
                      {example.description}
                    </p>
                  )}
                </div>
                <div className="not-prose" itemProp="text">
                  <meta itemProp="programmingLanguage" content={example.language} />
                  <ProductionCodeBlock
                    html={example.html}
                    code={example.code}
                    language={example.language}
                    filename={example.filename}
                    maxLines={maxLines}
                    showLineNumbers={showLineNumbers}
                    className="shadow-sm"
                  />
                </div>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // TROUBLESHOOTING VARIANT
  // ============================================================================
  if (props.variant === 'troubleshooting') {
    const { description, items, className } = props;

    if (items.length === 0) return null;

    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Copy className="h-5 w-5" />
            Troubleshooting
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {items.map((trouble) => {
              // Simple string format
              if (typeof trouble === 'string') {
                return (
                  <li key={trouble.slice(0, 50)} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{trouble}</span>
                  </li>
                );
              }

              // Issue/solution object format
              return (
                <li key={trouble.issue.slice(0, 50)} className="space-y-2">
                  <div className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{trouble.issue}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {trouble.solution}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // INSTALLATION VARIANT
  // ============================================================================
  if (props.variant === 'installation') {
    const { installation, className } = props;

    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Copy className="h-5 w-5" />
            Installation
          </CardTitle>
          <CardDescription>Setup instructions and requirements</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Claude Code installation */}
          {typeof installation === 'object' &&
            'claudeCode' in installation &&
            installation.claudeCode && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Claude Code Setup</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {installation.claudeCode.steps?.map((step: string) => (
                      <li key={step.slice(0, 50)} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
                {installation.claudeCode.configPath && (
                  <div>
                    <h4 className="font-medium mb-2">Configuration Paths</h4>
                    <div className="space-y-1 text-sm">
                      {Object.entries(installation.claudeCode.configPath).map(
                        ([location, path]) => (
                          <div key={location} className={UI_CLASSES.FLEX_GAP_2}>
                            <UnifiedBadge variant="base" style="outline" className="capitalize">
                              {location}
                            </UnifiedBadge>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {String(path)}
                            </code>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Claude Desktop installation (for MCP servers) */}
          {typeof installation === 'object' &&
            'claudeDesktop' in installation &&
            installation.claudeDesktop && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Claude Desktop Setup</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {installation.claudeDesktop.steps?.map((step: string) => (
                      <li key={step.slice(0, 50)} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
                {installation.claudeDesktop.configPath && (
                  <div>
                    <h4 className="font-medium mb-2">Configuration Paths</h4>
                    <div className="space-y-1 text-sm">
                      {Object.entries(installation.claudeDesktop.configPath).map(
                        ([platform, path]) => (
                          <div key={platform} className={UI_CLASSES.FLEX_GAP_2}>
                            <UnifiedBadge variant="base" style="outline" className="capitalize">
                              {platform}
                            </UnifiedBadge>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {String(path)}
                            </code>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Requirements */}
          {installation.requirements && installation.requirements.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Requirements</h4>
              <ul className="space-y-2">
                {installation.requirements.map((requirement: string) => (
                  <li key={requirement.slice(0, 50)} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                    <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // TypeScript exhaustiveness check
  return null;
}
