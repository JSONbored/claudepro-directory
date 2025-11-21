import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export async function generateMetadata(): Promise<Metadata> {
  // Use /account/library metadata since this redirects there
  return generatePageMetadata('/account/library');
}

/**
 * Redirect legacy /account/bookmarks to /account/library
 * Keeping this for backward compatibility
 */
export default function BookmarksPage() {
  logger.info(
    'BookmarksPage: redirecting legacy /account/bookmarks to /account/library',
    undefined,
    {
      sourceRoute: '/account/bookmarks',
      targetRoute: '/account/library',
      redirectReason: 'legacy-route-compatibility',
    }
  );
  redirect('/account/library');
}
