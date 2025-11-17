import { type CollectionSharedProps, renderCollectionSharedEmail } from './collection-shared.tsx';
import {
  type ContactSubmissionAdminProps,
  renderContactSubmissionAdminEmail,
} from './contact-submission-admin.tsx';
import {
  type ContactSubmissionUserProps,
  renderContactSubmissionUserEmail,
} from './contact-submission-user.tsx';
import { type JobApprovedProps, renderJobApprovedEmail } from './job-approved.tsx';
import { type JobExpiredProps, renderJobExpiredEmail } from './job-expired.tsx';
import { type JobExpiringProps, renderJobExpiringEmail } from './job-expiring.tsx';
import {
  type JobPaymentConfirmedProps,
  renderJobPaymentConfirmedEmail,
} from './job-payment-confirmed.tsx';
import { type JobPostedProps, renderJobPostedEmail } from './job-posted.tsx';
import { type JobRejectedProps, renderJobRejectedEmail } from './job-rejected.tsx';
import { type JobSubmittedProps, renderJobSubmittedEmail } from './job-submitted.tsx';
import {
  type NewsletterWelcomeProps,
  renderNewsletterWelcomeEmail,
} from './newsletter-welcome.tsx';
import {
  type OnboardingCommunityProps,
  renderOnboardingCommunityEmail,
} from './onboarding-community.tsx';
import {
  type OnboardingGettingStartedProps,
  renderOnboardingGettingStartedEmail,
} from './onboarding-getting-started.tsx';
import {
  type OnboardingPowerTipsProps,
  renderOnboardingPowerTipsEmail,
} from './onboarding-power-tips.tsx';
import {
  type OnboardingStayEngagedProps,
  renderOnboardingStayEngagedEmail,
} from './onboarding-stay-engaged.tsx';
import { renderSignupOAuthEmail, type SignupOAuthProps } from './signup-oauth.tsx';
import { renderWeeklyDigestEmail, type WeeklyDigestProps } from './weekly-digest.tsx';

export const JOBS_FROM = 'Claude Pro Directory <jobs@mail.claudepro.directory>';
export const COMMUNITY_FROM = 'Claude Pro Directory <community@mail.claudepro.directory>';
export const HELLO_FROM = 'Claude Pro Directory <hello@mail.claudepro.directory>';
export const ONBOARDING_FROM = 'Claude Pro Directory <noreply@claudepro.directory>';
export const CONTACT_FROM = 'Claude Pro Directory <contact@mail.claudepro.directory>';

export type EmailTemplateSlug =
  | 'job-submitted'
  | 'job-approved'
  | 'job-rejected'
  | 'job-expiring'
  | 'job-expired'
  | 'job-payment-confirmed'
  | 'job-posted'
  | 'collection-shared'
  | 'newsletter-welcome'
  | 'signup-oauth'
  | 'onboarding-getting-started'
  | 'onboarding-power-tips'
  | 'onboarding-community'
  | 'onboarding-stay-engaged'
  | 'weekly-digest'
  | 'contact-submission-admin'
  | 'contact-submission-user';

export type EmailTemplateCategory = 'jobs' | 'community' | 'newsletter' | 'onboarding' | 'contact';

export interface EmailTemplateDefinition<TProps> {
  slug: EmailTemplateSlug;
  displayName: string;
  description: string;
  category: EmailTemplateCategory;
  from: string;
  replyTo?: string;
  buildSubject: (props: unknown) => string;
  buildSampleData: () => TProps;
  render: (props: unknown) => Promise<string>;
}

const now = new Date('2025-01-15T12:00:00.000Z');
const iso = (date: Date) => date.toISOString();

export const EMAIL_TEMPLATE_MANIFEST: EmailTemplateDefinition<unknown>[] = [
  {
    slug: 'job-submitted',
    displayName: 'Job – Submitted',
    description: 'Confirms receipt of a newly submitted job listing and outlines next steps.',
    category: 'jobs',
    from: JOBS_FROM,
    buildSubject: (props: unknown) => `Job Submitted: ${(props as JobSubmittedProps).jobTitle}`,
    buildSampleData: (): JobSubmittedProps => ({
      jobTitle: 'Senior Research Engineer',
      company: 'Anthropic Labs',
      userEmail: 'talentlead@example.com',
      jobId: 'job_12345',
    }),
    render: (props: unknown) => {
      return renderJobSubmittedEmail(props as JobSubmittedProps);
    },
  },
  {
    slug: 'job-approved',
    displayName: 'Job – Approved',
    description: 'Sent when a job has been reviewed and payment is required before publishing.',
    category: 'jobs',
    from: JOBS_FROM,
    buildSubject: (props: unknown) => `Job Approved: ${(props as JobApprovedProps).jobTitle}`,
    buildSampleData: (): JobApprovedProps => ({
      jobTitle: 'Senior Research Engineer',
      company: 'Anthropic Labs',
      userEmail: 'talentlead@example.com',
      jobId: 'job_12345',
      plan: 'featured',
      paymentAmount: 399,
      paymentUrl: 'https://claudepro.directory/jobs/job_12345/pay',
    }),
    render: (props: unknown) => {
      return renderJobApprovedEmail(props as JobApprovedProps);
    },
  },
  {
    slug: 'job-rejected',
    displayName: 'Job – Revisions Needed',
    description: 'Notifies the poster that edits are required before the job can go live.',
    category: 'jobs',
    from: JOBS_FROM,
    buildSubject: (props: unknown) => {
      const typedProps = props as JobRejectedProps;
      return `Action Required: Update Your Job Posting - ${typedProps.jobTitle}`;
    },
    buildSampleData: (): JobRejectedProps => ({
      jobTitle: 'Senior Research Engineer',
      company: 'Anthropic Labs',
      userEmail: 'talentlead@example.com',
      jobId: 'job_12345',
      rejectionReason: 'Please add salary range and clarify required Claude experience.',
    }),
    render: (props: unknown) => {
      return renderJobRejectedEmail(props as JobRejectedProps);
    },
  },
  {
    slug: 'job-expiring',
    displayName: 'Job – Expiring Soon',
    description: 'Reminder that a job listing is about to expire with quick renewal links.',
    category: 'jobs',
    from: JOBS_FROM,
    buildSubject: (props: unknown) => {
      const typedProps = props as JobExpiringProps;
      return `Expiring Soon: ${typedProps.jobTitle} (${typedProps.daysRemaining} days remaining)`;
    },
    buildSampleData: (): JobExpiringProps => ({
      jobTitle: 'Senior Research Engineer',
      company: 'Anthropic Labs',
      userEmail: 'talentlead@example.com',
      jobId: 'job_12345',
      expiresAt: iso(new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)),
      daysRemaining: 3,
      renewalUrl: 'https://claudepro.directory/account/jobs/job_12345/renew',
    }),
    render: (props: unknown) => {
      return renderJobExpiringEmail(props as JobExpiringProps);
    },
  },
  {
    slug: 'job-expired',
    displayName: 'Job – Expired',
    description: 'Performance summary after a job expires with a CTA to repost.',
    category: 'jobs',
    from: JOBS_FROM,
    buildSubject: (props: unknown) => `Job Listing Expired: ${(props as JobExpiredProps).jobTitle}`,
    buildSampleData: (): JobExpiredProps => ({
      jobTitle: 'Senior Research Engineer',
      company: 'Anthropic Labs',
      userEmail: 'talentlead@example.com',
      jobId: 'job_12345',
      expiredAt: iso(now),
      viewCount: 1420,
      clickCount: 287,
      repostUrl: 'https://claudepro.directory/account/jobs/job_12345/repost',
    }),
    render: (props: unknown) => {
      return renderJobExpiredEmail(props as JobExpiredProps);
    },
  },
  {
    slug: 'job-payment-confirmed',
    displayName: 'Job – Payment Confirmed',
    description: 'Confirms payment receipt, highlights analytics, and links to the live listing.',
    category: 'jobs',
    from: JOBS_FROM,
    buildSubject: (props: unknown) =>
      `Your Job is Live: ${(props as JobPaymentConfirmedProps).jobTitle}`,
    buildSampleData: (): JobPaymentConfirmedProps => ({
      jobTitle: 'Senior Research Engineer',
      company: 'Anthropic Labs',
      userEmail: 'talentlead@example.com',
      jobId: 'job_12345',
      jobSlug: 'anthropic-senior-research-engineer',
      plan: 'featured',
      paymentAmount: 399,
      paymentDate: iso(new Date(now.getTime() - 6 * 60 * 60 * 1000)),
      expiresAt: iso(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)),
    }),
    render: (props: unknown) => {
      return renderJobPaymentConfirmedEmail(props as JobPaymentConfirmedProps);
    },
  },
  {
    slug: 'job-posted',
    displayName: 'Job – Posted via Transactional Endpoint',
    description: 'Transactional email confirming that a listing is live.',
    category: 'jobs',
    from: JOBS_FROM,
    buildSubject: (props: unknown) =>
      `Your job posting "${(props as JobPostedProps).jobTitle}" is now live!`,
    buildSampleData: (): JobPostedProps => ({
      jobTitle: 'Senior Research Engineer',
      company: 'Anthropic Labs',
      userEmail: 'talentlead@example.com',
      jobSlug: 'anthropic-senior-research-engineer',
    }),
    render: (props: unknown) => {
      return renderJobPostedEmail(props as JobPostedProps);
    },
  },
  {
    slug: 'collection-shared',
    displayName: 'Collection Shared',
    description: 'Notifies recipients when a community collection has been shared with them.',
    category: 'community',
    from: COMMUNITY_FROM,
    replyTo: 'community@mail.claudepro.directory',
    buildSubject: (props: unknown) => {
      const typedProps = props as CollectionSharedProps;
      return `${typedProps.senderName} shared a collection with you`;
    },
    buildSampleData: (): CollectionSharedProps => ({
      collectionName: 'Claude Agents for Product Teams',
      collectionDescription: 'Curated automations for research, planning, and content ops.',
      senderName: 'Mia Chen',
      recipientEmail: 'newmember@example.com',
      collectionSlug: 'product-team-agents',
      senderSlug: 'mia',
      itemCount: 12,
    }),
    render: (props: unknown) => {
      return renderCollectionSharedEmail(props as CollectionSharedProps);
    },
  },
  {
    slug: 'newsletter-welcome',
    displayName: 'Newsletter Welcome',
    description: 'Welcome email for new subscribers with core CTAs.',
    category: 'newsletter',
    from: HELLO_FROM,
    buildSubject: () => 'Welcome to Claude Pro Directory! 🎉',
    buildSampleData: (): NewsletterWelcomeProps => ({
      email: 'subscriber@example.com',
      source: 'footer',
    }),
    render: (props: unknown) => {
      return renderNewsletterWelcomeEmail(props as NewsletterWelcomeProps);
    },
  },
  {
    slug: 'signup-oauth',
    displayName: 'OAuth Sign-Up',
    description: 'Welcome email sent when a user signs up via OAuth (Google, GitHub, Discord).',
    category: 'onboarding',
    from: HELLO_FROM,
    buildSubject: () => 'Welcome to Claude Pro Directory! 🎉',
    buildSampleData: (): SignupOAuthProps => ({
      email: 'user@example.com',
      provider: 'google',
    }),
    render: (props: unknown) => {
      return renderSignupOAuthEmail(props as SignupOAuthProps);
    },
  },
  {
    slug: 'onboarding-getting-started',
    displayName: 'Onboarding – Step 2',
    description: 'Second touch in the onboarding series focused on first interactions.',
    category: 'onboarding',
    from: ONBOARDING_FROM,
    buildSubject: () => 'Getting Started with Claude Pro Directory',
    buildSampleData: (): OnboardingGettingStartedProps => ({ email: 'founder@example.com' }),
    render: (props: unknown) =>
      renderOnboardingGettingStartedEmail(props as OnboardingGettingStartedProps),
  },
  {
    slug: 'onboarding-power-tips',
    displayName: 'Onboarding – Step 3',
    description: 'Advanced workflow tips for power users.',
    category: 'onboarding',
    from: ONBOARDING_FROM,
    buildSubject: () => 'Power User Tips for Claude',
    buildSampleData: (): OnboardingPowerTipsProps => ({ email: 'founder@example.com' }),
    render: (props: unknown) => {
      return renderOnboardingPowerTipsEmail(props as OnboardingPowerTipsProps);
    },
  },
  {
    slug: 'onboarding-community',
    displayName: 'Onboarding – Step 4',
    description: 'Encourages users to join and contribute to the community.',
    category: 'onboarding',
    from: ONBOARDING_FROM,
    buildSubject: () => 'Join the Claude Pro Community',
    buildSampleData: (): OnboardingCommunityProps => ({ email: 'founder@example.com' }),
    render: (props: unknown) => {
      return renderOnboardingCommunityEmail(props as OnboardingCommunityProps);
    },
  },
  {
    slug: 'onboarding-stay-engaged',
    displayName: 'Onboarding – Step 5',
    description: 'Re-engagement touch highlighting recent updates and feedback loops.',
    category: 'onboarding',
    from: ONBOARDING_FROM,
    buildSubject: () => 'Stay Engaged with ClaudePro',
    buildSampleData: (): OnboardingStayEngagedProps => ({ email: 'founder@example.com' }),
    render: (props: unknown) =>
      renderOnboardingStayEngagedEmail(props as OnboardingStayEngagedProps),
  },
  {
    slug: 'weekly-digest',
    displayName: 'Weekly Digest',
    description: 'Weekly roundup of new, trending, and personalized content.',
    category: 'newsletter',
    from: HELLO_FROM,
    buildSubject: (props: unknown) => `This Week in Claude: ${(props as WeeklyDigestProps).weekOf}`,
    buildSampleData: (): WeeklyDigestProps => ({
      email: 'subscriber@example.com',
      weekOf: 'January 13, 2025',
      newContent: [
        {
          title: 'Claude Content Strategist',
          description: 'Plan editorial calendars with live data pulls.',
          category: 'agents',
          slug: 'claude-content-strategist',
          url: 'https://claudepro.directory/agents/claude-content-strategist',
        },
        {
          title: 'Legal Research Copilot',
          description: 'Summaries plus precedent cross-references.',
          category: 'workflows',
          slug: 'legal-research-copilot',
          url: 'https://claudepro.directory/workflows/legal-research-copilot',
        },
      ],
      trendingContent: [
        {
          title: 'MCP Notion Sync',
          description: 'Bi-directional Notion sync with Claude.',
          category: 'mcp',
          slug: 'mcp-notion-sync',
          url: 'https://claudepro.directory/mcp/mcp-notion-sync',
          viewCount: 18250,
        },
        {
          title: 'Growth Analyst Agent',
          description: 'Automates experimentation analysis.',
          category: 'agents',
          slug: 'growth-analyst-agent',
          url: 'https://claudepro.directory/agents/growth-analyst-agent',
          viewCount: 13420,
        },
      ],
      personalizedContent: [
        {
          title: 'Config Projections Toolkit',
          description: 'Forecasts costs for large deployments.',
          category: 'tools',
          slug: 'config-projections-toolkit',
          url: 'https://claudepro.directory/tools/config-projections-toolkit',
        },
      ],
    }),
    render: (props: unknown) => {
      return renderWeeklyDigestEmail(props as WeeklyDigestProps);
    },
  },
  {
    slug: 'contact-submission-admin',
    displayName: 'Contact – Admin Notification',
    description: 'Notifies admins of new contact form submissions via terminal.',
    category: 'contact',
    from: CONTACT_FROM,
    replyTo: undefined,
    buildSubject: (props: unknown) => {
      const typedProps = props as ContactSubmissionAdminProps;
      return `New Contact: ${typedProps.category} - ${typedProps.name}`;
    },
    buildSampleData: (): ContactSubmissionAdminProps => ({
      submissionId: 'sub_12345',
      name: 'Sarah Johnson',
      email: 'sarah@techcorp.com',
      category: 'partnership',
      message:
        'Hi! We love Claude Pro Directory and would like to discuss a potential partnership opportunity.',
      submittedAt: now.toISOString(),
    }),
    render: (props: unknown) =>
      renderContactSubmissionAdminEmail(props as ContactSubmissionAdminProps),
  },
  {
    slug: 'contact-submission-user',
    displayName: 'Contact – User Confirmation',
    description: 'Confirms receipt of contact form submission.',
    category: 'contact',
    from: HELLO_FROM,
    buildSubject: () => 'We received your message!',
    buildSampleData: (): ContactSubmissionUserProps => ({
      name: 'Sarah Johnson',
      category: 'partnership',
    }),
    render: (props: unknown) =>
      renderContactSubmissionUserEmail(props as ContactSubmissionUserProps),
  },
];

export function getEmailTemplateDefinition(slug: EmailTemplateSlug) {
  return EMAIL_TEMPLATE_MANIFEST.find((entry) => entry.slug === slug);
}
