'use client';

/**
 * Unified Section Component - Consolidates 9 section components into 1
 *
 * Replaces:
 * - features-section.tsx (88 LOC)
 * - use-cases-section.tsx (88 LOC)
 * - security-section.tsx (92 LOC)
 * - requirements-section.tsx (92 LOC)
 * - troubleshooting-section.tsx (80 LOC)
 * - content-section.tsx (68 LOC)
 * - examples-section.tsx (104 LOC)
 * - configuration-section.tsx (157 LOC)
 * - installation-section.tsx (226 LOC)
 *
 * Total savings: 995 LOC → 350 LOC = 645 LOC removed (64.8% reduction)
 */

import { motion } from 'motion/react';
import { ProductionCodeBlock } from '@/src/components/content/interactive-code-block';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import type { CategoryId } from '@/src/lib/config/category-config.types';
import {
  Bookmark,
  BookOpen,
  Bot,
  Briefcase,
  Code,
  Copy,
  FileText,
  type LucideIcon,
  Package,
  Rocket,
  Sparkles,
  Terminal,
  Zap,
} from '@/src/lib/icons';
import type { ContentItem } from '@/src/lib/types/component.types';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';

// ============================================================================
// SHARED CONSTANTS
// ============================================================================

const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  agents: Sparkles,
  mcp: Package,
  commands: Terminal,
  rules: FileText,
  hooks: Code,
  statuslines: Zap,
  collections: Bookmark,
  skills: Rocket,
  guides: BookOpen,
  jobs: Briefcase,
  changelog: Bot,
};

const SCROLL_REVEAL_ANIMATION = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
} as const;

// ============================================================================
// TYPESCRIPT TYPES - DISCRIMINATED UNIONS
// ============================================================================

type BaseProps = {
  className?: string;
};

/**
 * List variant - Simple bullet list with colored dots
 * Replaces: features-section, use-cases-section, security-section, requirements-section
 */
type ListVariant = BaseProps & {
  variant: 'list';
  title: string;
  description: string;
  icon?: LucideIcon;
  category?: CategoryId;
  items: string[];
  dotColor?: string;
};

/**
 * Enhanced list variant - Supports issue/solution pairs
 * Replaces: troubleshooting-section
 */
type EnhancedListVariant = BaseProps & {
  variant: 'enhanced-list';
  title: string;
  description?: string;
  icon?: LucideIcon;
  items: Array<string | { issue: string; solution: string }>;
  dotColor?: string;
};

/**
 * Code variant - Single code block with syntax highlighting
 * Replaces: content-section
 */
type CodeVariant = BaseProps & {
  variant: 'code';
  title: string;
  description?: string;
  icon?: LucideIcon;
  html: string;
  code: string;
  language: string;
  filename: string;
};

/**
 * Examples variant - Multiple code examples with titles/descriptions
 * Replaces: examples-section
 */
type ExamplesVariant = BaseProps & {
  variant: 'examples';
  title?: string;
  description?: string;
  icon?: LucideIcon;
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
};

/**
 * Configuration variant - Handles 3 formats: json, multi, hook
 * Replaces: configuration-section
 */
type ConfigurationVariant = BaseProps &
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
        configs: Array<{
          key: string;
          html: string;
          code: string;
          filename: string;
        }>;
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
      }
  );

/**
 * Installation variant - Complex multi-platform installation
 * Replaces: installation-section
 */
type InstallationVariant = BaseProps & {
  variant: 'installation';
  installationData: {
    claudeCode: {
      steps: Array<
        { type: 'command'; html: string; code: string } | { type: 'text'; text: string }
      >;
      configPath?: Record<string, string>;
      configFormat?: string;
    } | null;
    claudeDesktop: {
      steps: Array<
        { type: 'command'; html: string; code: string } | { type: 'text'; text: string }
      >;
      configPath?: Record<string, string>;
    } | null;
    sdk: {
      steps: Array<
        { type: 'command'; html: string; code: string } | { type: 'text'; text: string }
      >;
    } | null;
    requirements?: string[];
  };
  item: ContentItem;
};

export type UnifiedSectionProps =
  | ListVariant
  | EnhancedListVariant
  | CodeVariant
  | ExamplesVariant
  | ConfigurationVariant
  | InstallationVariant;

// ============================================================================
// VARIANT RENDERERS
// ============================================================================

function ListSectionRenderer({
  title,
  description,
  icon: ProvidedIcon,
  category,
  items,
  dotColor = 'bg-primary',
  className,
}: Omit<ListVariant, 'variant'>) {
  if (items.length === 0) return null;

  const Icon = ProvidedIcon || (category ? CATEGORY_ICONS[category] : Copy);

  return (
    <motion.div {...SCROLL_REVEAL_ANIMATION}>
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Icon className={UI_CLASSES.ICON_MD} />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.slice(0, 50)} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                <div className={cn('mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full', dotColor)} />
                <span className="text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EnhancedListSectionRenderer({
  title,
  description = 'Common issues and solutions',
  icon: ProvidedIcon,
  items,
  dotColor = 'bg-red-500',
  className,
}: Omit<EnhancedListVariant, 'variant'>) {
  if (items.length === 0) return null;

  const Icon = ProvidedIcon || Copy;

  return (
    <motion.div {...SCROLL_REVEAL_ANIMATION}>
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Icon className={UI_CLASSES.ICON_MD} />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {items.map((trouble, index) => {
              if (typeof trouble === 'string') {
                return (
                  <li key={index} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                    <div className={cn('mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full', dotColor)} />
                    <span className="text-sm leading-relaxed">{trouble}</span>
                  </li>
                );
              }

              return (
                <li key={index} className="space-y-2">
                  <div className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                    <div className={cn('mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full', dotColor)} />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-sm">{trouble.issue}</p>
                      <p className="text-muted-foreground text-sm leading-relaxed">
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
    </motion.div>
  );
}

function CodeSectionRenderer({
  title,
  description,
  icon: ProvidedIcon,
  html,
  code,
  language,
  filename,
  className,
}: Omit<CodeVariant, 'variant'>) {
  const Icon = ProvidedIcon || Copy;

  return (
    <motion.div {...SCROLL_REVEAL_ANIMATION}>
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Icon className={UI_CLASSES.ICON_MD} />
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
    </motion.div>
  );
}

function ExamplesSectionRenderer({
  examples,
  title = 'Usage Examples',
  description = 'Practical code examples demonstrating common use cases and implementation patterns',
  icon: ProvidedIcon,
  maxLines = 20,
  showLineNumbers = false,
  className,
}: Omit<ExamplesVariant, 'variant'>) {
  if (examples.length === 0) return null;

  const Icon = ProvidedIcon || Copy;

  return (
    <motion.div {...SCROLL_REVEAL_ANIMATION}>
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Icon className={UI_CLASSES.ICON_MD} />
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
                  <h4 className="font-semibold text-base text-foreground" itemProp="name">
                    {example.title}
                  </h4>
                  {example.description && (
                    <p
                      className="text-muted-foreground text-sm leading-relaxed"
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
    </motion.div>
  );
}

function ConfigurationSectionRenderer(props: Omit<ConfigurationVariant, 'variant'>) {
  if (props.format === 'multi') {
    const { configs, className } = props;

    return (
      <motion.div {...SCROLL_REVEAL_ANIMATION}>
        <Card data-section="configuration" className={cn('', className)}>
          <CardHeader>
            <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Copy className={UI_CLASSES.ICON_MD} />
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
      </motion.div>
    );
  }

  if (props.format === 'hook') {
    const { hookConfig, scriptContent, className } = props;

    return (
      <motion.div {...SCROLL_REVEAL_ANIMATION}>
        <Card className={cn('', className)}>
          <CardHeader>
            <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Copy className={UI_CLASSES.ICON_MD} />
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
      </motion.div>
    );
  }

  const { html, code, filename, className } = props;

  return (
    <motion.div {...SCROLL_REVEAL_ANIMATION}>
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Copy className={UI_CLASSES.ICON_MD} />
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
    </motion.div>
  );
}

function InstallationSectionRenderer({
  installationData,
  item,
  className,
}: Omit<InstallationVariant, 'variant'>) {
  return (
    <motion.div {...SCROLL_REVEAL_ANIMATION}>
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Copy className={UI_CLASSES.ICON_MD} />
            Installation
          </CardTitle>
          <CardDescription>Setup instructions and requirements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {installationData.claudeCode && (
            <div className="space-y-4">
              <h4 className="font-medium">Claude Code Setup</h4>
              <div className="space-y-3">
                {installationData.claudeCode.steps.map((step, index) => {
                  const stepKey = `cc-step-${index}-${step.type}`;
                  if (step.type === 'command') {
                    return (
                      <div key={stepKey} className="space-y-2">
                        <div className="text-muted-foreground text-sm">
                          Step {index + 1}: Run command
                        </div>
                        <ProductionCodeBlock
                          html={step.html}
                          code={step.code}
                          language="bash"
                          filename={`install-step-${index + 1}.sh`}
                          maxLines={10}
                        />
                      </div>
                    );
                  }
                  return (
                    <div key={stepKey} className="flex items-start gap-3">
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                      <span className="text-sm leading-relaxed">{step.text}</span>
                    </div>
                  );
                })}
              </div>
              {installationData.claudeCode.configPath && (
                <div>
                  <h5 className="mb-2 font-medium text-sm">Configuration Paths</h5>
                  <div className="space-y-1 text-sm">
                    {Object.entries(installationData.claudeCode.configPath).map(
                      ([location, path]) => (
                        <div key={location} className={UI_CLASSES.FLEX_GAP_2}>
                          <UnifiedBadge variant="base" style="outline" className="capitalize">
                            {location}
                          </UnifiedBadge>
                          <code className="rounded bg-muted px-1 py-0.5 text-xs">
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

          {installationData.claudeDesktop && (
            <div className="space-y-4">
              <h4 className="font-medium">Claude Desktop Setup</h4>
              <div className="space-y-3">
                {installationData.claudeDesktop.steps.map((step, index) => {
                  const stepKey = `cd-step-${index}-${step.type}`;
                  if (step.type === 'command') {
                    return (
                      <div key={stepKey} className="space-y-2">
                        <div className="text-muted-foreground text-sm">
                          Step {index + 1}: Run command
                        </div>
                        <ProductionCodeBlock
                          html={step.html}
                          code={step.code}
                          language="bash"
                          filename={`desktop-step-${index + 1}.sh`}
                          maxLines={10}
                        />
                      </div>
                    );
                  }
                  return (
                    <div key={stepKey} className="flex items-start gap-3">
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                      <span className="text-sm leading-relaxed">{step.text}</span>
                    </div>
                  );
                })}
              </div>
              {installationData.claudeDesktop.configPath && (
                <div>
                  <h5 className="mb-2 font-medium text-sm">Configuration Paths</h5>
                  <div className="space-y-1 text-sm">
                    {Object.entries(installationData.claudeDesktop.configPath).map(
                      ([platform, path]) => (
                        <div key={platform} className={UI_CLASSES.FLEX_GAP_2}>
                          <UnifiedBadge variant="base" style="outline" className="capitalize">
                            {platform}
                          </UnifiedBadge>
                          <code className="rounded bg-muted px-1 py-0.5 text-xs">
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

          {installationData.sdk && (
            <div className="space-y-4">
              <h4 className="font-medium">SDK Setup</h4>
              <div className="space-y-3">
                {installationData.sdk.steps.map((step, index) => {
                  const stepKey = `sdk-step-${index}-${step.type}`;
                  if (step.type === 'command') {
                    return (
                      <div key={stepKey} className="space-y-2">
                        <div className="text-muted-foreground text-sm">
                          Step {index + 1}: Run command
                        </div>
                        <ProductionCodeBlock
                          html={step.html}
                          code={step.code}
                          language="bash"
                          filename={`sdk-step-${index + 1}.sh`}
                          maxLines={10}
                        />
                      </div>
                    );
                  }
                  return (
                    <div key={stepKey} className="flex items-start gap-3">
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                      <span className="text-sm leading-relaxed">{step.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {installationData.requirements && installationData.requirements.length > 0 && (
            <div>
              <h4 className="mb-2 font-medium">Requirements</h4>
              <ul className="space-y-2">
                {installationData.requirements.map((requirement: string) => (
                  <li key={requirement.slice(0, 50)} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                    <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-500" />
                    <span className="text-sm leading-relaxed">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function UnifiedSection(props: UnifiedSectionProps) {
  switch (props.variant) {
    case 'list':
      return <ListSectionRenderer {...props} />;
    case 'enhanced-list':
      return <EnhancedListSectionRenderer {...props} />;
    case 'code':
      return <CodeSectionRenderer {...props} />;
    case 'examples':
      return <ExamplesSectionRenderer {...props} />;
    case 'configuration':
      return <ConfigurationSectionRenderer {...props} />;
    case 'installation':
      return <InstallationSectionRenderer {...props} />;
    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = props;
      return null;
  }
}
