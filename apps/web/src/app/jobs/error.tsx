'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  segment: 'jobs-page',
  title: 'Jobs page unavailable',
  description:
    'We ran into an issue loading the latest roles. Please retry or return to the home page.',
  resetText: 'Retry jobs',
  links: [
    { href: '/jobs', label: 'View jobs', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
});
