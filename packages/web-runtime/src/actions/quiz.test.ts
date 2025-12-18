import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock safe-action middleware
vi.mock('./safe-action.ts', () => {
  const createActionMock = () => ({
    action: vi.fn((handler) => {
      return async (input: unknown) => {
        return handler({ parsedInput: input, ctx: {} });
      };
    }),
  });

  return {
    rateLimitedAction: {
      inputSchema: vi.fn(() => ({
        metadata: vi.fn(() => createActionMock()),
      })),
    },
  };
});

// Mock data layer
vi.mock('../data/quiz.ts', () => ({
  getQuizConfiguration: vi.fn(),
}));

describe('getQuizConfigurationAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return quiz configuration from data layer', async () => {
    const { getQuizConfigurationAction } = await import('./quiz.ts');
    const { getQuizConfiguration } = await import('../data/quiz.ts');

    const mockConfig = {
      questions: [
        {
          id: 'q1',
          text: 'What is your use case?',
          type: 'use_case',
        },
      ],
    };

    vi.mocked(getQuizConfiguration).mockResolvedValue(mockConfig as any);

    const result = await getQuizConfigurationAction({});

    expect(getQuizConfiguration).toHaveBeenCalled();
    expect(result).toEqual(mockConfig);
  });

  it('should return null on error', async () => {
    const { getQuizConfigurationAction } = await import('./quiz.ts');
    const { getQuizConfiguration } = await import('../data/quiz.ts');

    vi.mocked(getQuizConfiguration).mockRejectedValue(new Error('Data fetch error'));

    const result = await getQuizConfigurationAction({});

    expect(result).toBeNull();
  });

  it('should handle getQuizConfiguration returning null', async () => {
    const { getQuizConfigurationAction } = await import('./quiz.ts');
    const { getQuizConfiguration } = await import('../data/quiz.ts');

    vi.mocked(getQuizConfiguration).mockResolvedValue(null);

    const result = await getQuizConfigurationAction({});

    expect(result).toBeNull();
  });

  it('should handle getQuizConfiguration returning undefined', async () => {
    const { getQuizConfigurationAction } = await import('./quiz.ts');
    const { getQuizConfiguration } = await import('../data/quiz.ts');

    vi.mocked(getQuizConfiguration).mockResolvedValue(undefined as any);

    const result = await getQuizConfigurationAction({});

    expect(result).toBeUndefined();
  });
});
