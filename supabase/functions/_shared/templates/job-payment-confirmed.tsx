/**
 * Job Payment Confirmed Email Template
 * Sent when payment is received and job goes live
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
          <strong style={strongStyle}>Payment:</strong> ${paymentAmount} on{' '}
          {new Date(paymentDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        <Text style={paragraphStyle}>
          <strong style={strongStyle}>Active Until:</strong>{' '}
          {new Date(expiresAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </Section>

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
