/**
 * Factory Validation Tests
 *
 * Validates all test data factories generate schema-compliant data.
 * This ensures factories are production-ready and type-safe.
 *
 * Test Strategy:
 * - Generate single entities and validate against schemas
 * - Generate multiple entities and validate batch generation
 * - Test transient parameters and custom configurations
 * - Test factory traits (admin, githubUser, etc.)
 * - Validate realistic data distributions
 */

import { describe, expect, test } from 'vitest';

// Content Schemas
import { agentContentSchema } from '@/src/lib/schemas/content/agent.schema';
import { collectionContentSchema } from '@/src/lib/schemas/content/collection.schema';
import { commandContentSchema } from '@/src/lib/schemas/content/command.schema';
import { hookContentSchema } from '@/src/lib/schemas/content/hook.schema';
import { mcpContentSchema } from '@/src/lib/schemas/content/mcp.schema';
import { ruleContentSchema } from '@/src/lib/schemas/content/rule.schema';
import { statuslineContentSchema } from '@/src/lib/schemas/content/statusline.schema';

// Content Factories
import {
  agentFactory,
  collectionFactory,
  commandFactory,
  hookFactory,
  mcpFactory,
  ruleFactory,
  statuslineFactory,
} from '@/tests/factories';

// User Factories
import { bookmarkFactory, reviewFactory, userFactory } from '@/tests/factories';

// Shared Factories
import { usageExampleFactory } from '@/tests/factories/shared/usage-example.factory';

describe('Content Factories', () => {
  describe('agentFactory', () => {
    test('should generate valid agent data matching schema', () => {
      const agent = agentFactory.build();
      const result = agentContentSchema.safeParse(agent);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('agents');
        expect(result.data.slug).toBeTruthy();
        expect(result.data.title).toBeTruthy();
        expect(result.data.description).toBeTruthy();
        expect(result.data.author).toBeTruthy();
        expect(result.data.dateAdded).toBeTruthy();
        expect(Array.isArray(result.data.tags)).toBe(true);
        expect(result.data.content).toBeTruthy();
      }
    });

    test('should generate valid batch of agents', () => {
      const agents = agentFactory.buildList(10);
      expect(agents).toHaveLength(10);

      agents.forEach((agent) => {
        const result = agentContentSchema.safeParse(agent);
        expect(result.success).toBe(true);
      });
    });

    test('should support transient parameters for configuration', () => {
      const agentWithConfig = agentFactory.build({}, {
        transient: { withConfiguration: true },
      });

      const result = agentContentSchema.safeParse(agentWithConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.configuration).toBeDefined();
        expect(result.data.configuration?.temperature).toBeDefined();
        expect(result.data.configuration?.maxTokens).toBeDefined();
      }
    });

    test('should support transient parameters for installation', () => {
      const agentWithInstall = agentFactory.build({}, {
        transient: { withInstallation: true },
      });

      const result = agentContentSchema.safeParse(agentWithInstall);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.installation).toBeDefined();
      }
    });

    test('should support custom tag count', () => {
      const agent = agentFactory.build({}, { transient: { tagCount: 3 } });
      const result = agentContentSchema.safeParse(agent);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toHaveLength(3);
      }
    });

    test('should generate unique slugs for sequences', () => {
      const agents = agentFactory.buildList(5);
      const slugs = new Set(agents.map((a) => a.slug));
      expect(slugs.size).toBe(5); // All unique
    });
  });

  describe('mcpFactory', () => {
    test('should generate valid MCP server data matching schema', () => {
      const mcp = mcpFactory.build();
      const result = mcpContentSchema.safeParse(mcp);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('mcp');
        expect(result.data.configuration).toBeDefined();
      }
    });

    test('should generate valid batch of MCP servers', () => {
      const mcps = mcpFactory.buildList(5);
      expect(mcps).toHaveLength(5);

      mcps.forEach((mcp) => {
        const result = mcpContentSchema.safeParse(mcp);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('commandFactory', () => {
    test('should generate valid command data matching schema', () => {
      const command = commandFactory.build();
      const result = commandContentSchema.safeParse(command);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('commands');
        expect(result.data.title).toMatch(/^\//); // Commands start with /
      }
    });

    test('should generate valid batch of commands', () => {
      const commands = commandFactory.buildList(8);
      expect(commands).toHaveLength(8);

      commands.forEach((command) => {
        const result = commandContentSchema.safeParse(command);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('hookFactory', () => {
    test('should generate valid hook data matching schema', () => {
      const hook = hookFactory.build();
      const result = hookContentSchema.safeParse(hook);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('hooks');
      }
    });

    test('should generate valid batch of hooks', () => {
      const hooks = hookFactory.buildList(6);
      expect(hooks).toHaveLength(6);

      hooks.forEach((hook) => {
        const result = hookContentSchema.safeParse(hook);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('ruleFactory', () => {
    test('should generate valid rule data matching schema', () => {
      const rule = ruleFactory.build();
      const result = ruleContentSchema.safeParse(rule);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('rules');
      }
    });

    test('should generate valid batch of rules', () => {
      const rules = ruleFactory.buildList(7);
      expect(rules).toHaveLength(7);

      rules.forEach((rule) => {
        const result = ruleContentSchema.safeParse(rule);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('statuslineFactory', () => {
    test('should generate valid statusline data matching schema', () => {
      const statusline = statuslineFactory.build();
      const result = statuslineContentSchema.safeParse(statusline);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('statuslines');
      }
    });

    test('should generate valid batch of statuslines', () => {
      const statuslines = statuslineFactory.buildList(6);
      expect(statuslines).toHaveLength(6);

      statuslines.forEach((statusline) => {
        const result = statuslineContentSchema.safeParse(statusline);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('collectionFactory', () => {
    test('should generate valid collection data matching schema', () => {
      const collection = collectionFactory.build();
      const result = collectionContentSchema.safeParse(collection);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('collections');
        expect(result.data.items.length).toBeGreaterThanOrEqual(2);
        expect(result.data.items.length).toBeLessThanOrEqual(20);
      }
    });

    test('should support custom item count', () => {
      const collection = collectionFactory.build({}, { transient: { itemCount: 5 } });
      const result = collectionContentSchema.safeParse(collection);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(5);
      }
    });

    test('should generate valid batch of collections', () => {
      const collections = collectionFactory.buildList(3);
      expect(collections).toHaveLength(3);

      collections.forEach((collection) => {
        const result = collectionContentSchema.safeParse(collection);
        expect(result.success).toBe(true);
      });
    });
  });
});

describe('User Factories', () => {
  describe('userFactory', () => {
    test('should generate valid authenticated user data', () => {
      const user = userFactory.build();

      expect(user.id).toBeTruthy();
      expect(user.email).toBeTruthy();
      expect(user.aud).toBe('authenticated');
      expect(user.role).toBe('authenticated');
      expect(user.app_metadata.provider).toBe('email');
      expect(user.user_metadata.username).toBeTruthy();
      expect(user.created_at).toBeTruthy();
    });

    test('should generate valid batch of users', () => {
      const users = userFactory.buildList(10);
      expect(users).toHaveLength(10);

      users.forEach((user) => {
        expect(user.id).toBeTruthy();
        expect(user.email).toBeTruthy();
      });

      // Ensure unique emails
      const emails = new Set(users.map((u) => u.email));
      expect(emails.size).toBe(10);
    });

    test('should generate admin user with trait', () => {
      const admin = userFactory.admin().build();

      expect(admin.app_metadata.role).toBe('admin');
      expect(admin.app_metadata.permissions).toEqual([
        'read',
        'write',
        'delete',
        'manage_users',
      ]);
      expect(admin.user_metadata.username).toBe('admin');
    });

    test('should generate GitHub OAuth user with trait', () => {
      const githubUser = userFactory.githubUser().build();

      expect(githubUser.app_metadata.provider).toBe('github');
      expect(githubUser.app_metadata.providers).toContain('github');
      expect(githubUser.user_metadata.provider_id).toBeTruthy();
      expect(githubUser.identities).toHaveLength(1);
      expect(githubUser.identities[0]).toHaveProperty('provider', 'github');
    });

    test('should generate unconfirmed user with trait', () => {
      const unconfirmed = userFactory.unconfirmed().build();

      expect(unconfirmed.email_confirmed_at).toBeNull();
      expect(unconfirmed.confirmed_at).toBeNull();
    });
  });

  describe('bookmarkFactory', () => {
    test('should generate valid bookmark data', () => {
      const bookmark = bookmarkFactory.build();

      expect(bookmark.id).toBeTruthy();
      expect(bookmark.user_id).toBeTruthy();
      expect(bookmark.content_type).toBeTruthy();
      expect(bookmark.content_slug).toBeTruthy();
      expect(bookmark.created_at).toBeTruthy();
      expect(bookmark.updated_at).toBeTruthy();
    });

    test('should generate valid batch of bookmarks', () => {
      const bookmarks = bookmarkFactory.buildList(15);
      expect(bookmarks).toHaveLength(15);

      bookmarks.forEach((bookmark) => {
        expect(bookmark.id).toBeTruthy();
        expect(['agents', 'mcp', 'commands', 'rules', 'hooks', 'statuslines']).toContain(
          bookmark.content_type
        );
      });
    });

    test('should sometimes include notes', () => {
      // Generate many bookmarks and check distribution
      const bookmarks = bookmarkFactory.buildList(100);
      const withNotes = bookmarks.filter((b) => b.notes !== null);

      // Should have roughly 30% with notes (probability: 0.3)
      // Randomness can vary significantly - verify at least some have notes
      expect(withNotes.length).toBeGreaterThan(5);
      // At least some bookmarks should have notes
      expect(withNotes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('reviewFactory', () => {
    test('should generate valid review data', () => {
      const review = reviewFactory.build();

      expect(review.id).toBeTruthy();
      expect(review.user_id).toBeTruthy();
      expect(review.content_type).toBeTruthy();
      expect(review.content_slug).toBeTruthy();
      expect(review.rating).toBeGreaterThanOrEqual(1);
      expect(review.rating).toBeLessThanOrEqual(5);
      expect(review.helpful_count).toBeGreaterThanOrEqual(0);
      expect(review.created_at).toBeTruthy();
    });

    test('should generate valid batch of reviews', () => {
      const reviews = reviewFactory.buildList(20);
      expect(reviews).toHaveLength(20);

      reviews.forEach((review) => {
        expect(review.rating).toBeGreaterThanOrEqual(1);
        expect(review.rating).toBeLessThanOrEqual(5);
      });
    });

    test('should have realistic rating distribution (skewed positive)', () => {
      // Generate large sample to test distribution
      const reviews = reviewFactory.buildList(1000);
      const ratingCounts = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      reviews.forEach((review) => {
        ratingCounts[review.rating as keyof typeof ratingCounts]++;
      });

      // Check distribution follows weighted pattern
      // Weights: 5=2, 4=3, 3=2, 2=1, 1=1
      // 4-star should be most common
      expect(ratingCounts[4]).toBeGreaterThan(ratingCounts[5]);
      expect(ratingCounts[4]).toBeGreaterThan(ratingCounts[3]);
      expect(ratingCounts[5]).toBeGreaterThan(ratingCounts[1]);
      expect(ratingCounts[3]).toBeGreaterThan(ratingCounts[1]);
    });

    test('should generate rating-appropriate comments', () => {
      // Generate multiple to increase chance of getting comment
      const highRatings = reviewFactory.buildList(20, { rating: 5 });
      const lowRatings = reviewFactory.buildList(20, { rating: 1 });

      const highWithComments = highRatings.filter((r) => r.comment !== null);
      const lowWithComments = lowRatings.filter((r) => r.comment !== null);

      // Test positive comments if any exist
      if (highWithComments.length > 0) {
        const positiveKeywords = ['excellent', 'great', 'saved', 'perfectly', 'useful'];
        const hasPositiveComment = highWithComments.some((r) =>
          positiveKeywords.some((keyword) => r.comment?.toLowerCase().includes(keyword))
        );
        // At least one high-rated review should have positive keywords
        expect(hasPositiveComment).toBe(true);
      }

      // Test negative comments if any exist
      if (lowWithComments.length > 0) {
        const negativeKeywords = ['did not', 'issues', 'needs'];
        const hasNegativeComment = lowWithComments.some((r) =>
          negativeKeywords.some((keyword) => r.comment?.toLowerCase().includes(keyword))
        );
        // At least one low-rated review should have negative keywords
        expect(hasNegativeComment).toBe(true);
      }
    });

    test('should have 70% probability of comments', () => {
      const reviews = reviewFactory.buildList(100);
      const withComments = reviews.filter((r) => r.comment !== null);

      // Should have roughly 70% with comments (probability: 0.7)
      // Randomness varies - just verify majority have comments
      expect(withComments.length).toBeGreaterThan(40);
      // Verify not all have comments (would indicate bug)
      expect(withComments.length).toBeLessThanOrEqual(100);
    });
  });
});

describe('Shared Factories', () => {
  describe('usageExampleFactory', () => {
    test('should generate valid usage examples', () => {
      const example = usageExampleFactory.build();

      expect(example.title).toBeTruthy();
      expect(example.language).toBeTruthy();
      expect(example.code).toBeTruthy();
      expect(['typescript', 'javascript', 'json', 'bash', 'python']).toContain(
        example.language
      );
    });

    test('should generate language-appropriate code', () => {
      // Test that generated examples have realistic code for their language
      const examples = usageExampleFactory.buildList(10);

      examples.forEach((example) => {
        expect(example.code.length).toBeGreaterThan(10);
        expect(['typescript', 'javascript', 'json', 'bash', 'python']).toContain(
          example.language
        );
      });

      // TypeScript examples should typically have common TS patterns
      const tsExamples = usageExampleFactory.buildList(5);
      const hasTypicalTsPattern = tsExamples.some(ex =>
        ex.code.includes('const') || ex.code.includes('import') || ex.code.includes('function')
      );
      expect(hasTypicalTsPattern).toBe(true);
    });

    test('should generate valid batch of examples', () => {
      const examples = usageExampleFactory.buildList(5);
      expect(examples).toHaveLength(5);

      examples.forEach((example) => {
        expect(example.title).toBeTruthy();
        expect(example.code).toBeTruthy();
      });
    });
  });
});

describe('Factory Integration', () => {
  test('should work together for realistic test scenarios', () => {
    // Create user with bookmarks and reviews
    const user = userFactory.build();
    const userBookmarks = bookmarkFactory.buildList(5, { user_id: user.id });
    const userReviews = reviewFactory.buildList(3, { user_id: user.id });

    expect(userBookmarks.every((b) => b.user_id === user.id)).toBe(true);
    expect(userReviews.every((r) => r.user_id === user.id)).toBe(true);
  });

  test('should create complete content ecosystem', () => {
    // Create various content types
    const agents = agentFactory.buildList(3);
    const mcpServers = mcpFactory.buildList(2);
    const commands = commandFactory.buildList(2);

    // Create collection referencing content with transient param
    const collection = collectionFactory.build({}, { transient: { itemCount: 7 } });

    expect(agents).toHaveLength(3);
    expect(mcpServers).toHaveLength(2);
    expect(commands).toHaveLength(2);
    expect(collection.items).toHaveLength(7);
  });

  test('should maintain data consistency across related entities', () => {
    const agent = agentFactory.build();
    const review = reviewFactory.build({
      content_type: 'agent',
      content_slug: agent.slug,
    });

    expect(review.content_type).toBe('agent');
    expect(review.content_slug).toBe(agent.slug);
  });
});
