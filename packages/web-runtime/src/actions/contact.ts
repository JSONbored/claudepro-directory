'use server';

/**
 * Contact Actions - Database-First Architecture
 * Calls get_contact_commands RPC.
 */

import { fetchContactCommands } from '../data/contact.ts';
import { rateLimitedAction } from './safe-action.ts';
import { z } from 'zod';

/**
 * Get contact terminal commands
 * Public action - no authentication required
 */
export const getContactCommands = rateLimitedAction
  .inputSchema(z.object({}))
  .metadata({ actionName: 'contact.getContactCommands', category: 'content' })
  .action(async () => {
    try {
      const data = await fetchContactCommands();
      // Return empty commands structure if data is null (graceful fallback)
      return data ?? { commands: [] };
    } catch {
      // Fallback to empty commands on error (safe-action middleware handles logging)
      return { commands: [] };
    }
  });
