'use client';

import { type Database } from '@heyclaude/database-types';
import { isValidCategory } from '@heyclaude/web-runtime/core';
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
import { logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { type UnifiedSectionProps } from '@heyclaude/web-runtime/types/component.types';
import {
  cn,
  UI_CLASSES,
  UnifiedBadge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import * as React from 'react';
import { useEffect, useState } from 'react';

import { ProductionCodeBlock } from '@/src/components/content/interactive-code-block';

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
 * Renders a motion-animated card with a header (icon and title), optional description, and content.
 *
 * @param title - Heading text displayed in the card header.
 * @param description - Optional secondary text shown under the title.
 * @param icon - Fallback icon component used when `category` is not provided.
 * @param category - Optional content category key used to select a category-specific icon from `ICONS`.
 * @param className - Additional CSS classes applied to the outer Card container.
 * @param children - Content rendered inside the card body.
 * @returns A JSX element representing the animated card with header and content.
 *
 * @see ICONS - mapping of content categories to icon components
 * @see Card, CardHeader, CardTitle, CardDescription, CardContent - Card primitives used to build the layout
 */
function Wrapper({
  title,
  description,
  icon = Copy,
  category,
  className,
  children,
}: {
  category?: Database['public']['Enums']['content_category'];
  children: React.ReactNode;
  className?: string;
  description?: string;
  icon?: LucideIcon;
  title: string;
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
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Icon className={UI_CLASSES.ICON_MD} />
            {title}
          </CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Initiates a browser download of a plain text file using the given filename and content.
 *
 * @param filename - The desired name of the downloaded file (including extension).
 * @param content - The text content to write into the file.
 *
 * @see URL.createObjectURL
 */
function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Render HTML content safely by sanitizing it on the client while preserving server-rendered markup.
 *
 * Sanitizes `html` using DOMPurify after hydration to mitigate XSS risks. During server-side rendering
 * the original `html` is rendered so markup is present for initial render; on the client the component
 * dynamically imports DOMPurify, replaces the content with a sanitized version, and falls back to the
 * original `html` if sanitization fails (a client warning is logged).
 *
 * @param html - The HTML string to render inside the wrapper element.
 * @param className - Optional CSS class(es) applied to the wrapper element.
 * @returns A div element containing the provided HTML (sanitized on the client when possible).
 *
 * @see https://github.com/cure53/DOMPurify
 * @see logClientWarn
 * @see normalizeError
 */
function TrustedHTML({ html, className }: { className?: string; html: string }) {
  // Hooks must be called unconditionally (Rules of Hooks)
  const [safeHtml, setSafeHtml] = useState<string>(
    globalThis.window === undefined ? html : '' // Start empty on client, will be set in useEffect
  );
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (globalThis.window !== undefined && html && typeof html === 'string') {
      import('dompurify')
        .then((DOMPurify) => {
          const sanitized = DOMPurify.default.sanitize(html, {
            ALLOWED_TAGS: [
              'p',
              'br',
              'strong',
              'em',
              'b',
              'i',
              'u',
              'a',
              'ul',
              'ol',
              'li',
              'h1',
              'h2',
              'h3',
              'h4',
              'h5',
              'h6',
              'code',
              'pre',
              'blockquote',
              'span',
              'div',
            ],
            ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
          });
          setSafeHtml(sanitized);
        })
        .catch((error) => {
          const normalized = normalizeError(error, 'Failed to sanitize HTML');
          logClientWarn(
            '[TrustedHTML] Failed to sanitize HTML',
            normalized,
            'TrustedHTML.sanitize',
            {
              component: 'TrustedHTML',
              action: 'sanitize-html',
            }
          );
          // Fallback to original HTML if sanitization fails
          setSafeHtml(html);
        });
    }
  }, [html]);

  // Early return check after hooks (Rules of Hooks compliance)
  if (!html || typeof html !== 'string') {
    return <div className={className} />;
  }

  // SSR uses pre-sanitized HTML; client re-sanitizes as defense-in-depth
  const htmlToRender = isClient ? safeHtml : html;

  // eslint-disable-next-line react/no-danger -- HTML is pre-sanitized server-side via markdownToHtml and re-sanitized client-side via DOMPurify as defense-in-depth
  return <div className={className} dangerouslySetInnerHTML={{ __html: htmlToRender }} />;
}

/**
 * Renders a tabbed interface for selecting and viewing multiple code blocks.
 *
 * Each tab displays a labeled code block and, when the active block includes a filename,
 * exposes a Download button that saves the block's code and invokes an optional download callback.
 *
 * @param props.blocks - Array of code block objects. Each block must include `code`, `html`, `label`, and `language`. `filename` is optional; when present a Download button is shown for that block.
 * @param props.onDownload - Optional callback invoked after a block is downloaded.
 *
 * @see ProductionCodeBlock
 * @see downloadTextFile
 */
function CodeGroupTabs({
  blocks,
  onDownload,
}: {
  blocks: Array<{
    code: string;
    filename?: string;
    html: string;
    label: string;
    language: string;
  }>;
  onDownload?: () => void;
}) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeBlock = blocks[activeIndex];

  if (!activeBlock) return null;

  return (
    <div className="space-y-3">
      {/* Tab buttons */}
      <div className="border-border flex flex-wrap gap-1 border-b pb-2">
        {blocks.map((block, index) => (
          <button
            key={`${block.label}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              'rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors',
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
      {activeBlock.filename ? (
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
      ) : null}
    </div>
  );
}

/**
 * Renders a vertical list of strings with a leading colored dot for each item.
 *
 * @param items - Strings to display as list rows; each string becomes one list item.
 * @param color - CSS class(es) applied to the dot indicator (typically Tailwind color classes).
 * @returns The rendered list element.
 *
 * @see UI_CLASSES
 */
function List({ items, color }: { color: string; items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.slice(0, 50)} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
          <div className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', color)} />
          <span className="text-sm leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

type EnhancedListItem =
  | string
  | { answer: string; question: string }
  | { issue: string; solution: string };

const getEnhancedListKey = (item: EnhancedListItem, index: number) => {
  if (typeof item === 'string') {
    return `enhanced-string-${item.slice(0, 50)}-${index}`;
  }
  // Support both old format (issue/solution) and new format (question/answer)
  const title = 'question' in item ? item.question : item.issue;
  const content = 'answer' in item ? item.answer : item.solution;
  return `enhanced-object-${title}-${content.slice(0, 50)}-${index}`;
};

/**
 * Renders a vertical list of items where each entry is either a simple string or a structured Q&A / issue-solution pair.
 *
 * For string items the component renders a single-line row with a colored dot and text. For object items it renders a titled row (question or issue) with supporting content (answer or solution) and the same colored dot.
 *
 * @param items - Array of items to render. Each item may be a `string`, `{ issue: string; solution: string }`, or `{ question: string; answer: string }`.
 * @param color - CSS class (typically a Tailwind color class) applied to the leading dot for each list item.
 * @returns A React element representing the rendered list.
 *
 * @see getEnhancedListKey
 */
function EnhancedList({ items, color }: { color: string; items: EnhancedListItem[] }) {
  return (
    <ul className="space-y-4">
      {items.map((item, index) => {
        if (typeof item === 'string') {
          return (
            <li key={getEnhancedListKey(item, index)} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
              <div className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', color)} />
              <span className="text-sm leading-relaxed">{item}</span>
            </li>
          );
        }

        // Support both old format (issue/solution) and new Schema.org format (question/answer)
        const title = 'question' in item ? item.question : item.issue;
        const content = 'answer' in item ? item.answer : item.solution;

        return (
          <li key={getEnhancedListKey(item, index)} className="space-y-2">
            <div className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
              <div className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', color)} />
              <div className="space-y-1">
                <p className="text-foreground text-sm font-medium">{title}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{content}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

type PlatformStep =
  | { code: string; html: string; type: 'command' }
  | { text: string; type: 'text' };

/**
 * Renders a titled platform block showing a sequence of setup steps and optional configuration paths.
 *
 * Each step of type `"command"` is shown as a bash code block with a generated filename based on `name` and step index.
 * Each step of type `"text"` is shown as a compact text row with a leading colored dot.
 *
 * @param props.name - Display name for the platform section (used as the heading and in generated filenames)
 * @param props.steps - Ordered list of platform steps; command steps render a ProductionCodeBlock, text steps render inline text
 * @param props.paths - Optional mapping of configuration keys to filesystem or config paths displayed under "Configuration Paths"
 * @returns A JSX element containing the platform heading, rendered steps, and an optional configuration paths list
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
  paths?: Record<string, string>;
  steps: PlatformStep[];
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
              <div className="bg-primary mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
              <span className="text-sm leading-relaxed">{step.text}</span>
            </div>
          )
        )}
      </div>
      {paths ? (
        <div>
          <h5 className="mb-2 text-sm font-medium">Configuration Paths</h5>
          <div className="space-y-1 text-sm">
            {Object.entries(paths).map(([k, p]) => (
              <div key={k} className={UI_CLASSES.FLEX_GAP_2}>
                <UnifiedBadge variant="base" style="outline" className="capitalize">
                  {k}
                </UnifiedBadge>
                <code className="bg-muted rounded px-1 py-0.5 text-xs">{String(p)}</code>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Renders a unified, variant-driven documentation section (lists, code blocks, examples, installation, text, etc.) based on the provided props.
 *
 * This component switches on `props.variant` to render one of several section types:
 * - 'list' and 'enhanced-list': compact item lists
 * - 'code' and 'code-group': single or tabbed code blocks with optional download buttons
 * - 'examples': multiple titled examples each with code and optional download
 * - 'configuration': single, multi, or hook configuration code blocks with optional downloads
 * - 'installation': platform-specific installation steps and optional requirement list
 * - 'text': rich HTML content sanitized client-side via TrustedHTML
 *
 * When download buttons are used, a telemetry download event is attempted via the pulse hook; telemetry failures are logged but do not interrupt rendering or downloads.
 *
 * @param props - Props controlling the variant, content, presentation, and optional telemetry context for the section
 * @returns The rendered React element for the requested section, or `null` when there is no content to display for the selected variant
 *
 * @see Wrapper
 * @see ProductionCodeBlock
 * @see TrustedHTML
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
      ? baseItem.category
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
        logClientWarn(
          '[Share] Failed to track download',
          normalized,
          'UnifiedSection.trackDownload',
          {
            component: 'UnifiedSection',
            action: 'track-download',
            category: 'share',
            nonCritical: true,
            context: 'unified_section_download',
            itemCategory,
            itemSlug,
          }
        );
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

    case 'code': {
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
          {props.filename ? (
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
          ) : null}
        </Wrapper>
      );
    }

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
            {block.filename ? (
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
            ) : null}
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
                itemScope
                itemType="https://schema.org/SoftwareSourceCode"
              >
                <div className="space-y-1">
                  <h4 className="text-foreground text-base font-semibold" itemProp="name">
                    {ex.title}
                  </h4>
                  {ex.description ? (
                    <p
                      className="text-muted-foreground text-sm leading-relaxed"
                      itemProp="description"
                    >
                      {ex.description}
                    </p>
                  ) : null}
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
                  {ex.filename ? (
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
                  ) : null}
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
                  {c.filename ? (
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
                  ) : null}
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
              {props.hookConfig ? (
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
              ) : null}
              {props.scriptContent ? (
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
              ) : null}
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
          {props.filename ? (
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
          ) : null}
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
            {d.claudeCode ? (
              <Platform
                name="Claude Code Setup"
                steps={d.claudeCode.steps}
                {...(d.claudeCode.configPath && { paths: d.claudeCode.configPath })}
              />
            ) : null}
            {d.claudeDesktop ? (
              <Platform
                name="Claude Desktop Setup"
                steps={d.claudeDesktop.steps}
                {...(d.claudeDesktop.configPath && { paths: d.claudeDesktop.configPath })}
              />
            ) : null}
            {d.sdk ? <Platform name="SDK Setup" steps={d.sdk.steps} /> : null}
            {d.mcpb ? <Platform name="One-Click Install (.mcpb)" steps={d.mcpb.steps} /> : null}
            {d.requirements && d.requirements.length > 0 ? (
              <div>
                <h4 className="mb-2 font-medium">Requirements</h4>
                <List items={d.requirements} color="bg-orange-500" />
              </div>
            ) : null}
          </div>
        </Wrapper>
      );
    }

    case 'text': {
      if (!props.html) return null;

      return (
        <Wrapper
          title={props.title}
          {...(props.description && { description: props.description })}
          {...(props.icon && { icon: props.icon })}
          {...(props.category && { category: props.category })}
          {...(props.className && { className: props.className })}
        >
          <div className="prose prose-slate dark:prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed prose-ul:my-4 prose-ol:my-4 prose-li:my-2 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-strong:font-semibold prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:text-foreground prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic max-w-none">
            <TrustedHTML html={props.html} />
          </div>
        </Wrapper>
      );
    }

    default: {
      return null;
    }
  }
}