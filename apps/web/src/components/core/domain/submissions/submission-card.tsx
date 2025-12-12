import { Constants, type Database } from '@heyclaude/database-types';
import { logger } from '@heyclaude/web-runtime/logging/server';
import {
  UI_CLASSES,
  UnifiedBadge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type ReactElement } from 'react';

import { ContentLinkButton, PrLinkButton } from './submission-link-buttons';

type UserSubmission = NonNullable<
  Database['public']['Functions']['get_user_dashboard']['Returns']['submissions']
>[number];

interface SubmissionCardProps {
  formatSubmissionDate: (dateString: string) => string;
  getContentLinkProps: (
    type: Database['public']['Enums']['submission_type'],
    slug: string,
    status: Database['public']['Enums']['submission_status']
  ) => null | { href: string };
  getPrLinkProps: (submission: UserSubmission) => null | { href: string };
  getStatusBadge: (status: Database['public']['Enums']['submission_status']) => ReactElement;
  getTypeLabel: (type: Database['public']['Enums']['submission_type']) => string;
  index: number;
  isValidSubmissionStatus: (
    status: unknown
  ) => status is Database['public']['Enums']['submission_status'];
  isValidSubmissionType: (type: unknown) => type is Database['public']['Enums']['submission_type'];
  submission: UserSubmission;
  VALID_SUBMISSION_STATUSES: Database['public']['Enums']['submission_status'][];
  VALID_SUBMISSION_TYPES: Database['public']['Enums']['submission_type'][];
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
  let status: Database['public']['Enums']['submission_status'] | null = null;
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
  let type: Database['public']['Enums']['submission_type'] | null = null;
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
        <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
          <div className="flex-1">
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
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
            <CardTitle className="mt-2">{submission.content_name ?? 'Untitled'}</CardTitle>
            <CardDescription className="mt-1">
              Slug: <code className="text-xs">{submission.content_slug ?? 'N/A'}</code>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-muted-foreground mb-4 flex flex-wrap gap-4 text-sm">
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

        {status === Constants.public.Enums.submission_status[2] && submission.rejection_reason ? (
          <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3">
            <p className="mb-1 text-sm font-medium text-red-400">Rejection Reason:</p>
            <p className="text-muted-foreground text-sm">{submission.rejection_reason}</p>
          </div>
        ) : null}

        {status === Constants.public.Enums.submission_status[4] && ( // 'merged'
          <div className="mb-4 rounded border border-green-500/20 bg-green-500/10 p-3">
            <p className="text-sm font-medium text-green-400">
              🎉 Your contribution is now live on ClaudePro Directory!
            </p>
          </div>
        )}

        <div className={UI_CLASSES.FLEX_GAP_2}>
          {prLinkProps ? <PrLinkButton href={prLinkProps.href} /> : null}
          {contentLinkProps ? <ContentLinkButton href={contentLinkProps.href} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}