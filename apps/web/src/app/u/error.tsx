'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  description:
    "We couldn't load this profile right now. Please retry or explore the community instead.",
  links: [
    { href: '/community', label: 'Browse community', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
  resetText: 'Retry profile',
  segment: 'user-profile',
  title: 'Profile unavailable',
});
