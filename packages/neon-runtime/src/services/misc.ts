/**
 * MiscService - Prisma-based service for miscellaneous data
 * 
 * This service replaces the Supabase-based MiscService using Prisma + raw SQL.
 * Uses `withClient()` to call PostgreSQL RPC functions via Neon's serverless driver.
 * 
 * @see packages/data-layer/src/services/misc.ts for Supabase version
 */

import { withClient } from '../client';
import type { PoolClient } from 'pg';

/**
 * Arguments for get_active_notifications RPC
 * 
 * @property p_dismissed_ids - Optional array of dismissed notification IDs (defaults to empty array)
 */
export interface GetActiveNotificationsArgs {
  p_dismissed_ids?: string[] | null;
}

/**
 * Arguments for get_form_field_config RPC
 * 
 * @property p_form_type - The form type to get configuration for
 */
export interface GetFormFieldConfigArgs {
  p_form_type: string;
}

/**
 * Prisma-based MiscService
 * 
 * Uses raw SQL via `withClient()` to call PostgreSQL RPC functions.
 * This maintains the same API as the Supabase version but uses Neon/Prisma.
 */
export class MiscService {
  /**
   * Calls the database RPC: get_active_notifications
   * 
   * @param args - RPC function arguments
   * @param args.p_dismissed_ids - Optional array of dismissed notification IDs (defaults to empty array)
   * @returns Array of active notifications
   */
  async getActiveNotifications(args: GetActiveNotificationsArgs = {}) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query(
          'SELECT * FROM get_active_notifications($1)',
          [args.p_dismissed_ids ?? []]
        );
        return rows;
      });
    } catch (error) {
      // TODO: Add proper error logging (similar to logRpcError)
      console.error('[MiscService] getActiveNotifications error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_active_announcement
   * 
   * @param p_now - Optional timestamp (defaults to now() in database if not provided)
   * @returns Active announcement or null if none found
   */
  async getActiveAnnouncement(p_now?: string) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameter, so only pass $1 if p_now is provided
        const query = p_now
          ? 'SELECT * FROM get_active_announcement($1)'
          : 'SELECT * FROM get_active_announcement()';
        const { rows } = await client.query(query, p_now ? [p_now] : []);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[MiscService] getActiveAnnouncement error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_navigation_menu
   * 
   * @returns Navigation menu data with primary, secondary, and actions sections
   */
  async getNavigationMenu() {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_navigation_menu()');
        return rows;
      });
    } catch (error) {
      console.error('[MiscService] getNavigationMenu error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_contact_commands
   * 
   * @returns Array of contact command configurations
   */
  async getContactCommands() {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_contact_commands()');
        return rows;
      });
    } catch (error) {
      console.error('[MiscService] getContactCommands error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_form_field_config
   * 
   * @param args - RPC function arguments
   * @param args.p_form_type - The form type to get configuration for
   * @returns Form field configuration or null if not found
   */
  async getFormFieldConfig(args: GetFormFieldConfigArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query(
          'SELECT * FROM get_form_field_config($1)',
          [args.p_form_type]
        );
        return rows;
      });
    } catch (error) {
      console.error('[MiscService] getFormFieldConfig error:', error);
      throw error;
    }
  }
}
