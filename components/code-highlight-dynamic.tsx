'use client';

import dynamic from 'next/dynamic';

// Loading component shown while CodeHighlight loads
const CodeHighlightLoader = () => (
  <div className="animate-pulse bg-card border border-border rounded-lg p-4 min-h-[4rem]">
    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
    <div className="h-4 bg-muted rounded w-1/2" />
  </div>
);

// Dynamically import the heavy CodeHighlight component
export const CodeHighlight = dynamic(
  () => import('./code-highlight').then((mod) => ({ default: mod.CodeHighlight })),
  {
    loading: () => <CodeHighlightLoader />,
    ssr: false, // Disable SSR for this component as it uses browser APIs
  }
);
