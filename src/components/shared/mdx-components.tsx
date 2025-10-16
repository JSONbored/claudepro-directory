'use client';

import Link from 'next/link';
import React from 'react';
import { useMDXContent } from '@/src/components/providers/mdx-content-provider';
import { useCopyWithEmailCapture } from '@/src/hooks/use-copy-with-email-capture';
import { CheckCircle, Copy, ExternalLink } from '@/src/lib/icons';
import type {
  MdxElementProps,
  MdxHeadingProps,
  MdxLinkProps,
} from '@/src/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// Client component for copy-to-clipboard headings
export function CopyableHeading({
  level,
  children,
  id,
  className,
  ...props
}: MdxHeadingProps & { level: 1 | 2 | 3 }) {
  const mdxContext = useMDXContent();

  const referrer = typeof window !== 'undefined' ? window.location.pathname : undefined;
  const { copied, copy } = useCopyWithEmailCapture({
    emailContext: {
      copyType: 'link',
      ...(mdxContext && {
        category: mdxContext.category,
        slug: mdxContext.slug,
      }),
      ...(referrer && { referrer }),
    },
    context: {
      component: 'CopyableHeading',
      action: 'copy-heading-link',
    },
  });

  const handleCopy = () => {
    if (id) {
      copy(`${window.location.origin}${window.location.pathname}#${id}`);
    }
  };

  const sizeClasses = {
    1: 'text-3xl font-bold mt-8 mb-6',
    2: 'text-2xl font-bold mt-8 mb-4',
    3: 'text-xl font-semibold mt-6 mb-3',
  };

  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';

  return (
    <Tag
      id={id}
      {...props}
      className={`${sizeClasses[level]} scroll-mt-16 group flex items-center gap-2 ${className || ''}`}
    >
      {children}
      {id && (
        <button
          type="button"
          onClick={handleCopy}
          className={
            'opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded'
          }
          title="Copy link to heading"
        >
          {copied ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      )}
    </Tag>
  );
}

// Type guard for text content validation (replaces Zod for bundle optimization)
function ensureString(value: unknown): string {
  return typeof value === 'string' ? value : String(value);
}

// Client component for copyable code blocks (MDX/rehype-pretty-code)
export function CopyableCodeBlock({ children, className, ...props }: MdxElementProps) {
  const mdxContext = useMDXContent();

  const referrer = typeof window !== 'undefined' ? window.location.pathname : undefined;
  const { copied, copy } = useCopyWithEmailCapture({
    emailContext: {
      copyType: 'code',
      ...(mdxContext && {
        category: mdxContext.category,
        slug: mdxContext.slug,
      }),
      ...(referrer && { referrer }),
    },
    context: {
      component: 'CopyableCodeBlock',
      action: 'copy-code',
    },
  });

  const handleCopy = async () => {
    // Extract text content from React children with proper validation
    const extractTextContent = (node: React.ReactNode): string => {
      if (typeof node === 'string') return node;
      if (typeof node === 'number') return String(node);
      if (Array.isArray(node)) {
        return node.map(extractTextContent).join('');
      }
      if (React.isValidElement(node)) {
        // Use type assertion only after React.isValidElement check
        const element = node as React.ReactElement<{
          children?: React.ReactNode;
        }>;
        return extractTextContent(element.props.children);
      }
      return '';
    };

    const rawText = extractTextContent(children);
    const validatedText = ensureString(rawText);

    await copy(validatedText);
  };

  return (
    <div className={UI_CLASSES.CODE_BLOCK_GROUP_WRAPPER}>
      <pre {...props} className={`${UI_CLASSES.CODE_BLOCK_PRE} ${className || ''}`}>
        {children}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className={UI_CLASSES.CODE_BLOCK_COPY_BUTTON_HEADER_FLOATING}
        style={{ minWidth: '48px', minHeight: '48px' }}
        title="Copy code"
      >
        {copied ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className={'h-4 w-4 text-muted-foreground'} />
        )}
      </button>
    </div>
  );
}

// External link component
export function ExternalLinkComponent({ href, children, className, ...props }: MdxLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
      className={`text-primary hover:underline transition-colors inline-flex items-center gap-1 ${className || ''}`}
    >
      {children}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

// Internal link component
export function InternalLinkComponent({ href, children, className, ...props }: MdxLinkProps) {
  return (
    <Link
      href={href}
      {...props}
      className={`text-primary hover:underline transition-colors ${className || ''}`}
    >
      {children}
    </Link>
  );
}
