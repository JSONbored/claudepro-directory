import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { type Metadata } from 'next';
import { type ReactNode } from 'react';

/**
 * Generate metadata for the "/submit" page.
 *
 * @returns The metadata object for the "/submit" page.
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

/**
 * Layout component that renders its child content unchanged for the "/submit" route.
 *
 * This server layout is used with dynamic server rendering (see the exported `dynamic` flag).
 *
 * @param children - The React nodes to render inside the layout
 * @returns The provided `children` rendered as-is
 *
 * @see generatePageMetadata
 * @see {@link dynamic}
 */
export default function SubmitLayout({ children }: { children: ReactNode }) {
  return children;
}