/**
 * Types for package generation system
 */

import type { Database as DatabaseGenerated } from '../../../_shared/database.types.ts';

/**
 * Content row type (from database)
 */
export type ContentRow = DatabaseGenerated['public']['Tables']['content']['Row'];

/**
 * Result of package generation
 */
export interface GenerateResult {
  storageUrl: string;
  metadata?: Record<string, unknown>; // Category-specific metadata (e.g., build_hash, file_size)
}

/**
 * Package generator interface
 * All category generators must implement this interface
 */
export interface PackageGenerator {
  /**
   * Check if content can be generated
   * @param content - Content row from database
   * @returns true if generation is possible
   */
  canGenerate(content: ContentRow): boolean;

  /**
   * Generate package and return storage URL
   * @param content - Content row from database
   * @returns Generation result with storage URL and metadata
   */
  generate(content: ContentRow): Promise<GenerateResult>;

  /**
   * Get Supabase Storage bucket name
   * @returns Bucket name for this category
   */
  getBucketName(): string;

  /**
   * Get database fields to update after generation
   * @returns Array of field names to update in content table
   */
  getDatabaseFields(): string[];
}

/**
 * Request body for package generation
 */
export interface GeneratePackageRequest {
  content_id: string;
  category: DatabaseGenerated['public']['Enums']['content_category'];
}

/**
 * Response for package generation
 */
export interface GeneratePackageResponse {
  success: boolean;
  content_id: string;
  category: DatabaseGenerated['public']['Enums']['content_category'];
  slug: string;
  storage_url: string; // Required for success, empty string for async/error cases
  metadata?: Record<string, unknown>;
  message?: string;
  error?: string;
}
