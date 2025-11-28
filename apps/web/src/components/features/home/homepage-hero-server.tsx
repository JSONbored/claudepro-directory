import dynamicImport from 'next/dynamic';
import { NumberTicker } from '@heyclaude/web-runtime/ui';
import { ParticlesBackground } from '@heyclaude/web-runtime/ui';

const RollingText = dynamicImport(
  () => import('@heyclaude/web-runtime/ui').then((mod) => ({ default: mod.RollingText })),
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
        <div className={'mx-auto max-w-3xl text-center'}>
          <h1 className="mb-4 font-bold text-3xl leading-tight tracking-tight sm:mb-6 sm:text-4xl sm:leading-tight lg:text-5xl lg:leading-tight">
            <span className="block">The ultimate directory for Claude</span>
            <RollingText
              words={['enthusiasts', 'developers', 'power users', 'beginners', 'builders']}
              duration={3000}
              className="block text-accent"
            />
          </h1>

          <p className="mx-auto max-w-2xl text-muted-foreground text-base leading-relaxed sm:text-lg lg:text-xl">
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
