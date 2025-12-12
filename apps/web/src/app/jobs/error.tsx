'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  description:
    'We ran into an issue loading the latest roles. Please retry or return to the home page.',
  links: [
    { href: '/jobs', label: 'View jobs', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
  resetText: 'Retry jobs',
  segment: 'jobs-page',
  title: 'Jobs page unavailable',
});
