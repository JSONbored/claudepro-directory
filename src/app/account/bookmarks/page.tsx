import { redirect } from 'next/navigation';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export const metadata = generatePageMetadata('/account/bookmarks');

/**
 * Redirect legacy /account/bookmarks to /account/library
 * Keeping this for backward compatibility
 */
export default function BookmarksPage() {
  logger.info('BookmarksPage: redirecting legacy /account/bookmarks to /account/library');
  redirect('/account/library');
}
