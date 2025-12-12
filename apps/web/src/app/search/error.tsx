'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  description: "We couldn't complete your search just now. Please retry or explore the home page.",
  links: [
    { href: '/search', label: 'Open search', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
  resetText: 'Retry search',
  segment: 'search',
  title: 'Search is temporarily unavailable',
});
