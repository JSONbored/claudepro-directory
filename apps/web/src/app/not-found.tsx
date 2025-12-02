import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import {
  bgColor,
  alignItems,
  justify,
  minHeight,
  padding,
} from '@heyclaude/web-runtime/design-system';
import { cn } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';

import { NotFoundEmpty } from '@/src/components/primitives/feedback/empty-state';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/404');
}

/**
 * Static Generation: 404 page is fully static
 * No dynamic data fetching - can be pre-rendered at build time
 */
export const revalidate = false;

export default function NotFound() {
  return (
    <div className={cn('flex', minHeight.screen, alignItems.center, justify.center, bgColor.background, padding.xDefault)}>
      <NotFoundEmpty />
    </div>
  );
}
