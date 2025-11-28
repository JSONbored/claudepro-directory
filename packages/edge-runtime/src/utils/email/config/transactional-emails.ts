/**
 * Transactional email configuration
 * Config-based approach for transactional emails
 */

import type * as React from 'npm:react@18.3.1';
import type { FC } from 'npm:react@18.3.1';
import { CollectionShared } from '@heyclaude/edge-runtime/utils/email/templates/collection-shared.tsx';
import { JobPosted } from '@heyclaude/edge-runtime/utils/email/templates/job-posted.tsx';
import { COMMUNITY_FROM, JOBS_FROM } from '@heyclaude/edge-runtime/utils/email/templates/manifest.ts';

export interface TransactionalEmailConfig<TProps = Record<string, unknown>> {
  template: FC<TProps> | ((props: TProps) => React.ReactElement);
  buildSubject: (data: Record<string, unknown>) => string;
  buildProps: (data: Record<string, unknown>, email: string) => TProps;
  from: string;
  validateData: (data: Record<string, unknown>) => {
    valid: boolean;
    error?: string;
  };
}

// biome-ignore lint/suspicious/noExplicitAny: Generic config requires any for component prop types
export const TRANSACTIONAL_EMAIL_CONFIGS: Record<string, TransactionalEmailConfig<any>> = {
  'job-posted': {
    template: JobPosted,
    buildSubject: (data) => `Your job posting "${data['jobTitle'] as string}" is now live!`,
    buildProps: (data, email) => ({
      jobTitle: data['jobTitle'],
      company: data['company'],
      userEmail: email,
      jobSlug: data['jobSlug'],
    }),
    from: JOBS_FROM,
    validateData: (data) => {
      if (!(data?.['jobTitle'] && data?.['company'] && data?.['jobSlug'])) {
        return { valid: false, error: 'Missing required job data' };
      }
      return { valid: true };
    },
  },
  'collection-shared': {
    template: CollectionShared,
    buildSubject: (data) => `${data['senderName'] as string} shared a collection with you`,
    buildProps: (data, email) => ({
      collectionName: data['collectionName'],
      collectionDescription: data['collectionDescription'] || undefined,
      senderName: data['senderName'],
      recipientEmail: email,
      collectionSlug: data['collectionSlug'],
      senderSlug: data['senderSlug'],
      itemCount: data['itemCount'],
    }),
    from: COMMUNITY_FROM,
    validateData: (data) => {
      if (
        !(
          data?.['collectionName'] &&
          data?.['senderName'] &&
          data?.['collectionSlug'] &&
          data?.['senderSlug'] &&
          data?.['itemCount']
        )
      ) {
        return { valid: false, error: 'Missing required collection data' };
      }
      return { valid: true };
    },
  },
};
