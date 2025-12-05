/**
 * Email Safety Guard
 *
 * Prevents accidental email sends in development/test environments.
 * This is CRITICAL for protecting subscriber lists and preventing spam.
 *
 * Features:
 * - Blocks all emails in development mode by default
 * - Allows whitelisted test emails
 * - Provides detailed logging of "would-be-sent" emails
 * - Environment-based configuration
 * - Escape hatch for integration testing
 */

import { logger as pinoLogger } from '../../logging/server';

/**
 * Email safety configuration from environment
 */
export interface EmailSafetyConfig {
  /**
   * Is the application running in production mode?
   */
  isProduction: boolean;

  /**
   * Should emails be blocked in non-production environments?
   * Default: true (emails are blocked in dev/staging)
   */
  blockNonProductionEmails: boolean;

  /**
   * Explicit override to allow emails in development
   * Set ALLOW_DEV_EMAILS=true to enable
   */
  allowDevEmails: boolean;

  /**
   * List of whitelisted email addresses that CAN receive emails in dev
   * These are typically developer emails for testing
   */
  whitelistedEmails: string[];

  /**
   * List of whitelisted email domains that CAN receive emails in dev
   * e.g., @your-company.com
   */
  whitelistedDomains: string[];
}

/**
 * Load email safety configuration from environment
 */
export function getEmailSafetyConfig(): EmailSafetyConfig {
  const nodeEnv = process.env['NODE_ENV'];
  const vercelEnv = process.env['VERCEL_ENV'];

  // Determine if production
  const isProduction =
    nodeEnv === 'production' ||
    vercelEnv === 'production';

  // Check for dev email override
  const allowDevEmails =
    process.env['ALLOW_DEV_EMAILS'] === 'true' ||
    process.env['ALLOW_DEV_EMAILS'] === '1';

  // Parse whitelisted emails (comma-separated)
  const whitelistedEmails = (process.env['DEV_EMAIL_WHITELIST'] || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Parse whitelisted domains (comma-separated)
  const whitelistedDomains = (process.env['DEV_EMAIL_DOMAIN_WHITELIST'] || '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  return {
    isProduction,
    blockNonProductionEmails: !isProduction,
    allowDevEmails,
    whitelistedEmails,
    whitelistedDomains,
  };
}

/**
 * Result of email safety check
 */
export interface EmailSafetyCheckResult {
  /**
   * Whether the email should be sent
   */
  allowed: boolean;

  /**
   * Reason for blocking (if blocked)
   */
  reason?: string;

  /**
   * Was the email whitelisted?
   */
  whitelisted?: boolean;
}

/**
 * Check if an email is safe to send
 *
 * @param recipientEmail - The email address to check
 * @returns Result indicating if email should be sent
 */
export function checkEmailSafety(recipientEmail: string): EmailSafetyCheckResult {
  const config = getEmailSafetyConfig();
  const normalizedEmail = recipientEmail.toLowerCase().trim();

  // In production, always allow
  if (config.isProduction) {
    return { allowed: true };
  }

  // If dev emails are explicitly allowed
  if (config.allowDevEmails) {
    return { allowed: true, reason: 'ALLOW_DEV_EMAILS is enabled' };
  }

  // Check email whitelist
  if (config.whitelistedEmails.includes(normalizedEmail)) {
    return { allowed: true, whitelisted: true, reason: 'Email is whitelisted' };
  }

  // Check domain whitelist
  const emailDomain = normalizedEmail.split('@')[1];
  if (emailDomain && config.whitelistedDomains.includes(emailDomain)) {
    return { allowed: true, whitelisted: true, reason: `Domain ${emailDomain} is whitelisted` };
  }

  // Block by default in non-production
  return {
    allowed: false,
    reason: `Email blocked in ${process.env['NODE_ENV'] || 'development'} environment. ` +
      'Set ALLOW_DEV_EMAILS=true or add to DEV_EMAIL_WHITELIST to override.',
  };
}

/**
 * Email data for logging blocked emails
 */
export interface BlockedEmailLog {
  to: string | string[];
  from: string;
  subject: string;
  html?: string | undefined;
  tags?: Array<{ name: string; value: string }> | undefined;
}

/**
 * Log a blocked email (for debugging)
 *
 * @param emailData - The email that would have been sent
 * @param reason - Why the email was blocked
 */
export function logBlockedEmail(emailData: BlockedEmailLog, reason: string): void {
  const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to];

  pinoLogger.info('📧 Email BLOCKED (dev mode)', {
    operation: 'email-safety-block',
    reason,
    to: recipients.join(', '),
    from: emailData.from,
    subject: emailData.subject,
    tags: emailData.tags?.map((t) => `${t.name}=${t.value}`).join(', '),
    htmlPreview: emailData.html ? emailData.html.slice(0, 200) + '...' : undefined,
    environment: process.env['NODE_ENV'] || 'development',
    tip: 'To send real emails in dev, set ALLOW_DEV_EMAILS=true or add email to DEV_EMAIL_WHITELIST',
  });
}

/**
 * Wrapper for sendEmail that enforces safety checks
 *
 * Use this instead of calling sendEmail directly to ensure
 * emails are not accidentally sent in development.
 *
 * @example
 * ```typescript
 * const result = await safeSendEmail({
 *   to: user.email,
 *   from: 'hello@example.com',
 *   subject: 'Welcome!',
 *   html: '<p>Hello!</p>',
 * });
 *
 * if (result.blocked) {
 *   console.log('Email was blocked:', result.reason);
 * }
 * ```
 */
export interface SafeEmailResult {
  /**
   * Was the email blocked?
   */
  blocked: boolean;

  /**
   * Reason for blocking (if blocked)
   */
  reason?: string | undefined;

  /**
   * Email ID from Resend (if sent)
   */
  emailId?: string | null | undefined;

  /**
   * Error from Resend (if failed)
   */
  error?: string | null | undefined;
}

/**
 * Type for the actual sendEmail function
 */
type SendEmailFn = (
  options: {
    to: string;
    subject: string;
    html: string;
    from: string;
    tags?: Array<{ name: string; value: string }>;
    replyTo?: string;
  },
  timeoutMessage?: string
) => Promise<{ data: { id: string } | null; error: { message: string } | null }>;

/**
 * Create a safe email sender that wraps the actual sendEmail function
 *
 * @param sendEmailFn - The actual sendEmail function from resend.ts
 * @returns A safe wrapper function
 */
export function createSafeEmailSender(sendEmailFn: SendEmailFn) {
  return async function safeSendEmail(
    options: {
      to: string;
      subject: string;
      html: string;
      from: string;
      tags?: Array<{ name: string; value: string }>;
      replyTo?: string;
    },
    timeoutMessage?: string
  ): Promise<SafeEmailResult> {
    // Check if email is safe to send
    const safetyCheck = checkEmailSafety(options.to);

    if (!safetyCheck.allowed) {
      // Log the blocked email for debugging
      logBlockedEmail(
        {
          to: options.to,
          from: options.from,
          subject: options.subject,
          html: options.html,
          tags: options.tags,
        },
        safetyCheck.reason || 'Blocked in non-production environment'
      );

      return {
        blocked: true,
        reason: safetyCheck.reason,
        emailId: null,
      };
    }

    // Email is allowed - send it
    const { data, error } = await sendEmailFn(options, timeoutMessage);

    return {
      blocked: false,
      emailId: data?.id ?? null,
      error: error?.message ?? null,
    };
  };
}

/**
 * Check multiple recipients and return lists of allowed/blocked
 */
export function checkMultipleRecipients(emails: string[]): {
  allowed: string[];
  blocked: Array<{ email: string; reason: string }>;
} {
  const allowed: string[] = [];
  const blocked: Array<{ email: string; reason: string }> = [];

  for (const email of emails) {
    const result = checkEmailSafety(email);
    if (result.allowed) {
      allowed.push(email);
    } else {
      blocked.push({ email, reason: result.reason || 'Blocked' });
    }
  }

  return { allowed, blocked };
}
