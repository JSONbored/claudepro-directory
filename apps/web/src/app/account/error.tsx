'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  segment: 'account',
  title: 'Account dashboard unavailable',
  description:
    "We hit an unexpected issue while loading your account. Please try again or head back home.",
  resetText: 'Retry dashboard',
  links: [
    { href: '/account', label: 'Go to dashboard', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
});
