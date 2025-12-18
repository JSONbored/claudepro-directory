'use server';

import { createCachedDataFunction, generateResourceTags } from './cached-data-factory.ts';

// Service returns transformed array matching RPC structure
interface ContactCommandResult {
  action_type: null | string;
  action_value: null | string;
  aliases: null | string[];
  category: null | string;
  confetti_variant: null | string;
  description: null | string;
  icon_name: null | string;
  id: null | string;
  requires_auth: boolean | null;
  text: null | string;
}

export type ContactCommandsRow = ContactCommandResult | null;

/**
 * Fetch contact commands
 * Uses 'use cache' to cache contact commands. This data is public and same for all users.
 * Contact commands change periodically, so we use the 'long' cacheLife profile.
 */
export const fetchContactCommands = createCachedDataFunction<void, ContactCommandsRow>({
  serviceKey: 'misc',
  methodName: 'getContactCommands',
  cacheMode: 'public',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire - optimized for SEO
  cacheTags: () => generateResourceTags('contact'),
  module: 'data/contact',
  operation: 'fetchContactCommands',
  normalizeResult: (result) => {
    const commands = result as ContactCommandResult[] | undefined;
    if (!commands || !Array.isArray(commands) || commands.length === 0) {
      return null;
    }
    return commands[0] ?? null;
  },
});
