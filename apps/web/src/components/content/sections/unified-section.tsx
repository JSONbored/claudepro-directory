'use client';

import * as React from 'react';
import type { Database } from '@heyclaude/database-types';
import { isValidCategory, logger, normalizeError } from '@heyclaude/web-runtime/core';
import { usePulse } from '@heyclaude/web-runtime/hooks';
import {
  Bookmark,
  BookOpen,
  Bot,
  Briefcase,
  Code,
  Copy,
  Download,
  FileText,
  type LucideIcon,
  Package,
  Rocket,
  Sparkles,
  Terminal,
  Zap,
} from '@heyclaude/web-runtime/icons';
import { cluster, iconSize } from '@heyclaude/web-runtime/design-system';
import type { UnifiedSectionProps } from '@heyclaude/web-runtime/types/component.types';
import { cn } from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import { ProductionCodeBlock } from '@/src/components/content/interactive-code-block';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';

const ICONS: Record<Database['public']['Enums']['content_category'], LucideIcon> = {
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

/**
 * Render a styled card with a header containing an icon, title, optional description, and the supplied content.
 *
 * If `category` is provided, uses the corresponding icon from `ICONS`; otherwise uses the `icon` prop.
 *
 * @param title - Header title text shown next to the icon
 * @param description - Optional header description rendered beneath the title
 * @param icon - Fallback Lucide icon component used when `category` is not provided
 * @param category - Optional content category key used to select an icon from `ICONS`
 * @param className - Optional additional class names applied to the outer Card
 * @param children - Content rendered inside the card body
 * @returns A JSX element representing the composed card
 *
 * @see ICONS
 * @see Card
 */
function Wrapper({
  title,
  description,
  icon = Copy,
  category,
  className,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  category?: Database['public']['Enums']['content_category'];
  className?: string;
  children: React.ReactNode;
}) {
  const Icon = category ? ICONS[category] : icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={cluster.compact}>
            <Icon className={iconSize.md} />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Render a tabbed interface that displays multiple code blocks and allows downloading the active block.
 *
 * Renders one tab per block using the block's `label`, shows the currently active block in a code viewer,
 * and exposes a download button when the active block has a `filename`.
 *
 * @param props.blocks - Array of code block objects. Each block must include:
 *   - `html`: rendered HTML for the code block
 *   - `code`: raw code text
 *   - `language`: language identifier for syntax highlighting
 *   - `label`: tab label
 *   - `filename` (optional): when present, enables a download button for that block
 * @param props.onDownload - Optional callback invoked after a block's code is downloaded
 * @returns A React element containing the tabbed code group, or `null` when no active block exists.
 *
 * @see ProductionCodeBlock
 * @see downloadTextFile
 */
function CodeGroupTabs({
  blocks,
  onDownload,
}: {
  blocks: Array<{
    html: string;
    code: string;
    language: string;
    filename?: string;
    label: string;
  }>;
  onDownload?: () => void;
}) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeBlock = blocks[activeIndex];

  if (!activeBlock) return null;

  return (
    <div className="space-y-3">
      {/* Tab buttons */}
      <div className="flex flex-wrap gap-1 border-border border-b pb-2">
        {blocks.map((block, index) => (
          <button
            key={`${block.label}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              'rounded-t-md px-3 py-1.5 font-medium text-xs transition-colors',
              activeIndex === index
                ? 'bg-accent/20 text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
          >
            {block.label}
          </button>
        ))}
      </div>

      {/* Active code block */}
      <ProductionCodeBlock
        html={activeBlock.html}
        code={activeBlock.code}
        language={activeBlock.language}
        filename={activeBlock.filename}
        maxLines={25}
      />

      {/* Download button */}
      {activeBlock.filename && (
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              downloadTextFile(activeBlock.filename ?? 'code.txt', activeBlock.code);
              onDownload?.();
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Download {activeBlock.filename}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Render a vertical list of text items each prefixed by a colored dot.
 *
 * @param items - Array of strings to display as list items.
 * @param color - Tailwind class or classes applied to the dot (for example, `"bg-green-500"`).
 * @returns The rendered `<ul>` element containing the list items.
 *
 * @see EnhancedList
 * @see Wrapper
 */
function List({ items, color }: { items: string[]; color: string }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.slice(0, 50)} className="flex items-start gap-3">
          <div className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', color)} />
          <span className="text-sm leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

type EnhancedListItem = string | { issue: string; solution: string };

const getEnhancedListKey = (item: EnhancedListItem, index: number) =>
  typeof item === 'string'
    ? `enhanced-string-${item.slice(0, 50)}-${index}`
    : `enhanced-object-${item.issue}-${item.solution.slice(0, 50)}-${index}`;

/**
 * Render a vertical list of enhanced items with a colored leading dot.
 *
 * Items may be plain strings (rendered as a single-line entry) or objects with `issue` and `solution`
 * (rendered as a titled issue with a supporting solution line).
 *
 * @param items - Array of items to render; each item is either a `string` or an object `{ issue: string; solution: string }`.
 * @param color - Utility class string applied to the leading dot for each item (controls dot color).
 * @returns A `<ul>` JSX element containing the rendered list items.
 *
 * @see getEnhancedListKey
 * @see List
 */
function EnhancedList({ items, color }: { items: EnhancedListItem[]; color: string }) {
  return (
    <ul className="space-y-4">
      {items.map((item, index) =>
        typeof item === 'string' ? (
          <li key={getEnhancedListKey(item, index)} className="flex items-start gap-3">
            <div className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', color)} />
            <span className="text-sm leading-relaxed">{item}</span>
          </li>
        ) : (
          <li key={getEnhancedListKey(item, index)} className="space-y-2">
            <div className="flex items-start gap-3">
              <div className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', color)} />
              <div className="space-y-1">
                <p className="font-medium text-foreground text-sm">{item.issue}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.solution}</p>
              </div>
            </div>
          </li>
        )
      )}
    </ul>
  );
}

type PlatformStep =
  | { type: 'command'; html: string; code: string }
  | { type: 'text'; text: string };

/**
 * Render a platform-specific setup section with ordered steps and optional configuration paths.
 *
 * Each step is rendered either as a labeled Bash code block (for `command` steps) or as an inline bullet (for `text` steps). When `paths` is provided, a "Configuration Paths" list is shown with labeled badges and code-styled paths.
 *
 * @param name - Display name shown in the section header and used to derive filenames for command steps
 * @param steps - Ordered steps to render; each step is either `{ type: 'command', html, code }` or `{ type: 'text', text }`
 * @param paths - Optional mapping of configuration keys to filesystem paths displayed under "Configuration Paths"
 * @returns A JSX element containing the platform header, rendered steps, and optional configuration paths section
 *
 * @see ProductionCodeBlock
 * @see UnifiedBadge
 */
function Platform({
  name,
  steps,
  paths,
}: {
  name: string;
  steps: PlatformStep[];
  paths?: Record<string, string>;
}) {
  const getStepKey = (step: PlatformStep, index: number) =>
    step.type === 'command'
      ? `platform-${name.toLowerCase()}-command-${step.code}-${index}`
      : `platform-${name.toLowerCase()}-text-${step.text}-${index}`;

  return (
    <div className="space-y-4">
      <h4 className="font-medium">{name}</h4>
      <div className="space-y-3">
        {steps.map((step, index) =>
          step.type === 'command' ? (
            <div key={getStepKey(step, index)} className="space-y-2">
              <div className="text-muted-foreground text-sm">Step {index + 1}: Run command</div>
              <ProductionCodeBlock
                html={step.html}
                code={step.code}
                language="bash"
                filename={`${name.toLowerCase()}-${index + 1}.sh`}
                maxLines={10}
              />
            </div>
          ) : (
            <div key={getStepKey(step, index)} className="flex items-start gap-3">
              <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="text-sm leading-relaxed">{step.text}</span>
            </div>
          )
        )}
      </div>
      {paths && (
        <div>
          <h5 className="mb-2 font-medium text-sm">Configuration Paths</h5>
          <div className="space-y-1 text-sm">
            {Object.entries(paths).map(([k, p]) => (
              <div key={k} className={cluster.compact}>
                <UnifiedBadge variant="base" style="outline" className="capitalize">
                  {k}
                </UnifiedBadge>
                <code className="rounded bg-muted px-1 py-0.5 text-xs">{String(p)}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Render a unified, variant-driven content section (lists, code blocks, examples, configuration, installation).
 *
 * Renders one of several layout variants based on props.variant: simple lists, enhanced lists with issue/solution items,
 * single or grouped code blocks with optional download buttons, usage examples, configuration blocks (including multi/hook formats),
 * and installation steps composed of Platform sections. When a content block exposes a filename, downloading that file will
 * attempt to track the download via the pulse tracking client obtained from usePulse; tracking failures are logged but do not affect UI behavior.
 *
 * @param props - Properties controlling the rendered variant and its content
 * @returns A JSX element for the requested unified section, or `null` when there is nothing to render for the given props
 *
 * @see Wrapper
 * @see ProductionCodeBlock
 * @see CodeGroupTabs
 * @see Platform
 * @see List
 * @see EnhancedList
 * @see downloadTextFile
 * @see usePulse
 */
export default function UnifiedSection(props: UnifiedSectionProps) {
  const pulse = usePulse();
  const baseItem = 'item' in props ? props.item : undefined;
  const itemCategory =
    baseItem &&
    'category' in baseItem &&
    typeof baseItem.category === 'string' &&
    isValidCategory(baseItem.category)
      ? (baseItem.category as Database['public']['Enums']['content_category'])
      : null;
  const itemSlug =
    baseItem && 'slug' in baseItem && typeof baseItem.slug === 'string' ? baseItem.slug : null;

  const trackDownload = () => {
    if (!(itemCategory && itemSlug)) return;
    pulse
      .download({
        category: itemCategory,
        slug: itemSlug,
      })
      .catch((error) => {
        // Log but don't throw - tracking failures shouldn't break user experience
        const normalized = normalizeError(error, 'Failed to track download');
        logger.warn('[Share] Failed to track download', {
          err: normalized,
          category: 'share',
          component: 'UnifiedSection',
          nonCritical: true,
          context: 'unified_section_download',
          itemCategory,
          itemSlug,
        });
      });
  };

  switch (props.variant) {
    case 'list': {
      if (props.items.length === 0) return null;

      return (
        <Wrapper
          title={props.title}
          description={props.description}
          {...(props.icon && { icon: props.icon })}
          {...(props.category && { category: props.category })}
          {...(props.className && { className: props.className })}
        >
          <List items={props.items} color={props.dotColor || 'bg-primary'} />
        </Wrapper>
      );
    }

    case 'enhanced-list': {
      if (props.items.length === 0) return null;

      return (
        <Wrapper
          title={props.title}
          {...(props.description && { description: props.description })}
          {...(props.icon && { icon: props.icon })}
          {...(props.className && { className: props.className })}
        >
          <EnhancedList items={props.items} color={props.dotColor || 'bg-red-500'} />
        </Wrapper>
      );
    }

    case 'code':
      return (
        <Wrapper
          title={props.title}
          {...(props.description && { description: props.description })}
          {...(props.icon && { icon: props.icon })}
          {...(props.className && { className: props.className })}
        >
          <ProductionCodeBlock
            html={props.html}
            code={props.code}
            language={props.language}
            filename={props.filename}
            maxLines={20}
          />
          {/* Download button below code block for better UX */}
          {props.filename && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadTextFile(props.filename ?? 'code.txt', props.code);
                  trackDownload();
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download {props.filename}
              </Button>
            </div>
          )}
        </Wrapper>
      );

    case 'code-group': {
      if (props.codeBlocks.length === 0) return null;

      // If only one block, render as single code block
      if (props.codeBlocks.length === 1) {
        const block = props.codeBlocks[0];
        if (!block) return null;
        return (
          <Wrapper
            title={props.title}
            {...(props.description && { description: props.description })}
            {...(props.icon && { icon: props.icon })}
            {...(props.className && { className: props.className })}
          >
            <ProductionCodeBlock
              html={block.html}
              code={block.code}
              language={block.language}
              filename={block.filename}
              maxLines={20}
            />
            {block.filename && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    downloadTextFile(block.filename ?? 'code.txt', block.code);
                    trackDownload();
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download {block.filename}
                </Button>
              </div>
            )}
          </Wrapper>
        );
      }

      // Multiple blocks: render with tabs
      return (
        <Wrapper
          title={props.title}
          {...(props.description && { description: props.description })}
          {...(props.icon && { icon: props.icon })}
          {...(props.className && { className: props.className })}
        >
          <CodeGroupTabs blocks={props.codeBlocks} onDownload={trackDownload} />
        </Wrapper>
      );
    }

    case 'examples': {
      if (props.examples.length === 0) return null;

      return (
        <Wrapper
          title={props.title || 'Usage Examples'}
          description={
            props.description ||
            'Practical code examples demonstrating common use cases and implementation patterns'
          }
          {...(props.icon && { icon: props.icon })}
          {...(props.className && { className: props.className })}
        >
          <div className="space-y-6">
            {props.examples.map((ex, i) => (
              <article
                key={`${ex.title}-${i}`}
                className="space-y-3"
                itemScope={true}
                itemType="https://schema.org/SoftwareSourceCode"
              >
                <div className="space-y-1">
                  <h4 className="font-semibold text-base text-foreground" itemProp="name">
                    {ex.title}
                  </h4>
                  {ex.description && (
                    <p
                      className="text-muted-foreground text-sm leading-relaxed"
                      itemProp="description"
                    >
                      {ex.description}
                    </p>
                  )}
                </div>
                <div className="not-prose" itemProp="text">
                  <meta itemProp="programmingLanguage" content={ex.language} />
                  <ProductionCodeBlock
                    html={ex.html}
                    code={ex.code}
                    language={ex.language}
                    filename={ex.filename}
                    maxLines={props.maxLines || 20}
                    showLineNumbers={props.showLineNumbers}
                    className="shadow-sm"
                  />
                  {/* Download button for example code */}
                  {ex.filename && (
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          downloadTextFile(ex.filename, ex.code);
                          trackDownload();
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download {ex.filename}
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </Wrapper>
      );
    }

    case 'configuration': {
      if (props.format === 'multi') {
        return (
          <Wrapper
            title="Configuration"
            description="Add these configurations to your Claude Desktop or Claude Code setup"
            {...(props.className && { className: props.className })}
          >
            <div className="space-y-6">
              {props.configs.map((c) => (
                <div key={c.key}>
                  <ProductionCodeBlock
                    html={c.html}
                    code={c.code}
                    language="json"
                    filename={c.filename}
                    maxLines={25}
                  />
                  {/* Download button for config */}
                  {c.filename && (
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          downloadTextFile(c.filename, c.code);
                          trackDownload();
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download {c.filename}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Wrapper>
        );
      }

      if (props.format === 'hook') {
        return (
          <Wrapper
            title="Hook Configuration"
            description="Hook setup and script content"
            {...(props.className && { className: props.className })}
          >
            <div className="space-y-4">
              {props.hookConfig && (
                <div className="space-y-2">
                  <ProductionCodeBlock
                    html={props.hookConfig.html}
                    code={props.hookConfig.code}
                    language="json"
                    filename={props.hookConfig.filename}
                    maxLines={20}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      downloadTextFile(
                        props.hookConfig?.filename || 'hook-config.json',
                        props.hookConfig?.code || ''
                      );
                      trackDownload();
                    }}
                  >
                    Download hook config
                  </Button>
                </div>
              )}
              {props.scriptContent && (
                <div className="space-y-2">
                  <ProductionCodeBlock
                    html={props.scriptContent.html}
                    code={props.scriptContent.code}
                    language="bash"
                    filename={props.scriptContent.filename}
                    maxLines={25}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      downloadTextFile(
                        props.scriptContent?.filename || 'hook-script.sh',
                        props.scriptContent?.code || ''
                      );
                      trackDownload();
                    }}
                  >
                    Download script
                  </Button>
                </div>
              )}
            </div>
          </Wrapper>
        );
      }

      return (
        <Wrapper
          title="Configuration"
          description="Configuration settings and parameters"
          {...(props.className && { className: props.className })}
        >
          <ProductionCodeBlock
            html={props.html}
            code={props.code}
            language="json"
            filename={props.filename}
            maxLines={25}
          />
          {/* Download button for configuration */}
          {props.filename && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  downloadTextFile(props.filename, props.code);
                  trackDownload();
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download {props.filename}
              </Button>
            </div>
          )}
        </Wrapper>
      );
    }

    case 'installation': {
      const d = props.installationData;

      return (
        <Wrapper
          title="Installation"
          description="Setup instructions and requirements"
          {...(props.className && { className: props.className })}
        >
          <div className="space-y-6">
            {d.claudeCode && (
              <Platform
                name="Claude Code Setup"
                steps={d.claudeCode.steps}
                {...(d.claudeCode.configPath && { paths: d.claudeCode.configPath })}
              />
            )}
            {d.claudeDesktop && (
              <Platform
                name="Claude Desktop Setup"
                steps={d.claudeDesktop.steps}
                {...(d.claudeDesktop.configPath && { paths: d.claudeDesktop.configPath })}
              />
            )}
            {d.sdk && <Platform name="SDK Setup" steps={d.sdk.steps} />}
            {d.mcpb && <Platform name="One-Click Install (.mcpb)" steps={d.mcpb.steps} />}
            {d.requirements && d.requirements.length > 0 && (
              <div>
                <h4 className="mb-2 font-medium">Requirements</h4>
                <List items={d.requirements} color="bg-orange-500" />
              </div>
            )}
          </div>
        </Wrapper>
      );
    }

    default:
      return null;
  }
}