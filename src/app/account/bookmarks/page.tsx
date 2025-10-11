import { redirect } from 'next/navigation';

/**
 * Redirect legacy /account/bookmarks to /account/library
 * Keeping this for backward compatibility
 */
export default function BookmarksPage() {
  redirect('/account/library');
}
