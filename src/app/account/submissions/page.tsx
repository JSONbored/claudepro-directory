import type { Metadata } from 'next';
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
import type { Database } from '@/src/types/database.types';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/submissions');
}

/**
 * Extract and validate GitHub PR components from URL
 * Returns validated owner, repo, and PR number, or null if invalid
 * This allows us to reconstruct the URL from trusted components instead of using user input directly
 */
// Dangerous Unicode characters that could be used for attacks
// Using Set for O(1) lookup performance instead of O(n) array includes
const dangerousCharsSet = new Set([
  0x202e,
  0x202d,
  0x202c,
  0x202b,
  0x202a, // RTL override marks
  0x200e,
  0x200f, // Left-to-right/right-to-left marks
  0x2066,
  0x2067,
  0x2068,
  0x2069, // Directional isolates
]);

// Shared regex patterns for PR URL validation
// Owner: GitHub usernames are 1-39 chars, alphanumeric + hyphens only (no underscores)
const OWNER_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})?$/;
// Repo: 1-100 chars, alphanumeric + underscores + dots + hyphens
const REPO_REGEX = /^[\w.-]{1,100}$/;
const PR_NUMBER_REGEX = /^\d+$/;
// Full path pattern: /owner/repo/pull/number
const PR_PATH_REGEX = /^\/([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})?)\/([\w.-]{1,100})\/pull\/(\d+)$/;

function extractPrComponents(
  url: string | null | undefined
): { owner: string; repo: string; prNumber: string } | null {
  if (!url || typeof url !== 'string') return null;

  // Disallow control characters, invisible chars, and dangerous unicode
  for (let i = 0; i < url.length; i++) {
    const code = url.charCodeAt(i);
    if (
      (code >= 0x00 && code <= 0x1f) ||
      (code >= 0x7f && code <= 0x9f) ||
      dangerousCharsSet.has(code)
    ) {
      return null;
    }
  }

  try {
    const parsed = new URL(url);
    // Only allow HTTPS links to github.com
    if (parsed.protocol.toLowerCase() !== 'https:') return null;
    if (parsed.hostname.toLowerCase() !== 'github.com') return null;
    // Reject any query parameters or fragments
    if (parsed.search || parsed.hash) return null;
    // Reject if username/password present
    if (parsed.username || parsed.password) return null;
    // Strict pattern: /owner/repo/pull/number
    const pathMatch = parsed.pathname.match(PR_PATH_REGEX);
    if (!pathMatch || pathMatch.length < 4) return null;

    const owner = pathMatch[1];
    const repo = pathMatch[2];
    const prNumber = pathMatch[3];

    // Type guard: ensure all components are defined
    if (!(owner && repo && prNumber)) return null;

    return { owner, repo, prNumber };
  } catch {
    return null;
  }
}

/**
 * Construct a safe GitHub PR URL from validated components
 * This ensures we're using only trusted, validated data instead of user-controlled URLs
 * Uses URL constructor for canonicalization to prevent encoding-based attacks
 */
function buildSafePrUrl(owner: string, repo: string, prNumber: string): string {
  // Additional validation matching GitHub's rules using shared regex patterns
  if (!(OWNER_REGEX.test(owner) && REPO_REGEX.test(repo) && PR_NUMBER_REGEX.test(prNumber))) {
    return '#';
  }
  try {
    // Use URL constructor to get canonicalized, normalized URL
    // This prevents encoding-based attacks and ensures proper URL encoding
    const url = new URL(`https://github.com/${owner}/${repo}/pull/${prNumber}`);
    // Return the canonicalized href (guaranteed to be normalized and safe)
    return url.href;
  } catch {
    // If URL construction fails, return fallback
    return '#';
  }
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
function isSafeType(type: string): type is Database['public']['Enums']['submission_type'] {
  return ALLOWED_TYPES.includes(type as (typeof ALLOWED_TYPES)[number]);
}

// Safe URL constructor - validates both type and slug before constructing
function getSafeContentUrl(
  type: Database['public']['Enums']['submission_type'],
  slug: string
): string | null {
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

  let submissions: NonNullable<
    Database['public']['Functions']['get_user_dashboard']['Returns']['submissions']
  > = [];
  let hasError = false;
  try {
    const data = await getUserDashboard(user.id);
    if (data?.submissions) {
      submissions = data.submissions;
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
    Database['public']['Enums']['submission_status'],
    { icon: typeof Clock; label: string }
  > = {
    pending: { icon: Clock, label: 'Pending Review' },
    approved: { icon: CheckCircle, label: 'Approved' },
    merged: { icon: CheckCircle, label: 'Merged ✓' },
    rejected: { icon: XCircle, label: 'Rejected' },
    spam: { icon: XCircle, label: 'Spam' },
  };

  const getStatusBadge = (status: Database['public']['Enums']['submission_status']) => {
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

  const getTypeLabel = (type: Database['public']['Enums']['submission_type']) => {
    const labels: Partial<Record<Database['public']['Enums']['submission_type'], string>> = {
      agents: 'Claude Agent',
      mcp: 'MCP Server',
      rules: 'Claude Rule',
      commands: 'Command',
      hooks: 'Hook',
      statuslines: 'Statusline',
      skills: 'Skill',
    };
    return labels[type] ?? type;
  };

  /**
   * Format date consistently using en-US locale
   */
  function formatSubmissionDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Render PR link button helper
   */
  function PrLinkButton({ href }: { href: string }) {
    return (
      <Button variant="outline" size="sm" asChild={true}>
        <a href={href} target="_blank" rel="noopener noreferrer">
          <GitPullRequest className="mr-1 h-3 w-3" />
          View PR
          <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      </Button>
    );
  }

  /**
   * Render content link button helper
   */
  function ContentLinkButton({ href }: { href: string }) {
    return (
      <Button variant="outline" size="sm" asChild={true}>
        <Link href={href}>
          <ExternalLink className="mr-1 h-3 w-3" />
          View Live
        </Link>
      </Button>
    );
  }

  /**
   * Get safe PR link props or null if PR URL is invalid
   * Extracts and validates PR components, then constructs a safe URL
   */
  function getPrLinkProps(submission: (typeof submissions)[number]) {
    const components = submission.pr_url ? extractPrComponents(submission.pr_url) : null;
    const prNumber = submission.pr_number || components?.prNumber;

    if (!(components && prNumber)) return null;

    const safePrUrl = buildSafePrUrl(components.owner, components.repo, prNumber);
    return safePrUrl && safePrUrl !== '#' ? { href: safePrUrl } : null;
  }

  /**
   * Get safe content URL or null if invalid
   */
  function getContentLinkProps(
    type: Database['public']['Enums']['submission_type'],
    slug: string,
    status: Database['public']['Enums']['submission_status']
  ): { href: string } | null {
    const safeUrl = getSafeContentUrl(type, slug);
    return safeUrl && status === 'merged' ? { href: safeUrl } : null;
  }

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
          {submissions.map((submission, index) => {
            const status = (submission.status ??
              'pending') as Database['public']['Enums']['submission_status'];
            const type = (submission.content_type ??
              'commands') as Database['public']['Enums']['submission_type'];
            const prLinkProps = getPrLinkProps(submission);
            const contentLinkProps = getContentLinkProps(
              type,
              submission.content_slug ?? '',
              status
            );
            return (
              <Card key={submission.id ?? `submission-${index}`}>
                <CardHeader>
                  <div className={UI_CLASSES.FLEX_ITEMS_START_JUSTIFY_BETWEEN}>
                    <div className="flex-1">
                      <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                        {getStatusBadge(status)}
                        <UnifiedBadge variant="base" style="outline" className="text-xs">
                          {getTypeLabel(type)}
                        </UnifiedBadge>
                      </div>
                      <CardTitle className="mt-2">
                        {submission.content_name ?? 'Untitled'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Slug: <code className="text-xs">{submission.content_slug ?? 'N/A'}</code>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className={'mb-4 flex flex-wrap gap-4 text-muted-foreground text-sm'}>
                    <div>
                      Submitted{' '}
                      {formatSubmissionDate(submission.created_at ?? new Date().toISOString())}
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
                    {prLinkProps && <PrLinkButton href={prLinkProps.href} />}
                    {contentLinkProps && <ContentLinkButton href={contentLinkProps.href} />}
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
