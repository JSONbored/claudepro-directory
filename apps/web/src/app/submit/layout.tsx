import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { type Metadata } from 'next';
import { connection } from 'next/server';
import { type ReactNode } from 'react';

/**
 * Dynamic Rendering Required
 *
 * This layout uses dynamic rendering for server-side data fetching and user-specific content.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */

/**
 * Generate metadata for the "/submit" page at request time.
 *
 * Awaits a server connection to ensure non-deterministic operations (for example, `Date.now()`) occur at request time before producing metadata.
 *
 * @returns The `Metadata` object for the "/submit" page
 * @see {@link @heyclaude/web-runtime/data.generatePageMetadata}
 */
export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  return generatePageMetadata('/submit');
}

/**
 * Layout component that renders its child content unchanged for the "/submit" route.
 *
 * This server layout uses dynamic rendering inherited from its configuration.
 *
 * @param children - The React nodes to render inside the layout
 * @returns The provided `children` rendered as-is
 *
 * @see generatePageMetadata
 */
export default function SubmitLayout({ children }: { children: ReactNode }) {
  return children;
}
