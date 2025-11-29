'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  segment: 'community',
  title: 'Community page unavailable',
  description:
    'The community hub hit an unexpected issue. Please try again or jump back to the directory.',
  resetText: 'Retry community',
  links: [{ href: '/', label: 'Back to home', variant: 'outline' }],
});
