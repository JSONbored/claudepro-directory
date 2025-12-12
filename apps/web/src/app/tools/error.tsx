'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  description:
    "We couldn't load the tools catalog right now. Please retry or check out the directory.",
  links: [
    { href: '/tools', label: 'View tools', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
  resetText: 'Retry tools',
  segment: 'tools',
  title: 'Tools page unavailable',
});
