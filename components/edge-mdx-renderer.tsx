import { MDXRemote } from 'next-mdx-remote/rsc';
import { memo } from 'react';
import { z } from 'zod';
import { ErrorBoundary } from '@/components/error-boundary';
import { mdxOptions } from '@/lib/mdx-config';
import type {
  mdxElementPropsSchema,
  mdxHeadingPropsSchema,
  mdxImagePropsSchema,
  mdxLinkPropsSchema,
} from '@/lib/schemas/shared.schema';
// Essential MDX components (always loaded)
import {
  CopyableCodeBlock,
  CopyableHeading,
  ExternalLinkComponent,
  InternalLinkComponent,
} from './mdx-components';
import { OptimizedImage } from './optimized-image';
// Core UI components (always loaded for Edge compatibility)
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

// Props schema for Edge MDX renderer
const edgeMDXRendererPropsSchema = z.object({
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

type EdgeMDXRendererProps = z.infer<typeof edgeMDXRendererPropsSchema>;

// Lazy-loaded component placeholders for Edge Functions
// These components are loaded on-demand to reduce initial bundle size
interface LazyComponentProps {
  componentName: string;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
  title?: string;
  type?: string;
}

const LazyComponentWrapper = ({
  componentName,
  fallback = null,
  children,
  ...props
}: LazyComponentProps & Record<string, unknown>) => {
  // For Edge Functions, provide a lightweight fallback that maintains functionality
  switch (componentName) {
    case 'Accordion':
      return (
        <div className="border rounded-lg overflow-hidden" {...props}>
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
              <span className="font-medium">{props.title || 'Expandable Content'}</span>
              <span className="text-sm group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="p-4 border-t">{children}</div>
          </details>
        </div>
      );

    case 'Callout':
      return (
        <Alert
          className={`my-6 ${props.type === 'warning' ? 'border-yellow-500' : props.type === 'error' ? 'border-red-500' : 'border-blue-500'}`}
          {...props}
        >
          <AlertTitle>{props.title || 'Note'}</AlertTitle>
          <AlertDescription>{children}</AlertDescription>
        </Alert>
      );

    case 'InfoBox':
      return (
        <Card className="my-6 border-blue-500/50 bg-blue-500/5" {...props}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {props.title || 'Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">{children}</CardContent>
        </Card>
      );

    case 'TLDRSummary':
      return (
        <Card className="my-6 border-green-500/50 bg-green-500/5" {...props}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              TL;DR
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1 text-sm">{Array.isArray(children) ? children : [children]}</ul>
          </CardContent>
        </Card>
      );

    case 'CodeGroup':
      return (
        <div className="my-6 border rounded-lg overflow-hidden" {...props}>
          <div className="bg-muted px-4 py-2 text-sm font-medium border-b">Code Example</div>
          <div className="p-4">{children}</div>
        </div>
      );

    case 'StepByStepGuide':
      return (
        <div className="my-6 space-y-4" {...props}>
          <h3 className="text-lg font-semibold mb-4">{props.title || 'Step-by-Step Guide'}</h3>
          <div className="space-y-3">{children}</div>
        </div>
      );

    default:
      // For unknown components, render a simple container
      return (
        <div className="my-4 p-4 border rounded-lg bg-muted/20" {...props}>
          <div className="text-sm text-muted-foreground mb-2">Component: {componentName}</div>
          {children}
        </div>
      );
  }
};

// Edge-optimized component map with lazy loading fallbacks
const edgeComponents = {
  // Enhanced image component
  img: ({ src, alt, width, height, className }: z.infer<typeof mdxImagePropsSchema>) => (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`my-8 ${className || ''}`}
      priority={false}
      blurDataURL=""
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
    <div className="my-8 overflow-x-auto">
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

  // Core UI components
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,

  // Lazy-loaded components with Edge-compatible fallbacks
  Accordion: (props: Record<string, unknown>) => (
    <LazyComponentWrapper componentName="Accordion" {...props} />
  ),
  AIOptimizedFAQ: (props: Record<string, unknown>) => (
    <LazyComponentWrapper componentName="AIOptimizedFAQ" {...props} />
  ),
  Callout: (props: Record<string, unknown>) => (
    <LazyComponentWrapper componentName="Callout" {...props} />
  ),
  CaseStudy: (props: Record<string, unknown>) => (
    <LazyComponentWrapper componentName="CaseStudy" {...props} />
  ),
  Checklist: (props: Record<string, unknown>) => (
    <LazyComponentWrapper componentName="Checklist" {...props} />
  ),
  CodeGroup: (props: Record<string, unknown>) => (
    <LazyComponentWrapper componentName="CodeGroup" {...props} />
  ),
  ComparisonTable: (props: Record<string, unknown>) => (
    <LazyComponentWrapper componentName="ComparisonTable" {...props} />
  ),
  DiagnosticFlow: (props: Record<string, unknown>) => (
    <LazyComponentWrapper componentName="DiagnosticFlow" {...props} />
  ),
  ErrorTable: (props: Record<string, unknown>) => (
    <LazyComponentWrapper componentName="ErrorTable" {...props} />
  ),
  ExpertQuote: (props: Record<string, unknown>) => (
    <LazyComponentWrapper componentName="ExpertQuote" {...props} />
  ),
  FeatureGrid: (props: Record<string, unknown>) => (
    <LazyComponentWrapper componentName="FeatureGrid" {...props} />
  ),
  InfoBox: (props: Record<string, unknown>) => (
    <LazyComponentWrapper componentName="InfoBox" {...props} />
  ),
  MetricsDisplay: (props: Record<string, unknown>) => (
    <LazyComponentWrapper componentName="MetricsDisplay" {...props} />
  ),
  QuickReference: (props: Record<string, unknown>) => (
    <LazyComponentWrapper componentName="QuickReference" {...props} />
  ),
  StepByStepGuide: (props: Record<string, unknown>) => (
    <LazyComponentWrapper componentName="StepByStepGuide" {...props} />
  ),
  ContentTabs: (props: Record<string, unknown>) => (
    <LazyComponentWrapper componentName="ContentTabs" {...props} />
  ),
  Tabs: (props: Record<string, unknown>) => (
    <LazyComponentWrapper componentName="ContentTabs" {...props} />
  ),
  TLDRSummary: (props: Record<string, unknown>) => (
    <LazyComponentWrapper componentName="TLDRSummary" {...props} />
  ),

  // SmartRelatedContent - Simplified for Edge
  SmartRelatedContent: () => (
    <Card className="my-6">
      <CardHeader>
        <CardTitle className="text-lg">Related Content</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Related content will be loaded after page render.
        </p>
      </CardContent>
    </Card>
  ),
};

function EdgeMDXRendererComponent(props: EdgeMDXRendererProps) {
  const { source, className } = edgeMDXRendererPropsSchema.parse(props);

  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <ErrorBoundary>
        <MDXRemote
          source={source}
          components={edgeComponents}
          options={{
            mdxOptions: mdxOptions,
          }}
        />
      </ErrorBoundary>
    </div>
  );
}

// Memoize EdgeMDXRenderer to prevent unnecessary re-renders
export const EdgeMDXRenderer = memo(EdgeMDXRendererComponent);
