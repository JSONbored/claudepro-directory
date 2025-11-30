import { Constants, type Database } from '@heyclaude/database-types';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserDashboard,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { between, iconSize, submissionBadge  } from '@heyclaude/web-runtime/design-system';
import { CheckCircle, Clock, GitPullRequest, Send, XCircle } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { UnifiedBadge, Button ,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle  } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
import Link from 'next/link';

import { SubmissionCard } from '@/src/components/core/domain/submissions/submission-card';

/**
 * Dynamic Rendering Required
 * Authenticated user submissions
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
  0x20_2E,
  0x20_2D,
  0x20_2C,
  0x20_2B,
  0x20_2A, // RTL override marks
  0x20_0E,
  0x20_0F, // Left-to-right/right-to-left marks
  0x20_66,
  0x20_67,
  0x20_68,
  0x20_69, // Directional isolates
]);

// Shared regex patterns for PR URL validation
// Owner: GitHub usernames are 1-39 chars, alphanumeric + hyphens only (no underscores)
const OWNER_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})?$/;
// Repo: 1-100 chars, alphanumeric + underscores + dots + hyphens
const REPO_REGEX = /^[\w.-]{1,100}$/;
const PR_NUMBER_REGEX = /^\d+$/;
// Full path pattern: /owner/repo/pull/number
// Uses loose capture groups, then validates components separately to avoid duplication
const PR_PATH_REGEX = /^\/([^/]+)\/([^/]+)\/pull\/(\d+)$/;

/**
 * Format date consistently using en-US locale
 * Returns safe fallback for invalid or missing dates
 */
function formatSubmissionDate(dateString: string): string {
  if (!dateString || typeof dateString !== 'string') {
    return '-';
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function extractPrComponents(
  url: null | string | undefined
): null | { owner: string; prNumber: string; repo: string; } {
  if (!url || typeof url !== 'string') return null;

  // Disallow control characters, invisible chars, and dangerous unicode
  for (let index = 0; index < url.length; index++) {
    const code = url.codePointAt(index);
    if (
      code === undefined ||
      (code >= 0x0 && code <= 0x1F) ||
      (code >= 0x7F && code <= 0x9F) ||
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
    // Match path structure with loose capture groups, then validate components separately
    const pathMatch = parsed.pathname.match(PR_PATH_REGEX);
    if (!pathMatch || pathMatch.length < 4) return null;

    const [, owner, repo, prNumber] = pathMatch;

    // Validate owner and repo against their specific regex patterns
    if (!(owner && OWNER_REGEX.test(owner))) return null;
    if (!(repo && REPO_REGEX.test(repo))) return null;
    if (!(prNumber && PR_NUMBER_REGEX.test(prNumber))) return null;

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
// Use Constants from database types to ensure sync with database enum
const ALLOWED_TYPES = Constants.public.Enums.submission_type;

// Typed copy for use as submission_type array
const ALLOWED_TYPES_ARRAY: Database['public']['Enums']['submission_type'][] = [
  ...ALLOWED_TYPES,
];

// Strict content slug validation - only alphanumeric, hyphens, underscores
function isValidSlug(slug: string): boolean {
  if (typeof slug !== 'string') return false;
  // No path separators, no dots, no percent-encoding, no special chars
  return /^[a-z0-9-_]+$/.test(slug);
}

// Strict type validation - must be in allowlist
function isSafeType(type: string): type is Database['public']['Enums']['submission_type'] {
  return (ALLOWED_TYPES as readonly string[]).includes(type);
}

// Safe URL constructor - validates both type and slug before constructing
function getSafeContentUrl(
  type: Database['public']['Enums']['submission_type'],
  slug: string
): null | string {
  if (!(isSafeType(type) && isValidSlug(slug))) {
    return null;
  }
  return `/${type}/${slug}`;
}

export default async function SubmissionsPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'SubmissionsPage',
    route: '/account/submissions',
    module: 'apps/web/src/app/account/submissions',
  });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'SubmissionsPage' });

  if (!user) {
    reqLogger.warn('SubmissionsPage: unauthenticated access attempt', {
      section: 'authentication',
      timestamp: new Date().toISOString(),
    });
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to view and manage your submissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={ROUTES.LOGIN}>Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create new child logger with user context
  // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
  const userLogger = reqLogger.child({
    userId: user.id, // Redaction will automatically hash this
  });

  // Section: Submissions Data Fetch
  let submissions: NonNullable<
    Database['public']['Functions']['get_user_dashboard']['Returns']['submissions']
  > = [];
  let hasError = false;
  try {
    const data = await getUserDashboard(user.id);
    if (data?.submissions) {
      submissions = data.submissions;
    } else {
      userLogger.error(
        'SubmissionsPage: getUserDashboard returned null',
        new Error('getUserDashboard returned null'),
        {
          section: 'submissions-data-fetch',
        }
      );
      hasError = true;
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load submissions from dashboard');
    userLogger.error('SubmissionsPage: getUserDashboard threw', normalized, {
      section: 'submissions-data-fetch',
    });
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="text-destructive">Failed to load submissions. Please try again later.</div>
      </div>
    );
  }

  // Valid enum values for validation - use Constants from database types
  const VALID_SUBMISSION_STATUSES = Constants.public.Enums.submission_status;

  /**
   * Validate submission status against enum values
   */
  function isValidSubmissionStatus(
    status: unknown
  ): status is Database['public']['Enums']['submission_status'] {
    if (typeof status !== 'string') return false;
    return (VALID_SUBMISSION_STATUSES as readonly string[]).includes(status);
  }

  /**
   * Validate submission type against enum values
   */
  function isValidSubmissionType(
    type: unknown
  ): type is Database['public']['Enums']['submission_type'] {
    if (typeof type !== 'string') return false;
    return (ALLOWED_TYPES as readonly string[]).includes(type);
  }

  // Use Constants for enum values in Record keys
  const SUBMISSION_STATUS_VARIANTS: Record<
    Database['public']['Enums']['submission_status'],
    { icon: typeof Clock; label: string }
  > = {
    [Constants.public.Enums.submission_status[0]]: { icon: Clock, label: 'Pending Review' }, // 'pending'
    [Constants.public.Enums.submission_status[1]]: { icon: CheckCircle, label: 'Approved' }, // 'approved'
    [Constants.public.Enums.submission_status[4]]: { icon: CheckCircle, label: 'Merged ✓' }, // 'merged'
    [Constants.public.Enums.submission_status[2]]: { icon: XCircle, label: 'Rejected' }, // 'rejected'
    [Constants.public.Enums.submission_status[3]]: { icon: XCircle, label: 'Spam' }, // 'spam'
  };

  const getStatusBadge = (status: Database['public']['Enums']['submission_status']) => {
    const variant = SUBMISSION_STATUS_VARIANTS[status];
    const Icon = variant.icon;
    const colorClass = submissionBadge[status];

    return (
      <UnifiedBadge variant="base" style="outline" className={colorClass}>
        <Icon className="mr-1 h-3 w-3" />
        {variant.label}
      </UnifiedBadge>
    );
  };

  const getTypeLabel = (type: Database['public']['Enums']['submission_type']): string => {
    // Use Constants for enum values in Record keys
    const labels: Record<Database['public']['Enums']['submission_type'], string> = {
      [Constants.public.Enums.submission_type[0]]: 'Claude Agent', // 'agents'
      [Constants.public.Enums.submission_type[1]]: 'MCP Server', // 'mcp'
      [Constants.public.Enums.submission_type[2]]: 'Claude Rule', // 'rules'
      [Constants.public.Enums.submission_type[3]]: 'Command', // 'commands'
      [Constants.public.Enums.submission_type[4]]: 'Hook', // 'hooks'
      [Constants.public.Enums.submission_type[5]]: 'Statusline', // 'statuslines'
      [Constants.public.Enums.submission_type[6]]: 'Skill', // 'skills'
    };
    return labels[type];
  };

  /**
   * Get safe PR link props or null if PR URL is invalid
   * Extracts and validates PR components, then constructs a safe URL
   */
  function getPrLinkProperties(submission: (typeof submissions)[number]) {
    const components = submission.pr_url ? extractPrComponents(submission.pr_url) : null;

    // Bail early if components are invalid
    if (!components) return null;

    // Use DB field with fallback to extracted value
    const prNumber = submission.pr_number ?? components.prNumber;
    if (!prNumber) return null;

    const safePrUrl = buildSafePrUrl(components.owner, components.repo, prNumber);
    return safePrUrl && safePrUrl !== '#' ? { href: safePrUrl } : null;
  }

  /**
   * Get safe content URL or null if invalid
   */
  function getContentLinkProperties(
    type: Database['public']['Enums']['submission_type'],
    slug: string,
    status: Database['public']['Enums']['submission_status']
  ): null | { href: string } {
    const safeUrl = getSafeContentUrl(type, slug);
    return safeUrl && status === Constants.public.Enums.submission_status[4] ? { href: safeUrl } : null; // 'merged'
  }

  // Log any submissions with missing IDs for data integrity monitoring
  for (const [index, sub] of submissions.entries()) {
    if (!sub.id) {
      userLogger.warn('SubmissionsPage: submission missing ID', {
        index: index,
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className={between.center}>
        <div>
          <h1 className="mb-2 font-bold text-3xl">My Submissions</h1>
          <p className="text-muted-foreground">
            {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.SUBMIT}>
            <Send className={`mr-2 ${iconSize.sm}`} />
            New Submission
          </Link>
        </Button>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Send className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-xl">No submissions yet</h3>
            <p className="mb-4 max-w-md text-center text-muted-foreground">
              Share your Claude configurations with the community! Your contributions help everyone
              build better AI workflows.
            </p>
            <Button asChild>
              <Link href={ROUTES.SUBMIT}>
                <Send className={`mr-2 ${iconSize.sm}`} />
                Submit Your First Configuration
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {submissions.map((submission, index) => (
            <SubmissionCard
              key={submission.id ?? `submission-${index}`}
              submission={submission}
              index={index}
              getStatusBadge={getStatusBadge}
              getTypeLabel={getTypeLabel}
              formatSubmissionDate={formatSubmissionDate}
              getPrLinkProps={getPrLinkProperties}
              getContentLinkProps={getContentLinkProperties}
              isValidSubmissionStatus={isValidSubmissionStatus}
              isValidSubmissionType={isValidSubmissionType}
              VALID_SUBMISSION_STATUSES={
                VALID_SUBMISSION_STATUSES as unknown as Database['public']['Enums']['submission_status'][]
              }
              VALID_SUBMISSION_TYPES={ALLOWED_TYPES_ARRAY}
            />
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <GitPullRequest
              className={`${iconSize.md} text-blue-600 mt-0.5 shrink-0`}
            />
            <div className="flex-1">
              <p className="font-medium text-blue-400 text-sm">How it works</p>
              <p className="mt-1 text-muted-foreground text-sm">
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
