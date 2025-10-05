/**
 * Production-Grade Resend Email Service
 * Handles newsletter subscriptions and contact management via Resend API
 *
 * Features:
 * - Type-safe API integration
 * - Error handling and logging
 * - Graceful degradation when API key missing
 * - Production-ready with comprehensive error messages
 */

import { Resend } from 'resend';
import { z } from 'zod';
import { logger } from '@/src/lib/logger';
import { env } from '@/src/lib/schemas/env.schema';

/**
 * Resend API response schemas for type safety
 * Based on official API docs: https://resend.com/docs/api-reference/contacts/create-contact
 */
const resendContactSchema = z.object({
  object: z.literal('contact'),
  id: z.string(),
});

const resendErrorSchema = z.object({
  name: z.string(),
  message: z.string(),
});

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

      // Debug: Log the raw response structure
      logger.info('Resend API raw response received', {
        hasData: !!response.data,
        dataType: typeof response.data,
        responseKeys: response.data ? Object.keys(response.data).join(', ') : 'none',
        fullResponse: JSON.stringify(response),
      });

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
