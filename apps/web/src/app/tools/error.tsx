'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  segment: 'tools',
  title: 'Tools page unavailable',
  description:
    "We couldn't load the tools catalog right now. Please retry or check out the directory.",
  resetText: 'Retry tools',
  links: [
    { href: '/tools', label: 'View tools', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
});
