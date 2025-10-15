/**
 * Additional Content Types
 *
 * Supplementary types used across the codebase.
 * Extracted from barrel file to eliminate performance overhead.
 */

/**
 * Content statistics type
 * Used for tracking counts across all categories
 */
export type ContentStats = {
  agents: number;
  mcp: number;
  rules: number;
  commands: number;
  hooks: number;
  guides: number;
  statuslines: number;
  collections: number;
  skills: number;
};

/**
 * Placeholder job content type
 * Jobs feature not fully implemented yet
 *
 * NOTE: This is a TypeScript type, not a Zod schema.
 * When jobs are properly implemented, create job.schema.ts with Zod validation.
 */
export type JobContent = {
  slug: string;
  description: string;
  category: string;
  author: string;
  dateAdded: string;
  tags: string[];
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string;
  postedAt: string;
  requirements: string[];
  benefits: string[];
  applyUrl: string;
  contactEmail: string;
  remote: boolean;
  featured?: boolean;
  companyLogo?: string;
};
