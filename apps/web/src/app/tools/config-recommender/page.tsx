/**
 * Configuration Recommender Landing Page
 *
 * Interactive quiz that generates personalized Claude configuration recommendations.
 * Uses rule-based algorithm for instant, zero-cost recommendations.
 *
 * Features:
 * - 7-question quiz with progressive disclosure
 * - Real-time validation
 * - Mobile-optimized
 * - Accessible (WCAG 2.1 AA compliant)
 * - SEO-optimized
 *
 * Performance:
 * - Client-side quiz (zero server calls until submit)
 * - <100ms recommendation generation
 * - Serverless-friendly architecture
 */

import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import {
  cluster,
  marginBottom,
  marginTop,
  iconLeading,
  iconSize,
  muted,
  weight,
  size,
  gap,
  padding,
  radius,
  row,
  minHeight,
  maxWidth,
  bgColor,
  textColor,
  alignItems,
  justify,
  borderColor,
  flexWrap,
  overflow,
  flexGrow,
} from '@heyclaude/web-runtime/design-system';
import { BarChart, Clock, Sparkles, Target, Zap } from '@heyclaude/web-runtime/icons';
import {
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/logging/server';
import {
  UnifiedBadge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';

import { NewsletterCTAVariant } from '@/src/components/features/growth/newsletter/newsletter-cta-variants';
import { QuizForm } from '@/src/components/features/tools/recommender/quiz-form';

/**
 * ISR: 24 hours (86,400s)
 *
 * This page uses Incremental Static Regeneration. Server component code executes at
 * build/revalidation time, not on every request.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#revalidate
 */
export const revalidate = 86_400;

/**
 * Produces metadata for the Config Recommender page.
 *
 * Delegates to the centralized metadata registry to build the metadata for the
 * '/tools/config-recommender' route.
 *
 * @returns Page metadata for the Config Recommender route.
 *
 * @see generatePageMetadata
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/tools/config-recommender');
}

/**
 * Render the Config Recommender landing page.
 *
 * Renders a server-side React page that presents a client-side, rule-based quiz and
 * supporting informational sections (hero, benefits, features, and newsletter CTA).
 * Creates an ISR-scoped logger with a generated requestId (generated at build/revalidation
 * time), normalizes and logs render errors, and re-throws normalized errors so they are
 * handled by the application's error boundary.
 *
 * @returns The React element tree for the Config Recommender landing page.
 *
 * @see generateRequestId
 * @see logger
 * @see normalizeError
 * @see QuizForm
 * @see NewsletterCTAVariant
 * @see generatePageMetadata
 */
export default function ConfigRecommenderPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();

  // Create ISR-scoped child logger (generated at build/revalidation time)
  const reqLogger = logger.child({
    requestId,
    operation: 'ConfigRecommenderPage',
    route: '/tools/config-recommender',
    module: 'app/tools/config-recommender',
  });

  try {
    return (
      <div className={`${minHeight.screen} ${bgColor.background}`}>
        {/* Hero Section */}
        <section className={`relative ${overflow.hidden} ${padding.xDefault} ${padding.yHero}`}>
          <div className={`container mx-auto ${maxWidth['4xl']}`}>
            {/* Badge */}
            <UnifiedBadge
              variant="base"
              style="outline"
              className={`${marginBottom.comfortable} ${borderColor['primary/20']} ${bgColor['accent/5']} ${textColor.primary}`}
            >
              <Sparkles className={iconLeading.xs} aria-hidden="true" />
              AI-Powered Recommendations
            </UnifiedBadge>

            {/* Title */}
            <h1 className={`${marginBottom.comfortable} bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text ${weight.bold} ${size['4xl']} ${textColor.transparent} md:${size['5xl']} lg:${size['6xl']}`}>
              Find Your Perfect Claude Configuration
            </h1>

            {/* Description */}
            <p className={`mx-auto ${marginBottom.relaxed} ${maxWidth['3xl']} ${muted.lg} md:${size.xl}`}>
              Answer 7 quick questions and get personalized recommendations from our catalog of 147+
              configurations. Instant results, zero cost, tailored to your needs.
            </p>

            {/* Stats */}
            <div className={`flex ${flexWrap.wrap} ${justify.center} ${gap.default}`}>
              <UnifiedBadge variant="base" style="secondary" className={size.sm}>
                <Clock className={iconLeading.xs} aria-hidden="true" />2 minutes
              </UnifiedBadge>
              <UnifiedBadge variant="base" style="secondary" className={size.sm}>
                <Target className={iconLeading.xs} aria-hidden="true" />
                147+ configs analyzed
              </UnifiedBadge>
              <UnifiedBadge variant="base" style="secondary" className={size.sm}>
                <Zap className={iconLeading.xs} aria-hidden="true" />
                Instant results
              </UnifiedBadge>
            </div>
          </div>
        </section>

        {/* Quiz Section */}
        <section className={`container mx-auto ${padding.xDefault} pb-16`}>
          <div className={`mx-auto ${maxWidth['4xl']}`}>
            <QuizForm />
          </div>
        </section>

        {/* Benefits Section */}
        <section className={`container mx-auto ${padding.xDefault} pb-16`}>
          <div className={`mx-auto ${maxWidth['4xl']}`}>
            <h2 className={`${marginBottom.relaxed} text-center ${weight.bold} ${size['2xl']}`}>How It Works</h2>

            <div className={`grid ${gap.relaxed} md:grid-cols-3`}>
              <Card>
                <CardHeader>
                  <CardTitle className={`${cluster.compact} ${size.lg}`}>
                    <span
                      className={`flex ${iconSize.xl} ${alignItems.center} ${justify.center} ${radius.full} ${bgColor.primary} ${weight.bold} ${textColor.primaryForeground} ${size.sm}`}
                    >
                      1
                    </span>
                    Answer Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Tell us about your use case, experience level, and preferences in 7 quick
                    questions.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className={`${cluster.compact} ${size.lg}`}>
                    <span
                      className={`flex ${iconSize.xl} ${alignItems.center} ${justify.center} ${radius.full} ${bgColor.primary} ${weight.bold} ${textColor.primaryForeground} ${size.sm}`}
                    >
                      2
                    </span>
                    Instant Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Our algorithm analyzes 147+ configurations and matches them to your specific
                    needs.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className={`${cluster.compact} ${size.lg}`}>
                    <span
                      className={`flex ${iconSize.xl} ${alignItems.center} ${justify.center} ${radius.full} ${bgColor.primary} ${weight.bold} ${textColor.primaryForeground} ${size.sm}`}
                    >
                      3
                    </span>
                    Get Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Receive ranked recommendations with match scores and explanations for each
                    choice.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={`container mx-auto ${padding.xDefault} pb-16`}>
          <div className={`mx-auto ${maxWidth['4xl']}`}>
            <Card className={`border-accent/20 ${bgColor['accent/5']}`}>
              <CardHeader>
                <CardTitle className={cluster.compact}>
                  <BarChart className={`${iconSize.md} ${textColor.primary}`} />
                  What You'll Get
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className={`grid ${gap.default} sm:grid-cols-2`}>
                  <li className={`${row.compact}`}>
                    <Sparkles
                      className={`${iconSize.md} ${textColor.primary} ${marginTop.micro} ${flexGrow.shrink0}`}
                    />
                    <span className={size.sm}>
                      Personalized match scores for each configuration
                    </span>
                  </li>
                  <li className={`${row.compact}`}>
                    <Sparkles
                      className={`${iconSize.md} ${textColor.primary} ${marginTop.micro} ${flexGrow.shrink0}`}
                    />
                    <span className={size.sm}>Clear explanations of why each was recommended</span>
                  </li>
                  <li className={`${row.compact}`}>
                    <Sparkles
                      className={`${iconSize.md} ${textColor.primary} ${marginTop.micro} ${flexGrow.shrink0}`}
                    />
                    <span className={size.sm}>Ranked results from best to good fit</span>
                  </li>
                  <li className={`${row.compact}`}>
                    <Sparkles
                      className={`${iconSize.md} ${textColor.primary} ${marginTop.micro} ${flexGrow.shrink0}`}
                    />
                    <span className={size.sm}>Shareable results to discuss with your team</span>
                  </li>
                  <li className={`${row.compact}`}>
                    <Sparkles
                      className={`${iconSize.md} ${textColor.primary} ${marginTop.micro} ${flexGrow.shrink0}`}
                    />
                    <span className={size.sm}>Direct links to setup guides and documentation</span>
                  </li>
                  <li className={`${row.compact}`}>
                    <Sparkles
                      className={`${iconSize.md} ${textColor.primary} ${marginTop.micro} ${flexGrow.shrink0}`}
                    />
                    <span className={size.sm}>Filter results by category and use case</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Email CTA - Footer section (matching homepage pattern) */}
        <section className={`container mx-auto ${padding.xDefault} ${padding.ySection}`}>
          <NewsletterCTAVariant source="content_page" variant="hero" />
        </section>
      </div>
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Config Recommender page render failed');
    reqLogger.warn('ConfigRecommenderPage: render failed - will be handled by error boundary', {
      err: normalized,
      recoverable: true,
      category: 'rendering',
    });
    throw normalized;
  }
}