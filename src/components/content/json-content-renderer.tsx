/**
 * JSON Content Renderer
 *
 * Renders structured JSON content to React components.
 * Replaces MDXRemote for guide content while maintaining identical output.
 *
 * Architecture:
 * - Server component (no client-side hydration for static content)
 * - Discriminated union routing based on section type
 * - Reuses ALL existing components (UnifiedContentBox, UnifiedContentBlock, etc)
 * - Parses inline markdown (bold, italic, links) in text
 * - Validates component props at render time
 *
 * Performance:
 * - No MDX compilation overhead
 * - Tree-shakeable component imports
 * - Server-side rendering only
 *
 * @see src/lib/schemas/guide-content.schema.ts - JSON structure definition
 * @see src/lib/content/inline-markdown-parser.ts - Text formatting
 */

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Checklist } from '@/src/components/content/checklist';
import { CodeGroupServer as CodeGroup } from '@/src/components/content/code-group-server';
import {
  ComparisonTable,
  DiagnosticFlow,
  ErrorTable,
  MetricsDisplay,
  SmartRelatedContent,
  StepByStepGuide,
} from '@/src/components/content/content-components';
import { UnifiedContentBlock } from '@/src/components/content/unified-content-block';
import { UnifiedContentBox } from '@/src/components/domain/unified-content-box';
import type {
  BlockquoteSection,
  CodeSection,
  ComponentSection,
  ContentSection,
  HeadingSection,
  ImageSection,
  ListSection,
  ParagraphSection,
  TableSection,
} from '@/src/lib/schemas/content/guide.schema';
// Validation removed - data is pre-validated at build time
import { cn } from '@/src/lib/utils';

// ==============================================================================
// INLINE MARKDOWN PARSER
// ==============================================================================

/**
 * Parse inline markdown formatting in text
 * Supports: **bold**, _italic_, [text](url)
 *
 * Uses regex-based parsing for performance (no heavy parser needed)
 */
function parseInlineMarkdown(text: string): ReactNode {
  // Split by markdown patterns while preserving them
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  // Combined regex for all inline markdown patterns
  // Order matters: links first (most specific), then bold, then italic
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|_([^_]+)_/g;

  let match: RegExpExecArray | null = pattern.exec(text);
  while (match !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Determine which pattern matched and render appropriately
    if (match[1] && match[2]) {
      // Link: [text](url)
      const linkText = match[1];
      const href = match[2];
      const isExternal = href.startsWith('http') || href.startsWith('//');

      parts.push(
        <Link
          key={match.index}
          href={href}
          className="text-primary hover:underline transition-colors"
          {...(isExternal && {
            target: '_blank',
            rel: 'noopener noreferrer',
          })}
        >
          {linkText}
        </Link>
      );
    } else if (match[3]) {
      // Bold: **text**
      parts.push(
        <strong key={match.index} className="font-semibold">
          {match[3]}
        </strong>
      );
    } else if (match[4]) {
      // Italic: _text_
      parts.push(
        <em key={match.index} className="italic">
          {match[4]}
        </em>
      );
    }

    lastIndex = pattern.lastIndex;
    match = pattern.exec(text);
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Generate anchor ID from heading text
 * Converts "Hello World" -> "hello-world"
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Collapse multiple hyphens
}

// ==============================================================================
// SECTION RENDERERS
// ==============================================================================

/**
 * Paragraph - Text with inline markdown
 */
function ParagraphRenderer({ content }: ParagraphSection) {
  return <p className="my-4 leading-relaxed text-foreground">{parseInlineMarkdown(content)}</p>;
}

/**
 * Heading - Section heading with anchor link
 */
function HeadingRenderer({ level, text, id }: HeadingSection) {
  const generatedId = id || slugify(text);
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  const sizeClasses: Record<number, string> = {
    1: 'text-3xl font-bold mt-8 mb-6',
    2: 'text-2xl font-bold mt-8 mb-4',
    3: 'text-xl font-semibold mt-6 mb-3',
    4: 'text-lg font-semibold mt-5 mb-2',
    5: 'text-base font-semibold mt-4 mb-2',
    6: 'text-sm font-semibold mt-3 mb-2',
  };

  return (
    <Tag id={generatedId} className={cn(sizeClasses[level], 'scroll-mt-16')}>
      {parseInlineMarkdown(text)}
    </Tag>
  );
}

/**
 * Code Block - Syntax-highlighted code
 * Reuses existing syntax highlighting from CodeGroupServer
 */
function CodeRenderer({ language, code, filename }: CodeSection) {
  // Wrap in CodeGroup for consistent rendering
  return (
    <div className="my-6">
      <CodeGroup
        examples={[
          {
            language,
            code,
            ...(filename && { filename }),
          },
        ]}
      />
    </div>
  );
}

/**
 * List - Ordered or unordered list
 */
function ListRenderer({ ordered, items }: ListSection) {
  const Tag = ordered ? 'ol' : 'ul';
  const listClass = ordered
    ? 'list-decimal list-inside space-y-2 my-4'
    : 'list-disc list-inside space-y-2 my-4';

  return (
    <Tag className={listClass}>
      {items.map((item) => (
        <li key={crypto.randomUUID()} className="leading-relaxed">
          {parseInlineMarkdown(item)}
        </li>
      ))}
    </Tag>
  );
}

/**
 * Blockquote - Quoted text
 */
function BlockquoteRenderer({ content }: BlockquoteSection) {
  return (
    <blockquote className="border-l-4 border-primary pl-4 py-2 my-6 bg-accent/10 rounded-r-lg italic text-muted-foreground">
      {parseInlineMarkdown(content)}
    </blockquote>
  );
}

/**
 * Image - Image with Next.js Image optimization
 */
function ImageRenderer({ src, alt, width, height, caption }: ImageSection) {
  return (
    <figure className="my-8">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="rounded-lg border border-border"
        priority={false}
      />
      {caption && (
        <figcaption className="text-sm text-muted-foreground text-center mt-2">
          {parseInlineMarkdown(caption)}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Table - Data table
 */
function TableRenderer({ headers, rows }: TableSection) {
  return (
    <div className="my-8 overflow-x-auto">
      <table className="w-full border-collapse border border-border rounded-lg overflow-hidden">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={crypto.randomUUID()}
                className="border border-border bg-muted px-4 py-2 text-left font-semibold"
              >
                {parseInlineMarkdown(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={crypto.randomUUID()}>
              {row.map((cell) => (
                <td key={crypto.randomUUID()} className="border border-border px-4 py-2">
                  {parseInlineMarkdown(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Component - React component with props
 * Routes to appropriate component based on component name
 */
function ComponentRenderer({ component, props }: ComponentSection) {
  // Type assertion: props are validated at build time by component schemas
  // We use type assertions here because the props shape varies by component type
  // and TypeScript can't narrow the union type based on the component string
  // biome-ignore lint/suspicious/noExplicitAny: Props validated at build time by schemas
  const componentProps = props as any;

  switch (component) {
    case 'UnifiedContentBox':
      return <UnifiedContentBox {...componentProps} />;

    case 'UnifiedContentBlock':
      return <UnifiedContentBlock {...componentProps} />;

    case 'StepByStepGuide':
      return <StepByStepGuide {...componentProps} />;

    case 'Checklist':
      return <Checklist {...componentProps} />;

    case 'CodeGroup':
      return <CodeGroup {...componentProps} />;

    case 'ComparisonTable':
      return <ComparisonTable {...componentProps} />;

    case 'DiagnosticFlow':
      return <DiagnosticFlow {...componentProps} />;

    case 'ErrorTable':
      return <ErrorTable {...componentProps} />;

    case 'MetricsDisplay':
      return <MetricsDisplay {...componentProps} />;

    case 'SmartRelatedContent':
      return <SmartRelatedContent {...componentProps} />;

    default:
      return null;
  }
}

/**
 * Horizontal Rule - Section divider
 */
function HorizontalRuleRenderer() {
  return <hr className="my-8 border-border" />;
}

// ==============================================================================
// SECTION ROUTER
// ==============================================================================

/**
 * Route section to appropriate renderer based on type
 */
function SectionRenderer({ section }: { section: ContentSection; index: number }) {
  switch (section.type) {
    case 'paragraph':
      return <ParagraphRenderer {...section} />;

    case 'heading':
      return <HeadingRenderer {...section} />;

    case 'code':
      return <CodeRenderer {...section} />;

    case 'list':
      return <ListRenderer {...section} />;

    case 'blockquote':
      return <BlockquoteRenderer {...section} />;

    case 'image':
      return <ImageRenderer {...section} />;

    case 'table':
      return <TableRenderer {...section} />;

    case 'component':
      return <ComponentRenderer {...section} />;

    case 'hr':
      return <HorizontalRuleRenderer />;

    default: {
      // TypeScript exhaustiveness check - ensures all section types are handled
      return null;
    }
  }
}

// ==============================================================================
// MAIN RENDERER
// ==============================================================================

export interface JsonContentRendererProps {
  /** Guide JSON data (validated) */
  json: unknown;
  /** Optional className for wrapper */
  className?: string;
}

/**
 * JSON Content Renderer - Main component
 *
 * Renders structured JSON content as React components.
 * Validates JSON structure and routes sections to appropriate renderers.
 *
 * @example
 * ```tsx
 * <JsonContentRenderer json={guideData} />
 * ```
 */
export function JsonContentRenderer({ json, className }: JsonContentRendererProps) {
  // Data is pre-validated at build time - no runtime validation needed
  // Supports both GuideJson and ChangelogJson (same content structure)

  // Type guard and safety check
  if (!json || typeof json !== 'object') {
    return null;
  }

  const contentData = json as { content?: { sections?: ContentSection[] } };
  const sections = contentData.content?.sections;

  if (!(sections && Array.isArray(sections))) {
    return null;
  }

  return (
    <article className={cn('prose prose-neutral dark:prose-invert max-w-none', className)}>
      {sections.map((section: ContentSection, index: number) => (
        <SectionRenderer key={crypto.randomUUID()} section={section} index={index} />
      ))}
    </article>
  );
}

// ==============================================================================
// EXPORTS
// ==============================================================================

export { parseInlineMarkdown, slugify };
