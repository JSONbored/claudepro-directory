/**
 * Weekly Digest Email Template
 * Sent every Monday with new content and trending tools from the past week
 */

import React from 'npm:react@18.3.1';
import { Button, Hr, Section, Text } from 'npm:@react-email/components@0.0.22';
import { buildEmailCtaUrl } from '../utils/email/cta.ts';
import { EMAIL_UTM_TEMPLATES } from '../utils/email/utm-templates.ts';
import { BaseLayout, renderEmailTemplate } from '../utils/email/base-template.tsx';
import {
  contentSection,
  ctaSection,
  ctaTitleStyle,
  dividerStyle,
  footerNoteSection,
  footerNoteStyle,
  paragraphStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  sectionTitleStyle,
  strongStyle,
} from '../utils/email/common-styles.ts';
import { CardListSection, HeroBlock } from '../utils/email/components/sections.tsx';

export interface DigestContentItem {
  title: string;
  description: string;
  category: string;
  slug: string;
  url: string;
}

export interface DigestTrendingItem extends DigestContentItem {
  viewCount: number;
}

export interface WeeklyDigestProps {
  email: string;
  weekOf: string;
  newContent: DigestContentItem[];
  trendingContent: DigestTrendingItem[];
  personalizedContent?: DigestContentItem[];
}

export function WeeklyDigest({
  email,
  weekOf,
  newContent,
  trendingContent,
  personalizedContent,
}: WeeklyDigestProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.WEEKLY_DIGEST;

  const mapContentCards = (items: DigestContentItem[], label: string) =>
    items.map((item) => ({
      title: item.title,
      description: item.description,
      meta: item.category.toUpperCase(),
      cta: {
        label: `View ${label}`,
        href: buildEmailCtaUrl(item.url, utm, {
          content: `${label.toLowerCase()}_${item.slug}`,
        }),
      },
    }));

  const personalizedCards = personalizedContent
    ? mapContentCards(personalizedContent, 'Recommendation')
    : [];
  const newContentCards = mapContentCards(newContent, 'Content');
  const trendingCards = trendingContent.map((item) => ({
    title: item.title,
    description: item.description,
    meta: `${item.category.toUpperCase()} • ${formatViewCount(item.viewCount)} views`,
    cta: {
      label: `View ${item.category}`,
      href: buildEmailCtaUrl(item.url, utm, { content: `trending_${item.slug}` }),
    },
  }));

  return (
    <BaseLayout preview={`This Week in Claude - ${weekOf}`} utm={utm}>
      <HeroBlock
        title="This Week in Claude 🚀"
        subtitle={weekOf}
      >
        <Text style={paragraphStyle}>
          Your weekly roundup of the best Claude tools, configurations, and resources from the community.
        </Text>
      </HeroBlock>

      <Hr style={dividerStyle} />

      {personalizedCards.length ? (
        <>
          <Section style={contentSection}>
            <Text style={sectionTitleStyle}>✨ Recommended for You</Text>
            <Text style={paragraphStyle}>Based on your interests and preferences:</Text>
          </Section>
          <CardListSection cards={personalizedCards} />
          <Hr style={dividerStyle} />
        </>
      ) : null}

      {newContentCards.length ? (
        <>
          <Section style={contentSection}>
            <Text style={sectionTitleStyle}>✨ New This Week</Text>
            <Text style={paragraphStyle}>Fresh tools and configurations added to the directory:</Text>
          </Section>
          <CardListSection cards={newContentCards} />
          <Hr style={dividerStyle} />
        </>
      ) : null}

      {trendingCards.length ? (
        <>
          <Section style={contentSection}>
            <Text style={sectionTitleStyle}>🔥 Trending This Week</Text>
            <Text style={paragraphStyle}>Most popular tools from the community:</Text>
          </Section>
          <CardListSection cards={trendingCards} />
          <Hr style={dividerStyle} />
        </>
      ) : null}

      <Section style={ctaSection}>
        <Text style={ctaTitleStyle}>Explore More</Text>
        <Text style={paragraphStyle}>
          Browse the complete directory to discover even more tools and configurations.
        </Text>

        <Button href={buildEmailCtaUrl(baseUrl, utm, { content: 'browse_cta' })} style={primaryButtonStyle}>
          Browse Directory
        </Button>

        <Button
          href={buildEmailCtaUrl(`${baseUrl}/trending`, utm, { content: 'trending_cta' })}
          style={secondaryButtonStyle}
        >
          View All Trending
        </Button>
      </Section>

      <Hr style={dividerStyle} />

      <Section style={footerNoteSection}>
        <Text style={footerNoteStyle}>
          📧 Subscribed with: <strong style={strongStyle}>{email}</strong>
        </Text>
        <Text style={footerNoteStyle}>
          You're receiving this because you subscribed to weekly updates from ClaudePro Directory. You can unsubscribe anytime using the links at the bottom of this email.
        </Text>
      </Section>
    </BaseLayout>
  );
}

function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export default WeeklyDigest;

export function renderWeeklyDigestEmail(props: WeeklyDigestProps) {
  return renderEmailTemplate(WeeklyDigest, props);
}
