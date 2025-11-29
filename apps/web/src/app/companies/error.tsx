'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  segment: 'companies',
  title: 'Companies are unavailable',
  description:
    "We couldn't load the companies directory right now. Please try again shortly or head back to the home page.",
  resetText: 'Retry companies',
  links: [
    { href: '/companies', label: 'Browse companies', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
});
