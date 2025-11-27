/**
 * Draft Manager - localStorage-based auto-save for submission form
 *
 * Handles automatic saving and restoration of form drafts.
 * Uses localStorage for instant, free, offline-capable storage.
 *
 * Features:
 * - Auto-save every 2 seconds (debounced)
 * - Restore draft on page load
 * - Quality scoring for gamification
 * - Expiration handling (30 days)
 * - Multiple draft support (per submission type)
 *
 * Usage:
 * ```tsx
 * const draftManager = new DraftManager(Constants.public.Enums.submission_type[0]); // 'agents'
 * draftManager.save(formData);
 * const draft = draftManager.load();
 * ```
 */

import { Constants } from '@heyclaude/database-types';

import { normalizeError } from '../../errors.ts';
import { logger } from '../../logger.ts';
import type { SubmissionContentType } from '../../types/component.types.ts';

/**
 * Form data structure for drafts
 */
export interface DraftFormData {
  // Step 1: Type selection
  submission_type: SubmissionContentType;

  // Step 2: Basic info
  name: string;
  description: string;

  // Step 3: Type-specific (stored as generic object)
  type_specific: Record<string, unknown>;

  // Step 4: Examples & tags
  examples: Array<{
    id: string;
    title: string;
    code: string;
    language: string;
    description?: string;
  }>;
  tags: string[];

  // Meta
  template_used?: string;
  last_step: number;
  quality_score: number;
}

/**
 * Stored draft metadata
 */
interface StoredDraft {
  data: DraftFormData;
  created_at: string;
  updated_at: string;
  expires_at: string;
  version: number;
}

/**
 * Draft Manager class
 */
export class DraftManager {
  private static readonly STORAGE_PREFIX = 'submission-draft';
  private static readonly VERSION = 1;
  private static readonly EXPIRATION_DAYS = 30;

  private key: string;

  constructor(submissionType?: SubmissionContentType) {
    // Key includes submission type for multiple draft support
    this.key = submissionType
      ? `${DraftManager.STORAGE_PREFIX}-${submissionType}`
      : DraftManager.STORAGE_PREFIX;
  }

  /**
   * Save draft to localStorage
   */
  save(data: Partial<DraftFormData>): boolean {
    try {
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + DraftManager.EXPIRATION_DAYS * 24 * 60 * 60 * 1000
      );

      // Load existing draft to preserve created_at
      const existing = this.loadRaw();
      const createdAt = existing?.created_at ?? now.toISOString();

      const draftData: DraftFormData = {
        submission_type: data.submission_type ?? Constants.public.Enums.submission_type[0], // 'agents'
        name: data.name ?? '',
        description: data.description ?? '',
        type_specific: data.type_specific ?? {},
        examples: data.examples ?? [],
        tags: data.tags ?? [],
        ...(data.template_used ? { template_used: data.template_used } : {}),
        last_step: data.last_step ?? 1,
        quality_score: this.calculateQualityScore(data as DraftFormData),
      };

      const draft: StoredDraft = {
        data: draftData,
        created_at: createdAt,
        updated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        version: DraftManager.VERSION,
      };

      localStorage.setItem(this.key, JSON.stringify(draft));
      return true;
    } catch (error) {
      const normalized = normalizeError(error, 'DraftManager: Failed to save draft');
      logger.warn('DraftManager: Failed to save draft', {
        error: normalized.message,
        key: this.key,
      });
      return false;
    }
  }

  /**
   * Load draft from localStorage
   */
  load(): DraftFormData | null {
    const draft = this.loadRaw();
    if (!draft) return null;

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(draft.expires_at);
    if (now > expiresAt) {
      this.clear();
      return null;
    }

    return draft.data;
  }

  /**
   * Load raw draft (with metadata)
   */
  private loadRaw(): StoredDraft | null {
    try {
      const stored = localStorage.getItem(this.key);
      if (!stored) return null;

      const draft = JSON.parse(stored) as StoredDraft;

      // Version check
      if (draft.version !== DraftManager.VERSION) {
        logger.info('DraftManager: Draft version mismatch, clearing', {
          stored: draft.version,
          current: DraftManager.VERSION,
        });
        this.clear();
        return null;
      }

      return draft;
    } catch (error) {
      const normalized = normalizeError(error, 'DraftManager: Failed to load draft');
      logger.warn('DraftManager: Failed to load draft', {
        error: normalized.message,
        key: this.key,
      });
      return null;
    }
  }

  /**
   * Clear draft from localStorage
   */
  clear(): boolean {
    try {
      localStorage.removeItem(this.key);
      return true;
    } catch (error) {
      const normalized = normalizeError(error, 'DraftManager: Failed to clear draft');
      logger.warn('DraftManager: Failed to clear draft', {
        error: normalized.message,
        key: this.key,
      });
      return false;
    }
  }

  /**
   * Check if draft exists
   */
  exists(): boolean {
    return this.load() !== null;
  }

  /**
   * Get draft age in milliseconds
   */
  getAge(): number | null {
    const draft = this.loadRaw();
    if (!draft) return null;

    const now = new Date();
    const createdAt = new Date(draft.created_at);
    return now.getTime() - createdAt.getTime();
  }

  /**
   * Get time until expiration in milliseconds
   */
  getTimeUntilExpiration(): number | null {
    const draft = this.loadRaw();
    if (!draft) return null;

    const now = new Date();
    const expiresAt = new Date(draft.expires_at);
    return expiresAt.getTime() - now.getTime();
  }

  /**
   * Calculate quality score (0-100)
   */
  private calculateQualityScore(data: Partial<DraftFormData>): number {
    let score = 0;

    // Name (20 points)
    if (data.name) {
      score += data.name.length >= 5 ? 20 : (data.name.length / 5) * 20;
    }

    // Description (30 points)
    if (data.description) {
      score += data.description.length >= 100 ? 30 : (data.description.length / 100) * 30;
    }

    // Examples (30 points)
    if (data.examples && data.examples.length > 0) {
      const exampleScore = Math.min(data.examples.length / 3, 1) * 30;
      score += exampleScore;
    }

    // Tags (10 points)
    if (data.tags && data.tags.length > 0) {
      const tagScore = Math.min(data.tags.length / 3, 1) * 10;
      score += tagScore;
    }

    // Type-specific fields (10 points)
    if (data.type_specific) {
      const fieldCount = Object.keys(data.type_specific).length;
      const typeScore = Math.min(fieldCount / 5, 1) * 10;
      score += typeScore;
    }

    return Math.round(score);
  }

  /**
   * Get quality level based on score
   */
  getQualityLevel(score: number): 'low' | 'medium' | 'high' | 'perfect' {
    if (score >= 90) return 'perfect';
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * List all drafts (across all submission types)
   */
  static listAll(): Array<{
    key: string;
    submission_type: SubmissionContentType;
    data: DraftFormData;
    created_at: string;
    updated_at: string;
  }> {
    const drafts: Array<{
      key: string;
      submission_type: SubmissionContentType;
      data: DraftFormData;
      created_at: string;
      updated_at: string;
    }> = [];

    try {
      for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);
        if (!key?.startsWith(DraftManager.STORAGE_PREFIX)) continue;

        const stored = localStorage.getItem(key);
        if (!stored) continue;

        const draft = JSON.parse(stored) as StoredDraft;

        // Check expiration
        const now = new Date();
        const expiresAt = new Date(draft.expires_at);
        if (now > expiresAt) {
          localStorage.removeItem(key);
          continue;
        }

        drafts.push({
          key,
          submission_type: draft.data.submission_type,
          data: draft.data,
          created_at: draft.created_at,
          updated_at: draft.updated_at,
        });
      }
    } catch (error) {
      const normalized = normalizeError(error, 'DraftManager: Failed to list drafts');
      // Pino's stdSerializers.err automatically handles error serialization
      logger.warn('DraftManager: Failed to list drafts', { err: normalized });
    }

    // Sort by updated_at (most recent first)
    drafts.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    return drafts;
  }

  /**
   * Clear all expired drafts
   */
  static clearExpired(): number {
    let cleared = 0;

    try {
      const now = new Date();
      const keys: string[] = [];

      // Collect all draft keys
      for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);
        if (key?.startsWith(DraftManager.STORAGE_PREFIX)) {
          keys.push(key);
        }
      }

      // Check each draft
      for (const key of keys) {
        const stored = localStorage.getItem(key);
        if (!stored) continue;

        try {
          const draft = JSON.parse(stored) as StoredDraft;
          const expiresAt = new Date(draft.expires_at);

          if (now > expiresAt) {
            localStorage.removeItem(key);
            cleared++;
          }
        } catch {
          // Invalid JSON, remove it
          localStorage.removeItem(key);
          cleared++;
        }
      }
    } catch (error) {
      const normalized = normalizeError(error, 'DraftManager: Failed to clear expired drafts');
      // Pino's stdSerializers.err automatically handles error serialization
      logger.warn('DraftManager: Failed to clear expired drafts', { err: normalized });
    }

    return cleared;
  }

  /**
   * Clear all drafts (useful for testing)
   */
  static clearAll(): number {
    let cleared = 0;

    try {
      const keys: string[] = [];

      // Collect all draft keys
      for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);
        if (key?.startsWith(DraftManager.STORAGE_PREFIX)) {
          keys.push(key);
        }
      }

      // Remove all
      for (const key of keys) {
        localStorage.removeItem(key);
        cleared++;
      }
    } catch (error) {
      const normalized = normalizeError(error, 'DraftManager: Failed to clear all drafts');
      // Pino's stdSerializers.err automatically handles error serialization
      logger.warn('DraftManager: Failed to clear all drafts', { err: normalized });
    }

    return cleared;
  }

  /**
   * Get storage size in bytes
   */
  static getStorageSize(): number {
    let size = 0;

    try {
      for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);
        if (!key?.startsWith(DraftManager.STORAGE_PREFIX)) continue;

        const value = localStorage.getItem(key);
        if (value) {
          // Rough estimate: 2 bytes per character (UTF-16)
          size += (key.length + value.length) * 2;
        }
      }
    } catch (error) {
      const normalized = normalizeError(error, 'DraftManager: Failed to calculate storage size');
      // Pino's stdSerializers.err automatically handles error serialization
      logger.warn('DraftManager: Failed to calculate storage size', { err: normalized });
    }

    return size;
  }
}

/**
 * Debounced auto-save hook
 *
 * Usage:
 * ```tsx
 * const handleChange = useDebouncedSave(draftManager, formData, 2000);
 * ```
 */
export function createDebouncedSave(
  draftManager: DraftManager,
  delay = 2000
): (data: Partial<DraftFormData>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (data: Partial<DraftFormData>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      draftManager.save(data);
      const loadedDraft = draftManager.load();
      logger.debug('DraftManager: Auto-saved draft', {
        ...(data.submission_type ? { submission_type: data.submission_type } : {}),
        ...(loadedDraft?.quality_score === undefined
          ? {}
          : { quality_score: loadedDraft.quality_score }),
      });
    }, delay);
  };
}
