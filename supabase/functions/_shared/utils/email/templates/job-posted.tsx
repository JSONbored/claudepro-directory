/**
 * Job Posted Email Template
 * Sent when a job listing is approved and goes live
 */

import React from 'npm:react@18.3.1';
import { Button, Hr, Section, Text } from 'npm:@react-email/components@0.0.22';
import { buildEmailCtaUrl } from '../cta.ts';
import { EMAIL_UTM_TEMPLATES } from '../utm-templates.ts';
import { BaseLayout, renderEmailTemplate } from '../base-template.tsx';
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
} from '../common-styles.ts';
import { JobDetailsSection } from '../components/job.tsx';

export interface JobPostedProps {
  jobTitle: string;
  company: string;
  userEmail: string;
  jobSlug: string;
}

export function JobPosted({ jobTitle, company, userEmail, jobSlug }: JobPostedProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.ONBOARDING_WELCOME;
  const jobUrl = `${baseUrl}/jobs/${jobSlug}`;

  return (
    <BaseLayout
      preview={`Your job posting "${jobTitle}" at ${company} is now live!`}
      utm={utm}
    >
      <Section style={contentSection}>
        <Text style={headingStyle}>Your Job Posting is Live! 🎉</Text>
        <Text style={subheadingStyle}>
          Your job listing has been approved and is now visible to the ClaudePro community.
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
            Your listing is now visible in our jobs directory
          </li>
          <li style={listItemStyle}>
            Qualified candidates can start applying immediately
          </li>
          <li style={listItemStyle}>
            Track views and applications in your dashboard
          </li>
          <li style={listItemStyle}>
            You'll receive notifications when candidates apply
          </li>
        </ul>
      </Section>

        <Section style={ctaSection}>
          <Button href={buildEmailCtaUrl(jobUrl, utm)} style={primaryButtonStyle}>
            View Job Listing
          </Button>
        </Section>

      <Hr style={dividerStyle} />

      <Section style={contentSection}>
        <Text style={paragraphStyle}>
          Need to make changes? Visit your{' '}
            <a
              href={buildEmailCtaUrl(`${baseUrl}/account/jobs`, utm)}
              style={{ color: '#ff6b35' }}
            >
            Jobs Dashboard
          </a>{' '}
          to edit or pause your listing anytime.
        </Text>
      </Section>
    </BaseLayout>
  );
}

export function renderJobPostedEmail(props: JobPostedProps) {
  return renderEmailTemplate(JobPosted, props);
}
