import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import type { Metadata } from 'next';
import { NotFoundEmpty } from '@/src/components/primitives/feedback/empty-state';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/404');
}

/**
 * Dynamic Rendering Required
 *
 * This page must use dynamic rendering because it imports from @heyclaude/web-runtime
 * which transitively imports feature-flags/flags.ts. The Vercel Flags SDK's flags/next
 * module contains module-level code that calls server functions, which cannot be
 * executed during static site generation.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <NotFoundEmpty />
    </div>
  );
}
