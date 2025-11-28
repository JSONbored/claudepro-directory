import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QuizService } from './quiz.ts';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';

vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

describe('QuizService', () => {
  let service: QuizService;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = {
      rpc: vi.fn(),
    } as unknown as SupabaseClient<Database>;
    service = new QuizService(mockSupabase);
  });

  describe('getQuizQuestions', () => {
    it('returns quiz questions on success', async () => {
      const mockData = [
        {
          id: 'q1',
          question: 'What is your experience level?',
          options: ['Beginner', 'Intermediate', 'Advanced'],
          order: 1,
        },
        {
          id: 'q2',
          question: 'What is your primary goal?',
          options: ['Learning', 'Building', 'Teaching'],
          order: 2,
        },
      ];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getQuizQuestions();

      expect(result).toEqual(mockData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_quiz_questions');
      expect(result).toHaveLength(2);
    });

    it('returns empty array when no questions exist', async () => {
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await service.getQuizQuestions();

      expect(result).toEqual([]);
    });

    it('throws error on database failure', async () => {
      const mockError = { message: 'Failed to fetch questions', code: 'DB_ERROR' };

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: mockError,
      } as any);

      await expect(service.getQuizQuestions()).rejects.toEqual(mockError);
    });

    it('handles questions with different data types', async () => {
      const mockData = [
        {
          id: 'q1',
          question: 'Multiple choice question',
          options: ['Option A', 'Option B', 'Option C'],
          type: 'multiple_choice',
        },
        {
          id: 'q2',
          question: 'Yes/No question',
          options: ['Yes', 'No'],
          type: 'boolean',
        },
      ];

      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await service.getQuizQuestions();

      expect(result).toHaveLength(2);
      expect(result![0].type).toBe('multiple_choice');
      expect(result![1].type).toBe('boolean');
    });
  });
});