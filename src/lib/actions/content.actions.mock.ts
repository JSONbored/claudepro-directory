/**
 * Content Actions Mock for Storybook
 *
 * Browser-compatible mock implementations of server actions.
 * Used by Storybook to render components without Node.js dependencies.
 *
 * @module lib/actions/content.actions.mock
 */

/**
 * Mock createReview - Returns success with mock data
 */
export async function createReview() {
  return {
    data: {
      success: true,
      review: {
        id: 'mock-review-id',
        user_id: 'mock-user-id',
        content_type: 'agents',
        content_slug: 'mock-slug',
        rating: 5,
        review_text: 'Mock review text',
        helpful_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
  };
}

/**
 * Mock updateReview - Returns success
 */
export async function updateReview() {
  return {
    data: {
      success: true,
    },
  };
}

/**
 * Mock deleteReview - Returns success
 */
export async function deleteReview() {
  return {
    data: {
      success: true,
    },
  };
}

/**
 * Mock getReviews - Returns empty array
 */
export async function getReviews() {
  return {
    data: {
      success: true,
      reviews: [],
      total: 0,
      hasMore: false,
    },
  };
}

/**
 * Mock getAggregateRating - Returns zero ratings
 */
export async function getAggregateRating() {
  return {
    data: {
      success: true,
      average: 0,
      count: 0,
      distribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    },
  };
}

/**
 * Mock markReviewHelpful - Returns success
 */
export async function markReviewHelpful() {
  return {
    data: {
      success: true,
    },
  };
}
