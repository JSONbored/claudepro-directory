import { redirect } from 'next/navigation';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';


export const metadata = generatePageMetadata('/account/bookmarks');

/**
 * Redirect legacy /account/bookmarks to /account/library
 * Keeping this for backward compatibility
 */
export default function BookmarksPage() {
  redirect('/account/library');
}
