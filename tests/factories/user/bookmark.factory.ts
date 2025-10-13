/**
 * Bookmark Factory
 *
 * Generates realistic bookmark data for user library features.
 *
 * **Usage:**
 * ```ts
 * import { bookmarkFactory } from '@/tests/factories';
 *
 * // Generate bookmark
 * const bookmark = bookmarkFactory.build();
 *
 * // Generate bookmark with notes
 * const bookmarkWithNotes = bookmarkFactory.build({
 *   notes: 'This is a great agent for code reviews'
 * });
 * ```
 */

import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

interface Bookmark {
  id: string;
  user_id: string;
  content_type: 'agents' | 'mcp' | 'commands' | 'rules' | 'hooks' | 'statuslines';
  content_slug: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const bookmarkFactory = Factory.define<Bookmark>(() => {
  const contentType = faker.helpers.arrayElement([
    'agents',
    'mcp',
    'commands',
    'rules',
    'hooks',
    'statuslines',
  ] as const);

  const createdAt = faker.date.past({ years: 1 }).toISOString();

  return {
    id: `bookmark-${faker.string.uuid()}`,
    user_id: `user-${faker.string.uuid()}`,
    content_type: contentType,
    content_slug: faker.helpers.slugify(faker.word.words(2)).toLowerCase(),
    notes: faker.helpers.maybe(() => faker.lorem.sentence({ min: 5, max: 20 }), {
      probability: 0.3,
    }),
    created_at: createdAt,
    updated_at:
      faker.helpers.maybe(
        () => faker.date.between({ from: createdAt, to: new Date() }).toISOString(),
        { probability: 0.2 }
      ) || createdAt,
  };
});
