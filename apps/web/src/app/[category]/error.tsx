'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  segment: 'category',
  title: 'Category unavailable',
  description:
    "We couldn't load this category right now. Please retry or browse the full directory.",
  resetText: 'Retry category',
  links: [
    { href: '/', label: 'Back to directory', variant: 'default' },
    { href: '/search', label: 'Go to search', variant: 'outline' },
  ],
});
