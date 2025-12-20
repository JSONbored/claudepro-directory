// CRITICAL FIX: Remove dynamic import to prevent layout shift
// Import directly to ensure hero loads immediately without CLS
import { HomepageHeroClient } from '@/src/components/features/home/homepage-hero-client';

/**
 * Homepage Hero Server Component
 *
 * OPTIMIZATION: Fetches stats data for hero section
 * This component streams the hero section immediately, improving TTFB
 *
 * The member count and stats are passed as props from the parent page component
 * which can fetch them separately or use default values
 *
 * NOTE: Hero animations are handled in client component for interactivity
 */
export async function HomepageHeroServer({
  memberCount,
  stats,
}: {
  memberCount: number;
  stats?: Record<string, { featured: number; total: number } | number>;
}) {
  return (
    <HomepageHeroClient memberCount={memberCount} {...(stats !== undefined ? { stats } : {})} />
  );
}
