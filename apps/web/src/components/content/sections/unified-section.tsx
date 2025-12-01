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
import { cluster, iconSize, hoverBg, spaceY, marginBottom, marginTop, muted, weight ,size  , gap , padding , row } from '@heyclaude/web-runtime/design-system';
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
 * Renders a styled card wrapper with a header (icon and title), optional description, and content.
 *
 * Chooses an icon from the `category` mapping when provided; otherwise uses the supplied `icon`.
 *
 * @param title - Header title text shown next to the icon
 * @param description - Optional header description rendered beneath the title
 * @param icon - Fallback Lucide icon component used when `category` is not provided
 * @param category - Optional content category key used to select an icon from `ICONS`
 * @param className - Optional additional class names applied to the outer Card
 * @param children - Content rendered inside the card body
 * @returns A React element that displays a card with a header (icon, title, optional description) and the provided children
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
 * Tabbed code group component for displaying multiple code blocks in tabs
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
    <div className={spaceY.default}>
      {/* Tab buttons */}
      <div className={`flex flex-wrap ${gap.tight} border-border border-b pb-2`}>
        {blocks.map((block, index) => (
          <button
            key={`${block.label}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              'rounded-t-md ${padding.xCompact} ${padding.ySnug} ${weight.medium} ${size.xs} transition-colors',
              activeIndex === index
                ? 'bg-accent/20 text-accent-foreground'
                : `${muted.default} ${hoverBg.muted} hover:text-foreground`
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
<div className={marginTop.compact}>
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
 * Renders a vertical list of text items where each item is prefixed by a colored dot.
 *
 * @param props.items - Array of item strings to render; each string is used as the visible label and as the stable key (first 50 characters).
 * @param props.color - Tailwind class or classes applied to the dot to indicate color (for example `"bg-green-500"`).
 * @returns A `<ul>` element containing the rendered list items.
 *
 * @see EnhancedList
 * @see Wrapper
 */
function List({ items, color }: { items: string[]; color: string }) {
  return (
    <ul className={spaceY.compact}>
      {items.map((item) => (
        <li key={item.slice(0, 50)} className={`${row.default}`}>
          <div className={cn(`${marginTop.compact} h-1.5 w-1.5 shrink-0 rounded-full`, color)} />
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
 * Render a vertical list where each entry is either a simple text item or an issue/solution pair with a colored leading dot.
 *
 * The component accepts an array of items where each item is either a string (rendered as a single-line list entry)
 * or an object with `issue` and `solution` fields (rendered as a titled issue with a nested solution). Each list entry
 * is prefixed by a small dot whose color is controlled by the `color` class string.
 *
 * @param items - Array of items to render. Each item is either a `string` or an object `{ issue: string; solution: string }`.
 * @param color - Tailwind (or utility) class string applied to the leading dot for each item (controls dot color).
 * @returns The rendered unordered list JSX element containing the provided items.
 *
 * @see getEnhancedListKey
 * @see List
 */
function EnhancedList({ items, color }: { items: EnhancedListItem[]; color: string }) {
  return (
    <ul className={spaceY.comfortable}>
      {items.map((item, index) =>
        typeof item === 'string' ? (
          <li key={getEnhancedListKey(item, index)} className={`${row.default}`}>
            <div className={cn(`${marginTop.compact} h-1.5 w-1.5 shrink-0 rounded-full`, color)} />
            <span className="text-sm leading-relaxed">{item}</span>
          </li>
        ) : (
          <li key={getEnhancedListKey(item, index)} className={spaceY.compact}>
            <div className={`${row.default}`}>
              <div className={cn(`${marginTop.compact} h-1.5 w-1.5 shrink-0 rounded-full`, color)} />
              <div className={spaceY.tight}>
                <p className={`${weight.medium} text-foreground ${size.sm}`}>{item.issue}</p>
                <p className={muted.smRelaxed}>{item.solution}</p>
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
 * Renders a titled platform setup section with ordered steps and optional configuration paths.
 *
 * Renders each step as either a Bash code block (for `command` steps) or an inline text bullet (for `text` steps). When `paths` is provided, renders a "Configuration Paths" list with labeled badges and code-styled paths.
 *
 * @param name - Display name of the platform used in the section header and to derive filenames for command steps
 * @param steps - Ordered array of steps to render. Each step is either:
 *   - `{ type: 'command', html, code }` — rendered as a Bash code block with a generated filename
 *   - `{ type: 'text', text }` — rendered as an inline text bullet
 * @param paths - Optional mapping of configuration key to filesystem path shown under "Configuration Paths"
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
    <div className={spaceY.comfortable}>
      <h4 className={weight.medium}>{name}</h4>
      <div className={spaceY.default}>
        {steps.map((step, index) =>
          step.type === 'command' ? (
            <div key={getStepKey(step, index)} className={spaceY.compact}>
              <div className={muted.sm}>Step {index + 1}: Run command</div>
              <ProductionCodeBlock
                html={step.html}
                code={step.code}
                language="bash"
                filename={`${name.toLowerCase()}-${index + 1}.sh`}
                maxLines={10}
              />
            </div>
          ) : (
            <div key={getStepKey(step, index)} className={`${row.default}`}>
              <div className={`${marginTop.compact} h-1.5 w-1.5 shrink-0 rounded-full bg-primary`} />
              <span className="text-sm leading-relaxed">{step.text}</span>
            </div>
          )
        )}
      </div>
      {paths && (
        <div>
          <h5 className={`${marginBottom.tight} ${weight.medium} ${size.sm}`}>Configuration Paths</h5>
          <div className={`${spaceY.tight} ${size.sm}`}>
            {Object.entries(paths).map(([k, p]) => (
              <div key={k} className={cluster.compact}>
                <UnifiedBadge variant="base" style="outline" className="capitalize">
                  {k}
                </UnifiedBadge>
                <code className={`rounded bg-muted ${padding.xMicro} ${padding.yHair} ${size.xs}`}>{String(p)}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
            <div className={marginTop.compact}>
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
              <div className={marginTop.compact}>
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
          <div className={spaceY.relaxed}>
            {props.examples.map((ex, i) => (
              <article
                key={`${ex.title}-${i}`}
                className={spaceY.default}
                itemScope={true}
                itemType="https://schema.org/SoftwareSourceCode"
              >
                <div className={spaceY.tight}>
                  <h4 className={`${weight.semibold} ${size.base} text-foreground`} itemProp="name">
                    {ex.title}
                  </h4>
                  {ex.description && (
                    <p
                      className={muted.smRelaxed}
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
                    <div className={marginTop.compact}>
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
            <div className={spaceY.relaxed}>
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
                    <div className={marginTop.compact}>
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
            <div className={spaceY.comfortable}>
              {props.hookConfig && (
                <div className={spaceY.compact}>
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
                <div className={spaceY.compact}>
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
            <div className={marginTop.compact}>
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
          <div className={spaceY.relaxed}>
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
                <h4 className={`${marginBottom.tight} ${weight.medium}`}>Requirements</h4>
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