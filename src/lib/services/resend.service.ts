/**
 * Production-Grade Resend Email Service
 * Handles newsletter subscriptions, contact management, and email sending via Resend API
 *
 * Features:
 * - Type-safe API integration
 * - React Email template support
 * - Error handling and logging
 * - Graceful degradation when API key missing
 * - Production-ready with comprehensive error messages
 */

import type { ReactElement } from 'react';
import { Resend } from 'resend';
import { z } from 'zod';
import { renderEmail } from '@/src/emails/utils/render';
import { logger } from '@/src/lib/logger';
import { env } from '@/src/lib/schemas/env.schema';
import { batchMapSettled } from '@/src/lib/utils/batch.utils';

/**
 * Resend API response schemas for type safety
 * Based on official API docs: https://resend.com/docs/api-reference
 *
 * Comprehensive validation for all external API responses to ensure type safety
 * and catch unexpected API changes early.
 */

// Contact schema - contacts.create response
const resendContactSchema = z.object({
  object: z.literal('contact'),
  id: z.string().min(1),
});

// Error schema - any error response
const resendErrorSchema = z.object({
  name: z.string(),
  message: z.string(),
});

// Email send response - emails.send success response
const resendEmailSendSchema = z.object({
  id: z.string().min(1),
});

// Contact list item schema - single contact in list
const resendContactListItemSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  created_at: z.string().optional(),
  unsubscribed: z.boolean().optional(),
});

// Contact list response with pagination - contacts.list response
const resendContactListResponseSchema = z.object({
  data: z.array(resendContactListItemSchema),
  next_cursor: z.string().nullable().optional(),
});

// Internal types for Zod inference (not exported)
type ResendError = z.infer<typeof resendErrorSchema>;

/**
 * Service response types
 */
export interface SubscribeResponse {
  success: boolean;
  contactId?: string;
  message: string;
  error?: string;
}

/**
 * Email sending result
 */
export interface EmailSendResult {
  success: boolean;
  emailId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * ResendService - Newsletter subscription management
 *
 * Usage:
 * ```ts
 * const result = await resendService.subscribe('user@example.com');
 * if (result.success) {
 *   console.log('Subscribed:', result.contactId);
 * }
 * ```
 */
class ResendService {
  private client: Resend | null = null;
  private readonly FROM_EMAIL = 'hello@mail.claudepro.directory';
  private readonly AUDIENCE_ID: string | undefined;

  constructor() {
    // Initialize Resend client if API key is available
    if (env.RESEND_API_KEY) {
      this.client = new Resend(env.RESEND_API_KEY);
      this.AUDIENCE_ID = env.RESEND_AUDIENCE_ID;

      if (!this.AUDIENCE_ID) {
        logger.warn(
          'RESEND_AUDIENCE_ID not configured - contacts will need manual audience assignment'
        );
      }
    } else {
      logger.warn('RESEND_API_KEY not configured - email service disabled');
    }
  }

  /**
   * Subscribe email to newsletter
   *
   * @param email - Subscriber email address (already validated)
   * @param metadata - Optional metadata for tracking (source, referrer, etc.)
   * @returns Promise with subscription result
   */
  async subscribe(
    email: string,
    metadata?: {
      source?: string;
      referrer?: string;
    }
  ): Promise<SubscribeResponse> {
    // Check if service is enabled
    if (!this.client) {
      logger.error('Resend service not initialized - missing API key');
      return {
        success: false,
        message: 'Email service is not configured',
        error: 'RESEND_API_KEY missing',
      };
    }

    // Verify audience ID is configured
    if (!this.AUDIENCE_ID) {
      logger.error('RESEND_AUDIENCE_ID not configured - cannot create contact');
      return {
        success: false,
        message: 'Newsletter service is not fully configured',
        error: 'RESEND_AUDIENCE_ID missing',
      };
    }

    try {
      // Create or update contact in Resend
      // Note: Resend automatically handles duplicates (updates existing contact)
      const response = await this.client.contacts.create({
        email,
        unsubscribed: false,
        audienceId: this.AUDIENCE_ID,
      });

      // Check for API errors first (Resend SDK returns either {data, error: null} or {data: null, error})
      if (response.error) {
        logger.error('Resend API returned error', undefined, {
          errorName: response.error.name || 'ResendError',
          errorMessage: response.error.message || String(response.error),
        });

        // Handle specific error cases
        const errorMessage = response.error.message || String(response.error);

        if (errorMessage.includes('already exists')) {
          return {
            success: true, // Treat duplicate as success (idempotent)
            message: 'Email already subscribed',
          };
        }

        if (errorMessage.includes('invalid email') || errorMessage.includes('validation')) {
          return {
            success: false,
            message: 'Invalid email address',
            error: 'Email validation failed',
          };
        }

        return {
          success: false,
          message: 'Subscription failed - please try again',
          error: errorMessage,
        };
      }

      // Type-safe response parsing
      const contact = resendContactSchema.safeParse(response.data);

      if (contact.success) {
        logger.info('Newsletter subscription successful', {
          contactId: contact.data.id,
          ...(metadata?.source && { source: metadata.source }),
          ...(metadata?.referrer && { referrer: metadata.referrer }),
        });

        return {
          success: true,
          contactId: contact.data.id,
          message: 'Successfully subscribed to newsletter',
        };
      }

      // Response doesn't match expected schema - log detailed error
      logger.error('Resend API response schema validation failed', undefined, {
        responseData: JSON.stringify(response.data),
        zodErrors: contact.error ? JSON.stringify(contact.error.format()) : 'No validation errors',
        expectedSchema: 'object: contact, id: string',
      });

      return {
        success: false,
        message: 'Subscription failed - unexpected response',
        error: 'Invalid API response format',
      };
    } catch (error) {
      // Handle Resend API errors
      const errorDetails = this.parseError(error);

      logger.error('Newsletter subscription failed', error instanceof Error ? error : undefined, {
        errorName: errorDetails.name,
        errorMessage: errorDetails.message,
        errorType: typeof error,
        errorString: String(error),
        ...(metadata?.source && { source: metadata.source }),
      });

      // Check for specific error cases
      if (errorDetails.message.includes('already exists')) {
        return {
          success: true, // Treat duplicate as success (idempotent)
          message: 'Email already subscribed',
        };
      }

      if (errorDetails.message.includes('invalid email')) {
        return {
          success: false,
          message: 'Invalid email address',
          error: 'Email validation failed',
        };
      }

      // Generic error response
      return {
        success: false,
        message: 'Subscription failed - please try again',
        error: errorDetails.message,
      };
    }
  }

  /**
   * Remove contact from audience
   *
   * @param email - Email address to remove
   * @param audienceId - Optional audience ID (defaults to env RESEND_AUDIENCE_ID)
   * @returns Success result
   */
  async removeContact(
    email: string,
    audienceId?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!(this.client && this.AUDIENCE_ID)) {
      return {
        success: false,
        error: 'Resend is not enabled - missing API key or audience ID',
      };
    }

    try {
      const targetAudienceId = audienceId || this.AUDIENCE_ID;

      await this.client.contacts.remove({
        audienceId: targetAudienceId,
        email,
      });

      logger.info('Contact removed from audience', {
        audienceId: targetAudienceId,
      });

      return { success: true, message: 'Contact removed successfully' };
    } catch (error) {
      const errorDetails = this.parseError(error);
      logger.error('Failed to remove contact', error instanceof Error ? error : undefined, {
        errorName: errorDetails.name,
        errorMessage: errorDetails.message,
      });

      return {
        success: false,
        error: errorDetails.message,
      };
    }
  }

  /**
   * Check if service is enabled and configured
   */
  isEnabled(): boolean {
    return this.client !== null;
  }

  /**
   * Get service status for health checks
   */
  getStatus(): { enabled: boolean; fromEmail: string } {
    return {
      enabled: this.isEnabled(),
      fromEmail: this.FROM_EMAIL,
    };
  }

  /**
   * Send email using React Email template
   *
   * @param to - Recipient email address(es)
   * @param subject - Email subject line
   * @param template - React Email component
   * @param options - Additional email options
   * @returns Email send result
   *
   * @example
   * ```ts
   * import { NewsletterWelcome } from '@/src/emails/templates/newsletter-welcome';
   *
   * const result = await resendService.sendEmail(
   *   'user@example.com',
   *   'Welcome to ClaudePro Directory!',
   *   <NewsletterWelcome email="user@example.com" source="signup" />
   * );
   * ```
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    template: ReactElement,
    options?: {
      from?: string;
      replyTo?: string;
      tags?: Array<{ name: string; value: string }>;
    }
  ): Promise<EmailSendResult> {
    // Check if service is enabled
    if (!this.client) {
      logger.error('Resend service not initialized - missing API key');
      return {
        success: false,
        error: 'Email service is not configured',
      };
    }

    try {
      // Render React template to HTML
      const rendered = await renderEmail(template, { plainText: true });

      if (!(rendered.success && rendered.html)) {
        logger.error('Failed to render email template', undefined, {
          ...(rendered.error && { error: rendered.error }),
        });

        return {
          success: false,
          error: rendered.error || 'Failed to render email template',
        };
      }

      // Send email via Resend
      const response = await this.client.emails.send({
        from: options?.from || this.FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: rendered.html,
        ...(rendered.text && { text: rendered.text }),
        ...(options?.replyTo && { replyTo: options.replyTo }),
        ...(options?.tags && { tags: options.tags }),
      });

      // Check for API errors
      if (response.error) {
        logger.error('Failed to send email via Resend', undefined, {
          errorName: response.error.name || 'ResendError',
          errorMessage: response.error.message || String(response.error),
          recipients: Array.isArray(to) ? to.join(', ') : to,
          subject,
        });

        return {
          success: false,
          error: response.error.message || String(response.error),
        };
      }

      // Validate email send response with Zod
      const emailSendResult = resendEmailSendSchema.safeParse(response.data);

      if (!emailSendResult.success) {
        logger.error('Resend email send response validation failed', undefined, {
          responseData: JSON.stringify(response.data),
          zodErrors: JSON.stringify(emailSendResult.error.format()),
          expectedSchema: 'id: string (min 1)',
        });

        return {
          success: false,
          error: 'Invalid API response format',
        };
      }

      // Success - email sent and validated
      logger.info('Email sent successfully', {
        emailId: emailSendResult.data.id,
        recipients: Array.isArray(to) ? to.join(', ') : to,
        subject,
      });

      return {
        success: true,
        emailId: emailSendResult.data.id,
        metadata: {
          recipients: to,
          subject,
        },
      };
    } catch (error) {
      const errorDetails = this.parseError(error);

      logger.error('Email sending failed', error instanceof Error ? error : undefined, {
        errorName: errorDetails.name,
        errorMessage: errorDetails.message,
        recipients: Array.isArray(to) ? to.join(', ') : to,
        subject,
      });

      return {
        success: false,
        error: errorDetails.message,
      };
    }
  }

  /**
   * Get all contacts from audience
   *
   * @param audienceId - Optional audience ID (defaults to configured audience)
   * @returns Array of contact email addresses
   *
   * @example
   * ```ts
   * const subscribers = await resendService.getAllContacts();
   * console.log(`${subscribers.length} subscribers`);
   * ```
   */
  async getAllContacts(audienceId?: string): Promise<string[]> {
    // Check if service is enabled
    if (!this.client) {
      logger.error('Resend service not initialized - missing API key');
      return [];
    }

    const targetAudienceId = audienceId || this.AUDIENCE_ID;

    if (!targetAudienceId) {
      logger.error('Audience ID not provided or configured');
      return [];
    }

    try {
      const contacts: string[] = [];
      let hasMore = true;
      let cursor: string | undefined;

      // Paginate through all contacts
      while (hasMore) {
        const response = await this.client.contacts.list({
          audienceId: targetAudienceId,
          ...(cursor && { cursor }),
        });

        if (response.error) {
          logger.error('Failed to fetch contacts from Resend', undefined, {
            errorName: response.error.name || 'ResendError',
            errorMessage: response.error.message || String(response.error),
            audienceId: targetAudienceId,
          });
          break;
        }

        // Validate contacts list response with Zod
        const contactsList = resendContactListResponseSchema.safeParse(response.data);

        if (contactsList.success) {
          // Extract email addresses from validated response
          const emails = contactsList.data.data.map((contact) => contact.email);
          contacts.push(...emails);

          // Check for next page cursor
          hasMore = !!contactsList.data.next_cursor;
          cursor = contactsList.data.next_cursor || undefined;
        } else {
          logger.error('Resend contacts list response validation failed', undefined, {
            responseData: JSON.stringify(response.data),
            zodErrors: JSON.stringify(contactsList.error.format()),
            expectedSchema: 'data: array, next_cursor: string | null',
          });
          hasMore = false;
        }
      }

      logger.info('Retrieved contacts from audience', {
        audienceId: targetAudienceId,
        count: contacts.length,
      });

      return contacts;
    } catch (error) {
      const errorDetails = this.parseError(error);
      logger.error('Failed to get contacts', error instanceof Error ? error : undefined, {
        errorName: errorDetails.name,
        errorMessage: errorDetails.message,
        audienceId: targetAudienceId,
      });
      return [];
    }
  }

  /**
   * Send batch emails with rate limiting
   *
   * Chunks recipients and adds delays to respect Resend rate limits.
   * Resend allows 50 recipients per request.
   *
   * @param recipients - Array of email addresses
   * @param subject - Email subject line
   * @param template - React Email component
   * @param options - Additional email options
   * @returns Batch send results
   *
   * @example
   * ```ts
   * const results = await resendService.sendBatchEmails(
   *   subscribers,
   *   'Weekly Digest',
   *   <WeeklyDigest {...data} />,
   *   { tags: [{ name: 'type', value: 'digest' }] }
   * );
   * console.log(`Sent: ${results.success}, Failed: ${results.failed}`);
   * ```
   */
  async sendBatchEmails(
    recipients: string[],
    subject: string,
    template: ReactElement,
    options?: {
      from?: string;
      replyTo?: string;
      tags?: Array<{ name: string; value: string }>;
      delayMs?: number; // Delay between batches (default: 1000ms)
    }
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Check if service is enabled
    if (!this.client) {
      logger.error('Resend service not initialized - missing API key');
      return results;
    }

    const batchSize = 50; // Resend limit
    const delayMs = options?.delayMs || 1000;

    logger.info('Starting batch email send', {
      totalRecipients: recipients.length,
      batches: Math.ceil(recipients.length / batchSize),
    });

    // Process in chunks
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(recipients.length / batchSize);

      logger.info(`Processing batch ${batchNumber}/${totalBatches}`, {
        batchSize: batch.length,
      });

      // Send emails in batch
      const batchResult = await batchMapSettled(batch, (email) => {
        const emailOptions: {
          from?: string;
          replyTo?: string;
          tags?: Array<{ name: string; value: string }>;
        } = {};
        if (options?.from) emailOptions.from = options.from;
        if (options?.replyTo) emailOptions.replyTo = options.replyTo;
        if (options?.tags) emailOptions.tags = options.tags;
        return this.sendEmail(email, subject, template, emailOptions);
      });

      // Count successes
      for (const emailResult of batchResult.successes) {
        if (emailResult.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`${emailResult.error || 'Unknown error'}`);
        }
      }

      // Count failures
      for (const failure of batchResult.failures) {
        results.failed++;
        results.errors.push(failure.error.message);
      }

      // Rate limit: delay between batches (except for last batch)
      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    logger.info('Batch email send completed', {
      success: results.success,
      failed: results.failed,
      total: recipients.length,
      successRate: `${((results.success / recipients.length) * 100).toFixed(1)}%`,
    });

    return results;
  }

  /**
   * Parse Resend API errors into structured format
   */
  private parseError(error: unknown): ResendError {
    // Try to parse as Resend error
    const parsed = resendErrorSchema.safeParse(error);
    if (parsed.success) {
      return parsed.data;
    }

    // Fallback to generic error
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
      };
    }

    return {
      name: 'UnknownError',
      message: String(error),
    };
  }
}

/**
 * Singleton instance for application-wide use
 * Ensures single Resend client instance across the app
 */
export const resendService = new ResendService();
