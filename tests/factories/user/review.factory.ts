/**
 * Review Factory
 *
 * Generates realistic review/rating data for content.
 *
 * **Usage:**
 * ```ts
 * import { reviewFactory } from '@/tests/factories';
 *
 * // Generate 5-star review
 * const review = reviewFactory.build({ rating: 5 });
 *
 * // Generate review with comment
 * const reviewWithComment = reviewFactory.build({
 *   comment: 'Excellent agent, saved me hours of work!'
 * });
 * ```
 */

import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

interface Review {
  id: string;
  user_id: string;
  content_type: 'agent' | 'mcp' | 'command' | 'rule' | 'hook' | 'statusline';
  content_slug: string;
  rating: number;
  comment: string | null;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export const reviewFactory = Factory.define<Review>(() => {
  const contentType = faker.helpers.arrayElement([
    'agent',
    'mcp',
    'command',
    'rule',
    'hook',
    'statusline',
  ] as const);

  const createdAt = faker.date.past({ years: 1 }).toISOString();

  // Generate realistic rating distribution (skewed toward positive)
  const rating = faker.helpers.weightedArrayElement([
    { weight: 2, value: 5 },
    { weight: 3, value: 4 },
    { weight: 2, value: 3 },
    { weight: 1, value: 2 },
    { weight: 1, value: 1 },
  ]);

  return {
    id: `review-${faker.string.uuid()}`,
    user_id: `user-${faker.string.uuid()}`,
    content_type: contentType,
    content_slug: faker.helpers.slugify(faker.word.words(2)).toLowerCase(),
    rating,
    comment: faker.helpers.maybe(
      () => {
        // Generate rating-appropriate comments
        if (rating >= 4) {
          return faker.helpers.arrayElement([
            'Excellent tool, highly recommended!',
            'This saved me hours of work. Thank you!',
            'Works perfectly, exactly what I needed.',
            'Great quality and well-documented.',
            'Very useful, will use again.',
          ]);
        }
        if (rating === 3) {
          return faker.helpers.arrayElement([
            'Good but could use some improvements.',
            'Works okay, decent for basic use.',
            'Not bad, but has some limitations.',
          ]);
        }
        return faker.helpers.arrayElement([
          'Did not work as expected.',
          'Had issues getting this to work.',
          'Needs better documentation.',
        ]);
      },
      { probability: 0.7 }
    ),
    helpful_count: faker.number.int({ min: 0, max: 50 }),
    created_at: createdAt,
    updated_at:
      faker.helpers.maybe(
        () => faker.date.between({ from: createdAt, to: new Date() }).toISOString(),
        { probability: 0.1 }
      ) || createdAt,
  };
});
