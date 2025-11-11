/**
 * Job Approved Email Template
 * Sent when admin approves a job listing and payment is required
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
  strongStyle,
  subheadingStyle,
} from '../utils/common-styles.ts';

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

      <Section style={contentSection}>
        <Text style={paragraphStyle}>
          <strong style={strongStyle}>Position:</strong> {jobTitle}
        </Text>
        <Text style={paragraphStyle}>
          <strong style={strongStyle}>Company:</strong> {company}
        </Text>
        <Text style={paragraphStyle}>
          <strong style={strongStyle}>Plan:</strong> {plan.charAt(0).toUpperCase() + plan.slice(1)}
        </Text>
        <Text style={paragraphStyle}>
          <strong style={strongStyle}>Amount:</strong> ${paymentAmount}
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      <Section style={contentSection}>
        <Text style={paragraphStyle}><strong style={strongStyle}>Next Steps:</strong></Text>
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
          <Button
            href={addUTMToURL(paymentUrl, utm)}
            style={primaryButtonStyle}
          >
            Complete Payment (${paymentAmount})
          </Button>
        )}
      </Section>
    </BaseLayout>
  );
}
