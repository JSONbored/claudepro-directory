'use client';

import { createSegmentErrorBoundary } from '@heyclaude/web-runtime/ui';

export default createSegmentErrorBoundary({
  description:
    'The community hub hit an unexpected issue. Please try again or jump back to the directory.',
  links: [{ href: '/', label: 'Back to home', variant: 'outline' }],
  resetText: 'Retry community',
  segment: 'community',
  title: 'Community page unavailable',
});
