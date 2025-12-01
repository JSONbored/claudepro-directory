import {
  generatePageMetadata,
  getAuthenticatedUser,
  getCollectionDetail,
} from '@heyclaude/web-runtime/data';
import { spaceY, muted, marginBottom, iconSize, weight , size , cluster } from '@heyclaude/web-runtime/design-system';
import { ArrowLeft } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { Button, Card, CardContent, CardHeader, CardTitle  } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
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
  const { slug } = await params;
  
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'EditCollectionPage',
    route: `/account/library/${slug}/edit`,
    module: 'apps/web/src/app/account/library/[slug]/edit',
  });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'EditCollectionPage' });

  if (!user) {
    reqLogger.warn('EditCollectionPage: unauthenticated access attempt', {
      section: 'authentication',
    });
    redirect('/login');
  }

  // Create new child logger with user context
  // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
  const userLogger = reqLogger.child({
    userId: user.id, // Redaction will automatically hash this
  });

  userLogger.info('EditCollectionPage: authentication successful', {
    section: 'authentication',
  });

  // Section: Collection Data Fetch
  let collectionData: Awaited<ReturnType<typeof getCollectionDetail>> = null;
  try {
    collectionData = await getCollectionDetail(user.id, slug);
    userLogger.info('EditCollectionPage: collection data loaded', {
      section: 'collection-data-fetch',
      hasData: !!collectionData,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load collection detail for edit page');
    // Wrapper API: error(message, error, context) - wrapper internally calls Pino with (logData, message)
    userLogger.error('EditCollectionPage: getCollectionDetail threw', normalized, {
      section: 'collection-data-fetch',
    });
    throw normalized;
  }

  if (!collectionData) {
    userLogger.warn('EditCollectionPage: collection not found or inaccessible', {
      section: 'collection-data-fetch',
    });
    notFound();
  }

  const { collection, bookmarks } = collectionData;

  if (!collection) {
    userLogger.warn('EditCollectionPage: collection is null in response', {
      section: 'collection-data-fetch',
    });
    notFound();
  }

  // Final summary log
  userLogger.info('EditCollectionPage: page render completed', {
    section: 'page-render',
  });

  return (
    <div className={spaceY.relaxed}>
      <div>
        <Link href={`/account/library/${slug}`}>
          <Button variant="ghost" className={`${marginBottom.default} ${cluster.compact}`}>
            <ArrowLeft className={iconSize.sm} />
            Back to Collection
          </Button>
        </Link>
        <h1 className={`${marginBottom.tight} ${weight.bold} ${size['3xl']}`}>Edit Collection</h1>
        <p className={muted.default}>Update your collection details and settings</p>
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
