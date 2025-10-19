import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { memo } from 'react';
import { z } from 'zod';
import { Checklist } from '@/src/components/content/checklist';
// ARCHITECTURAL MODERNIZATION: Removed setPageMetadata import
// OLD: Module-level state pattern (anti-pattern for client components)
// NEW: Direct prop passing via component wrapper (see SmartRelatedContent below)
import { CodeGroupServer as CodeGroup } from '@/src/components/content/code-group-server';
// Import all MDX components from consolidated file
import {
  // Lazy-loaded heavy components (code-split with React.lazy)
  ComparisonTable,
  // Eager-loaded lightweight components
  CopyableCodeBlock,
  CopyableHeading,
  DiagnosticFlow,
  ErrorTable,
  ExternalLinkComponent,
  InternalLinkComponent,
  MetricsDisplay,
  SmartRelatedContent,
  StepByStepGuide,
} from '@/src/components/content/mdx-components';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { UnifiedContentBox } from '@/src/components/domain/unified-content-box';
import { ErrorBoundary } from '@/src/components/infra/error-boundary';
import { Alert, AlertDescription, AlertTitle } from '@/src/components/primitives/alert';
import { Button } from '@/src/components/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { mdxOptions } from '@/src/lib/content/mdx-config';
import type {
  mdxElementPropsSchema,
  mdxHeadingPropsSchema,
  mdxImagePropsSchema,
  mdxLinkPropsSchema,
} from '@/src/lib/schemas/shared.schema';
// Import lightweight components (always loaded)
import { UnifiedContentBlock } from '../content/unified-content-block';

// Props schemas for MDX components are imported from shared.schema

const mdxRendererPropsSchema = z.object({
  source: z.string(),
  className: z.string().default(''),
  pathname: z.string().optional(),
  metadata: z
    .object({
      tags: z.array(z.string()).default([]),
      keywords: z.array(z.string()).default([]),
    })
    .optional(),
});

type MDXRendererProps = z.infer<typeof mdxRendererPropsSchema>;

/**
 * ARCHITECTURAL MODERNIZATION: Eliminated module-level state
 *
 * OLD PATTERN (REMOVED):
 * - let currentPathname = '' (module-level state)
 * - setPageMetadata() call in render function
 * - Global state shared across renders (anti-pattern)
 * - Wrapper functions (buildMDXComponents factory)
 *
 * NEW PATTERN:
 * - Direct components object (no factory function)
 * - MDXRemote scope prop for passing metadata
 * - No wrappers, no shared state
 * - Type-safe, maintainable, no race conditions
 */

// Custom components for MDX
const components = {
  // Enhanced image component
  img: ({ src, alt, width, height, className }: z.infer<typeof mdxImagePropsSchema>) => (
    <Image
      src={src}
      alt={alt}
      width={width || 800}
      height={height || 600}
      className={`my-8 ${className || ''}`}
      priority={false}
    />
  ),

  // Custom link component with external link detection
  a: ({ href, children, ...props }: z.infer<typeof mdxLinkPropsSchema>) => {
    const isExternal = href && (href.startsWith('http') || href.startsWith('//'));

    if (isExternal) {
      return (
        <ExternalLinkComponent href={href} {...props}>
          {children}
        </ExternalLinkComponent>
      );
    }

    return (
      <InternalLinkComponent href={href} {...props}>
        {children}
      </InternalLinkComponent>
    );
  },

  // Enhanced headings with copy-to-clipboard functionality
  h1: ({ children, id, ...props }: z.infer<typeof mdxHeadingPropsSchema>) => (
    <CopyableHeading level={1} id={id} {...props}>
      {children}
    </CopyableHeading>
  ),

  h2: ({ children, id, ...props }: z.infer<typeof mdxHeadingPropsSchema>) => (
    <CopyableHeading level={2} id={id} {...props}>
      {children}
    </CopyableHeading>
  ),

  h3: ({ children, id, ...props }: z.infer<typeof mdxHeadingPropsSchema>) => (
    <CopyableHeading level={3} id={id} {...props}>
      {children}
    </CopyableHeading>
  ),

  // Enhanced code blocks with copy functionality
  pre: ({ children, ...props }: z.infer<typeof mdxElementPropsSchema>) => (
    <CopyableCodeBlock {...props}>{children}</CopyableCodeBlock>
  ),

  // Enhanced inline code
  code: ({ children, className, ...props }: z.infer<typeof mdxElementPropsSchema>) => (
    <code
      {...props}
      className={`bg-zinc-800 px-2 py-0.5 rounded text-sm font-mono text-zinc-300 border border-zinc-700 ${className || ''}`}
    >
      {children}
    </code>
  ),

  // Enhanced blockquotes
  blockquote: ({ children, className, ...props }: z.infer<typeof mdxElementPropsSchema>) => (
    <blockquote
      {...props}
      className={`border-l-4 border-primary pl-4 py-2 my-6 bg-accent/10 rounded-r-lg italic text-muted-foreground ${className || ''}`}
    >
      {children}
    </blockquote>
  ),

  // Enhanced tables
  table: ({ children, className, ...props }: z.infer<typeof mdxElementPropsSchema>) => (
    <div className={'my-8 overflow-x-auto'}>
      <table
        {...props}
        className={`w-full border-collapse border border-border rounded-lg overflow-hidden ${className || ''}`}
      >
        {children}
      </table>
    </div>
  ),

  th: ({ children, className, ...props }: z.infer<typeof mdxElementPropsSchema>) => (
    <th
      {...props}
      className={`border border-border bg-muted px-4 py-2 text-left font-semibold ${className || ''}`}
    >
      {children}
    </th>
  ),

  td: ({ children, className, ...props }: z.infer<typeof mdxElementPropsSchema>) => (
    <td {...props} className={`border border-border px-4 py-2 ${className || ''}`}>
      {children}
    </td>
  ),

  // Custom components for enhanced content
  Alert,
  AlertDescription,
  AlertTitle,
  Badge: UnifiedBadge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,

  // AI-Optimized Components with Schema.org markup
  // Unified Content Box - NO WRAPPERS, direct discriminated union
  UnifiedContentBox,

  // Other content components
  UnifiedContentBlock,
  Checklist,
  CodeGroup,
  ComparisonTable,
  DiagnosticFlow,
  ErrorTable,
  MetricsDisplay,
  SmartRelatedContent,
  StepByStepGuide,
};

function MDXRendererComponent(props: MDXRendererProps) {
  const { source, className } = mdxRendererPropsSchema.parse(props);

  // PROPER MODERNIZATION: Metadata passed via MDXContentProvider context
  // SmartRelatedContent accesses via useMDXContent() hook
  // NO module-level state, NO scope hacks, NO wrappers

  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <ErrorBoundary>
        <MDXRemote
          source={source}
          components={components}
          options={{
            mdxOptions: mdxOptions,
          }}
        />
      </ErrorBoundary>
    </div>
  );
}

// Memoize MDXRenderer to prevent unnecessary re-renders on prop changes
export const MDXRenderer = memo(MDXRendererComponent);
