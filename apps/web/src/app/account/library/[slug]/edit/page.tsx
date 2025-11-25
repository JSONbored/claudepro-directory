import { hashUserId, logger, normalizeError } from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getCollectionDetail,
} from '@heyclaude/web-runtime/data';
import { ArrowLeft } from '@heyclaude/web-runtime/icons';
import { generateRequestId } from '@heyclaude/web-runtime/utils/request-context';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CollectionForm } from '@/src/components/core/forms/collection-form';
import { Button } from '@/src/components/primitives/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';

/**
 * Dynamic Rendering Required
 * Authenticated route
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    logger.warn('EditCollectionPage: unauthenticated access attempt', undefined, {
      requestId: generateRequestId(),
      operation: 'EditCollectionPage',
      route: `/account/library/${slug}/edit`,
      slug,
    });
    redirect('/login');
  }

  const userIdHash = hashUserId(user.id);

  let collectionData: Awaited<ReturnType<typeof getCollectionDetail>> = null;
  try {
    collectionData = await getCollectionDetail(user.id, slug);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load collection detail for edit page');
    logger.error('EditCollectionPage: getCollectionDetail threw', normalized, {
      requestId: generateRequestId(),
      operation: 'EditCollectionPage',
      route: `/account/library/${slug}/edit`,
      slug,
      userIdHash,
    });
    throw normalized;
  }

  if (!collectionData) {
    logger.warn('EditCollectionPage: collection not found or inaccessible', undefined, {
      requestId: generateRequestId(),
      operation: 'EditCollectionPage',
      route: `/account/library/${slug}/edit`,
      slug,
      userIdHash,
    });
    notFound();
  }

  const { collection, bookmarks } = collectionData;

  if (!collection) {
    logger.warn('EditCollectionPage: collection is null in response', undefined, {
      requestId: generateRequestId(),
      operation: 'EditCollectionPage',
      route: `/account/library/${slug}/edit`,
      slug,
      userIdHash,
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
