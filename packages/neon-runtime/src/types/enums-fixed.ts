/**
 * Prisma Enum Types
 * 
 * Prisma generates enums as string literal union types within model types.
 * This file extracts enum types from Prisma model types for use in neon-runtime services.
 * 
 * @see packages/neon-runtime/prisma/schema.prisma for enum definitions
 */

import type { Prisma } from '@prisma/client';

/**
 * Content Category Enum
 * 
 * Extracted from Prisma.contentCreateInput['category']
 * 
 * Values: 'agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'skills', 'collections', 'guides', 'jobs', 'changelog'
 */
export type ContentCategory = NonNullable<Prisma.contentCreateInput['category']>;

/**
 * Job Category Enum
 * 
 * Extracted from Prisma.jobsCreateInput['category']
 */
export type JobCategory = NonNullable<Prisma.jobsCreateInput['category']>;

/**
 * Job Status Enum
 * 
 * Extracted from Prisma.jobsCreateInput['status']
 */
export type JobStatus = NonNullable<Prisma.jobsCreateInput['status']>;

/**
 * Job Tier Enum
 * 
 * Extracted from Prisma.jobsCreateInput['tier']
 */
export type JobTier = NonNullable<Prisma.jobsCreateInput['tier']>;

/**
 * Job Type Enum
 * 
 * Extracted from Prisma.jobsCreateInput['type']
 */
export type JobType = NonNullable<Prisma.jobsCreateInput['type']>;

/**
 * Newsletter Subscription Status Enum
 * 
 * Extracted from Prisma.newsletter_subscriptionsCreateInput['status']
 */
export type NewsletterSubscriptionStatus = NonNullable<Prisma.newsletter_subscriptionsCreateInput['status']>;

/**
 * Newsletter Source Enum
 * 
 * Extracted from Prisma.newsletter_subscriptionsCreateInput['source']
 */
export type NewsletterSource = NonNullable<Prisma.newsletter_subscriptionsCreateInput['source']>;

/**
 * Newsletter Interest Enum
 * 
 * Extracted from Prisma.newsletter_subscriptionsCreateInput['primary_interest']
 */
export type NewsletterInterest = Prisma.newsletter_subscriptionsCreateInput['primary_interest'];

/**
 * Copy Type Enum
 * 
 * Extracted from Prisma.newsletter_subscriptionsCreateInput['copy_type']
 */
export type CopyType = Prisma.newsletter_subscriptionsCreateInput['copy_type'];

/**
 * Content Source Enum
 * 
 * Extracted from Prisma.contentCreateInput['source']
 */
export type ContentSource = Prisma.contentCreateInput['source'];

/**
 * Changelog Source Enum
 * 
 * Extracted from Prisma.changelogCreateInput['source']
 */
export type ChangelogSource = NonNullable<Prisma.changelogCreateInput['source']>;

/**
 * User Role Enum
 * 
 * Note: Users table is ignored (managed by Neon Auth)
 * This type is inferred from schema enum definition
 */
export type UserRole = 'user' | 'admin' | 'moderator';

/**
 * User Tier Enum
 * 
 * Note: Users table is ignored (managed by Neon Auth)
 * This type is inferred from schema enum definition
 */
export type UserTier = 'free' | 'pro' | 'enterprise';
