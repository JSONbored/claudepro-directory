/**
 * Job Expired Email Template
 * Sent when job listing expires with repost option
 */

import React from 'npm:react@18.3.1';
import { Button, Hr, Section, Text } from 'npm:@react-email/components@0.0.22';
import { addUTMToURL } from '../utils/email/email-utm.ts';
import { EMAIL_UTM_TEMPLATES } from '../utils/email/utm-templates.ts';
import { BaseLayout, renderEmailTemplate } from '../utils/email/base-template.tsx';
import {
  contentSection,
  ctaSection,
  dividerStyle,
  headingStyle,
  listItemStyle,
  listStyle,
  paragraphStyle,
  primaryButtonStyle,
  strongStyle,
  subheadingStyle,
} from '../utils/email/common-styles.ts';
import { JobDetailsSection } from '../utils/email/components/job.tsx';
import { formatEmailDate, formatNumber } from '../utils/email/formatters.ts';

export interface JobExpiredProps {
  jobTitle: string;
  company: string;
  userEmail: string;
  jobId: string;
  expiredAt: string;
  viewCount?: number;
  clickCount?: number;
  repostUrl?: string;
}

export function JobExpired({
  jobTitle,
  company,
  userEmail,
  jobId,
  expiredAt,
  viewCount = 0,
  clickCount = 0,
  repostUrl,
}: JobExpiredProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME;
  const expiredLabel = formatEmailDate(expiredAt);
  const viewsLabel = formatNumber(viewCount);
  const clicksLabel = formatNumber(clickCount);

  return (
    <BaseLayout
      preview={`Your job posting "${jobTitle}" has expired`}
      utm={utm}
    >
      <Section style={contentSection}>
        <Text style={headingStyle}>Job Listing Expired</Text>
        <Text style={subheadingStyle}>
          Your job posting for {jobTitle} at {company} has reached its expiration date.
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      <JobDetailsSection
        title="Performance Summary:"
        items={[
          { label: 'Position', value: jobTitle },
          { label: 'Company', value: company },
          { label: 'Views', value: viewsLabel, icon: '📊' },
          { label: 'Clicks', value: clicksLabel, icon: '🖱️' },
          { label: 'Expired', value: expiredLabel, icon: '📅' },
        ]}
      />

      <Hr style={dividerStyle} />

      <Section style={contentSection}>
        <Text style={paragraphStyle}>
          <strong style={strongStyle}>Still hiring?</strong>
        </Text>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            Repost your listing with one click
          </li>
          <li style={listItemStyle}>
            All details are preserved - just review and publish
          </li>
          <li style={listItemStyle}>
            Get another 30 days of visibility
          </li>
        </ul>
      </Section>

      <Section style={ctaSection}>
        {repostUrl && (
          <Button href={addUTMToURL(repostUrl, utm)} style={primaryButtonStyle}>
            Repost Listing ($299)
          </Button>
        )}
      </Section>
    </BaseLayout>
  );
}

export function renderJobExpiredEmail(props: JobExpiredProps) {
  return renderEmailTemplate(JobExpired, props);
}
