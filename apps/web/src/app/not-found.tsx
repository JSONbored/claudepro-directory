import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { padding, minHeight } from '@heyclaude/web-runtime/design-system';
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

/**
 * Renders the 404 page UI by centering the NotFound empty-state inside a full-height, padded container.
 *
 * @returns The React element displaying a full-height, padded container with the NotFoundEmpty component centered.
 *
 * @see NotFoundEmpty
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing#not-found-pages | Next.js NotFound pages}
 * @see padding, minHeight from @heyclaude/web-runtime/design-system
 */
export default function NotFound() {
  return (
    <div
      className={`flex ${minHeight.screen} bg-background items-center justify-center ${padding.xDefault}`}
    >
      <NotFoundEmpty />
    </div>
  );
}