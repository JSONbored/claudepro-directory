'use client';

/**
 * Configuration-driven content section with 6 variants (bullets, content, configuration, examples, troubleshooting, installation).
 * All async operations happen at page level - this component receives pre-processed data and renders UI.
 */

import { motion } from 'motion/react';
import { ProductionCodeBlock } from '@/src/components/content/production-code-block';
import { UnifiedBadge } from '@/src/components/core/domain/badges/unified-badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import type { CategoryId } from '@/src/lib/config/category-config';
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

export type UnifiedContentSectionProps =
  | {
      variant: 'bullets';
      title: string;
      description?: string;
      items: string[];
      category: CategoryId;
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
      className?: string;
    };

const BULLET_COLORS = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
} as const;

const SCROLL_REVEAL_ANIMATION = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
} as const;

export function UnifiedContentSection(props: UnifiedContentSectionProps) {
  if (props.variant === 'bullets') {
    const {
      title,
      description,
      items,
      category,
      bulletColor = 'primary',
      textVariant = 'default',
      className,
    } = props;

    if (items.length === 0) return null;

    const Icon = CATEGORY_ICONS[category];

    const bulletClass = BULLET_COLORS[bulletColor];
    const textClass = textVariant === 'mono' ? 'font-mono text-xs' : 'text-sm';

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
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.slice(0, 50)} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                  <div className={cn('mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full', bulletClass)} />
                  <span className={cn('leading-relaxed', textClass)}>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (props.variant === 'content') {
    const { title, description, html, code, language, filename, className } = props;

    return (
      <motion.div {...SCROLL_REVEAL_ANIMATION}>
        <Card className={cn('', className)}>
          <CardHeader>
            <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Copy className={UI_CLASSES.ICON_MD} />
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

  if (props.variant === 'configuration') {
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
      <motion.div {...SCROLL_REVEAL_ANIMATION}>
        <Card className={cn('', className)}>
          <CardHeader>
            <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Copy className={UI_CLASSES.ICON_MD} />
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

  if (props.variant === 'troubleshooting') {
    const { description, items, className } = props;

    if (items.length === 0) return null;

    return (
      <motion.div {...SCROLL_REVEAL_ANIMATION}>
        <Card className={cn('', className)}>
          <CardHeader>
            <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Copy className={UI_CLASSES.ICON_MD} />
              Troubleshooting
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {items.map((trouble) => {
                if (typeof trouble === 'string') {
                  return (
                    <li key={trouble.slice(0, 50)} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                      <span className="text-sm leading-relaxed">{trouble}</span>
                    </li>
                  );
                }

                return (
                  <li key={trouble.issue.slice(0, 50)} className="space-y-2">
                    <div className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
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

  if (props.variant === 'installation') {
    const { installationData, className } = props;

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
                    <li
                      key={requirement.slice(0, 50)}
                      className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}
                    >
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

  return null;
}
