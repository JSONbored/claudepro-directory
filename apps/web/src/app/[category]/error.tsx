'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  description:
    "We couldn't load this category right now. Please retry or browse the full directory.",
  links: [
    { href: '/', label: 'Back to directory', variant: 'default' },
    { href: '/search', label: 'Go to search', variant: 'outline' },
  ],
  resetText: 'Retry category',
  segment: 'category',
  title: 'Category unavailable',
});
