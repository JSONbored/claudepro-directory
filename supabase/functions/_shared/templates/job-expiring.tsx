/**
 * Job Expiring Soon Email Template
 * Sent 7 days before job expiration with renewal option
 */

import React from 'npm:react@18.3.1';
import { Button, Hr, Section, Text } from 'npm:@react-email/components@0.0.22';
import { addUTMToURL } from '../utils/email-utm.ts';
import { EMAIL_UTM_TEMPLATES } from '../utils/utm-templates.ts';
import { BaseLayout } from '../layouts/base-layout.tsx';
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
} from '../utils/common-styles.ts';

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

  return (
    <BaseLayout
      preview={`Your job posting "${jobTitle}" expires in ${daysRemaining} days`}
      utm={utm}
    >
      <Section style={contentSection}>
        <Text style={headingStyle}>⏰ Job Listing Expiring Soon</Text>
        <Text style={subheadingStyle}>
          Your job posting will expire in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}.
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      <Section style={contentSection}>
        <Text style={paragraphStyle}>
          <strong style={strongStyle}>Position:</strong> {jobTitle}
        </Text>
        <Text style={paragraphStyle}>
          <strong style={strongStyle}>Company:</strong> {company}
        </Text>
        <Text style={paragraphStyle}>
          <strong style={strongStyle}>Expires:</strong> {new Date(expiresAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </Section>

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
          <Button href={addUTMToURL(renewalUrl, utm)} style={primaryButtonStyle}>
            Renew Listing ($99)
          </Button>
        )}
        <Button href={addUTMToURL(jobUrl, utm)} style={secondaryButtonStyle}>
          View Listing
        </Button>
      </Section>
    </BaseLayout>
  );
}
