import { Constants, type Database } from '@heyclaude/database-types';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserDashboard,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  between,
  flexDir,
  flexGrow,
  gap,
  grid,
  iconLeading,
  iconSize,
  alignItems,
  marginBottom,
  marginTop,
  maxWidth,
  muted,
  padding,
  paddingTop,
  size,
  spaceY,
  submissionBadge,
  textColor,
  weight,
  display,
  marginRight,
  textAlign,
  borderColor,
  bgColor,
} from '@heyclaude/web-runtime/design-system';
import { CheckCircle, Clock, GitPullRequest, type IconComponent, Send, XCircle } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  UnifiedBadge,
} from '@heyclaude/web-runtime/ui';
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
// Owner: GitHub usernames are 1-39 chars, alphanumeric + hyphens only (no underscores, cannot end with hyphen)
const OWNER_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
// Repo: 1-100 chars, alphanumeric + underscores + dots + hyphens (cannot be "." or "..", cannot end with ".git")
const REPO_REGEX = /^(?!\.\.?$)(?!.*\.git$)[\w.-]{1,100}$/;
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
  for (const char of url) {
    const code = char.codePointAt(0);
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

/**
 * Checks whether a string is one of the allowed `submission_type` enum values.
 *
 * @param type - The string to validate as a submission type
 * @returns `true` if `type` is one of the allowed `submission_type` values, `false` otherwise.
 * @see ALLOWED_TYPES
 */
function isSafeType(type: string): type is Database['public']['Enums']['submission_type'] {
  return (ALLOWED_TYPES as readonly string[]).includes(type);
}

/**
 * Constructs a canonical content path for a submission when the submission type and slug are valid.
 *
 * Validates the submission `type` and `slug` using runtime helpers and returns the path `/type/slug` only if both are accepted.
 *
 * @param type - A value from the `submission_type` enum; must be one of the allowed submission types.
 * @param slug - A content slug consisting of lowercase letters, digits, hyphens, or underscores (no dots, separators, or encoded characters).
 * @returns The path string `/type/slug` if `type` and `slug` are valid, `null` otherwise.
 *
 * @see isSafeType
 * @see isValidSlug
 */
function getSafeContentUrl(
  type: Database['public']['Enums']['submission_type'],
  slug: string
): null | string {
  if (!(isSafeType(type) && isValidSlug(slug))) {
    return null;
  }
  return `/${type}/${slug}`;
}

/**
 * Server-rendered page that displays the current user's "My Submissions" dashboard.
 *
 * Fetches the authenticated user and the user's dashboard submissions on the server; when unauthenticated it renders a sign-in prompt, and when the dashboard fetch fails it renders a short error message. For each submission it validates enums, constructs safe PR and content links, logs data-integrity issues, and renders SubmissionCard components or an empty-state with a CTA.
 *
 * @returns The React element tree for the submissions page.
 *
 * @see getAuthenticatedUser - resolves the current authenticated user on the server
 * @see getUserDashboard - fetches the user's dashboard and submissions
 * @see SubmissionCard - presentation component used to render individual submissions
 */
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
      <div className={spaceY.relaxed}>
        <Card>
          <CardHeader>
            <CardTitle className={`${size['2xl']}`}>Sign in required</CardTitle>
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
      <div className={spaceY.relaxed}>
        <div className={textColor.destructive}>Failed to load submissions. Please try again later.</div>
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
   * Check whether a value is a valid submission type.
   *
   * @param type - The value to test for membership in the `submission_type` enum
   * @returns `true` if `type` is one of the allowed `submission_type` enum values, `false` otherwise.
   *
   * @see ALLOWED_TYPES
   */
  function isValidSubmissionType(
    type: unknown
  ): type is Database['public']['Enums']['submission_type'] {
    if (typeof type !== 'string') return false;
    return (ALLOWED_TYPES as readonly string[]).includes(type);
  }

  // Use string literals for enum values in Record keys (safer than array indices)
  const SUBMISSION_STATUS_VARIANTS: Record<
    Database['public']['Enums']['submission_status'],
    { icon: IconComponent; label: string }
  > = {
    pending: { icon: Clock as IconComponent, label: 'Pending Review' },
    approved: { icon: CheckCircle as IconComponent, label: 'Approved' },
    merged: { icon: CheckCircle as IconComponent, label: 'Merged ✓' },
    rejected: { icon: XCircle as IconComponent, label: 'Rejected' },
    spam: { icon: XCircle as IconComponent, label: 'Spam' },
  };

  const getStatusBadge = (status: Database['public']['Enums']['submission_status']) => {
    const variant = SUBMISSION_STATUS_VARIANTS[status];
    const Icon = variant.icon;
    const colorClass = submissionBadge[status];

    return (
      <UnifiedBadge variant="base" style="outline" className={colorClass}>
        <Icon className={iconLeading.xs} />
        {variant.label}
      </UnifiedBadge>
    );
  };

  const getTypeLabel = (type: Database['public']['Enums']['submission_type']): string => {
    // Use string literals for enum values in Record keys (safer than array indices)
    const labels: Record<Database['public']['Enums']['submission_type'], string> = {
      agents: 'Claude Agent',
      mcp: 'MCP Server',
      rules: 'Claude Rule',
      commands: 'Command',
      hooks: 'Hook',
      statuslines: 'Statusline',
      skills: 'Skill',
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
   * Return a safe, canonical content URL for a merged submission, or null when unavailable.
   *
   * @param type - Submission content type (one of the allowed `submission_type` values)
   * @param slug - Content slug; must be a lowercase, URL-safe identifier
   * @param status - Submission status; only `'merged'` produces a link
   * @returns An object with `href` set to the safe content path when `type`/`slug` are valid and `status` is `'merged'`, or `null` otherwise.
   * @see getSafeContentUrl
   */
  function getContentLinkProperties(
    type: Database['public']['Enums']['submission_type'],
    slug: string,
    status: Database['public']['Enums']['submission_status']
  ): null | { href: string } {
    if (status !== 'merged') return null;
    const safeUrl = getSafeContentUrl(type, slug);
    return safeUrl ? { href: safeUrl } : null;
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
    <div className={spaceY.relaxed}>
      <div className={between.center}>
        <div>
          <h1 className={`${marginBottom.tight} ${weight.bold} ${size['3xl']}`}>My Submissions</h1>
          <p className={muted.default}>
            {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.SUBMIT}>
            <Send className={`${marginRight.compact} ${iconSize.sm}`} />
            New Submission
          </Link>
        </Button>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className={`${display.flex} ${flexDir.col} ${alignItems.center} ${padding.ySection}`}>
            <Send className={`${marginBottom.default} ${iconSize['3xl']} ${muted.default}`} />
            <h3 className={`${marginBottom.tight} ${weight.semibold} ${size.xl}`}>No submissions yet</h3>
            <p className={`${marginBottom.default} ${maxWidth.md} ${textAlign.center} ${muted.default}`}>
              Share your Claude configurations with the community! Your contributions help everyone
              build better AI workflows.
            </p>
            <Button asChild>
              <Link href={ROUTES.SUBMIT}>
                <Send className={`${marginRight.compact} ${iconSize.sm}`} />
                Submit Your First Configuration
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={`${grid.base} ${gap.comfortable}`}>
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
                [...VALID_SUBMISSION_STATUSES] as Database['public']['Enums']['submission_status'][]
              }
              VALID_SUBMISSION_TYPES={ALLOWED_TYPES_ARRAY}
            />
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className={`${borderColor['blue/20']} ${bgColor['info/5']}`}>
        <CardContent className={paddingTop.relaxed}>
          <div className={`${display.flex} ${gap.default}`}>
            <GitPullRequest
              className={`${iconSize.md} ${textColor.blue} ${marginTop.micro} ${flexGrow.shrink0}`}
            />
            <div className={flexGrow['1']}>
              <p className={`${weight.medium} ${textColor.info400} ${size.sm}`}>How it works</p>
              <p className={`${marginTop.tight} ${muted.sm}`}>
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