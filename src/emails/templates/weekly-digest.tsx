/**
 * Weekly Digest Email Template
 * Sent every Monday with new content and trending tools from the past week
 *
 * Features:
 * - New content section (up to 5 items)
 * - Trending tools section (top 3 by views)
 * - Responsive design
 * - Email client compatible
 */

import { Button, Hr, Section, Text } from '@react-email/components';
import type * as React from 'react';
import { BaseLayout } from '../layouts/base-layout';
import {
  contentSection,
  ctaSection,
  ctaTitleStyle,
  dividerStyle,
  footerNoteSection,
  footerNoteStyle,
  headingStyle,
  heroSection,
  paragraphStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  sectionTitleStyle,
  strongStyle,
  subheadingStyle,
} from '../utils/common-styles';
import { borderRadius, brandColors, emailTheme, spacing, typography } from '../utils/theme';

/**
 * Content item for digest
 */
export interface DigestContentItem {
  title: string;
  description: string;
  category: string;
  slug: string;
  url: string;
}

/**
 * Trending item with view count
 */
export interface DigestTrendingItem extends DigestContentItem {
  viewCount: number;
}

/**
 * Props for WeeklyDigest email
 */
export interface WeeklyDigestProps {
  /**
   * Subscriber's email address
   */
  email: string;

  /**
   * Week identifier (e.g., "December 2-8, 2025")
   */
  weekOf: string;

  /**
   * New content added this week (up to 5)
   */
  newContent: DigestContentItem[];

  /**
   * Trending content (top 3 by views)
   */
  trendingContent: DigestTrendingItem[];

  /**
   * Personalized recommendations based on user interests (optional)
   */
  personalizedContent?: DigestContentItem[];
}

/**
 * WeeklyDigest Email Component
 *
 * Sent every Monday morning with curated weekly updates.
 *
 * @example
 * ```tsx
 * <WeeklyDigest
 *   email="user@example.com"
 *   weekOf="December 2-8, 2025"
 *   newContent={[...]}
 *   trendingContent={[...]}
 * />
 * ```
 */
export function WeeklyDigest({
  email,
  weekOf,
  newContent,
  trendingContent,
  personalizedContent,
}: WeeklyDigestProps) {
  return (
    <BaseLayout preview={`This Week in Claude - ${weekOf} | New tools, trending content, and more`}>
      {/* Hero section */}
      <Section style={heroSection}>
        <Text style={headingStyle}>This Week in Claude 🚀</Text>
        <Text style={subheadingStyle}>{weekOf}</Text>
        <Text style={paragraphStyle}>
          Your weekly roundup of the best Claude tools, configurations, and resources from the
          community.
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Personalized Content Section */}
      {personalizedContent && personalizedContent.length > 0 && (
        <>
          <Section style={contentSection}>
            <Text style={sectionTitleStyle}>✨ Recommended for You</Text>
            <Text style={paragraphStyle}>Based on your interests and preferences:</Text>

            {personalizedContent.map((item) => (
              <Section key={`personalized-${item.category}-${item.slug}`} style={itemCardStyle}>
                <Text style={itemCategoryStyle}>{item.category.toUpperCase()}</Text>
                <Text style={itemTitleStyle}>{item.title}</Text>
                <Text style={itemDescriptionStyle}>{item.description}</Text>
                <Button href={item.url} style={itemButtonStyle}>
                  View {item.category}
                </Button>
              </Section>
            ))}
          </Section>

          <Hr style={dividerStyle} />
        </>
      )}

      {/* New Content Section */}
      {newContent && newContent.length > 0 && (
        <>
          <Section style={contentSection}>
            <Text style={sectionTitleStyle}>✨ New This Week</Text>
            <Text style={paragraphStyle}>
              Fresh tools and configurations added to the directory:
            </Text>

            {newContent.map((item) => (
              <Section key={`${item.category}-${item.slug}`} style={itemCardStyle}>
                <Text style={itemCategoryStyle}>{item.category.toUpperCase()}</Text>
                <Text style={itemTitleStyle}>{item.title}</Text>
                <Text style={itemDescriptionStyle}>{item.description}</Text>
                <Button href={item.url} style={itemButtonStyle}>
                  View {item.category}
                </Button>
              </Section>
            ))}
          </Section>

          <Hr style={dividerStyle} />
        </>
      )}

      {/* Trending Content Section */}
      {trendingContent && trendingContent.length > 0 && (
        <>
          <Section style={contentSection}>
            <Text style={sectionTitleStyle}>🔥 Trending This Week</Text>
            <Text style={paragraphStyle}>Most popular tools from the community:</Text>

            {trendingContent.map((item) => (
              <Section key={`trending-${item.category}-${item.slug}`} style={itemCardStyle}>
                <div style={trendingHeaderStyle}>
                  <Text style={itemCategoryStyle}>{item.category.toUpperCase()}</Text>
                  <Text style={viewCountStyle}>👁️ {formatViewCount(item.viewCount)} views</Text>
                </div>
                <Text style={itemTitleStyle}>{item.title}</Text>
                <Text style={itemDescriptionStyle}>{item.description}</Text>
                <Button href={item.url} style={itemButtonStyle}>
                  View {item.category}
                </Button>
              </Section>
            ))}
          </Section>

          <Hr style={dividerStyle} />
        </>
      )}

      {/* Call to action */}
      <Section style={ctaSection}>
        <Text style={ctaTitleStyle}>Explore More</Text>
        <Text style={paragraphStyle}>
          Browse the complete directory to discover even more tools and configurations.
        </Text>

        <Button href="https://claudepro.directory" style={primaryButtonStyle}>
          Browse Directory
        </Button>

        <Button href="https://claudepro.directory/trending" style={secondaryButtonStyle}>
          View All Trending
        </Button>
      </Section>

      <Hr style={dividerStyle} />

      {/* Footer note */}
      <Section style={footerNoteSection}>
        <Text style={footerNoteStyle}>
          📧 Subscribed with: <strong style={strongStyle}>{email}</strong>
        </Text>
        <Text style={footerNoteStyle}>
          You're receiving this because you subscribed to weekly updates from ClaudePro Directory.
          You can unsubscribe anytime using the links at the bottom of this email.
        </Text>
      </Section>
    </BaseLayout>
  );
}

/**
 * Format view count for display
 */
function formatViewCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

/**
 * Template-specific custom styles
 * (Styles for digest item cards and trending view counts)
 */

const itemCardStyle: React.CSSProperties = {
  backgroundColor: emailTheme.bgTertiary,
  border: `1px solid ${emailTheme.borderDefault}`,
  borderRadius: borderRadius.md,
  padding: spacing.lg,
  marginBottom: spacing.md,
};

const itemCategoryStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.semibold,
  color: brandColors.primary,
  letterSpacing: '0.05em',
  margin: `0 0 ${spacing.xs} 0`,
};

const itemTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.sm} 0`,
  lineHeight: typography.lineHeight.tight,
};

const itemDescriptionStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: `0 0 ${spacing.md} 0`,
};

const itemButtonStyle: React.CSSProperties = {
  backgroundColor: brandColors.primary,
  color: '#ffffff',
  fontWeight: typography.fontWeight.medium,
  fontSize: typography.fontSize.sm,
  padding: `${spacing.sm} ${spacing.lg}`,
  borderRadius: borderRadius.sm,
  textDecoration: 'none',
  display: 'inline-block',
  border: 'none',
};

const trendingHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spacing.xs,
};

const viewCountStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xs,
  color: emailTheme.textTertiary,
  fontWeight: typography.fontWeight.medium,
};

/**
 * Export default for easier imports
 */
export default WeeklyDigest;
