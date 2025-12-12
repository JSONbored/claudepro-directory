'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  description:
    "We couldn't load the contact page right now. Please try again or use one of the alternative contact methods below.",
  links: [
    { href: '/contact', label: 'Go to contact', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
  resetText: 'Retry contact',
  segment: 'contact',
  title: 'Contact page unavailable',
});
