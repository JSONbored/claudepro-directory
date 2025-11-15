/**
 * Job Approved Email Template
 * Sent when admin approves a job listing and payment is required
 */

import React from 'npm:react@18.3.1';
import { Button, Hr, Section, Text } from 'npm:@react-email/components@0.0.22';
import { buildEmailCtaUrl } from '../utils/email/cta.ts';
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
import { formatCurrency } from '../utils/email/formatters.ts';

export interface JobApprovedProps {
  jobTitle: string;
  company: string;
  userEmail: string;
  jobId: string;
  plan: string;
  paymentAmount: number;
  paymentUrl?: string;
}

export function JobApproved({
  jobTitle,
  company,
  userEmail,
  plan,
  paymentAmount,
  paymentUrl,
}: JobApprovedProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME;
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const amountLabel = formatCurrency(paymentAmount);

  return (
    <BaseLayout
      preview={`Great news! Your job posting "${jobTitle}" has been approved`}
      utm={utm}
    >
      <Section style={contentSection}>
        <Text style={headingStyle}>Job Approved! 🎉</Text>
        <Text style={subheadingStyle}>
          Congratulations! Your job listing has been approved and is ready to publish.
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      <JobDetailsSection
        items={[
          { label: 'Position', value: jobTitle },
          { label: 'Company', value: company },
          { label: 'Plan', value: planLabel },
          { label: 'Amount', value: amountLabel },
        ]}
      />

      <Hr style={dividerStyle} />

      <Section style={contentSection}>
        <Text style={paragraphStyle}>
          <strong style={strongStyle}>Next Steps:</strong>
        </Text>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            Complete payment to activate your listing
          </li>
          <li style={listItemStyle}>
            Your job goes live immediately after payment
          </li>
          <li style={listItemStyle}>
            Track performance from your dashboard
          </li>
        </ul>
      </Section>

      <Section style={ctaSection}>
          {paymentUrl && (
            <Button href={buildEmailCtaUrl(paymentUrl, utm)} style={primaryButtonStyle}>
              Complete Payment ({amountLabel})
            </Button>
          )}
      </Section>
    </BaseLayout>
  );
}

export function renderJobApprovedEmail(props: JobApprovedProps) {
  return renderEmailTemplate(JobApproved, props);
}
