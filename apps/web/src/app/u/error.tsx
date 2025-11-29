'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  segment: 'user-profile',
  title: 'Profile unavailable',
  description:
    "We couldn't load this profile right now. Please retry or explore the community instead.",
  resetText: 'Retry profile',
  links: [
    { href: '/community', label: 'Browse community', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
});
