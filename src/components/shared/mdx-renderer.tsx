import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { memo } from 'react';
import { z } from 'zod';
import { ErrorBoundary } from '@/src/components/shared/error-boundary';
import { mdxOptions } from '@/src/lib/content/mdx-config';
import type {
  mdxElementPropsSchema,
  mdxHeadingPropsSchema,
  mdxImagePropsSchema,
  mdxLinkPropsSchema,
} from '@/src/lib/schemas/shared.schema';
// Import lightweight components (always loaded)
import { Accordion } from '../content/accordion';
import { Callout } from '../content/callout';
import { CaseStudy } from '../content/case-study';
import { AIOptimizedFAQ } from '../content/faq';
import { FeatureGrid } from '../content/feature-grid';
import { InfoBox } from '../content/info-box';
import { TLDRSummary } from '../content/tldr-summary';
import { Checklist } from '../interactive/checklist';
import { ContentTabs as Tabs } from '../interactive/content-tabs';
import { ExpertQuote } from '../interactive/expert-quote';
import { QuickReference } from '../interactive/quick-reference';
import { setPageMetadata } from '../smart-related-content/with-metadata';
import { CodeGroupServer as CodeGroup } from '../template/code-group-server';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
// Import heavy components as lazy-loaded (Suspense boundaries)
import {
  ComparisonTable,
  DiagnosticFlow,
  ErrorTable,
  MetricsDisplay,
  SmartRelatedContent,
  StepByStepGuide,
} from './lazy-mdx-components';
import {
  CopyableCodeBlock,
  CopyableHeading,
  ExternalLinkComponent,
  InternalLinkComponent,
} from './mdx-components';

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
 * Global variable to store pathname for MDX components
 *
 * NOTE: This is safe in Next.js App Router server components
 * Each request gets its own execution context, so there's no
 * cross-request state leakage. For client components, pathname
 * is passed as a prop directly to avoid stale closures.
 */
let currentPathname = '';

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
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,

  // AI-Optimized Components with Schema.org markup
  Accordion,
  AIOptimizedFAQ,
  Callout,
  CaseStudy,
  Checklist,
  CodeGroup,
  ComparisonTable,
  DiagnosticFlow,
  ErrorTable,
  ExpertQuote,
  FeatureGrid,
  InfoBox,
  MetricsDisplay,
  QuickReference,
  SmartRelatedContent: (props: Parameters<typeof SmartRelatedContent>[0]) => (
    <SmartRelatedContent {...props} pathname={currentPathname} />
  ),
  StepByStepGuide,
  Tabs,
  TLDRSummary,
};

function MDXRendererComponent(props: MDXRendererProps) {
  const { source, className, pathname, metadata } = mdxRendererPropsSchema.parse(props);

  // Set pathname for SmartRelatedContent to use
  currentPathname = pathname || '';

  // Set metadata for SmartRelatedContent to use
  if (metadata) {
    setPageMetadata(metadata);
  }

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
