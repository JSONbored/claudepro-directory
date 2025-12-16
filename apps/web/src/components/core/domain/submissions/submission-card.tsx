import { SubmissionStatus } from '@heyclaude/data-layer/prisma';
import type { submission_status, submission_type } from '@heyclaude/data-layer/prisma';
import type { UserDashboardSubmission } from '@heyclaude/database-types/postgres-types';
import { logger } from '@heyclaude/web-runtime/logging/server';
import {
  UnifiedBadge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type ReactElement } from 'react';

import { ContentLinkButton, PrLinkButton } from './submission-link-buttons';
import { between, cluster, marginTop, marginBottom, gap, padding } from "@heyclaude/web-runtime/design-system";

type UserSubmission = UserDashboardSubmission;

interface SubmissionCardProps {
  formatSubmissionDate: (dateString: string) => string;
  getContentLinkProps: (
    type: submission_type,
    slug: string,
    status: submission_status
  ) => null | { href: string };
  getPrLinkProps: (submission: UserSubmission) => null | { href: string };
  getStatusBadge: (status: submission_status) => ReactElement;
  getTypeLabel: (type: submission_type) => string;
  index: number;
  isValidSubmissionStatus: (
    status: unknown
  ) => status is submission_status;
  isValidSubmissionType: (type: unknown) => type is submission_type;
  submission: UserSubmission;
  VALID_SUBMISSION_STATUSES: submission_status[];
  VALID_SUBMISSION_TYPES: submission_type[];
}

/**
 * Renders a card summarizing a user's submission with status, type, timestamps, alerts, and action links.
 *
 * Validates submission fields and logs warnings for missing or invalid status, content type, or slug.
 *
 * @param props.submission - The submission record to display.
 * @param props.index - Fallback numeric index used for keys and IDs when `submission.id` is absent.
 * @param props.getStatusBadge - Returns a badge element for a valid submission status.
 * @param props.getTypeLabel - Returns the display label for a valid submission content type.
 * @param props.formatSubmissionDate - Formats an ISO date string for display.
 * @param props.getPrLinkProps - Computes optional PR link props for the submission; return `null` when no PR link should be shown.
 * @param props.getContentLinkProps - Computes optional content link props for a (type, slug, status) triplet; return `null` when no content link should be shown.
 * @param props.isValidSubmissionStatus - Type guard validating a submission status value.
 * @param props.isValidSubmissionType - Type guard validating a submission content type value.
 * @param props.VALID_SUBMISSION_STATUSES - Array of allowed submission status enum values (used only for logging context).
 * @param props.VALID_SUBMISSION_TYPES - Array of allowed submission content type enum values (used only for logging context).
 * @returns The rendered submission card element.
 *
 * @see PrLinkButton
 * @see ContentLinkButton
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
  let status: submission_status | null = null;
  if (submission.status) {
    if (isValidSubmissionStatus(submission.status)) {
      status = submission.status;
    } else {
      logger.warn({ 
        submissionId,
        invalidStatus: submission.status,
        validStatuses: VALID_SUBMISSION_STATUSES,
        error: `Invalid status: ${submission.status}`,
        },
        'SubmissionsPage: Invalid submission status'
      );
    }
  } else {
    logger.warn({ submissionId }, 'SubmissionsPage: Missing submission status');
  }

  // Validate content_type - log warning if missing or invalid
  let type: submission_type | null = null;
  if (submission.content_type) {
    if (isValidSubmissionType(submission.content_type)) {
      type = submission.content_type;
    } else {
      logger.warn({ 
        submissionId,
        invalidContentType: submission.content_type,
        validContentTypes: VALID_SUBMISSION_TYPES,
        error: `Invalid content_type: ${submission.content_type}`,
        },
        'SubmissionsPage: Invalid submission content_type'
      );
    }
  } else {
    logger.warn({ submissionId }, 'SubmissionsPage: Missing submission content_type');
  }

  // Validate content_slug - log warning if missing
  const contentSlug = submission.content_slug;
  if (!contentSlug) {
    logger.warn({ submissionId }, 'SubmissionsPage: Missing submission content_slug');
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
                  className="text-muted-foreground text-xs"
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
                  className="text-muted-foreground text-xs"
                >
                  Type: Unknown
                </UnifiedBadge>
              )}
            </div>
            <CardTitle className={`${marginTop.compact}`}>{submission.content_name ?? 'Untitled'}</CardTitle>
            <CardDescription className={`${marginTop.tight}`}>
              Slug: <code className="text-xs">{submission.content_slug ?? 'N/A'}</code>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className={`text-muted-foreground ${marginBottom.default} flex flex-wrap ${gap.default} text-sm`}>
          <div>
            Submitted {submission.created_at ? formatSubmissionDate(submission.created_at) : 'N/A'}
          </div>
          {submission.merged_at ? (
            <>
              <span>•</span>
              <div>Merged {formatSubmissionDate(submission.merged_at)}</div>
            </>
          ) : null}
          {submission.pr_number ? (
            <>
              <span>•</span>
              <div>PR #{submission.pr_number}</div>
            </>
          ) : null}
        </div>

        {status === SubmissionStatus.rejected && submission.rejection_reason ? (
          <div className={`${marginBottom.default} rounded border border-red-500/20 bg-red-500/10 ${padding.compact}`}>
            <p className={`${marginBottom.tight} text-sm font-medium text-red-400`}>Rejection Reason:</p>
            <p className="text-muted-foreground text-sm">{submission.rejection_reason}</p>
          </div>
        ) : null}

        {status === SubmissionStatus.merged && ( // 'merged'
          <div className={`${marginBottom.default} rounded border border-green-500/20 bg-green-500/10 ${padding.compact}`}>
            <p className="text-sm font-medium text-green-400">
              🎉 Your contribution is now live on ClaudePro Directory!
            </p>
          </div>
        )}

        <div className={`flex ${gap.tight}`}>
          {prLinkProps ? <PrLinkButton href={prLinkProps.href} /> : null}
          {contentLinkProps ? <ContentLinkButton href={contentLinkProps.href} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}