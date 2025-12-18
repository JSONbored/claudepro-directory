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

// Mock service factory
const mockGetContactCommands = vi.fn();
vi.mock('../data/service-factory', () => ({
  getService: vi.fn(async (serviceKey: string) => {
    if (serviceKey === 'misc') {
      return {
        getContactCommands: mockGetContactCommands,
      };
    }
    throw new Error(`Unknown service: ${serviceKey}`);
  }),
}));

describe('getContactCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetContactCommands.mockClear();
  });

  it('should return contact commands from MiscService', async () => {
    const { getContactCommands } = await import('./contact.ts');
    const { getService } = await import('../data/service-factory');

    const mockCommands = [
      {
        id: 'cmd-1',
        text: 'help',
        description: 'Get help',
        category: 'general',
      },
    ];

    mockGetContactCommands.mockResolvedValue(mockCommands as any);

    const result = await getContactCommands({});

    expect(getService).toHaveBeenCalledWith('misc');
    expect(mockGetContactCommands).toHaveBeenCalled();
    expect(result).toEqual({ commands: mockCommands });
  });

  it('should return empty array on error', async () => {
    const { getContactCommands } = await import('./contact.ts');

    mockGetContactCommands.mockRejectedValue(new Error('Service error'));

    const result = await getContactCommands({});

    expect(result).toEqual({ commands: [] });
  });

  it('should handle null result from service', async () => {
    const { getContactCommands } = await import('./contact.ts');

    mockGetContactCommands.mockResolvedValue(null as any);

    const result = await getContactCommands({});

    expect(result).toEqual({ commands: [] });
  });

  it('should handle undefined result from service', async () => {
    const { getContactCommands } = await import('./contact.ts');

    mockGetContactCommands.mockResolvedValue(undefined as any);

    const result = await getContactCommands({});

    expect(result).toEqual({ commands: [] });
  });

  it('should handle empty array result from service', async () => {
    const { getContactCommands } = await import('./contact.ts');

    mockGetContactCommands.mockResolvedValue([]);

    const result = await getContactCommands({});

    expect(result).toEqual({ commands: [] });
  });

  describe('edge cases', () => {
    it('should handle getService errors', async () => {
      const { getContactCommands } = await import('./contact.ts');
      const { getService } = await import('../data/service-factory');

      vi.mocked(getService).mockRejectedValue(new Error('Service initialization failed'));

      const result = await getContactCommands({});

      expect(result).toEqual({ commands: [] });
    });

    it('should handle getContactCommands returning non-array', async () => {
      const { getContactCommands } = await import('./contact.ts');

      mockGetContactCommands.mockResolvedValue({} as any);

      const result = await getContactCommands({});

      // Should still return commands array (nullish coalescing handles this)
      expect(result).toEqual({ commands: [] });
    });
  });
});
