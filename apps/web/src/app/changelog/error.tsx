'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  segment: 'changelog-page',
  title: 'Changelog temporarily unavailable',
  description:
    "We couldn't load the release notes right now. Please retry or head back home.",
  resetText: 'Retry changelog',
  links: [
    { href: '/changelog', label: 'View changelog', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
});
