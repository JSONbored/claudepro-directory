import Link from 'next/link';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { ROUTES } from '@/src/lib/constants';
import { Bookmark, ExternalLink, FolderOpen, Layers, Plus } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata = await generatePageMetadata('/account/library');

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's bookmarks
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Get user's collections
  const { data: collections } = await supabase
    .from('user_collections')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const bookmarkCount = bookmarks?.length || 0;
  const collectionCount = collections?.length || 0;

  return (
    <div className={UI_CLASSES.SPACE_Y_6}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Library</h1>
          <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
            {bookmarkCount} bookmarks • {collectionCount} collections
          </p>
        </div>
        <Link href={ROUTES.ACCOUNT_LIBRARY_NEW}>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Collection
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="bookmarks" className={UI_CLASSES.W_FULL}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="bookmarks" className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Bookmarks ({bookmarkCount})
          </TabsTrigger>
          <TabsTrigger value="collections" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Collections ({collectionCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookmarks" className={UI_CLASSES.SPACE_Y_4}>
          {!bookmarks || bookmarks.length === 0 ? (
            <Card>
              <CardContent className={`${UI_CLASSES.FLEX_COL_CENTER} py-12`}>
                <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No bookmarks yet</h3>
                <p className={`${UI_CLASSES.TEXT_MUTED_FOREGROUND} text-center max-w-md`}>
                  Start exploring the directory and bookmark your favorite agents, MCP servers,
                  rules, and more!
                </p>
                <Link href="/" className="mt-4 text-primary hover:underline">
                  Browse Directory →
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {bookmarks.map((bookmark) => (
                <Card key={bookmark.id}>
                  <CardHeader>
                    <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
                      <div className={UI_CLASSES.FLEX_1}>
                        <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                          <Badge variant="outline" className="capitalize">
                            {bookmark.content_type}
                          </Badge>
                          <CardTitle className={UI_CLASSES.TEXT_LG}>
                            {bookmark.content_slug}
                          </CardTitle>
                        </div>
                        {bookmark.notes && (
                          <CardDescription className="mt-2">{bookmark.notes}</CardDescription>
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
        </TabsContent>

        <TabsContent value="collections" className={UI_CLASSES.SPACE_Y_4}>
          {!collections || collections.length === 0 ? (
            <Card>
              <CardContent className={`${UI_CLASSES.FLEX_COL_CENTER} py-12`}>
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No collections yet</h3>
                <p className={`${UI_CLASSES.TEXT_MUTED_FOREGROUND} text-center max-w-md mb-4`}>
                  Organize your bookmarks into custom collections! Group related configurations
                  together and share them with others.
                </p>
                <Link href={ROUTES.ACCOUNT_LIBRARY_NEW}>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Collection
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {collections.map((collection) => (
                <Card key={collection.id} className={UI_CLASSES.CARD_INTERACTIVE}>
                  <Link href={`/account/library/${collection.slug}`}>
                    <CardHeader>
                      <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
                        <div className={UI_CLASSES.FLEX_1}>
                          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} mb-2`}>
                            <Layers className="h-4 w-4 text-primary" />
                            {collection.is_public && (
                              <Badge variant="outline" className="text-xs">
                                Public
                              </Badge>
                            )}
                          </div>
                          <CardTitle className={UI_CLASSES.TEXT_LG}>{collection.name}</CardTitle>
                          {collection.description && (
                            <CardDescription className="mt-2 line-clamp-2">
                              {collection.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                          {collection.item_count} {collection.item_count === 1 ? 'item' : 'items'}
                        </p>
                        <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
                          {collection.view_count} views
                        </p>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
