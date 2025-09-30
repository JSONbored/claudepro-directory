'use client';

import { CheckCircle, Copy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import { z } from 'zod';
import { copyToClipboard } from '@/lib/clipboard-utils';
import type { MdxElementProps, MdxHeadingProps, MdxLinkProps } from '@/lib/schemas';

// Client component for copy-to-clipboard headings
export function CopyableHeading({
  level,
  children,
  id,
  className,
  ...props
}: MdxHeadingProps & { level: 1 | 2 | 3 }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (id) {
      navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
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

// Schema for validating text content extraction
const textContentSchema = z.string().min(0);

// Client component for copyable code blocks
export function CopyableCodeBlock({ children, className, ...props }: MdxElementProps) {
  const [copied, setCopied] = useState(false);

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
        const element = node as React.ReactElement<{ children?: React.ReactNode }>;
        return extractTextContent(element.props.children);
      }
      return '';
    };

    const rawText = extractTextContent(children);
    const validatedText = textContentSchema.parse(rawText);

    const success = await copyToClipboard(validatedText, {
      component: 'CopyableCodeBlock',
      action: 'copy-code',
    });

    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group my-6">
      <pre
        {...props}
        className={`bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto text-sm font-mono text-zinc-300 ${className || ''}`}
      >
        {children}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-zinc-800 rounded"
        title="Copy code"
      >
        {copied ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4 text-zinc-400" />
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
