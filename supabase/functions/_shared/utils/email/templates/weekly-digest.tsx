/**
 * Weekly Digest Email Template
 * Sent every Monday with new content and trending tools from the past week
 */

import React from 'npm:react@18.3.1';
import { Hr, Section, Text } from 'npm:@react-email/components@0.0.22';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates.ts';
import { BaseLayout } from '../base-template.tsx';
import {
  contentSection,
  dividerStyle,
  paragraphStyle,
  sectionTitleStyle,
} from '../common-styles.ts';
import { CardListSection, HeroBlock } from '../components/sections.tsx';
import { EmailCtaSection } from '../components/cta.tsx';
import { EmailFooterNote } from '../components/footer-note.tsx';
import { buildSubscriptionFooter } from '../config/footer-presets.ts';
import { buildEmailCtaUrl } from '../cta.ts';

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

        <EmailCtaSection
          utm={utm}
          title="Explore More"
          description="Browse the complete directory to discover even more tools and configurations."
          buttons={[
            { preset: 'browseDirectory', variant: 'primary' },
            { preset: 'viewTrending', variant: 'secondary' },
          ]}
        />

      <Hr style={dividerStyle} />

        <EmailFooterNote lines={buildSubscriptionFooter('weeklyDigest', { email })} />
    </BaseLayout>
  );
}

export async function renderWeeklyDigestEmail(props: WeeklyDigestProps): Promise<string> {
  const { renderEmailTemplate } = await import('../base-template.tsx');
  return renderEmailTemplate(WeeklyDigest, props);
}

function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export default WeeklyDigest;

