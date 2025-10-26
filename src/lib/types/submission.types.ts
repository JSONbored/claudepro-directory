/**
 * Submission Types
 *
 * Centralized type definitions for submission-related entities.
 * Single source of truth for all submission type imports.
 *
 * @module types/submission
 */

import type { Database } from '@/src/types/database.types';

/** Submission entity from database */
export type Submission = Database['public']['Tables']['submissions']['Row'];

/** Submission insert payload */
export type SubmissionInsert = Database['public']['Tables']['submissions']['Insert'];

/** Submission update payload */
export type SubmissionUpdate = Database['public']['Tables']['submissions']['Update'];
