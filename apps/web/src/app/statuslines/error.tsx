'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  segment: 'statuslines-page',
  title: 'Statuslines unavailable',
  description:
    "We couldn't load the statuslines gallery right now. Please try again or browse the home page.",
  resetText: 'Retry statuslines',
  links: [
    { href: '/statuslines', label: 'View statuslines', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
});
