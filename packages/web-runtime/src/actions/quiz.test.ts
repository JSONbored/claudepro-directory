import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock safe-action middleware - standardized pattern
// Pattern: rateLimitedAction.inputSchema().metadata().action()
vi.mock('./safe-action.ts', () => {
  // Define all factory functions inside the mock factory to avoid hoisting issues
  const createActionHandler = (inputSchema: any) => {
    return vi.fn((handler: any) => {
      return async (input: unknown) => {
        const parsed = inputSchema ? inputSchema.parse(input) : input;
        return handler({
          parsedInput: parsed,
          ctx: { userAgent: 'test-user-agent', startTime: performance.now() },
        });
      };
    });
  };

  const createMetadataResult = (inputSchema: any) => ({
    action: createActionHandler(inputSchema),
  });

  const createInputSchemaResult = (inputSchema: any) => ({
    metadata: vi.fn(() => createMetadataResult(inputSchema)),
    action: createActionHandler(inputSchema),
  });

  return {
    rateLimitedAction: {
      inputSchema: vi.fn((schema: any) => createInputSchemaResult(schema)),
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
