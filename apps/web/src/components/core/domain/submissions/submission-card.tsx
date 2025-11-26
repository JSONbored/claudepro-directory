import { Constants, type Database } from '@heyclaude/database-types';
import { logger } from '@heyclaude/web-runtime/core';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import type { ReactElement } from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
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
        <div className={'mb-4 flex flex-wrap gap-4 text-muted-foreground text-sm'}>
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
          <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3">
            <p className={'mb-1 font-medium text-red-400 text-sm'}>Rejection Reason:</p>
            <p className={'text-muted-foreground text-sm'}>{submission.rejection_reason}</p>
          </div>
        )}

        {status === Constants.public.Enums.submission_status[4] && ( // 'merged'
          <div className="mb-4 rounded border border-green-500/20 bg-green-500/10 p-3">
            <p className={'font-medium text-green-400 text-sm'}>
              🎉 Your contribution is now live on ClaudePro Directory!
            </p>
          </div>
        )}

        <div className={UI_CLASSES.FLEX_GAP_2}>
          {prLinkProps && <PrLinkButton href={prLinkProps.href} />}
          {contentLinkProps && <ContentLinkButton href={contentLinkProps.href} />}
        </div>
      </CardContent>
    </Card>
  );
}
