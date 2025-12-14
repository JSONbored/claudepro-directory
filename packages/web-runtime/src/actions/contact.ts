'use server';

/**
 * Contact Actions - Database-First Architecture
 * Calls get_contact_commands RPC.
 */

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
      const { MiscService } = await import('@heyclaude/data-layer');
      const service = new MiscService();
      const result = await service.getContactCommands();
      // GetContactCommandsReturns is ContactCommandResult[][] (array of arrays)
      // Return first array as commands, or empty array if none
      return { commands: result?.[0] ?? [] };
    } catch {
      // Fallback to empty commands on error (safe-action middleware handles logging)
      return { commands: [] };
    }
  });
