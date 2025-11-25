import dynamicImport from 'next/dynamic';
import { NumberTicker } from '@/src/components/primitives/animation/number-ticker';
import { ParticlesBackground } from '@/src/components/primitives/animation/particles-background';

const RollingText = dynamicImport(
  () => import('@/src/components/primitives/animation/rolling-text').then((mod) => mod.RollingText),
  {
    loading: () => <span className="text-accent">enthusiasts</span>,
  }
);

/**
 * Homepage Hero Server Component
 *
 * OPTIMIZATION: No data fetching - renders immediately for streaming SSR
 * This component streams the hero section immediately, improving TTFB
 *
 * The member count is passed as a prop from the parent page component
 * which can fetch it separately or use a default value
 */
export async function HomepageHeroServer({ memberCount }: { memberCount: number }) {
  return (
    <section className={'relative border-border/50 border-b'} aria-label="Homepage hero">
      {/* Particles Background */}
      <ParticlesBackground />

      <div className={'container relative z-10 mx-auto px-4 py-10 sm:py-16 lg:py-24'}>
        <div className={'mx-auto max-w-4xl text-center'}>
          <h1 className="mb-4 font-bold text-4xl tracking-tight sm:mb-6 sm:text-5xl lg:text-7xl">
            <span>The ultimate directory for Claude</span>
            <br />
            <RollingText
              words={['enthusiasts', 'developers', 'power users', 'beginners', 'builders']}
              duration={3000}
              className="text-accent"
            />
          </h1>

          <p className="mx-auto max-w-3xl text-muted-foreground text-sm leading-relaxed sm:text-base lg:text-lg">
            Join{' '}
            <NumberTicker value={memberCount} className="font-semibold text-accent" suffix="+" />{' '}
            members discovering and sharing the best Claude configurations. Explore expert rules,
            powerful MCP servers, specialized agents, automation hooks, and connect with the
            community building the future of AI.
          </p>
        </div>
      </div>
    </section>
  );
}
