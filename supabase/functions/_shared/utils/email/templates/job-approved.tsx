/**
 * Job Approved Email Template
 * Sent when admin approves a job listing and payment is required
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
import { formatCurrency } from '../formatters.ts';
import { EmailCtaSection } from '../components/cta.tsx';

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

        <EmailCtaSection
          utm={utm}
          buttons={
            paymentUrl
              ? [
                  {
                    preset: 'primaryDirectory' as const, // label overridden below, href uses paymentUrl
                    variant: 'primary' as const,
                    overrides: { href: paymentUrl, label: `Complete Payment (${amountLabel})`, contentKey: 'payment_cta' },
                  },
                ]
              : []
          }
        />
    </BaseLayout>
  );
}

export async function renderJobApprovedEmail(props: JobApprovedProps): Promise<string> {
  const { renderEmailTemplate } = await import('../base-template.tsx');
  return renderEmailTemplate(JobApproved, props);
}

