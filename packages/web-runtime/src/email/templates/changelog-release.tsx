/**
 * Changelog Release Email Template
 * Sent to newsletter subscribers when a new changelog entry is published
 *
 * Features:
 * - Modern card-based layout for changelog sections
 * - Release title and TLDR summary
 * - Section breakdown (Added, Changed, Fixed, etc.)
 * - Release date display
 * - Dark mode compatible
 * - Clean, minimal design
 */

import { Link, Section, Text } from '@react-email/components';
import React from 'react';
import { BaseLayout } from '../base-template';
import { EmailBadge } from '../components/badge';
import { EmailCard } from '../components/card';
import { buildEmailCtaUrl } from '../cta';
import { brandColors, emailTheme, spacing, typography } from '../theme';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates';

/**
 * Changelog section with commits
 */
export interface ChangelogSection {
  type: string;
  commits: Array<{
    scope?: string;
    description: string;
    sha?: string;
    author?: string;
  }>;
}

/**
 * Changelog release email props
 */
export interface ChangelogReleaseEmailProps {
  /**
   * Changelog entry title (version)
   */
  title: string;

  /**
   * TLDR summary of the release
   */
  tldr: string;

  /**
   * Array of changelog sections (Added, Changed, Fixed, etc.)
   */
  sections?: ChangelogSection[];

  /**
   * Release date string (e.g., "December 7, 2025")
   */
  releaseDate: string;

  /**
   * Changelog slug for URL
   */
  slug: string;
}

/**
 * Format date string for display
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Get emoji for section type
 */
function getSectionEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    feat: '✨',
    fix: '🐛',
    perf: '⚡',
    refactor: '♻️',
    docs: '📚',
    Added: '✨',
    Changed: '🔄',
    Fixed: '🐛',
    Removed: '🗑️',
    Security: '🔒',
    Performance: '⚡',
    Refactor: '♻️',
    Documentation: '📚',
  };
  return emojiMap[type] || '📝';
}

/**
 * Format section type name for display
 */
function formatSectionType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Changelog Release Email Component
 *
 * Usage:
 * ```tsx
 * <ChangelogReleaseEmail
 *   title="1.2.0"
 *   tldr="Major improvements and new features"
 *   sections={[...]}
 *   releaseDate="2025-12-07"
 *   slug="1-2-0-2025-12-07"
 * />
 * ```
 */
export function ChangelogReleaseEmail({
  title,
  tldr,
  sections = [],
  releaseDate,
  slug,
}: ChangelogReleaseEmailProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.CHANGELOG_RELEASE || {
    source: 'email',
    medium: 'newsletter',
    campaign: 'changelog_release',
  };

  const changelogUrl = `${baseUrl}/changelog/${slug}`;
  const formattedDate = formatDate(releaseDate);
  const hasSections = Array.isArray(sections) && sections.length > 0;

  return (
    <BaseLayout preview={`New Release: ${title} - ${tldr}`} utm={utm}>
      <Section style={heroSection}>
        <EmailBadge variant="primary" size="default">
          New Release
        </EmailBadge>
        <Text style={heroTitleStyle}>{title}</Text>
        <Text style={heroSubtitleStyle}>{tldr}</Text>
        <Text style={releaseDateStyle}>Released {formattedDate}</Text>
      </Section>

      {hasSections && (
        <Section style={sectionContainer}>
          <Text style={sectionTitleStyle}>📋 What's Changed</Text>
          {sections.slice(0, 6).map((section, index) => (
            <EmailCard key={`section-${section.type}-${index}`} style={sectionCardStyle}>
              <div style={sectionHeaderStyle}>
                <Text style={sectionTypeStyle}>
                  {getSectionEmoji(section.type)} {formatSectionType(section.type)}
                </Text>
              </div>
              {section.commits && section.commits.length > 0 && (
                <ul style={commitListStyle}>
                  {section.commits.slice(0, 5).map((commit, commitIndex) => (
                    <li key={`commit-${commitIndex}`} style={commitItemStyle}>
                      <Text style={commitTextStyle}>{commit.description}</Text>
                      {commit.scope && (
                        <EmailBadge variant="secondary" size="sm" style={scopeBadgeStyle}>
                          {commit.scope}
                        </EmailBadge>
                      )}
                    </li>
                  ))}
                  {section.commits.length > 5 && (
                    <Text style={moreCommitsStyle}>+{section.commits.length - 5} more changes</Text>
                  )}
                </ul>
              )}
            </EmailCard>
          ))}
          {sections.length > 6 && (
            <Text style={moreSectionsStyle}>+{sections.length - 6} more sections</Text>
          )}
        </Section>
      )}

      <Section style={ctaSection}>
        <Link
          href={buildEmailCtaUrl(changelogUrl, utm, {
            content: 'view_full_release',
          })}
          style={ctaButtonStyle}
        >
          View Full Release Notes →
        </Link>
      </Section>
    </BaseLayout>
  );
}

/**
 * Export default for easier imports
 */
export default ChangelogReleaseEmail;

const heroSection: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: spacing.xl,
  padding: `${spacing.xl} ${spacing.lg}`,
  backgroundColor: emailTheme.bgSecondary,
  borderRadius: spacing.xl,
  border: `1px solid ${emailTheme.borderLight}`,
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize['3xl'],
  fontWeight: typography.fontWeight.bold,
  margin: `${spacing.md} 0 ${spacing.sm}`,
  color: emailTheme.textPrimary,
  lineHeight: typography.lineHeight.tight,
};

const heroSubtitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  color: emailTheme.textSecondary,
  margin: `0 0 ${spacing.md}`,
  lineHeight: typography.lineHeight.relaxed,
};

const releaseDateStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textTertiary,
  margin: 0,
  fontWeight: typography.fontWeight.medium,
};

const sectionContainer: React.CSSProperties = {
  marginTop: spacing.xl,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: typography.fontSize.xl,
  fontWeight: typography.fontWeight.bold,
  margin: `0 0 ${spacing.lg}`,
  color: emailTheme.textPrimary,
};

const sectionCardStyle: React.CSSProperties = {
  marginBottom: spacing.md,
};

const sectionHeaderStyle: React.CSSProperties = {
  marginBottom: spacing.sm,
};

const sectionTypeStyle: React.CSSProperties = {
  fontSize: typography.fontSize.lg,
  fontWeight: typography.fontWeight.semibold,
  margin: 0,
  color: emailTheme.textPrimary,
};

const commitListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: spacing.lg,
  listStyle: 'none',
};

const commitItemStyle: React.CSSProperties = {
  marginBottom: spacing.sm,
  paddingLeft: spacing.md,
  position: 'relative',
};

const commitTextStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  color: emailTheme.textPrimary,
  margin: 0,
  lineHeight: typography.lineHeight.relaxed,
  display: 'inline',
};

const scopeBadgeStyle: React.CSSProperties = {
  marginLeft: spacing.xs,
  display: 'inline-block',
};

const moreCommitsStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textTertiary,
  margin: `${spacing.xs} 0 0`,
  fontStyle: 'italic',
};

const moreSectionsStyle: React.CSSProperties = {
  fontSize: typography.fontSize.sm,
  color: emailTheme.textTertiary,
  margin: `${spacing.md} 0 0`,
  textAlign: 'center',
  fontStyle: 'italic',
};

const ctaSection: React.CSSProperties = {
  marginTop: spacing.xl,
  textAlign: 'center',
  padding: `${spacing.xl} 0`,
};

const ctaButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: `${spacing.md} ${spacing.xl}`,
  backgroundColor: brandColors.primary,
  color: '#05060a',
  borderRadius: '9999px',
  textDecoration: 'none',
  fontWeight: typography.fontWeight.semibold,
  fontSize: typography.fontSize.base,
};
