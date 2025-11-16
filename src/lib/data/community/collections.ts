'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type {
  CollectionDetailData,
  GetGetUserCollectionDetailReturn,
} from '@/src/types/database-overrides';

export type { CollectionDetailData };

export async function getPublicCollectionDetail(input: {
  userSlug: string;
  collectionSlug: string;
  viewerId?: string;
}): Promise<CollectionDetailData | null> {
  const { userSlug, collectionSlug, viewerId } = input;

  try {
    const data = await fetchCachedRpc<
      'get_user_collection_detail',
      GetGetUserCollectionDetailReturn
    >(
      {
        p_user_slug: userSlug,
        p_collection_slug: collectionSlug,
        ...(viewerId ? { p_viewer_id: viewerId } : {}),
      },
      {
        rpcName: 'get_user_collection_detail',
        tags: ['collections', `collection-${collectionSlug}`, `user-${userSlug}`],
        ttlKey: 'cache.content_list.ttl_seconds',
        keySuffix: viewerId
          ? `${userSlug}-${collectionSlug}-viewer-${viewerId}`
          : `${userSlug}-${collectionSlug}`,
        useAuthClient: true,
        fallback: null,
        logMeta: {
          slug: userSlug,
          collectionSlug,
          hasViewer: Boolean(viewerId),
        },
      }
    );

    if (!data) {
      logger.warn('getPublicCollectionDetail: RPC returned null', {
        slug: userSlug,
        collectionSlug,
        ...(viewerId ? { viewerId } : {}),
      });
      return null;
    }

    return data;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user collection detail');
    logger.error('getPublicCollectionDetail failed', normalized, {
      slug: userSlug,
      collectionSlug,
      ...(viewerId ? { viewerId } : {}),
    });
    throw normalized;
  }
}
