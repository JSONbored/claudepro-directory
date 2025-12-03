import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { type Metadata } from 'next';
import { type ReactNode } from 'react';

/**
 * Generates the page metadata for the /submit route.
 *
 * @returns The Next.js `Metadata` object for the `/submit` route.
 * @see {@link generatePageMetadata} from @heyclaude/web-runtime/data
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/submit');
}

/**
 * Dynamic Rendering Required
 *
 * This layout uses dynamic rendering for server-side data fetching and user-specific content.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const dynamic = 'force-dynamic';

export default function SubmitLayout({ children }: { children: ReactNode }) {
  return children;
}