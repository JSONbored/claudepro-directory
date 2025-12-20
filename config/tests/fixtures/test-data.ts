/**
 * Centralized Test Data Factories
 *
 * Provides reusable test data factories for common entities.
 * Uses Prismock-compatible data structures for database testing.
 * Optionally uses @faker-js/faker for realistic test data generation.
 *
 * @module config/tests/fixtures/test-data
 */

import type { PrismockClient } from 'prismock';
import { faker } from '@faker-js/faker';

/**
 * Factory for creating test user data
 *
 * @param overrides - Partial user data to override defaults
 * @param useFaker - Whether to use faker for realistic data (default: false)
 */
export function createTestUser(overrides?: Partial<TestUser>, useFaker = false): TestUser {
  const baseData = useFaker
    ? {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        display_name: faker.person.fullName(),
        username: faker.internet
          .userName()
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-'),
        bio: faker.person.bio(),
        website: faker.internet.url(),
        social_x_link: `https://x.com/${faker.internet.userName()}`,
        work: faker.company.name(),
        profile_public: faker.datatype.boolean(),
        follow_email: faker.datatype.boolean(),
        interests: faker.helpers.arrayElements(['ai', 'agents', 'automation', 'mcp', 'rules'], {
          min: 1,
          max: 3,
        }),
        created_at: faker.date.past(),
        updated_at: faker.date.recent(),
      }
    : {
        id: `user-${Math.random().toString(36).substr(2, 9)}`,
        email: `test-${Math.random().toString(36).substr(2, 9)}@example.com`,
        display_name: 'Test User',
        username: `testuser-${Math.random().toString(36).substr(2, 9)}`,
        bio: 'Test user bio',
        website: 'https://example.com',
        social_x_link: 'https://x.com/testuser',
        work: 'Test Company',
        profile_public: true,
        follow_email: false,
        interests: ['ai', 'agents'],
        created_at: new Date(),
        updated_at: new Date(),
      };

  return {
    ...baseData,
    ...overrides,
  };
}

/**
 * Factory for creating test content data
 *
 * @param overrides - Partial content data to override defaults
 * @param useFaker - Whether to use faker for realistic data (default: false)
 */
export function createTestContent(overrides?: Partial<TestContent>, useFaker = false): TestContent {
  const categories = ['agents', 'mcp', 'rules', 'commands', 'hooks', 'skills'];
  const baseData = useFaker
    ? {
        id: faker.string.uuid(),
        slug: faker.helpers.slugify(faker.lorem.words(3)),
        title: faker.lorem.sentence(),
        category: faker.helpers.arrayElement(categories),
        description: faker.lorem.paragraph(),
        author_slug: faker.internet.userName().toLowerCase(),
        tags: faker.helpers.arrayElements(['ai', 'automation', 'mcp', 'agents', 'claude'], {
          min: 1,
          max: 5,
        }),
        source: faker.helpers.arrayElement(['github', 'website', 'documentation']),
        source_url: faker.internet.url(),
        popularity_score: faker.number.int({ min: 0, max: 1000 }),
        trending_score: faker.number.int({ min: 0, max: 500 }),
        created_at: faker.date.past(),
        updated_at: faker.date.recent(),
      }
    : {
        id: `content-${Math.random().toString(36).substr(2, 9)}`,
        slug: `test-content-${Math.random().toString(36).substr(2, 9)}`,
        title: 'Test Content',
        category: 'agents',
        description: 'Test content description',
        author_slug: 'test-user',
        tags: ['ai', 'automation'],
        source: 'github',
        source_url: 'https://github.com/example/repo',
        popularity_score: 100,
        trending_score: 50,
        created_at: new Date(),
        updated_at: new Date(),
      };

  return {
    ...baseData,
    ...overrides,
  };
}

/**
 * Factory for creating test job data
 *
 * @param overrides - Partial job data to override defaults
 * @param useFaker - Whether to use faker for realistic data (default: false)
 */
export function createTestJob(overrides?: Partial<TestJob>, useFaker = false): TestJob {
  const baseData = useFaker
    ? {
        id: faker.string.uuid(),
        slug: faker.helpers.slugify(faker.person.jobTitle()),
        title: faker.person.jobTitle(),
        company_name: faker.company.name(),
        company_slug: faker.helpers.slugify(faker.company.name()),
        location: faker.location.city(),
        salary_range: `$${faker.number.int({ min: 50, max: 200 })}k-$${faker.number.int({ min: 100, max: 300 })}k`,
        category: faker.helpers.arrayElement(['engineering', 'design', 'product', 'marketing']),
        employment_type: faker.helpers.arrayElement(['full-time', 'part-time', 'contract']),
        experience_level: faker.helpers.arrayElement(['junior', 'mid-level', 'senior', 'lead']),
        remote: faker.datatype.boolean(),
        posted_at: faker.date.recent(),
        created_at: faker.date.past(),
        updated_at: faker.date.recent(),
      }
    : {
        id: `job-${Math.random().toString(36).substr(2, 9)}`,
        slug: `test-job-${Math.random().toString(36).substr(2, 9)}`,
        title: 'Senior Developer',
        company_name: 'Test Company',
        company_slug: 'test-company',
        location: 'Remote',
        salary_range: '$100k-$150k',
        category: 'engineering',
        employment_type: 'full-time',
        experience_level: 'senior',
        remote: true,
        posted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

  return {
    ...baseData,
    ...overrides,
  };
}

/**
 * Factory for creating test company data
 *
 * @param overrides - Partial company data to override defaults
 * @param useFaker - Whether to use faker for realistic data (default: false)
 */
export function createTestCompany(overrides?: Partial<TestCompany>, useFaker = false): TestCompany {
  const baseData = useFaker
    ? {
        id: faker.string.uuid(),
        slug: faker.helpers.slugify(faker.company.name()),
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        website: faker.internet.url(),
        logo_url: faker.image.url(),
        created_at: faker.date.past(),
        updated_at: faker.date.recent(),
      }
    : {
        id: `company-${Math.random().toString(36).substr(2, 9)}`,
        slug: `test-company-${Math.random().toString(36).substr(2, 9)}`,
        name: 'Test Company',
        description: 'Test company description',
        website: 'https://example.com',
        logo_url: 'https://example.com/logo.png',
        created_at: new Date(),
        updated_at: new Date(),
      };

  return {
    ...baseData,
    ...overrides,
  };
}

/**
 * Factory for creating test bookmark data
 */
export function createTestBookmark(overrides?: Partial<TestBookmark>): TestBookmark {
  return {
    id: `bookmark-${Math.random().toString(36).substr(2, 9)}`,
    user_id: `user-${Math.random().toString(36).substr(2, 9)}`,
    content_category: 'agents',
    content_slug: `test-content-${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date(),
    ...overrides,
  };
}

/**
 * Helper to seed Prismock database with test data
 */
export async function seedTestData(
  prismock: PrismockClient,
  options?: {
    users?: TestUser[];
    content?: TestContent[];
    jobs?: TestJob[];
    companies?: TestCompany[];
    bookmarks?: TestBookmark[];
  }
) {
  if (options?.users) {
    for (const user of options.users) {
      await prismock.public_users.create({ data: user as any });
    }
  }

  if (options?.content) {
    for (const content of options.content) {
      await prismock.content.create({ data: content as any });
    }
  }

  if (options?.jobs) {
    for (const job of options.jobs) {
      await prismock.jobs.create({ data: job as any });
    }
  }

  if (options?.companies) {
    for (const company of options.companies) {
      await prismock.companies.create({ data: company as any });
    }
  }

  if (options?.bookmarks) {
    for (const bookmark of options.bookmarks) {
      await prismock.bookmarks.create({ data: bookmark as any });
    }
  }
}

// Type definitions for test data
export interface TestUser {
  id: string;
  email: string;
  display_name: string;
  username: string;
  bio?: string | null;
  website?: string | null;
  social_x_link?: string | null;
  work?: string | null;
  profile_public: boolean;
  follow_email: boolean;
  interests?: string[] | null;
  created_at: Date;
  updated_at: Date;
}

export interface TestContent {
  id: string;
  slug: string;
  title: string;
  category: string;
  description?: string | null;
  author_slug?: string | null;
  tags?: string[] | null;
  source: string;
  source_url?: string | null;
  popularity_score: number;
  trending_score: number;
  created_at: Date;
  updated_at: Date;
}

export interface TestJob {
  id: string;
  slug: string;
  title: string;
  company_name: string;
  company_slug?: string | null;
  location: string;
  salary_range?: string | null;
  category: string;
  employment_type: string;
  experience_level: string;
  remote: boolean;
  posted_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TestCompany {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  website?: string | null;
  logo_url?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TestBookmark {
  id: string;
  user_id: string;
  content_category: string;
  content_slug: string;
  created_at: Date;
}
