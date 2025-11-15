/**
 * Job Expiring Soon Email Template
 * Sent 7 days before job expiration with renewal option
 */

import React from 'npm:react@18.3.1';
import { Button, Hr, Section, Text } from 'npm:@react-email/components@0.0.22';
import { buildEmailCtaUrl } from '../cta.ts';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates.ts';
import { BaseLayout, renderEmailTemplate } from '../base-template.tsx';
import {
  contentSection,
  ctaSection,
  dividerStyle,
  headingStyle,
  listItemStyle,
  listStyle,
  paragraphStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  strongStyle,
  subheadingStyle,
} from '../common-styles.ts';
import { JobDetailsSection } from '../components/job.tsx';
import { formatEmailDate, pluralize } from '../formatters.ts';

export interface JobExpiringProps {
  jobTitle: string;
  company: string;
  userEmail: string;
  jobId: string;
  expiresAt: string;
  daysRemaining: number;
  renewalUrl?: string;
}

export function JobExpiring({
  jobTitle,
  company,
  userEmail,
  jobId,
  expiresAt,
  daysRemaining,
  renewalUrl,
}: JobExpiringProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME;
  const jobUrl = `${baseUrl}/jobs/${jobId}`;
  const expiresLabel = formatEmailDate(expiresAt);
  const dayWord = pluralize(daysRemaining, 'day');

  return (
    <BaseLayout
      preview={`Your job posting "${jobTitle}" expires in ${daysRemaining} days`}
      utm={utm}
    >
      <Section style={contentSection}>
        <Text style={headingStyle}>⏰ Job Listing Expiring Soon</Text>
        <Text style={subheadingStyle}>
          Your job posting will expire in {daysRemaining} {dayWord}.
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      <JobDetailsSection
        items={[
          { label: 'Position', value: jobTitle },
          { label: 'Company', value: company },
          { label: 'Expires', value: expiresLabel },
        ]}
      />

      <Hr style={dividerStyle} />

      <Section style={contentSection}>
        <Text style={paragraphStyle}>
          <strong style={strongStyle}>Want to keep it live?</strong>
        </Text>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            Renew for another 30 days and continue receiving applications
          </li>
          <li style={listItemStyle}>
            Your listing maintains its current performance and visibility
          </li>
          <li style={listItemStyle}>
            No interruption in service - seamless renewal
          </li>
        </ul>
      </Section>

        <Section style={ctaSection}>
          {renewalUrl && (
            <Button href={buildEmailCtaUrl(renewalUrl, utm)} style={primaryButtonStyle}>
              Renew Listing ($99)
            </Button>
          )}
          <Button href={buildEmailCtaUrl(jobUrl, utm)} style={secondaryButtonStyle}>
            View Listing
          </Button>
        </Section>
    </BaseLayout>
  );
}

export function renderJobExpiringEmail(props: JobExpiringProps) {
  return renderEmailTemplate(JobExpiring, props);
}
