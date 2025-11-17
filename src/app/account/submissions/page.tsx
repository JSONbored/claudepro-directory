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
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { getUserDashboard } from '@/src/lib/data/account/user-data';
import { ROUTES } from '@/src/lib/data/config/constants';
import { CheckCircle, Clock, ExternalLink, GitPullRequest, Send, XCircle } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { BADGE_COLORS, UI_CLASSES } from '@/src/lib/ui-constants';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type {
  GetGetUserDashboardReturn,
  SubmissionStatus,
  SubmissionType,
} from '@/src/types/database-overrides';

export const metadata = generatePageMetadata('/account/submissions');

// Helper: strictly validate GitHub PR URLs to prevent XSS and redirect attacks
function isSafePrUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    // Only allow HTTPS links to github.com, with /pull/ in path (no fragments, query params, etc)
    if (parsed.protocol !== 'https:') return false;
    if (parsed.hostname !== 'github.com') return false;
    // Strict pattern: /owner/repo/pull/number (no trailing path, query, or fragment)
    if (!/^\/[^/]+\/[^/]+\/pull\/\d+$/.test(parsed.pathname)) return false;
    // Reject any query parameters or fragments
    if (parsed.search || parsed.hash) return false;
    return true;
  } catch {
    return false;
  }
}

// Sanitizer returns the safe URL or fallback
function sanitizePrUrl(url: string | null | undefined): string {
  if (isSafePrUrl(url) && url) {
    return url;
  }
  return '#';
}

// Allow-list of valid content types shown in URLs
const ALLOWED_TYPES = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'skills',
  'collections',
  'guides',
  'jobs',
] as const;

// Strict content slug validation - only alphanumeric, hyphens, underscores
function isValidSlug(slug: string): boolean {
  if (typeof slug !== 'string') return false;
  // No path separators, no dots, no percent-encoding, no special chars
  return /^[a-z0-9-_]+$/.test(slug);
}

// Strict type validation - must be in allowlist
function isSafeType(type: string): boolean {
  return ALLOWED_TYPES.includes(type as (typeof ALLOWED_TYPES)[number]);
}

// Safe URL constructor - validates both type and slug before constructing
function getSafeContentUrl(type: string, slug: string): string | null {
  if (!(isSafeType(type) && isValidSlug(slug))) {
    return null;
  }
  return `/${type}/${slug}`;
}

export default async function SubmissionsPage() {
  const { user } = await getAuthenticatedUser({ context: 'SubmissionsPage' });

  if (!user) {
    logger.warn('SubmissionsPage: unauthenticated access attempt');
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to view and manage your submissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild={true}>
              <Link href={ROUTES.LOGIN}>Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  let submissions: GetGetUserDashboardReturn['submissions'] = [];
  let hasError = false;
  try {
    const data = await getUserDashboard(user.id);
    if (data) {
      submissions = data.submissions ?? [];
    } else {
      logger.error('SubmissionsPage: getUserDashboard returned null', undefined, {
        userId: user.id,
      });
      hasError = true;
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load submissions from dashboard');
    logger.error('SubmissionsPage: getUserDashboard threw', normalized, { userId: user.id });
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="text-destructive">Failed to load submissions. Please try again later.</div>
      </div>
    );
  }

  const SUBMISSION_STATUS_VARIANTS: Record<
    SubmissionStatus,
    { icon: typeof Clock; label: string }
  > = {
    pending: { icon: Clock, label: 'Pending Review' },
    approved: { icon: CheckCircle, label: 'Approved' },
    merged: { icon: CheckCircle, label: 'Merged ✓' },
    rejected: { icon: XCircle, label: 'Rejected' },
    spam: { icon: XCircle, label: 'Spam' },
  };

  const getStatusBadge = (status: SubmissionStatus) => {
    const variant = SUBMISSION_STATUS_VARIANTS[status] || SUBMISSION_STATUS_VARIANTS.pending;
    const Icon = variant.icon;
    const colorClass =
      BADGE_COLORS.submissionStatus[status] || BADGE_COLORS.submissionStatus.pending;

    return (
      <UnifiedBadge variant="base" style="outline" className={colorClass}>
        <Icon className="mr-1 h-3 w-3" />
        {variant.label}
      </UnifiedBadge>
    );
  };

  const getTypeLabel = (type: SubmissionType) => {
    const labels: Record<SubmissionType, string> = {
      agents: 'Claude Agent',
      mcp: 'MCP Server',
      rules: 'Claude Rule',
      commands: 'Command',
      hooks: 'Hook',
      statuslines: 'Statusline',
      skills: 'Skill',
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
        <Button asChild={true}>
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
            <Button asChild={true}>
              <Link href={ROUTES.SUBMIT}>
                <Send className={`mr-2 ${UI_CLASSES.ICON_SM}`} />
                Submit Your First Configuration
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission) => {
            const status = submission.status;
            const type = submission.content_type;
            return (
              <Card key={submission.id}>
                <CardHeader>
                  <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
                    <div className="flex-1">
                      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                        {getStatusBadge(status)}
                        <UnifiedBadge variant="base" style="outline" className="text-xs">
                          {getTypeLabel(type)}
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

                  {status === 'rejected' && submission.rejection_reason && (
                    <div className="mb-4 rounded border border-red-500/20 bg-red-500/10 p-3">
                      <p className={'mb-1 font-medium text-red-400 text-sm'}>Rejection Reason:</p>
                      <p className={'text-muted-foreground text-sm'}>
                        {submission.rejection_reason}
                      </p>
                    </div>
                  )}

                  {status === 'merged' && (
                    <div className="mb-4 rounded border border-green-500/20 bg-green-500/10 p-3">
                      <p className={'font-medium text-green-400 text-sm'}>
                        🎉 Your contribution is now live on ClaudePro Directory!
                      </p>
                    </div>
                  )}

                  <div className={UI_CLASSES.FLEX_GAP_2}>
                    {isSafePrUrl(submission.pr_url) && submission.pr_url && (
                      <Button variant="outline" size="sm" asChild={true}>
                        <a
                          href={sanitizePrUrl(submission.pr_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <GitPullRequest className="mr-1 h-3 w-3" />
                          View PR
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    )}

                    {(() => {
                      const safeUrl = getSafeContentUrl(type, submission.content_slug);
                      return safeUrl && status === 'merged' ? (
                        <Button variant="outline" size="sm" asChild={true}>
                          <Link href={safeUrl}>
                            <ExternalLink className="mr-1 h-3 w-3" />
                            View Live
                          </Link>
                        </Button>
                      ) : null;
                    })()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
