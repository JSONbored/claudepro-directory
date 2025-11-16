/**
 * Job Rejected Email Template
 * Sent when admin rejects a job listing with reason and edit option
 */

import React from 'npm:react@18.3.1';
import { Hr, Section, Text } from 'npm:@react-email/components@0.0.22';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates.ts';
import { BaseLayout } from '../base-template.tsx';
import {
  contentSection,
  dividerStyle,
  headingStyle,
  paragraphStyle,
  strongStyle,
  subheadingStyle,
} from '../common-styles.ts';
import { JobDetailsSection } from '../components/job.tsx';
import { EmailCtaSection } from '../components/cta.tsx';

export interface JobRejectedProps {
  jobTitle: string;
  company: string;
  userEmail: string;
  jobId: string;
  rejectionReason?: string;
}

export function JobRejected({
  jobTitle,
  company,
  userEmail,
  jobId,
  rejectionReason,
}: JobRejectedProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME;
  const editUrl = `${baseUrl}/account/jobs/${jobId}/edit`;

  return (
    <BaseLayout
      preview={`Update required for your job posting "${jobTitle}"`}
      utm={utm}
    >
      <Section style={contentSection}>
        <Text style={headingStyle}>Job Listing Requires Updates</Text>
        <Text style={subheadingStyle}>
          We've reviewed your job posting and it needs some adjustments before we can publish it.
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      <JobDetailsSection
        items={[
          { label: 'Position', value: jobTitle },
          { label: 'Company', value: company },
        ]}
      />

      {rejectionReason && (
        <>
          <Hr style={dividerStyle} />
          <Section style={contentSection}>
            <Text style={paragraphStyle}>
              <strong style={strongStyle}>Feedback from our team:</strong>
            </Text>
            <Text style={paragraphStyle}>{rejectionReason}</Text>
          </Section>
        </>
      )}

      <Hr style={dividerStyle} />

      <Section style={contentSection}>
        <Text style={paragraphStyle}>
          Please review the feedback above, make the necessary updates, and resubmit your listing.
          We're here to help you get published!
        </Text>
      </Section>

        <EmailCtaSection
          utm={utm}
          buttons={[
            {
              preset: 'primaryDirectory',
              variant: 'primary',
              overrides: { href: editUrl, label: 'Edit Job Listing', contentKey: 'edit_job_cta' },
            },
          ]}
        />
    </BaseLayout>
  );
}

