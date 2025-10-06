import { createClient } from '@/src/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Bookmark, ExternalLink } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bookmarks - ClaudePro Directory',
  description: 'View and manage your bookmarked configurations',
};

export default async function BookmarksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's bookmarks
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className={UI_CLASSES.SPACE_Y_6}>
      <div>
        <h1 className="text-3xl font-bold mb-2">Bookmarks</h1>
        <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
          {bookmarks?.length || 0} saved configurations
        </p>
      </div>

      {!bookmarks || bookmarks.length === 0 ? (
        <Card>
          <CardContent className={`${UI_CLASSES.FLEX_COL_CENTER} py-12`}>
            <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No bookmarks yet</h3>
            <p className={`${UI_CLASSES.TEXT_MUTED_FOREGROUND} text-center max-w-md`}>
              Start exploring the directory and bookmark your favorite agents, MCP servers, rules, and more!
            </p>
            <Link
              href="/"
              className="mt-4 text-primary hover:underline"
            >
              Browse Directory →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookmarks.map((bookmark) => (
            <Card key={bookmark.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                      <Badge variant="outline" className="capitalize">
                        {bookmark.content_type}
                      </Badge>
                      <CardTitle className={UI_CLASSES.TEXT_LG}>
                        {bookmark.content_slug}
                      </CardTitle>
                    </div>
                    {bookmark.notes && (
                      <CardDescription className="mt-2">
                        {bookmark.notes}
                      </CardDescription>
                    )}
                  </div>
                  <Link
                    href={`/${bookmark.content_type}/${bookmark.content_slug}`}
                    className="text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                  Saved {new Date(bookmark.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
