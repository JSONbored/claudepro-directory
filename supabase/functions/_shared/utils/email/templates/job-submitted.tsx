/**
 * Job Submitted Email Template
 * Sent when a user submits a new job listing for review
 */

import React from 'npm:react@18.3.1';
import { Hr, Section, Text } from 'npm:@react-email/components@0.0.22';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates.ts';
import { BaseLayout, renderEmailTemplate } from '../base-template.tsx';
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
import { EmailCtaSection } from '../components/cta.tsx';

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

      <JobDetailsSection
        items={[
          { label: 'Position', value: jobTitle },
          { label: 'Company', value: company },
        ]}
      />

      <Hr style={dividerStyle} />

      <Section style={contentSection}>
        <Text style={paragraphStyle}>
          <strong style={strongStyle}>What's Next?</strong>
        </Text>
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

        <EmailCtaSection
          utm={utm}
          buttons={[
            {
              preset: 'primaryDirectory',
              variant: 'primary',
              overrides: {
                href: `${baseUrl}/account/jobs`,
                label: 'View My Jobs',
                contentKey: 'view_jobs_cta',
              },
            },
          ]}
        />
    </BaseLayout>
  );
}

export function renderJobSubmittedEmail(props: JobSubmittedProps) {
  return renderEmailTemplate(JobSubmitted, props);
}
