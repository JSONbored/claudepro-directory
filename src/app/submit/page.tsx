import { RecentSubmissionsCard } from '@/src/components/submit/sidebar/recent-submissions-card';
import { SubmitStatsCard } from '@/src/components/submit/sidebar/submit-stats-card';
import { TipsCard } from '@/src/components/submit/sidebar/tips-card';
import { TopContributorsCard } from '@/src/components/submit/sidebar/top-contributors-card';
import { SubmitFormClient } from '@/src/components/submit/submit-form-client';
import {
  getRecentMerged,
  getSubmissionStats,
  getTopContributors,
} from '@/src/lib/actions/submission-stats-actions';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// SEO Metadata - SHA-2961
export const metadata = await generatePageMetadata('/submit');

/**
 * Submit Page - Server Component
 * Fetches sidebar data in parallel on server for performance
 *
 * RESPONSIVE DESIGN:
 * - Desktop (≥1024px): Two-column layout (form + sticky sidebar)
 * - Tablet (768-1023px): Single column, sidebar below form
 * - Mobile (<768px): Single column, sidebar below form, optimized spacing
 *
 * PERFORMANCE:
 * - Server-side data fetching (parallel queries)
 * - Edge caching (5-10 min TTL)
 * - Minimal client-side JavaScript
 */
export default async function SubmitPage() {
  // Fetch sidebar data in parallel (cached for 5-10 min)
  const [statsResult, recentResult, contributorsResult] = await Promise.all([
    getSubmissionStats({}),
    getRecentMerged({ limit: 5 }),
    getTopContributors({ limit: 5 }),
  ]);

  const stats = statsResult?.data || { total: 0, pending: 0, mergedThisWeek: 0 };
  const recentMerged = recentResult?.data || [];
  const topContributors = contributorsResult?.data || [];

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl">
      {/* Header - Responsive text sizes */}
      <div className={`${UI_CLASSES.TEXT_CENTER} mb-6 sm:mb-8 lg:mb-12`}>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
          Submit Your Configuration
        </h1>
        <p
          className={`text-base sm:text-lg ${UI_CLASSES.TEXT_MUTED_FOREGROUND} max-w-3xl mx-auto px-2 sm:px-4`}
        >
          Share your Claude configurations with the community - no JSON formatting required!
        </p>
      </div>

      {/* Two-column layout: Form + Sidebar */}
      {/* 
        BREAKPOINTS:
        - Mobile (<1024px): Single column, form first, sidebar second
        - Desktop (≥1024px): Two columns, form left (flexible), sidebar right (380px fixed), sticky sidebar
      */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN: Form (appears first on all screen sizes) */}
        <div className="w-full min-w-0">
          <SubmitFormClient />
        </div>

        {/* RIGHT COLUMN: Sidebar */}
        {/* 
          RESPONSIVE BEHAVIOR:
          - Mobile/Tablet: Appears below form, full width
          - Desktop: Sticky sidebar at top-24, fixed width 380px
        */}
        <aside className="w-full space-y-4 sm:space-y-6 lg:sticky lg:top-24 lg:h-fit">
          <SubmitStatsCard stats={stats} />
          <RecentSubmissionsCard submissions={recentMerged} />
          <TopContributorsCard contributors={topContributors} />
          <TipsCard />
        </aside>
      </div>
    </div>
  );
}
