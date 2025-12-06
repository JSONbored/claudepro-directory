/**
 * NewsletterService - Prisma-based service for newsletter subscriptions
 * 
 * This service replaces the Supabase-based NewsletterService using Prisma + raw SQL.
 * Uses `withClient()` for RPC functions and Prisma ORM for table queries.
 * 
 * @see packages/data-layer/src/services/newsletter.ts for Supabase version
 */

import { prisma, withClient } from '../client';
import type { PoolClient } from 'pg';

/**
 * Arguments for subscribe_newsletter RPC
 * 
 * @property p_email - Email address (required)
 * @property p_source - Newsletter source (defaults to 'footer')
 * @property p_referrer - Optional referrer URL
 * @property p_copy_type - Optional copy type
 * @property p_copy_category - Optional content category
 * @property p_copy_slug - Optional content slug
 * @property p_ip_address - Optional IP address
 * @property p_user_agent - Optional user agent string
 * @property p_resend_contact_id - Optional Resend contact ID
 * @property p_sync_status - Optional sync status (defaults to 'pending')
 * @property p_sync_error - Optional sync error message
 * @property p_engagement_score - Optional engagement score (defaults to 50)
 * @property p_primary_interest - Optional primary interest
 * @property p_total_copies - Optional total copies count (defaults to 0)
 * @property p_last_active_at - Optional last active timestamp (defaults to now())
 * @property p_resend_topics - Optional Resend topics array
 */
export interface SubscribeNewsletterArgs {
  p_email: string;
  p_source?: string | null;
  p_referrer?: string | null;
  p_copy_type?: string | null;
  p_copy_category?: string | null;
  p_copy_slug?: string | null;
  p_ip_address?: string | null;
  p_user_agent?: string | null;
  p_resend_contact_id?: string | null;
  p_sync_status?: string | null;
  p_sync_error?: string | null;
  p_engagement_score?: number | null;
  p_primary_interest?: string | null;
  p_total_copies?: number | null;
  p_last_active_at?: string | null;
  p_resend_topics?: string[] | null;
}

/**
 * Prisma-based NewsletterService
 * 
 * Uses raw SQL via `withClient()` for RPC functions and Prisma ORM for table queries.
 * This maintains the same API as the Supabase version but uses Neon/Prisma.
 */
export class NewsletterService {
  /**
   * Calls the database RPC: subscribe_newsletter
   * 
   * @param args - RPC function arguments
   * @param args.p_email - Email address (required)
   * @param args.p_source - Newsletter source (defaults to 'footer')
   * @param args.p_referrer - Optional referrer URL
   * @param args.p_copy_type - Optional copy type
   * @param args.p_copy_category - Optional content category
   * @param args.p_copy_slug - Optional content slug
   * @param args.p_ip_address - Optional IP address
   * @param args.p_user_agent - Optional user agent string
   * @param args.p_resend_contact_id - Optional Resend contact ID
   * @param args.p_sync_status - Optional sync status (defaults to 'pending')
   * @param args.p_sync_error - Optional sync error message
   * @param args.p_engagement_score - Optional engagement score (defaults to 50)
   * @param args.p_primary_interest - Optional primary interest
   * @param args.p_total_copies - Optional total copies count (defaults to 0)
   * @param args.p_last_active_at - Optional last active timestamp (defaults to now())
   * @param args.p_resend_topics - Optional Resend topics array
   * @returns Subscription result
   */
  async subscribeNewsletter(args: SubscribeNewsletterArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has many default parameters - only pass non-default values
        const params: unknown[] = [args.p_email]; // Required
        let paramIndex = 2;
        let query = 'SELECT * FROM subscribe_newsletter($1';

        // Build query with only non-default parameters
        if (args.p_source !== undefined && args.p_source !== null && args.p_source !== 'footer') {
          query += `, $${paramIndex}`;
          params.push(args.p_source);
          paramIndex++;
        } else if (
          args.p_referrer !== undefined ||
          args.p_copy_type !== undefined ||
          args.p_copy_category !== undefined ||
          args.p_copy_slug !== undefined ||
          args.p_ip_address !== undefined ||
          args.p_user_agent !== undefined ||
          args.p_resend_contact_id !== undefined ||
          args.p_sync_status !== undefined ||
          args.p_sync_error !== undefined ||
          args.p_engagement_score !== undefined ||
          args.p_primary_interest !== undefined ||
          args.p_total_copies !== undefined ||
          args.p_last_active_at !== undefined ||
          args.p_resend_topics !== undefined
        ) {
          query += ", 'footer'"; // default
        }

        // Continue with remaining optional parameters...
        // For simplicity, pass all provided parameters
        const optionalParams = [
          args.p_referrer,
          args.p_copy_type,
          args.p_copy_category,
          args.p_copy_slug,
          args.p_ip_address,
          args.p_user_agent,
          args.p_resend_contact_id,
          args.p_sync_status,
          args.p_sync_error,
          args.p_engagement_score,
          args.p_primary_interest,
          args.p_total_copies,
          args.p_last_active_at,
          args.p_resend_topics,
        ];

        let hasOptionalParams = false;
        for (const param of optionalParams) {
          if (param !== undefined) {
            hasOptionalParams = true;
            break;
          }
        }

        if (hasOptionalParams) {
          // For now, use a simpler approach - pass all params with defaults
          // This is complex due to many optional parameters with defaults
          // In production, you might want to build this more carefully
          query += ', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)';
          params.push(
            args.p_source ?? 'footer',
            args.p_referrer ?? null,
            args.p_copy_type ?? null,
            args.p_copy_category ?? null,
            args.p_copy_slug ?? null,
            args.p_ip_address ?? null,
            args.p_user_agent ?? null,
            args.p_resend_contact_id ?? null,
            args.p_sync_status ?? 'pending',
            args.p_sync_error ?? null,
            args.p_engagement_score ?? 50,
            args.p_primary_interest ?? null,
            args.p_total_copies ?? 0,
            args.p_last_active_at ?? null,
            args.p_resend_topics ?? null
          );
        } else {
          query += ')';
        }

        const { rows } = await client.query(query, params);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[NewsletterService] subscribeNewsletter error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_active_subscribers
   * 
   * @returns Array of active subscriber email addresses
   */
  async getNewsletterSubscriberCount() {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_active_subscribers()');
        return rows.length;
      });
    } catch (error) {
      console.error('[NewsletterService] getNewsletterSubscriberCount error:', error);
      throw error;
    }
  }

  /**
   * Gets a newsletter subscription by ID using Prisma ORM
   * 
   * @param id - Subscription ID
   * @returns Newsletter subscription or null if not found
   */
  async getSubscriptionById(id: string) {
    try {
      return await prisma.newsletter_subscriptions.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('[NewsletterService] getSubscriptionById error:', error);
      throw error;
    }
  }
}
