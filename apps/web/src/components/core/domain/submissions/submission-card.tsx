import { Constants, type Database } from '@heyclaude/database-types';
import { logger } from '@heyclaude/web-runtime/core';
import { between, cluster, marginBottom, marginTop, muted, weight ,size , padding , gap } from '@heyclaude/web-runtime/design-system';
import type { ReactElement } from 'react';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { ContentLinkButton, PrLinkButton } from './submission-link-buttons';

type UserSubmission = NonNullable<
  Database['public']['Functions']['get_user_dashboard']['Returns']['submissions']
>[number];

interface SubmissionCardProps {
  submission: UserSubmission;
  index: number;
  getStatusBadge: (status: Database['public']['Enums']['submission_status']) => ReactElement;
  getTypeLabel: (type: Database['public']['Enums']['submission_type']) => string;
  formatSubmissionDate: (dateString: string) => string;
  getPrLinkProps: (submission: UserSubmission) => { href: string } | null;
  getContentLinkProps: (
    type: Database['public']['Enums']['submission_type'],
    slug: string,
    status: Database['public']['Enums']['submission_status']
  ) => { href: string } | null;
  isValidSubmissionStatus: (
    status: unknown
  ) => status is Database['public']['Enums']['submission_status'];
  isValidSubmissionType: (type: unknown) => type is Database['public']['Enums']['submission_type'];
  VALID_SUBMISSION_STATUSES: Database['public']['Enums']['submission_status'][];
  VALID_SUBMISSION_TYPES: Database['public']['Enums']['submission_type'][];
}

/**
 * Render a card representing a user submission with status/type badges, metadata, alerts, and action links.
 *
 * Logs warnings when the submission's status, content_type, or content_slug are missing or invalid.
 *
 * @param submission - The submission record to display.
 * @param index - Fallback index used when `submission.id` is not present.
 * @param getStatusBadge - Function that returns a badge element for a validated submission status.
 * @param getTypeLabel - Function that returns a human-readable label for a validated submission type.
 * @param formatSubmissionDate - Function that formats ISO date strings for display.
 * @param getPrLinkProps - Function that derives PR link props from a submission.
 * @param getContentLinkProps - Function that derives content link props from a submission type, slug, and status.
 * @param isValidSubmissionStatus - Type guard that validates submission status values.
 * @param isValidSubmissionType - Type guard that validates submission content_type values.
 * @param VALID_SUBMISSION_STATUSES - Array of allowed submission status values used for validation and logging.
 * @param VALID_SUBMISSION_TYPES - Array of allowed submission type values used for validation and logging.
 * @returns The JSX element for the submission card.
 *
 * @see PrLinkButton
 * @see ContentLinkButton
 * @see UnifiedBadge
 */
export function SubmissionCard({
  submission,
  index,
  getStatusBadge,
  getTypeLabel,
  formatSubmissionDate,
  getPrLinkProps,
  getContentLinkProps,
  isValidSubmissionStatus,
  isValidSubmissionType,
  VALID_SUBMISSION_STATUSES,
  VALID_SUBMISSION_TYPES,
}: SubmissionCardProps) {
  const submissionId = submission.id ?? `submission-${index}`;

  // Validate status - log warning if missing or invalid
  let status: Database['public']['Enums']['submission_status'] | null = null;
  if (submission.status) {
    if (isValidSubmissionStatus(submission.status)) {
      status = submission.status;
    } else {
      logger.warn('SubmissionsPage: Invalid submission status', {
        submissionId,
        invalidStatus: submission.status,
        validStatuses: VALID_SUBMISSION_STATUSES,
        error: `Invalid status: ${submission.status}`,
      });
    }
  } else {
    logger.warn('SubmissionsPage: Missing submission status', undefined, {
      submissionId,
    });
  }

  // Validate content_type - log warning if missing or invalid
  let type: Database['public']['Enums']['submission_type'] | null = null;
  if (submission.content_type) {
    if (isValidSubmissionType(submission.content_type)) {
      type = submission.content_type;
    } else {
      logger.warn('SubmissionsPage: Invalid submission content_type', {
        submissionId,
        invalidContentType: submission.content_type,
        validContentTypes: VALID_SUBMISSION_TYPES,
        error: `Invalid content_type: ${submission.content_type}`,
      });
    }
  } else {
    logger.warn('SubmissionsPage: Missing submission content_type', undefined, {
      submissionId,
    });
  }

  // Validate content_slug - log warning if missing
  const contentSlug = submission.content_slug;
  if (!contentSlug) {
    logger.warn('SubmissionsPage: Missing submission content_slug', undefined, {
      submissionId,
    });
  }

  const prLinkProps = getPrLinkProps(submission);
  // Only call getContentLinkProps if type, slug, and status are all valid
  const contentLinkProps =
    type && contentSlug && status ? getContentLinkProps(type, contentSlug, status) : null;

  return (
    <Card key={submission.id ?? `submission-${index}`}>
      <CardHeader>
        <div className={between.start}>
          <div className="flex-1">
            <div className={cluster.compact}>
              {status ? (
                getStatusBadge(status)
              ) : (
                <UnifiedBadge
                  variant="base"
                  style="outline"
                  className={`${muted.default} ${size.xs}`}
                >
                  Status: Unknown
                </UnifiedBadge>
              )}
              {type ? (
                <UnifiedBadge variant="base" style="outline" className="text-xs">
                  {getTypeLabel(type)}
                </UnifiedBadge>
              ) : (
                <UnifiedBadge
                  variant="base"
                  style="outline"
                  className={`${muted.default} ${size.xs}`}
                >
                  Type: Unknown
                </UnifiedBadge>
              )}
            </div>
            <CardTitle className={marginTop.compact}>{submission.content_name ?? 'Untitled'}</CardTitle>
            <CardDescription className={marginTop.tight}>
              Slug: <code className="text-xs">{submission.content_slug ?? 'N/A'}</code>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className={`${marginBottom.default} flex flex-wrap ${gap.comfortable} ${muted.sm}`}>
          <div>
            Submitted {submission.created_at ? formatSubmissionDate(submission.created_at) : 'N/A'}
          </div>
          {submission.merged_at && (
            <>
              <span>•</span>
              <div>Merged {formatSubmissionDate(submission.merged_at)}</div>
            </>
          )}
          {submission.pr_number && (
            <>
              <span>•</span>
              <div>PR #{submission.pr_number}</div>
            </>
          )}
        </div>

        {status === Constants.public.Enums.submission_status[2] && submission.rejection_reason && ( // 'rejected'
          <div className={`${marginBottom.default} rounded border border-red-500/20 bg-red-500/10 ${padding.compact}`}>
            <p className={'mb-1 ${weight.medium} text-red-400 ${size.sm}'}>Rejection Reason:</p>
            <p className={muted.sm}>{submission.rejection_reason}</p>
          </div>
        )}

        {status === Constants.public.Enums.submission_status[4] && ( // 'merged'
          <div className={`${marginBottom.default} rounded border border-green-500/20 bg-green-500/10 ${padding.compact}`}>
            <p className={`${weight.medium} text-green-400 ${size.sm}`}>
              🎉 Your contribution is now live on ClaudePro Directory!
            </p>
          </div>
        )}

        <div className={cluster.compact}>
          {prLinkProps && <PrLinkButton href={prLinkProps.href} />}
          {contentLinkProps && <ContentLinkButton href={contentLinkProps.href} />}
        </div>
      </CardContent>
    </Card>
  );
}