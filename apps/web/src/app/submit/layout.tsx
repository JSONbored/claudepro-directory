import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { type Metadata } from 'next';
import { type ReactNode } from 'react';

/**
 * Dynamic Rendering Required
 *
 * This layout uses dynamic rendering for server-side data fetching and user-specific content.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */

/**
 * Generate metadata for the "/submit" page.
 *
 * The metadata function is deterministic, so connection() defer is not needed.
 *
 * @returns The `Metadata` object for the "/submit" page
 * @see {@link @heyclaude/web-runtime/data.generatePageMetadata}
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/submit');
}

/**
 * Layout component that renders its child content unchanged for the "/submit" route.
 *
 * This server layout uses dynamic rendering inherited from its configuration.
 *
 * @param children - The React nodes to render inside the layout
 * @param children.children
 * @returns The provided `children` rendered as-is
 *
 * @see generatePageMetadata
 */
export default function SubmitLayout({ children }: { children: ReactNode }) {
  return children;
}
