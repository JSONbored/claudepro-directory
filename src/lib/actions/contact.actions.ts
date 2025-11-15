'use server';

/**
 * Contact Actions - Database-First Architecture
 * Calls get_contact_commands RPC.
 */

import { fetchContactCommands } from '@/src/lib/data/contact';
import { logActionFailure } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';

type ContactCommandsResult = Database['public']['Functions']['get_contact_commands']['Returns'];

export async function getContactCommands(): Promise<ContactCommandsResult> {
  try {
    const data = await fetchContactCommands();
    if (!data) {
      throw new Error('Contact commands unavailable');
    }
    return data;
  } catch (error) {
    throw logActionFailure('contact.getContactCommands', error);
  }
}
