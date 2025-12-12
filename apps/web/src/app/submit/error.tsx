'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  description:
    "We couldn't load the submission form right now. Please retry or return to the directory.",
  links: [
    { href: '/submit', label: 'Open submission form', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
  resetText: 'Retry submission',
  segment: 'submit',
  title: 'Submission form unavailable',
});
