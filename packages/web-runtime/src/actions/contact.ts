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
    const { getService } = await import('../data/service-factory');
    const service = await getService('misc');
    const result = await service.getContactCommands();
    return { commands: result ?? [] };
  });
