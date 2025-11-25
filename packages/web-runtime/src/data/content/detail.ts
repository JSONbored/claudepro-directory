'use server';

import type { Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { generateContentTags } from '../content-helpers.ts';
import { normalizeError } from '../../errors.ts';
import { fetchCached } from '../../cache/fetch-cached.ts';
import { ContentService } from '@heyclaude/data-layer';
import { logger } from '../../logger.ts';
import { generateRequestId } from '../../utils/request-context.ts';

const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

function isValidContentCategory(
  value: string
): value is Database['public']['Enums']['content_category'] {
  return (
    typeof value === 'string' &&
    CONTENT_CATEGORY_VALUES.includes(value as Database['public']['Enums']['content_category'])
  );
}

export type ContentDetailData = Database['public']['Functions']['get_content_detail_complete']['Returns'];

export async function getContentDetailComplete(input: {
  category: string;
  slug: string;
}): Promise<Database['public']['Functions']['get_content_detail_complete']['Returns'] | null> {
  const { category, slug } = input;

  if (!isValidContentCategory(category)) {
    const normalized = normalizeError('Invalid category', 'Invalid category in getContentDetailComplete');
    logger.error('Invalid category in getContentDetailComplete', normalized, {
      requestId: generateRequestId(),
      operation: 'getContentDetailComplete',
      category,
      slug,
    });
    return null;
  }

  try {
    return await fetchCached(
      (client) => new ContentService(client).getContentDetailComplete({ p_category: category, p_slug: slug }),
      {
        keyParts: ['content', category, slug, 'complete'],
        tags: generateContentTags(category, slug),
        ttlKey: 'cache.content_detail.ttl_seconds',
        fallback: null,
        logMeta: { category, slug },
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load content detail');
    logger.error('getContentDetailComplete failed', normalized, {
      requestId: generateRequestId(),
      operation: 'getContentDetailComplete',
      category,
      slug,
    });
    throw normalized;
  }
}

export async function getContentDetailCore(input: {
  category: string;
  slug: string;
}): Promise<Database['public']['Functions']['get_content_detail_core']['Returns'] | null> {
  const { category, slug } = input;

  if (!isValidContentCategory(category)) {
    const normalized = normalizeError('Invalid category', 'Invalid category in getContentDetailCore');
    logger.error('Invalid category in getContentDetailCore', normalized, {
      requestId: generateRequestId(),
      operation: 'getContentDetailCore',
      category,
      slug,
    });
    return null;
  }

  try {
    return await fetchCached(
      (client) => new ContentService(client).getContentDetailCore({ p_category: category, p_slug: slug }),
      {
        keyParts: ['content', category, slug, 'core'],
        tags: generateContentTags(category, slug),
        ttlKey: 'cache.content_detail.ttl_seconds',
        fallback: null,
        logMeta: { category, slug, type: 'core' },
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'getContentDetailCore failed');
    logger.error('getContentDetailCore failed', normalized, {
      requestId: generateRequestId(),
      operation: 'getContentDetailCore',
      category,
      slug,
    });
    return null;
  }
}

export async function getContentAnalytics(input: {
  category: string;
  slug: string;
}): Promise<Database['public']['Functions']['get_content_analytics']['Returns'] | null> {
  const { category, slug } = input;

  if (!isValidContentCategory(category)) {
    const normalized = normalizeError('Invalid category', 'Invalid category in getContentAnalytics');
    logger.error('Invalid category in getContentAnalytics', normalized, {
      requestId: generateRequestId(),
      operation: 'getContentAnalytics',
      category,
      slug,
    });
    return null;
  }

  try {
    return await fetchCached(
      (client) => new ContentService(client).getContentAnalytics({ p_category: category, p_slug: slug }),
      {
        keyParts: ['content', category, slug, 'analytics'],
        tags: generateContentTags(category, slug),
        ttlKey: 'cache.content_detail.ttl_seconds',
        fallback: null,
        logMeta: { category, slug, type: 'analytics' },
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load content analytics');
    logger.error('getContentAnalytics failed', normalized, {
      requestId: generateRequestId(),
      operation: 'getContentAnalytics',
      category,
      slug,
    });
    throw normalized;
  }
}
