/**
 * Job Expiring Soon Email Template
 * Sent 7 days before job expiration with renewal option
 */

import React from 'npm:react@18.3.1';
import { Hr, Section, Text } from 'npm:@react-email/components@0.0.22';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates.ts';
import { BaseLayout } from '../base-template.tsx';
import {
  contentSection,
  dividerStyle,
  headingStyle,
  listItemStyle,
  listStyle,
  paragraphStyle,
  strongStyle,
  subheadingStyle,
} from '../common-styles.ts';
import { JobDetailsSection } from '../components/job.tsx';
import { formatEmailDate, pluralize } from '../formatters.ts';
import { EmailCtaSection } from '../components/cta.tsx';

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

        <EmailCtaSection
          utm={utm}
          buttons={[
            ...(renewalUrl
              ? [
                  {
                    preset: 'primaryDirectory' as const,
                    variant: 'primary' as const,
                    overrides: { href: renewalUrl, label: 'Renew Listing ($99)', contentKey: 'renewal_cta' },
                  },
                ]
              : []),
            {
              preset: 'primaryDirectory' as const,
              variant: 'secondary' as const,
              overrides: { href: jobUrl, label: 'View Listing', contentKey: 'view_listing_cta' },
            },
          ]}
        />
    </BaseLayout>
  );
}

export async function renderJobExpiringEmail(props: JobExpiringProps): Promise<string> {
  const { renderEmailTemplate } = await import('../base-template.tsx');
  return renderEmailTemplate(JobExpiring, props);
}

