/**
 * Job email configuration
 * Config-based approach for job lifecycle emails
 */

import type React from 'npm:react@18.3.1';
import type { FC } from 'npm:react@18.3.1';
import { JobApproved } from '@heyclaude/edge-runtime/utils/email/templates/job-approved.tsx';
import { JobExpired } from '@heyclaude/edge-runtime/utils/email/templates/job-expired.tsx';
import { JobExpiring } from '@heyclaude/edge-runtime/utils/email/templates/job-expiring.tsx';
import { JobPaymentConfirmed } from '@heyclaude/edge-runtime/utils/email/templates/job-payment-confirmed.tsx';
import { JobRejected } from '@heyclaude/edge-runtime/utils/email/templates/job-rejected.tsx';
import { JobSubmitted } from '@heyclaude/edge-runtime/utils/email/templates/job-submitted.tsx';

export interface JobEmailConfig<TProps = Record<string, unknown>> {
  template: FC<TProps> | ((props: TProps) => React.ReactElement);
  buildSubject: (data: Record<string, unknown>) => string;
  buildProps: (data: Record<string, unknown>) => TProps;
}

// biome-ignore lint/suspicious/noExplicitAny: Generic config requires any for component prop types
export const JOB_EMAIL_CONFIGS: Record<string, JobEmailConfig<any>> = {
  'job-submitted': {
    template: JobSubmitted,
    buildSubject: (data) => `Job Submitted: ${data['jobTitle'] as string}`,
    buildProps: (data) => ({
      jobTitle: data['jobTitle'],
      company: data['company'],
      userEmail: data['userEmail'],
      jobId: data['jobId'],
    }),
  },
  'job-approved': {
    template: JobApproved,
    buildSubject: (data) => `Job Approved: ${data['jobTitle'] as string}`,
    buildProps: (data) => ({
      jobTitle: data['jobTitle'],
      company: data['company'],
      userEmail: data['userEmail'],
      jobId: data['jobId'],
      plan: data['plan'],
      paymentAmount: data['paymentAmount'],
      paymentUrl: data['paymentUrl'],
    }),
  },
  'job-rejected': {
    template: JobRejected,
    buildSubject: (data) =>
      `Action Required: Update Your Job Posting - ${data['jobTitle'] as string}`,
    buildProps: (data) => ({
      jobTitle: data['jobTitle'],
      company: data['company'],
      userEmail: data['userEmail'],
      jobId: data['jobId'],
      rejectionReason: data['rejectionReason'],
    }),
  },
  'job-expiring': {
    template: JobExpiring,
    buildSubject: (data) =>
      `Expiring Soon: ${data['jobTitle'] as string} (${data['daysRemaining'] as number} days remaining)`,
    buildProps: (data) => ({
      jobTitle: data['jobTitle'],
      company: data['company'],
      userEmail: data['userEmail'],
      jobId: data['jobId'],
      expiresAt: data['expiresAt'],
      daysRemaining: data['daysRemaining'],
      renewalUrl: data['renewalUrl'],
    }),
  },
  'job-expired': {
    template: JobExpired,
    buildSubject: (data) => `Job Listing Expired: ${data['jobTitle'] as string}`,
    buildProps: (data) => ({
      jobTitle: data['jobTitle'],
      company: data['company'],
      userEmail: data['userEmail'],
      jobId: data['jobId'],
      expiredAt: data['expiredAt'],
      viewCount: data['viewCount'],
      clickCount: data['clickCount'],
      repostUrl: data['repostUrl'],
    }),
  },
  'job-payment-confirmed': {
    template: JobPaymentConfirmed,
    buildSubject: (data) => `Your Job is Live: ${data['jobTitle'] as string}`,
    buildProps: (data) => ({
      jobTitle: data['jobTitle'],
      company: data['company'],
      userEmail: data['userEmail'],
      jobId: data['jobId'],
      jobSlug: data['jobSlug'],
      plan: data['plan'],
      paymentAmount: data['paymentAmount'],
      paymentDate: data['paymentDate'],
      expiresAt: data['expiresAt'],
    }),
  },
};
