'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  description: "We couldn't load the partner details right now. Please retry or reach out later.",
  links: [
    { href: '/partner', label: 'View partner options', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
  resetText: 'Retry partner page',
  segment: 'partner',
  title: 'Partner page unavailable',
});
