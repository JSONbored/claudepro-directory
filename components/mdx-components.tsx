'use client';

import { CheckCircle, Copy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// Client component for copy-to-clipboard headings
export function CopyableHeading({
  level,
  children,
  id,
  ...props
}: {
  level: 1 | 2 | 3;
  children: React.ReactNode;
  id?: string | undefined;
  [key: string]: any;
}) {
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
      className={`${sizeClasses[level]} scroll-mt-16 group flex items-center gap-2`}
      {...props}
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

// Client component for copyable code blocks
export function CopyableCodeBlock({
  children,
  ...props
}: {
  children: React.ReactNode;
  [key: string]: any;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const codeElement = children as any;
    const code = codeElement?.props?.children || '';
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-6">
      <pre
        className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto text-sm font-mono text-zinc-300"
        {...props}
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
export function ExternalLinkComponent({
  href,
  children,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline transition-colors inline-flex items-center gap-1"
      {...props}
    >
      {children}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

// Internal link component
export function InternalLinkComponent({
  href,
  children,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <Link href={href} className="text-primary hover:underline transition-colors" {...props}>
      {children}
    </Link>
  );
}
