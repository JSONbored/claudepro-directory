'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  description: "We couldn't load the release notes right now. Please retry or head back home.",
  links: [
    { href: '/changelog', label: 'View changelog', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
  resetText: 'Retry changelog',
  segment: 'changelog-page',
  title: 'Changelog temporarily unavailable',
});
