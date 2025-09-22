import { MDXRemote } from 'next-mdx-remote/rsc';
import { mdxOptions } from '@/lib/mdx-config';
import {
  AIOptimizedFAQ,
  ComparisonTable,
  ExpertQuote,
  FeatureGrid,
  InfoBox,
  QuickReference,
  RelatedResources,
  StepByStepGuide,
  TLDRSummary,
} from './ai-optimized-components';
import {
  CopyableCodeBlock,
  CopyableHeading,
  ExternalLinkComponent,
  InternalLinkComponent,
} from './mdx-components';
import { OptimizedImage } from './optimized-image';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface MDXRendererProps {
  source: string;
  className?: string;
}

// Custom components for MDX
const components = {
  // Enhanced image component
  img: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: any }) => (
    <OptimizedImage src={src} alt={alt} className="my-8" {...props} />
  ),

  // Custom link component with external link detection
  a: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: any;
  }) => {
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
  h1: ({
    children,
    id,
    ...props
  }: {
    children: React.ReactNode;
    id?: string;
    [key: string]: any;
  }) => (
    <CopyableHeading level={1} id={id} {...props}>
      {children}
    </CopyableHeading>
  ),

  h2: ({
    children,
    id,
    ...props
  }: {
    children: React.ReactNode;
    id?: string;
    [key: string]: any;
  }) => (
    <CopyableHeading level={2} id={id} {...props}>
      {children}
    </CopyableHeading>
  ),

  h3: ({
    children,
    id,
    ...props
  }: {
    children: React.ReactNode;
    id?: string;
    [key: string]: any;
  }) => (
    <CopyableHeading level={3} id={id} {...props}>
      {children}
    </CopyableHeading>
  ),

  // Enhanced code blocks with copy functionality
  pre: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <CopyableCodeBlock {...props}>{children}</CopyableCodeBlock>
  ),

  // Enhanced inline code
  code: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <code
      className="bg-zinc-800 px-2 py-0.5 rounded text-sm font-mono text-zinc-300 border border-zinc-700"
      {...props}
    >
      {children}
    </code>
  ),

  // Enhanced blockquotes
  blockquote: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <blockquote
      className="border-l-4 border-primary pl-4 py-2 my-6 bg-accent/10 rounded-r-lg italic text-muted-foreground"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Enhanced tables
  table: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <div className="my-8 overflow-x-auto">
      <table
        className="w-full border-collapse border border-border rounded-lg overflow-hidden"
        {...props}
      >
        {children}
      </table>
    </div>
  ),

  th: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <th className="border border-border bg-muted px-4 py-2 text-left font-semibold" {...props}>
      {children}
    </th>
  ),

  td: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <td className="border border-border px-4 py-2" {...props}>
      {children}
    </td>
  ),

  // Custom components for enhanced content
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,

  // AI-Optimized Components with Schema.org markup
  AIOptimizedFAQ,
  ComparisonTable,
  StepByStepGuide,
  FeatureGrid,
  TLDRSummary,
  ExpertQuote,
  RelatedResources,
  InfoBox,
  QuickReference,
};

export function MDXRenderer({ source, className = '' }: MDXRendererProps) {
  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <MDXRemote
        source={source}
        components={components}
        options={{
          mdxOptions: mdxOptions,
        }}
      />
    </div>
  );
}
