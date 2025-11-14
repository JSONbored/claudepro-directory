/**
 * Job Payment Confirmed Email Template
 * Sent when payment is received and job goes live
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
  secondaryButtonStyle,
  strongStyle,
  subheadingStyle,
} from '../utils/email/common-styles.ts';
import { JobDetailsSection } from '../utils/email/components/job.tsx';
import { formatCurrency, formatEmailDate } from '../utils/email/formatters.ts';

export interface JobPaymentConfirmedProps {
  jobTitle: string;
  company: string;
  userEmail: string;
  jobId: string;
  jobSlug: string;
  plan: string;
  paymentAmount: number;
  paymentDate: string;
  expiresAt: string;
}

export function JobPaymentConfirmed({
  jobTitle,
  company,
  userEmail,
  jobSlug,
  plan,
  paymentAmount,
  paymentDate,
  expiresAt,
}: JobPaymentConfirmedProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME;
  const jobUrl = `${baseUrl}/jobs/${jobSlug}`;
  const analyticsUrl = `${baseUrl}/account/jobs`;
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const paymentLabel = `${formatCurrency(paymentAmount)} on ${formatEmailDate(paymentDate)}`;
  const expiresLabel = formatEmailDate(expiresAt);

  return (
    <BaseLayout
      preview={`Payment confirmed! Your job "${jobTitle}" is now live`}
      utm={utm}
    >
      <Section style={contentSection}>
        <Text style={headingStyle}>🚀 Your Job is Live!</Text>
        <Text style={subheadingStyle}>
          Payment confirmed! Your job listing is now published and visible to thousands of candidates.
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      <JobDetailsSection
        items={[
          { label: 'Position', value: jobTitle },
          { label: 'Company', value: company },
          { label: 'Plan', value: planLabel },
          { label: 'Payment', value: paymentLabel },
          { label: 'Active Until', value: expiresLabel },
        ]}
      />

      <Hr style={dividerStyle} />

      <Section style={contentSection}>
        <Text style={paragraphStyle}>
          <strong style={strongStyle}>What's Next?</strong>
        </Text>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            Your listing is live and searchable immediately
          </li>
          <li style={listItemStyle}>
            Track views and clicks in your dashboard
          </li>
          <li style={listItemStyle}>
            Get notified when candidates apply
          </li>
        </ul>
      </Section>

      <Section style={ctaSection}>
        <Button href={addUTMToURL(jobUrl, utm)} style={primaryButtonStyle}>
          View Live Listing
        </Button>
        <Button href={addUTMToURL(analyticsUrl, utm)} style={secondaryButtonStyle}>
          View Analytics
        </Button>
      </Section>
    </BaseLayout>
  );
}

export function renderJobPaymentConfirmedEmail(props: JobPaymentConfirmedProps) {
  return renderEmailTemplate(JobPaymentConfirmed, props);
}
