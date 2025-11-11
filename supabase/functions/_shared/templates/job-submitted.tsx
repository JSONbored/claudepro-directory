/**
 * Job Submitted Email Template
 * Sent when a user submits a new job listing for review
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

export interface JobSubmittedProps {
  jobTitle: string;
  company: string;
  userEmail: string;
  jobId: string;
}

export function JobSubmitted({ jobTitle, company, userEmail, jobId }: JobSubmittedProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME;

  return (
    <BaseLayout
      preview={`Your job posting "${jobTitle}" at ${company} is under review`}
      utm={utm}
    >
      <Section style={contentSection}>
        <Text style={headingStyle}>Job Submitted Successfully! 📋</Text>
        <Text style={subheadingStyle}>
          We've received your job posting and it's now under admin review.
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
      </Section>

      <Hr style={dividerStyle} />

      <Section style={contentSection}>
        <Text style={paragraphStyle}><strong style={strongStyle}>What's Next?</strong></Text>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            Our team will review your listing within 24-48 hours
          </li>
          <li style={listItemStyle}>
            You'll receive payment instructions after approval
          </li>
          <li style={listItemStyle}>
            Once paid, your listing goes live immediately
          </li>
        </ul>
      </Section>

      <Section style={ctaSection}>
        <Button
          href={addUTMToURL(`${baseUrl}/account/jobs`, utm)}
          style={primaryButtonStyle}
        >
          View My Jobs
        </Button>
      </Section>
    </BaseLayout>
  );
}
