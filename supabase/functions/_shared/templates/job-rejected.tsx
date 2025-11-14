/**
 * Job Rejected Email Template
 * Sent when admin rejects a job listing with reason and edit option
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
  paragraphStyle,
  primaryButtonStyle,
  strongStyle,
  subheadingStyle,
} from '../utils/email/common-styles.ts';
import { JobDetailsSection } from '../utils/email/components/job.tsx';

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

      <Section style={ctaSection}>
        <Button href={addUTMToURL(editUrl, utm)} style={primaryButtonStyle}>
          Edit Job Listing
        </Button>
      </Section>
    </BaseLayout>
  );
}

export function renderJobRejectedEmail(props: JobRejectedProps) {
  return renderEmailTemplate(JobRejected, props);
}
