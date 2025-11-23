import {
  generatePageMetadata,
  getAuthenticatedUser,
  getCollectionDetail,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime';
import { ArrowLeft } from '@heyclaude/web-runtime/icons';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CollectionForm } from '@/src/components/core/forms/collection-form';
import { Button } from '@/src/components/primitives/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';

interface EditCollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EditCollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  return generatePageMetadata('/account/library/:slug/edit', { params: { slug } });
}

export default async function EditCollectionPage({ params }: EditCollectionPageProps) {
  const { slug } = await params;
  const { user } = await getAuthenticatedUser({ context: 'EditCollectionPage' });

  if (!user) {
    logger.warn('EditCollectionPage: unauthenticated access attempt', { slug });
    redirect('/login');
  }

  let collectionData: Awaited<ReturnType<typeof getCollectionDetail>> = null;
  try {
    collectionData = await getCollectionDetail(user.id, slug);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load collection detail for edit page');
    logger.error('EditCollectionPage: getCollectionDetail threw', normalized, {
      slug,
      userId: user.id,
    });
    throw normalized;
  }

  if (!collectionData) {
    logger.warn('EditCollectionPage: collection not found or inaccessible', {
      slug,
      userId: user.id,
    });
    notFound();
  }

  const { collection, bookmarks } = collectionData;

  if (!collection) {
    logger.warn('EditCollectionPage: collection is null in response', {
      slug,
      userId: user.id,
    });
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/account/library/${slug}`}>
          <Button variant="ghost" className="mb-4 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Collection
          </Button>
        </Link>
        <h1 className="mb-2 font-bold text-3xl">Edit Collection</h1>
        <p className="text-muted-foreground">Update your collection details and settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CollectionForm
            bookmarks={(bookmarks ?? []).map((b) => ({ ...b, notes: b.notes ?? '' }))}
            mode="edit"
            collection={{ ...collection, description: collection.description ?? '' }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
