/**
 * Submit Page - Database-First Community Submissions
 * All stats/recent/contributors from data layer with edge caching.
 */

import { Constants, type Database } from '@heyclaude/database-types';
import {
  generatePageMetadata,
  getContentTemplates,
  getSubmissionDashboard,
  getSubmissionFormFields,
} from '@heyclaude/web-runtime/data';
import { TrendingUp } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  cn,
  UI_CLASSES,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import dynamicImport from 'next/dynamic';

import { JobsPromo } from '@/src/components/core/domain/jobs/jobs-banner';
import { SubmitFormClient } from '@/src/components/core/forms/content-submission-form';
import { SidebarActivityCard } from '@/src/components/core/forms/sidebar-activity-card';
import { SubmitPageHero } from '@/src/components/core/forms/submit-page-hero';

const NewsletterCTAVariant = dynamicImport(
  () =>
    import('@/src/components/features/growth/newsletter/newsletter-cta-variants').then(
      (module_) => ({
        default: module_.NewsletterCTAVariant,
      })
    ),
  {
    loading: () => <div className="bg-muted/20 h-32 animate-pulse rounded-lg" />,
  }
);

// Use enum values from Constants
const DEFAULT_CONTENT_CATEGORY = Constants.public.Enums.content_category[0]; // 'agents'

/**
 * Dynamic Rendering Required
 *
 * This page uses dynamic rendering for server-side data fetching and user-specific content.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const revalidate = 86_400;

const SUBMISSION_TIPS = [
  'Be specific in your descriptions - help users understand what your config does',
  'Add examples in your prompts - they make configs more useful',
  'Test thoroughly before submitting - we review for quality',
  'Use clear names - avoid abbreviations and jargon',
  'Tag appropriately - tags help users discover your work',
];

const TYPE_LABELS: Record<Database['public']['Enums']['submission_type'], string> = {
  agents: 'Agent',
  mcp: 'MCP',
  rules: 'Rule',
  commands: 'Command',
  hooks: 'Hook',
  statuslines: 'Statusline',
  skills: 'Skill',
};

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604_800) return `${Math.floor(seconds / 86_400)}d ago`;
  return `${Math.floor(seconds / 604_800)}w ago`;
}

/**
 * Type guard: Check if a value is a valid content_category
 * Uses only generated types from @heyclaude/database-types
 */
function isValidContentCategory(
  value: string
): value is Database['public']['Enums']['content_category'] {
  return Constants.public.Enums.content_category.includes(
    value as Database['public']['Enums']['content_category']
  );
}

/**
 * Map submission_type to content_category with runtime validation
 * Uses only generated types from @heyclaude/database-types
 * Validates that the submission_type value is a valid content_category at runtime
 */
function mapSubmissionTypeToContentCategory(
  submissionType: Database['public']['Enums']['submission_type'] | null
): Database['public']['Enums']['content_category'] {
  if (submissionType === null) {
    return DEFAULT_CONTENT_CATEGORY; // Safe default
  }

  // Runtime validation: submission_type values are a subset of content_category
  // Use type guard to ensure type safety without assertions
  if (isValidContentCategory(submissionType)) {
    return submissionType; // TypeScript now knows this is content_category
  }

  // Fallback if somehow an invalid value gets through (should never happen)
  // Note: This is a module-level utility function, so it can't access component-level bindings
  // Log with minimal context (utility functions don't need full request context)
  logger.warn('mapSubmissionTypeToContentCategory: invalid submission_type', {
    module: 'apps/web/src/app/submit',
    operation: 'mapSubmissionTypeToContentCategory',
    submissionType,
  });
  return DEFAULT_CONTENT_CATEGORY;
}

/**
 * Type guard that verifies an unknown value has the shape of a recent merged submission.
 *
 * @param submission - Value to check for the required recent-submission fields
 * @returns `true` if `submission` has non-null `id`, `content_name`, `content_type`, and `merged_at` properties (and therefore can be treated as a recent merged submission), `false` otherwise.
 *
 * @see mapSubmissionTypeToContentCategory
 * @see formatTimeAgo
 * @see SidebarActivityCard
 */
function isValidRecentSubmission(submission: unknown): submission is {
  content_name: string;
  content_type: Database['public']['Enums']['submission_type'];
  id: string;
  merged_at: string;
  user?: null | { name: string; slug: string };
} {
  return (
    submission !== null &&
    typeof submission === 'object' &&
    'id' in submission &&
    submission.id !== null &&
    'content_name' in submission &&
    submission.content_name !== null &&
    'content_type' in submission &&
    submission.content_type !== null &&
    'merged_at' in submission &&
    submission.merged_at !== null
  );
}

/**
 * Produce the page metadata for the Submit page.
 *
 * Generates the Metadata object used by Next.js for the /submit route, applying the site's standard metadata defaults for content pages.
 *
 * @returns The Metadata object for the Submit page
 *
 * @see generatePageMetadata
 * @see import('next').Metadata
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/submit');
}

/**
 * Edge-cached data: Dashboard data fetched from edge-cached data layer
 */
/**
 * Render the community submission page including the submission form, metrics dashboard, content templates, and a sidebar with recent activity and tips.
 *
 * This server component fetches data per-request: submission dashboard stats & recent submissions, submission form configuration, and content templates for supported categories. It performs runtime validation on category mappings and logs failures; template fetch failures for individual categories fall back to empty arrays so the page can still render. The page is edge-cached and uses the file-level `revalidate` for ISR.
 *
 * @returns The page's JSX element containing the hero, submission form, community stats, recent activity, and newsletter CTA.
 *
 * @see getSubmissionDashboard
 * @see getSubmissionFormFields
 * @see getContentTemplates
 * @see SubmitFormClient
 * @see SubmitPageHero
 * @see SidebarActivityCard
 */

export default async function SubmitPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'SubmitPage',
    route: '/submit',
    module: 'apps/web/src/app/submit',
  });

  // Section: Submission Dashboard
  let dashboardData: Awaited<ReturnType<typeof getSubmissionDashboard>> = null;
  try {
    dashboardData = await getSubmissionDashboard(5, 5);
    reqLogger.info('SubmitPage: submission dashboard loaded', {
      section: 'submission-dashboard',
      recentCount: 5,
      statsCount: 5,
      hasData: !!dashboardData,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load submission dashboard');
    reqLogger.error('SubmitPage: getSubmissionDashboard failed', normalized, {
      section: 'submission-dashboard',
      recentCount: 5,
      statsCount: 5,
    });
    // Continue with null dashboardData - page will render with fallback empty data
  }

  if (!dashboardData) {
    reqLogger.warn('SubmitPage: getSubmissionDashboard returned no data', {
      section: 'submission-dashboard',
      recentCount: 5,
      statsCount: 5,
    });
  }

  // Section: Form Configuration
  let formConfig: Awaited<ReturnType<typeof getSubmissionFormFields>> | null = null;
  try {
    formConfig = await getSubmissionFormFields();
    reqLogger.info('SubmitPage: form configuration loaded', {
      section: 'form-config',
      hasConfig: Boolean(formConfig),
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load submission form config');
    reqLogger.error('SubmitPage: getSubmissionFormFields failed', normalized, {
      section: 'form-config',
    });
    throw normalized;
  }

  // Fetch templates for all supported submission types
  // submission_type enum values are a subset of content_category enum values
  // Map each element and validate using type guard to ensure type safety
  const supportedCategories: Database['public']['Enums']['content_category'][] =
    Constants.public.Enums.submission_type
      .map((type): string => {
        // Runtime validation: all submission_type values are valid content_category values
        if (isValidContentCategory(type)) {
          return type;
        }
        // This should never happen, but TypeScript requires handling the case
        reqLogger.warn('SubmitPage: invalid submission_type found', {
          type,
        });
        return DEFAULT_CONTENT_CATEGORY;
      })
      .filter((category): category is Database['public']['Enums']['content_category'] =>
        isValidContentCategory(category)
      );
  // Section: Content Templates
  let templates: Awaited<ReturnType<typeof getContentTemplates>> = [];
  try {
    const templatePromises = supportedCategories.map((category) =>
      getContentTemplates(category).catch((error) => {
        const normalized = normalizeError(error, `Failed to load templates for ${category}`);
        reqLogger.error('SubmitPage: getContentTemplates failed for category', normalized, {
          section: 'content-templates',
          category,
        });
        return []; // Return empty array on error for this category
      })
    );
    const templateResults = await Promise.all(templatePromises);
    templates = templateResults.flat();
    reqLogger.info('SubmitPage: content templates loaded', {
      section: 'content-templates',
      templatesCount: templates.length,
      categoriesCount: supportedCategories.length,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load submission templates');
    reqLogger.error('SubmitPage: getContentTemplates failed', normalized, {
      section: 'content-templates',
    });
    // Continue with empty templates array - page will render without templates
  }

  if (templates.length === 0) {
    reqLogger.warn('SubmitPage: no templates returned from getContentTemplates', {
      supportedCategoriesCount: supportedCategories.length,
      categories: supportedCategories,
    });
  }

  const stats = {
    total: dashboardData?.stats?.total ?? 0,
    pending: dashboardData?.stats?.pending ?? 0,
    merged_this_week: dashboardData?.stats?.merged_this_week ?? 0,
  };
  const recentMerged = (dashboardData?.recent ?? [])
    .filter((submission) => isValidRecentSubmission(submission))
    .map((submission) => {
      // Type guard ensures these are non-null, but TypeScript needs explicit checks
      const id = submission.id;
      const mergedAt = submission.merged_at;
      const contentName = submission.content_name;
      if (!id || !mergedAt || !contentName) {
        // This should never happen due to type guard, but TypeScript needs this check
        throw new Error('Invalid submission data');
      }
      return {
        id,
        content_name: contentName,
        content_type: mapSubmissionTypeToContentCategory(submission.content_type),
        merged_at: mergedAt,
        merged_at_formatted: formatTimeAgo(mergedAt),
        user:
          submission.user?.name && submission.user.slug
            ? { name: submission.user.name, slug: submission.user.slug }
            : null,
      };
    });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:py-12">
      {/* Hero Header with animations */}
      <SubmitPageHero stats={stats} />

      <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr] lg:gap-8">
        <div className="w-full min-w-0">
          <SubmitFormClient formConfig={formConfig} templates={templates} />
        </div>

        <aside className="w-full space-y-4 sm:space-y-6 lg:sticky lg:top-24 lg:h-fit">
          {/* Job Promo Card - Priority #1 */}
          <JobsPromo />

          {/* Stats Card - 3-column grid */}
          <Card>
            <CardHeader>
              <CardTitle className={cn(UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2, 'text-sm font-medium')}>
                <TrendingUp className={UI_CLASSES.ICON_SM} />
                Community Stats
              </CardTitle>
            </CardHeader>
            <CardContent className={UI_CLASSES.GRID_COLS_3_GAP_2}>
              {/* Total */}
              <div className={cn('rounded-lg p-3 text-center', 'bg-blue-500/10')}>
                <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
                <div className={UI_CLASSES.TEXT_XS_MUTED}>Total</div>
              </div>

              {/* Pending */}
              <div className={cn('rounded-lg p-3 text-center', 'bg-yellow-500/10')}>
                <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
                <div className={UI_CLASSES.TEXT_XS_MUTED}>Pending</div>
              </div>

              {/* This Week */}
              <div className={cn('rounded-lg p-3 text-center', 'bg-green-500/10')}>
                <div className="text-2xl font-bold text-green-400">{stats.merged_this_week}</div>
                <div className={UI_CLASSES.TEXT_XS_MUTED}>This Week</div>
              </div>
            </CardContent>
          </Card>

          {/* Combined Recent + Tips Tabbed Card */}
          <SidebarActivityCard
            recentMerged={recentMerged}
            tips={SUBMISSION_TIPS}
            typeLabels={Object.fromEntries(
              Object.entries(TYPE_LABELS).map(([key, value]) => [
                mapSubmissionTypeToContentCategory(
                  key as Database['public']['Enums']['submission_type']
                ),
                value,
              ])
            )}
          />
        </aside>
      </div>

      {/* Email CTA - Footer section (matching homepage pattern) */}
      <section className="container mx-auto px-4 py-12">
        <NewsletterCTAVariant source="content_page" variant="hero" />
      </section>
    </div>
  );
}