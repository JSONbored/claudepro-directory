/**
 * IndexNow Submission Inngest Function
 *
 * Submits URLs to IndexNow API for search engine indexing.
 * This function is triggered by the sitemap POST endpoint and handles
 * the external API call asynchronously, eliminating blocking from Vercel functions.
 *
 * Event: indexnow/submit
 * Data: { urlList: string[], host: string, key: string, keyLocation: string }
 */

import { inngest } from '../../client';
import { RETRY_CONFIGS } from '../../config';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { fetchWithRetryAndTimeout } from '@heyclaude/web-runtime/server';
import { TIMEOUT_PRESETS } from '@heyclaude/shared-runtime';

const INDEXNOW_API_URL = 'https://api.indexnow.org/IndexNow';

export const submitIndexNow = inngest.createFunction(
  {
    id: 'indexnow/submit',
    name: 'Submit URLs to IndexNow',
    retries: RETRY_CONFIGS.externalApi,
    timeouts: {
      finish: '30s', // 30 seconds (TIMEOUTS.EXTERNAL_API = 30000ms)
    },
  },
  { event: 'indexnow/submit' },
  async ({ event, step }) => {
    const { urlList, host, key, keyLocation } = event.data;

    if (!urlList || !Array.isArray(urlList) || urlList.length === 0) {
      logger.warn(
        {
          eventId: event.id,
          urlCount: urlList?.length ?? 0,
        },
        'IndexNow: Empty or invalid URL list'
      );
      return { success: false, submitted: 0, error: 'Empty or invalid URL list' };
    }

    if (!host || !key || !keyLocation) {
      logger.warn(
        {
          eventId: event.id,
          hasHost: !!host,
          hasKey: !!key,
          hasKeyLocation: !!keyLocation,
        },
        'IndexNow: Missing required parameters'
      );
      return { success: false, submitted: 0, error: 'Missing required parameters' };
    }

    return await step.run('submit-to-indexnow', async () => {
      try {
        const payload = {
          host,
          key,
          keyLocation,
          urlList: urlList.slice(0, 10_000), // IndexNow limit is 10,000 URLs
        };

        const { response } = await fetchWithRetryAndTimeout(
          {
            url: INDEXNOW_API_URL,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            retry: {
              attempts: 2,
              baseDelayMs: 1000,
              retryOn: [500, 502, 503, 504],
              noRetryOn: [400, 401, 403, 404],
            },
          },
          TIMEOUT_PRESETS.external
        );

        if (!response.ok) {
          const text = await response.text();
          logger.warn(
            {
              eventId: event.id,
              status: response.status,
              body: text,
              submitted: urlList.length,
            },
            'IndexNow: API request failed'
          );
          return {
            success: false,
            submitted: 0,
            error: 'IndexNow request failed',
            status: response.status,
            body: text,
          };
        }

        logger.info(
          {
            eventId: event.id,
            submitted: urlList.length,
            host,
          },
          'IndexNow: Submission successful'
        );

        return {
          success: true,
          submitted: urlList.length,
        };
      } catch (error) {
        const normalized = normalizeError(error, 'IndexNow submission failed');
        logger.error(
          {
            err: normalized,
            eventId: event.id,
            submitted: urlList.length,
          },
          'IndexNow: Submission error'
        );
        return {
          success: false,
          submitted: 0,
          error: normalized.message ?? 'IndexNow submission failed',
        };
      }
    });
  }
);
