'use server';

import { ContentService } from '@heyclaude/data-layer';
import  { type Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';

import { fetchCached } from '../../cache/fetch-cached.ts';
import { normalizeError } from '../../errors.ts';
import { logger } from '../../logger.ts';
import { generateRequestId } from '../../utils/request-id.ts';
import { generateContentTags } from '../content-helpers.ts';

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
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getContentDetailComplete',
    module: 'data/content/detail',
  });

  if (!isValidContentCategory(category)) {
    const normalized = normalizeError('Invalid category', 'Invalid category in getContentDetailComplete');
    reqLogger.error('Invalid category in getContentDetailComplete', normalized, {
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
        ttlKey: 'content_detail',
        fallback: null,
        logMeta: { category, slug },
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load content detail');
    reqLogger.error('getContentDetailComplete failed', normalized, {
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
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getContentDetailCore',
    module: 'data/content/detail',
  });

  if (!isValidContentCategory(category)) {
    const normalized = normalizeError('Invalid category', 'Invalid category in getContentDetailCore');
    reqLogger.error('Invalid category in getContentDetailCore', normalized, {
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
        ttlKey: 'content_detail',
        fallback: null,
        logMeta: { category, slug, type: 'core' },
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'getContentDetailCore failed');
    reqLogger.error('getContentDetailCore failed', normalized, {
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
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getContentAnalytics',
    module: 'data/content/detail',
  });

  if (!isValidContentCategory(category)) {
    const normalized = normalizeError('Invalid category', 'Invalid category in getContentAnalytics');
    reqLogger.error('Invalid category in getContentAnalytics', normalized, {
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
        ttlKey: 'content_detail',
        fallback: null,
        logMeta: { category, slug, type: 'analytics' },
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load content analytics');
    reqLogger.error('getContentAnalytics failed', normalized, {
      category,
      slug,
    });
    throw normalized;
  }
}
