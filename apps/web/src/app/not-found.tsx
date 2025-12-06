import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { type Metadata } from 'next';

import { NotFoundEmpty } from '@/src/components/primitives/feedback/empty-state';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/404');
}

/**
 * Static Generation: 404 page is fully static
 * No dynamic data fetching - can be pre-rendered at build time
 */

/**
 * Renders the site's 404 Not Found page using the NotFoundEmpty presentation.
 *
 * @returns The React element for the 404 page.
 *
 * @see {@link "@/src/components/primitives/feedback/empty-state".NotFoundEmpty}
 */
export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <NotFoundEmpty />
    </div>
  );
}
