import {
  createWebAppContextWithId,
  generateRequestId,
  hashUserId,
  logger,
  normalizeError,
  withDuration,
} from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getCollectionDetail,
} from '@heyclaude/web-runtime/data';
import { ArrowLeft } from '@heyclaude/web-runtime/icons';
import { Button, Card, CardContent, CardHeader, CardTitle  } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { CollectionForm } from '@/src/components/core/forms/collection-form';

/**
 * Dynamic Rendering Required
 * Authenticated route
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface EditCollectionPageProperties {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EditCollectionPageProperties): Promise<Metadata> {
  const { slug } = await params;
  return generatePageMetadata('/account/library/:slug/edit', { params: { slug } });
}

export default async function EditCollectionPage({ params }: EditCollectionPageProperties) {
  const startTime = Date.now();
  const { slug } = await params;

  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const baseLogContext = createWebAppContextWithId(
    requestId,
    `/account/library/${slug}/edit`,
    'EditCollectionPage',
    {
      slug,
    }
  );

  // Section: Authentication
  const authSectionStart = Date.now();
  const { user } = await getAuthenticatedUser({ context: 'EditCollectionPage' });

  if (!user) {
    logger.warn(
      'EditCollectionPage: unauthenticated access attempt',
      undefined,
      withDuration(
        {
          ...baseLogContext,
          section: 'authentication',
        },
        authSectionStart
      )
    );
    redirect('/login');
  }

  const userIdHash = hashUserId(user.id);
  const logContext = { ...baseLogContext, userIdHash };
  logger.info(
    'EditCollectionPage: authentication successful',
    withDuration(
      {
        ...logContext,
        section: 'authentication',
      },
      authSectionStart
    )
  );

  // Section: Collection Data Fetch
  const collectionSectionStart = Date.now();
  let collectionData: Awaited<ReturnType<typeof getCollectionDetail>> = null;
  try {
    collectionData = await getCollectionDetail(user.id, slug);
    logger.info(
      'EditCollectionPage: collection data loaded',
      withDuration(
        {
          ...logContext,
          section: 'collection-data-fetch',
          hasData: !!collectionData,
        },
        collectionSectionStart
      )
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load collection detail for edit page');
    logger.error(
      'EditCollectionPage: getCollectionDetail threw',
      normalized,
      withDuration(
        {
          ...logContext,
          section: 'collection-data-fetch',
          sectionDuration_ms: Date.now() - collectionSectionStart,
        },
        startTime
      )
    );
    throw normalized;
  }

  if (!collectionData) {
    logger.warn(
      'EditCollectionPage: collection not found or inaccessible',
      undefined,
      withDuration(
        {
          ...logContext,
          section: 'collection-data-fetch',
          sectionDuration_ms: Date.now() - collectionSectionStart,
        },
        startTime
      )
    );
    notFound();
  }

  const { collection, bookmarks } = collectionData;

  if (!collection) {
    logger.warn(
      'EditCollectionPage: collection is null in response',
      undefined,
      withDuration(
        {
          ...logContext,
          section: 'collection-data-fetch',
          sectionDuration_ms: Date.now() - collectionSectionStart,
        },
        startTime
      )
    );
    notFound();
  }

  // Final summary log
  logger.info(
    'EditCollectionPage: page render completed',
    withDuration(
      {
        ...logContext,
        section: 'page-render',
      },
      startTime
    )
  );

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
