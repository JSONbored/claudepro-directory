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
import { type SubmissionContentType } from '../../types/component.types.ts';

/**
 * Form data structure for drafts
 */
export interface DraftFormData {
  description: string;

  // Step 4: Examples & tags
  examples: Array<{
    code: string;
    description?: string;
    id: string;
    language: string;
    title: string;
  }>;
  last_step: number;

  // Step 2: Basic info
  name: string;

  quality_score: number;
  // Step 1: Type selection
  submission_type: SubmissionContentType;

  tags: string[];
  // Meta
  template_used?: string;
  // Step 3: Type-specific (stored as generic object)
  type_specific: Record<string, unknown>;
}

/**
 * Stored draft metadata
 */
interface StoredDraft {
  created_at: string;
  data: DraftFormData;
  expires_at: string;
  updated_at: string;
  version: number;
}

/**
 * Draft Manager class
 */
export class DraftManager {
  private static readonly EXPIRATION_DAYS = 30;
  private static readonly STORAGE_PREFIX = 'submission-draft';
  private static readonly VERSION = 1;

  private readonly key: string;

  constructor(submissionType?: SubmissionContentType) {
    // Key includes submission type for multiple draft support
    this.key = submissionType
      ? `${DraftManager.STORAGE_PREFIX}-${submissionType}`
      : DraftManager.STORAGE_PREFIX;
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
      // Client-side utility - include full context
      const normalized = normalizeError(error, 'DraftManager: Failed to clear all drafts');
      logger.warn(
        { cleared, err: normalized, module: 'data/drafts', operation: 'DraftManager.clearAll' },
        'DraftManager: Failed to clear all drafts'
      );
    }

    return cleared;
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
      // Client-side utility - include full context
      const normalized = normalizeError(error, 'DraftManager: Failed to clear expired drafts');
      logger.warn(
        { cleared, err: normalized, module: 'data/drafts', operation: 'DraftManager.clearExpired' },
        'DraftManager: Failed to clear expired drafts'
      );
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
      // Client-side utility - include full context
      const normalized = normalizeError(error, 'DraftManager: Failed to calculate storage size');
      logger.warn(
        { err: normalized, module: 'data/drafts', operation: 'DraftManager.getStorageSize' },
        'DraftManager: Failed to calculate storage size'
      );
    }

    return size;
  }

  /**
   * List all drafts (across all submission types)
   */
  static listAll(): Array<{
    created_at: string;
    data: DraftFormData;
    key: string;
    submission_type: SubmissionContentType;
    updated_at: string;
  }> {
    const drafts: Array<{
      created_at: string;
      data: DraftFormData;
      key: string;
      submission_type: SubmissionContentType;
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
          created_at: draft.created_at,
          data: draft.data,
          key,
          submission_type: draft.data.submission_type,
          updated_at: draft.updated_at,
        });
      }
    } catch (error) {
      // Client-side utility - include full context
      const normalized = normalizeError(error, 'DraftManager: Failed to list drafts');
      logger.warn(
        { err: normalized, module: 'data/drafts', operation: 'DraftManager.listAll' },
        'DraftManager: Failed to list drafts'
      );
    }

    // Sort by updated_at (most recent first)
    drafts.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    return drafts;
  }

  /**
   * Clear draft from localStorage
   */
  clear(): boolean {
    try {
      localStorage.removeItem(this.key);
      return true;
    } catch (error) {
      // Client-side utility - include full context
      const normalized = normalizeError(error, 'DraftManager: Failed to clear draft');
      logger.warn(
        { err: normalized, key: this.key, module: 'data/drafts', operation: 'DraftManager.clear' },
        'DraftManager: Failed to clear draft'
      );
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
  getAge(): null | number {
    const draft = this.loadRaw();
    if (!draft) return null;

    const now = new Date();
    const createdAt = new Date(draft.created_at);
    return now.getTime() - createdAt.getTime();
  }

  /**
   * Get quality level based on score
   * @param score
   */
  getQualityLevel(score: number): 'high' | 'low' | 'medium' | 'perfect' {
    if (score >= 90) return 'perfect';
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Get time until expiration in milliseconds
   */
  getTimeUntilExpiration(): null | number {
    const draft = this.loadRaw();
    if (!draft) return null;

    const now = new Date();
    const expiresAt = new Date(draft.expires_at);
    return expiresAt.getTime() - now.getTime();
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
   * Save draft to localStorage
   * @param data
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
        description: data.description ?? '',
        examples: data.examples ?? [],
        name: data.name ?? '',
        submission_type: data.submission_type ?? Constants.public.Enums.submission_type[0], // 'agents'
        tags: data.tags ?? [],
        type_specific: data.type_specific ?? {},
        ...(data.template_used ? { template_used: data.template_used } : {}),
        last_step: data.last_step ?? 1,
        quality_score: this.calculateQualityScore(data as DraftFormData),
      };

      const draft: StoredDraft = {
        created_at: createdAt,
        data: draftData,
        expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
        version: DraftManager.VERSION,
      };

      localStorage.setItem(this.key, JSON.stringify(draft));
      return true;
    } catch (error) {
      // Client-side utility - include full context
      const normalized = normalizeError(error, 'DraftManager: Failed to save draft');
      logger.warn(
        {
          err: normalized,
          key: this.key,
          module: 'data/drafts',
          operation: 'DraftManager.save',
          submission_type: data.submission_type,
        },
        'DraftManager: Failed to save draft'
      );
      return false;
    }
  }

  /**
   * Calculate quality score (0-100)
   * @param data
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
   * Load raw draft (with metadata)
   */
  private loadRaw(): null | StoredDraft {
    try {
      const stored = localStorage.getItem(this.key);
      if (!stored) return null;

      const draft = JSON.parse(stored) as StoredDraft;

      // Version check
      if (draft.version !== DraftManager.VERSION) {
        // Client-side utility - include full context
        logger.info(
          {
            current: DraftManager.VERSION,
            key: this.key,
            module: 'data/drafts',
            operation: 'DraftManager.loadRaw',
            stored: draft.version,
          },
          'DraftManager: Draft version mismatch, clearing'
        );
        this.clear();
        return null;
      }

      return draft;
    } catch (error) {
      // Client-side utility - include full context
      const normalized = normalizeError(error, 'DraftManager: Failed to load draft');
      logger.warn(
        {
          err: normalized,
          key: this.key,
          module: 'data/drafts',
          operation: 'DraftManager.loadRaw',
        },
        'DraftManager: Failed to load draft'
      );
      return null;
    }
  }
}

/**
 * Debounced auto-save hook
 *
 * Usage:
 * ```tsx
 * const handleChange = useDebouncedSave(draftManager, formData, 2000);
 * ```
 * @param draftManager
 * @param delay
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
      // Client-side utility - include full context
      logger.debug(
        {
          module: 'data/drafts',
          operation: 'createDebouncedSave',
          ...(data.submission_type ? { submission_type: data.submission_type } : {}),
          ...(loadedDraft?.quality_score === undefined
            ? {}
            : { quality_score: loadedDraft.quality_score }),
        },
        'DraftManager: Auto-saved draft'
      );
    }, delay);
  };
}
