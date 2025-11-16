'use server';

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { GetUserProfileReturn } from '@/src/types/database-overrides';

export async function getPublicUserProfile(input: {
  slug: string;
  viewerId?: string;
}): Promise<GetUserProfileReturn | null> {
  const { slug, viewerId } = input;

  try {
    return await fetchCachedRpc<GetUserProfileReturn | null>(
      {
        p_user_slug: slug,
        ...(viewerId ? { p_viewer_id: viewerId } : {}),
      },
      {
        rpcName: 'get_user_profile',
        tags: ['users', `user-${slug}`],
        ttlKey: 'cache.user_profile.ttl_seconds',
        keySuffix: viewerId ? `${slug}-viewer-${viewerId}` : slug,
        useAuthClient: true,
        fallback: null,
        logMeta: { slug, hasViewer: Boolean(viewerId) },
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user profile detail');
    logger.error('getPublicUserProfile failed', normalized, {
      slug,
      ...(viewerId ? { viewerId } : {}),
    });
    throw normalized;
  }
}
