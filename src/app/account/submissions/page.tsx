import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { ROUTES } from '@/src/lib/constants';
import { getUserDashboard } from '@/src/lib/data/user-data';
import { CheckCircle, Clock, ExternalLink, GitPullRequest, Send, XCircle } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { BADGE_COLORS, type SubmissionStatusType, UI_CLASSES } from '@/src/lib/ui-constants';
import type { Tables } from '@/src/types/database.types';


export const metadata = generatePageMetadata('/account/submissions');

export default async function SubmissionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let submissions: Array<Tables<'submissions'>> = [];
  let hasError = false;

  if (user) {
    // User-scoped edge-cached RPC via centralized data layer
    const data = await getUserDashboard(user.id);
    if (!data) {
      logger.error('Failed to fetch user dashboard', new Error('Dashboard data is null'));
      hasError = true;
    } else {
      // Trust database types - PostgreSQL validates structure
      const result = data as { submissions: Array<Tables<'submissions'>> };
      submissions = result.submissions || [];
    }
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="text-destructive">Failed to load submissions. Please try again later.</div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { icon: Clock, label: 'Pending Review' },
      approved: { icon: CheckCircle, label: 'Approved' },
      merged: { icon: CheckCircle, label: 'Merged ✓' },
      rejected: { icon: XCircle, label: 'Rejected' },
    };

    const variant = variants[status as keyof typeof variants] || variants.pending;
    const Icon = variant.icon;
    const colorClass =
      BADGE_COLORS.submissionStatus[status as SubmissionStatusType] ||
      BADGE_COLORS.submissionStatus.pending;

    return (
      <UnifiedBadge variant="base" style="outline" className={colorClass}>
        <Icon className="mr-1 h-3 w-3" />
        {variant.label}
      </UnifiedBadge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      agents: 'Claude Agent',
      mcp: 'MCP Server',
      rules: 'Claude Rule',
      commands: 'Command',
      hooks: 'Hook',
      statuslines: 'Statusline',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
        <div>
          <h1 className="mb-2 font-bold text-3xl">My Submissions</h1>
          <p className="text-muted-foreground">
            {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.SUBMIT}>
            <Send className={`mr-2 ${UI_CLASSES.ICON_SM}`} />
            New Submission
          </Link>
        </Button>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className={'flex flex-col items-center py-12'}>
            <Send className={`mb-4 h-12 w-12 ${UI_CLASSES.ICON_NEUTRAL}`} />
            <h3 className="mb-2 font-semibold text-xl">No submissions yet</h3>
            <p className={'mb-4 max-w-md text-center text-muted-foreground'}>
              Share your Claude configurations with the community! Your contributions help everyone
              build better AI workflows.
            </p>
            <Button asChild>
              <Link href={ROUTES.SUBMIT}>
                <Send className={`mr-2 ${UI_CLASSES.ICON_SM}`} />
                Submit Your First Configuration
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
                  <div className="flex-1">
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                      {getStatusBadge(submission.status)}
                      <UnifiedBadge variant="base" style="outline" className="text-xs">
                        {getTypeLabel(submission.content_type)}
                      </UnifiedBadge>
                    </div>
                    <CardTitle className="mt-2">{submission.content_name}</CardTitle>
                    <CardDescription className="mt-1">
                      Slug: <code className="text-xs">{submission.content_slug}</code>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className={'mb-4 flex flex-wrap gap-4 text-muted-foreground text-sm'}>
                  <div>Submitted {new Date(submission.created_at).toLocaleDateString()}</div>
                  {submission.merged_at && (
                    <>
                      <span>•</span>
                      <div>Merged {new Date(submission.merged_at).toLocaleDateString()}</div>
                    </>
                  )}
                  {submission.pr_number && (
                    <>
                      <span>•</span>
                      <div>PR #{submission.pr_number}</div>
                    </>
                  )}
                </div>

                {submission.status === 'rejected' && submission.rejection_reason && (
                  <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3">
                    <p className={'mb-1 font-medium text-red-400 text-sm'}>Rejection Reason:</p>
                    <p className={'text-muted-foreground text-sm'}>{submission.rejection_reason}</p>
                  </div>
                )}

                {submission.status === 'merged' && (
                  <div className="mb-4 rounded border border-green-500/20 bg-green-500/10 p-3">
                    <p className={'font-medium text-green-400 text-sm'}>
                      🎉 Your contribution is now live on ClaudePro Directory!
                    </p>
                  </div>
                )}

                <div className={UI_CLASSES.FLEX_GAP_2}>
                  {submission.pr_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={submission.pr_url} target="_blank" rel="noopener noreferrer">
                        <GitPullRequest className="mr-1 h-3 w-3" />
                        View PR
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  )}

                  {submission.status === 'merged' && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/${submission.content_type}/${submission.content_slug}`}>
                        <ExternalLink className="mr-1 h-3 w-3" />
                        View Live
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <GitPullRequest
              className={`${UI_CLASSES.ICON_MD} ${UI_CLASSES.ICON_INFO} ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`}
            />
            <div className="flex-1">
              <p className={'font-medium text-blue-400 text-sm'}>How it works</p>
              <p className={'mt-1 text-muted-foreground text-sm'}>
                When you submit a configuration, we automatically create a Pull Request on GitHub.
                Our team reviews it for quality, security, and accuracy. Once approved and merged,
                your contribution goes live for everyone to use!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
