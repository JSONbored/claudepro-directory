'use server';

/**
 * Contact Actions - Database-First Architecture
 * Calls get_contact_commands RPC.
 */

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { fetchContactCommands } from '@/src/lib/data/contact/commands';

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
