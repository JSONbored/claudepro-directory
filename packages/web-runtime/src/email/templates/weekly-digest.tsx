/**
 * Weekly Digest Email Template
 * Sent weekly to newsletter subscribers with new and trending content
 *
 * Features:
 * - Modern card-based layout for content items
 * - New content section with date information
 * - Trending content section with view counts
 * - Category badges
 * - Dark mode compatible
 * - Clean, minimal design
 */

import type {
  WeeklyDigestNewContent,
  WeeklyDigestTrendingContent,
} from '@heyclaude/database-types/postgres-types';
import { Link, Section, Text } from '@react-email/components';
import React from 'react';
import { BaseLayout } from '../base-template';
import { EmailBadge } from '../components/badge';
import { EmailCard } from '../components/card';
import { buildEmailCtaUrl } from '../cta';
import { brandColors, emailTheme, spacing, typography } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

// Re-export types for convenience
export type { WeeklyDigestNewContent, WeeklyDigestTrendingContent };

/**
 * Weekly digest email props
 */
export interface WeeklyDigestEmailProps {
  /**
   * Week identifier string (e.g., "December 2-8, 2025")
   */
  weekOf: string;

  /**
   * Array of new content items from this week
   */
  newContent?: WeeklyDigestNewContent[];

  /**
   * Array of trending content items
   */
  trendingContent?: WeeklyDigestTrendingContent[];
}

/**
 * Weekly Digest Email Component
 *
 * Usage:
 * ```tsx
 * <WeeklyDigestEmail
 *   weekOf="December 2-8, 2025"
 *   newContent={[...]}
 *   trendingContent={[...]}
 * />
 * ```
 */
export function WeeklyDigestEmail({
  weekOf,
  newContent = [],
  trendingContent = [],
}: WeeklyDigestEmailProps) {
  const utm = EMAIL_UTM_TEMPLATES.WEEKLY_DIGEST || {
    source: 'email',
    medium: 'newsletter',
    campaign: 'weekly_digest',
  };

  const hasNewContent = Array.isArray(newContent) && newContent.length > 0;
  const hasTrendingContent = Array.isArray(trendingContent) && trendingContent.length > 0;

  return (
    <BaseLayout
      preview={`This Week in Claude: ${weekOf} - Discover new and trending content from the Claude ecosystem.`}
      utm={utm}
    >
      <Section style={heroSection}>
        <Text style={heroTitleStyle}>This Week in Claude</Text>
        <Text style={heroSubtitleStyle}>Week of {weekOf}</Text>
      </Section>

      {hasNewContent && (
        <Section style={sectionContainer}>
          <Text style={sectionTitleStyle}>✨ New This Week</Text>
          {newContent.map((item, index) => (
            <ContentCard
              key={`new-${item.slug || index}-${index}`}
              title={item.title}
              description={item.description}
              category={item.category}
              url={item.url}
              utm={utm}
              metadata={item.date_added ? formatDate(item.date_added) : ''}
            />
          ))}
        </Section>
      )}

      {hasTrendingContent && (
        <Section style={sectionContainer}>
          <Text style={sectionTitleStyle}>🔥 Trending</Text>
          {trendingContent.map((item, index) => (
            <ContentCard
              key={`trending-${item.slug || index}-${index}`}
              title={item.title}
              description={item.description}
              category={item.category}
              url={item.url}
              utm={utm}
              metadata={item.view_count !== null ? `${formatNumber(item.view_count)} views` : ''}
            />
          ))}
        </Section>
      )}

      {!hasNewContent && !hasTrendingContent && (
        <EmailCard variant="subtle">
          <Text style={emptyStateStyle}>
            No new content this week. Check back next week for updates!
          </Text>
        </EmailCard>
      )}

      <Section style={ctaSection}>
        <Link
          href={buildEmailCtaUrl('https://claudepro.directory', utm, {
            content: 'browse_all_button',
          })}
          style={ctaLinkStyle}
        >
          Browse All Content →
        </Link>
      </Section>
    </BaseLayout>
  );
}

/**
 * Content card component for individual content items
 */
interface ContentCardProps {
  title: string | null;
  description: string | null;
  category: string | null;
  url: string | null;
  utm: typeof EMAIL_UTM_TEMPLATES.WEEKLY_DIGEST;
  metadata: string;
}

function ContentCard({ title, description, category, url, utm, metadata }: ContentCardProps) {
  const contentUrl = url
    ? buildEmailCtaUrl(url, utm, {
        content: `content_item_${category || 'unknown'}`,
      })
    : '#';

  return (
    <EmailCard variant="default" style={contentCardStyle}>
      {category && (
        <EmailBadge variant="secondary" size="sm">
          {category}
        </EmailBadge>
      )}
      {title && (
        <Link href={contentUrl} style={contentTitleStyle}>
          {title}
        </Link>
      )}
      {description && <Text style={contentDescriptionStyle}>{description}</Text>}
      {metadata && <Text style={contentMetadataStyle}>{metadata}</Text>}
    </EmailCard>
  );
}

/**
 * Format date string to readable format
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format number with locale-specific formatting
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

// Styles
const heroSection: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: spacing.xl,
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['2xl'],
  fontWeight: typography.fontWeight.bold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.xs} 0`,
};

const heroSubtitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  margin: 0,
};

const sectionContainer: React.CSSProperties = {
  marginBottom: spacing.xl,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.semibold,
  color: emailTheme.textPrimary,
  margin: `0 0 ${spacing.md} 0`,
};

const contentCardStyle: React.CSSProperties = {
  marginBottom: spacing.md,
};

const contentTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  color: brandColors.primary,
  textDecoration: 'none',
  display: 'block',
  margin: `${spacing.sm} 0 ${spacing.xs} 0`,
};

const contentDescriptionStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  lineHeight: typography.lineHeight.relaxed,
  margin: `${spacing.xs} 0 ${spacing.sm} 0`,
};

const contentMetadataStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textTertiary,
  margin: `${spacing.xs} 0 0 0`,
};

const ctaSection: React.CSSProperties = {
  textAlign: 'center',
  marginTop: spacing.xl,
  marginBottom: spacing.lg,
};

const ctaLinkStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.semibold,
  color: brandColors.primary,
  textDecoration: 'none',
};

const emptyStateStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textSecondary,
  textAlign: 'center',
  margin: 0,
};
