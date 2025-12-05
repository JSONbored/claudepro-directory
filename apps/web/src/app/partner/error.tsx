'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  segment: 'partner',
  title: 'Partner page unavailable',
  description: "We couldn't load the partner details right now. Please retry or reach out later.",
  resetText: 'Retry partner page',
  links: [
    { href: '/partner', label: 'View partner options', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
});
