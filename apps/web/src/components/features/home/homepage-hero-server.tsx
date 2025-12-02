import { borderBottom, marginBottom, marginTop, cluster, muted, weight, size, maxWidth, padding, zLayer,
  tracking,
  leading,
  justify,
  textColor,
  iconSize,
} from '@heyclaude/web-runtime/design-system';
import { Sparkles } from '@heyclaude/web-runtime/icons';
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
export async function HomepageHeroServer({
  memberCount,
  newThisWeekCount = 0,
}: {
  memberCount: number;
  newThisWeekCount?: number;
}) {
  return (
    <section className={`relative ${borderBottom.light}`} aria-label="Homepage hero">
      {/* Particles Background */}
      <ParticlesBackground />

      <div className={`container relative ${zLayer.raised} mx-auto ${padding.xDefault} ${padding.ySpacious} sm:py-16 lg:py-24`}>
        <div className={`mx-auto ${maxWidth['3xl']} text-center`}>
          <h1 className={`${marginBottom.default} ${weight.bold} ${size['3xl']} ${leading.tight} ${tracking.tight} sm:${marginBottom.comfortable} sm:${size['4xl']} sm:leading-tight lg:${size['5xl']} lg:leading-tight`}>
            <span className="block">The ultimate directory for Claude</span>
            <RollingText
              words={['enthusiasts', 'developers', 'power users', 'beginners', 'builders']}
              duration={3000}
              className={`block ${textColor.accent}`}
            />
          </h1>

          <p className={`mx-auto ${maxWidth['2xl']} ${muted.default} ${size.base} ${leading.relaxed} sm:${size.lg} lg:${size.xl}`}>
            Join{' '}
            <NumberTicker value={memberCount} className={`${weight.semibold} ${textColor.accent}`} suffix="+" />{' '}
            members discovering and sharing the best Claude configurations. Explore expert rules,
            powerful MCP servers, specialized agents, automation hooks, and connect with the
            community building the future of AI.
          </p>

          {/* New this week stat - subtle indicator */}
          {newThisWeekCount > 0 && (
            <p className={`${cluster.tight} mx-auto ${marginTop.default} ${justify.center} ${size.sm}`}>
              <Sparkles className={`${iconSize.xsPlus} ${textColor.amber}`} />
              <span className={`${weight.semibold} ${textColor.foreground}`}>{newThisWeekCount}</span>
              <span className={muted.sm}>new this week</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
