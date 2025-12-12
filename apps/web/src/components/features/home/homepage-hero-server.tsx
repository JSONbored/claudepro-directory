import dynamicImport from 'next/dynamic';

const HomepageHeroClient = dynamicImport(
  () =>
    import('@/src/components/features/home/homepage-hero-client').then((mod) => ({
      default: mod.HomepageHeroClient,
    })),
  {
    loading: () => (
      <section className="border-border/50 relative border-b" aria-label="Homepage hero">
        <div className="relative z-10 container mx-auto px-4 py-10 sm:py-16 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-3xl leading-tight font-bold tracking-tight sm:mb-6 sm:text-4xl sm:leading-tight lg:text-5xl lg:leading-tight">
              <span className="block">The ultimate directory for Claude</span>
              <span className="text-accent block">enthusiasts</span>
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed sm:text-lg lg:text-xl">
              Join members discovering and sharing the best Claude configurations.
            </p>
          </div>
        </div>
      </section>
    ),
  }
);

/**
 * Homepage Hero Server Component
 *
 * OPTIMIZATION: Fetches stats data for hero section
 * This component streams the hero section immediately, improving TTFB
 *
 * The member count and stats are passed as props from the parent page component
 * which can fetch them separately or use default values
 *
 * NOTE: Morphing blob background is handled in client component for interactivity
 */
export async function HomepageHeroServer({ 
  memberCount,
  stats = {},
}: { 
  memberCount: number;
  stats?: Record<string, { featured: number; total: number } | number>;
}) {
  return <HomepageHeroClient memberCount={memberCount} stats={stats} />;
}
