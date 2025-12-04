import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { type Metadata } from 'next';
import { type ReactNode } from 'react';

/**
 * Generate the Metadata for the "/submit" route used by Next.js.
 *
 * Produces the page metadata associated with the '/submit' path.
 *
 * @returns The Metadata object for the '/submit' page.
 * @see {@link @heyclaude/web-runtime/data.generatePageMetadata}
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