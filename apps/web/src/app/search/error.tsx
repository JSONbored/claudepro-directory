'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  segment: 'search',
  title: 'Search is temporarily unavailable',
  description: "We couldn't complete your search just now. Please retry or explore the home page.",
  resetText: 'Retry search',
  links: [
    { href: '/search', label: 'Open search', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
});
