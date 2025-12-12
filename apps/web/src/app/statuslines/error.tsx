'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  description:
    "We couldn't load the statuslines gallery right now. Please try again or browse the home page.",
  links: [
    { href: '/statuslines', label: 'View statuslines', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
  resetText: 'Retry statuslines',
  segment: 'statuslines-page',
  title: 'Statuslines unavailable',
});
