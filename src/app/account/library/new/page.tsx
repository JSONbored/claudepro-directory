import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CollectionForm } from '@/src/components/core/forms/collection-form';
import { Button } from '@/src/components/primitives/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { getUserBookmarksForCollections } from '@/src/lib/data/account/user-data';
import { ROUTES } from '@/src/lib/data/config/constants';
import { ArrowLeft } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export const metadata = generatePageMetadata('/account/library/new');

export default async function NewCollectionPage() {
  const { user } = await getAuthenticatedUser({ context: 'NewCollectionPage' });

  if (!user) {
    logger.warn('NewCollectionPage: unauthenticated access attempt');
    redirect('/login');
  }

  const bookmarks = await getUserBookmarksForCollections(user.id);
  if (!bookmarks) {
    logger.warn('NewCollectionPage: getUserBookmarksForCollections returned null', {
      userId: user.id,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={ROUTES.ACCOUNT_LIBRARY}>
          <Button variant="ghost" className="mb-4 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
        </Link>
        <h1 className="mb-2 font-bold text-3xl">Create Collection</h1>
        <p className="text-muted-foreground">Organize your bookmarks into a custom collection</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CollectionForm
            bookmarks={(bookmarks || []).map((b) => ({ ...b, notes: b.notes ?? '' }))}
            mode="create"
          />
        </CardContent>
      </Card>
    </div>
  );
}
