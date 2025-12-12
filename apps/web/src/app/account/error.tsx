'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  description:
    'We hit an unexpected issue while loading your account. Please try again or head back home.',
  links: [
    { href: '/account', label: 'Go to dashboard', variant: 'default' },
    { href: '/', label: 'Back to home', variant: 'outline' },
  ],
  resetText: 'Retry dashboard',
  segment: 'account',
  title: 'Account dashboard unavailable',
});
