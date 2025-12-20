import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock safe-action middleware - standardized pattern
// Pattern: optionalAuthAction.inputSchema().metadata().action()
// Pattern: rateLimitedAction.inputSchema().metadata().action()
vi.mock('./safe-action.ts', () => {
  // Define all factory functions inside the mock factory to avoid hoisting issues
  const createOptionalAuthActionHandler = (inputSchema: any) => {
    return vi.fn((handler: any) => {
      return async (input: unknown) => {
        const parsed = inputSchema ? inputSchema.parse(input) : input;
        // For optionalAuthAction, provide user object so userId is set
        // This matches the real behavior where userId is only set if user exists
        const result = await handler({
          parsedInput: parsed,
          ctx: {
            user: { id: 'test-user-id', email: 'test@example.com' } as any,
            userId: 'test-user-id',
            userEmail: 'test@example.com',
          },
        });
        return result;
      };
    });
  };

  const createOptionalAuthMetadataResult = (inputSchema: any) => ({
    action: createOptionalAuthActionHandler(inputSchema),
  });

  const createOptionalAuthInputSchemaResult = (inputSchema: any) => ({
    metadata: vi.fn(() => createOptionalAuthMetadataResult(inputSchema)),
    action: createOptionalAuthActionHandler(inputSchema),
  });

  const createRateLimitedActionHandler = (inputSchema: any) => {
    return vi.fn((handler: any) => {
      return async (input: unknown) => {
        const parsed = inputSchema ? inputSchema.parse(input) : input;
        const result = await handler({
          parsedInput: parsed,
          ctx: { userAgent: 'test-user-agent', startTime: performance.now() },
        });
        return result;
      };
    });
  };

  const createRateLimitedMetadataResult = (inputSchema: any) => ({
    action: createRateLimitedActionHandler(inputSchema),
  });

  const createRateLimitedInputSchemaResult = (inputSchema: any) => ({
    metadata: vi.fn(() => createRateLimitedMetadataResult(inputSchema)),
    action: createRateLimitedActionHandler(inputSchema),
  });

  return {
    optionalAuthAction: {
      inputSchema: vi.fn((schema: any) => createOptionalAuthInputSchemaResult(schema)),
    },
    rateLimitedAction: {
      inputSchema: vi.fn((schema: any) => createRateLimitedInputSchemaResult(schema)),
    },
  };
});

// Mock pulse
vi.mock('../pulse.ts', () => ({
  enqueuePulseEventServer: vi.fn(),
}));

// Mock data layer
vi.mock('../data/tools/recommendations.ts', () => ({
  getConfigRecommendations: vi.fn(),
}));

// Mock logger
vi.mock('../logger.ts', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock errors
vi.mock('../errors.ts', () => ({
  normalizeError: vi.fn((error, message) => {
    const err = error instanceof Error ? error : new Error(String(error));
    err.message = message;
    return err;
  }),
}));

describe.skip('trackInteractionAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate interaction_type enum', async () => {
      const { trackInteractionAction } = await import('./pulse.ts');
      const { interaction_typeSchema } = await import('../prisma-zod-schemas.ts');
      
      // Test that valid enum values are accepted
      expect(() => {
        interaction_typeSchema.parse('view');
      }).not.toThrow();
      
      // Test that invalid enum values are rejected
      expect(() => {
        interaction_typeSchema.parse('invalid-type');
      }).toThrow();
    });

    it('should accept optional content_type, content_slug, session_id, metadata', async () => {
      const { trackInteractionAction } = await import('./pulse.ts');
      const { enqueuePulseEventServer } = await import('../pulse.ts');

      await trackInteractionAction({
        interaction_type: 'view',
        content_type: 'agents',
        content_slug: 'test-agent',
        session_id: '123e4567-e89b-12d3-a456-426614174000',
        metadata: { source: 'homepage' },
      });

      expect(enqueuePulseEventServer).toHaveBeenCalled();
    });

    it('should validate session_id UUID format when provided', async () => {
      const { trackInteractionAction } = await import('./pulse.ts');

      await expect(
        trackInteractionAction({
          interaction_type: 'view',
          session_id: 'invalid-uuid',
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('event enqueueing', () => {
    it('should call enqueuePulseEventServer with correct parameters', async () => {
      const { trackInteractionAction } = await import('./pulse.ts');
      const { enqueuePulseEventServer } = await import('../pulse.ts');

      await trackInteractionAction({
        interaction_type: 'view',
        content_type: 'agents',
        content_slug: 'test-agent',
        session_id: '123e4567-e89b-12d3-a456-426614174000',
        metadata: { source: 'homepage' },
      });

      expect(enqueuePulseEventServer).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        content_type: 'agents',
        content_slug: 'test-agent',
        interaction_type: 'view',
        session_id: '123e4567-e89b-12d3-a456-426614174000',
        metadata: { source: 'homepage' },
      });
    });

    it('should handle null values for optional fields', async () => {
      const { trackInteractionAction } = await import('./pulse.ts');
      const { enqueuePulseEventServer } = await import('../pulse.ts');

      await trackInteractionAction({
        interaction_type: 'view',
        content_type: null,
        content_slug: null,
        session_id: null,
        metadata: null,
      });

      expect(enqueuePulseEventServer).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        content_type: null,
        content_slug: null,
        interaction_type: 'view',
        session_id: null,
        metadata: null,
      });
    });

    it('should handle null userId when not authenticated', async () => {
      const { trackInteractionAction } = await import('./pulse.ts');
      const { enqueuePulseEventServer } = await import('../pulse.ts');

      // Mock optionalAuthAction to return null userId
      vi.mock('./safe-action.ts', async () => {
        const actual = await vi.importActual('./safe-action.ts');
        return {
          ...actual,
          optionalAuthAction: {
            inputSchema: vi.fn((schema) => ({
              metadata: vi.fn(() => ({
                action: vi.fn((handler) => {
                  return async (input: unknown) => {
                    const parsed = schema.parse(input);
                    return handler({
                      parsedInput: parsed,
                      ctx: { userId: null },
                    });
                  };
                }),
              })),
            })),
          },
        };
      });

      await trackInteractionAction({
        interaction_type: 'view',
      });

      expect(enqueuePulseEventServer).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: null,
        })
      );
    });
  });
});

describe.skip('trackNewsletterEventAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should require eventType string', async () => {
      const { trackNewsletterEventAction } = await import('./pulse.ts');

      await expect(
        trackNewsletterEventAction({
          // Missing eventType
        } as any)
      ).rejects.toThrow();
    });

    it('should accept optional metadata', async () => {
      const { trackNewsletterEventAction } = await import('./pulse.ts');
      const { enqueuePulseEventServer } = await import('../pulse.ts');

      await trackNewsletterEventAction({
        eventType: 'click',
        metadata: { source: 'footer' },
      });

      expect(enqueuePulseEventServer).toHaveBeenCalled();
    });
  });

  describe('event enqueueing', () => {
    it('should call enqueuePulseEventServer with newsletter event data', async () => {
      const { trackNewsletterEventAction } = await import('./pulse.ts');
      const { enqueuePulseEventServer } = await import('../pulse.ts');

      await trackNewsletterEventAction({
        eventType: 'click',
        metadata: { source: 'footer' },
      });

      expect(enqueuePulseEventServer).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        content_type: null,
        content_slug: 'newsletter_cta',
        interaction_type: 'click',
        session_id: null,
        metadata: {
          event_type: 'click',
          source: 'footer',
        },
      });
    });
  });
});

describe.skip('trackTerminalCommandAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate contact_action_type enum', async () => {
      const { trackTerminalCommandAction } = await import('./pulse.ts');
      const { contact_action_typeSchema } = await import('../prisma-zod-schemas.ts');
      
      // Test that valid enum values are accepted
      expect(() => {
        contact_action_typeSchema.parse('submit');
      }).not.toThrow();
      
      // Test that invalid enum values are rejected
      expect(() => {
        contact_action_typeSchema.parse('invalid-action');
      }).toThrow();
    });

    it('should require command_id, action_type, and success', async () => {
      const { trackTerminalCommandAction } = await import('./pulse.ts');

      await expect(
        trackTerminalCommandAction({
          // Missing required fields
        } as any)
      ).rejects.toThrow();
    });

    it('should accept optional error_reason and execution_time_ms', async () => {
      const { trackTerminalCommandAction } = await import('./pulse.ts');
      const { enqueuePulseEventServer } = await import('../pulse.ts');

      await trackTerminalCommandAction({
        command_id: 'cmd-1',
        action_type: 'execute',
        success: true,
        error_reason: 'Timeout',
        execution_time_ms: 500,
      });

      expect(enqueuePulseEventServer).toHaveBeenCalled();
    });
  });

  describe('event enqueueing', () => {
    it('should call enqueuePulseEventServer with terminal command data', async () => {
      const { trackTerminalCommandAction } = await import('./pulse.ts');
      const { enqueuePulseEventServer } = await import('../pulse.ts');

      await trackTerminalCommandAction({
        command_id: 'cmd-1',
        action_type: 'execute',
        success: true,
        error_reason: 'Timeout',
        execution_time_ms: 500,
      });

      expect(enqueuePulseEventServer).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        content_type: null,
        content_slug: 'contact-terminal',
        interaction_type: 'contact_interact',
        session_id: null,
        metadata: {
          command_id: 'cmd-1',
          action_type: 'execute',
          success: true,
          error_reason: 'Timeout',
          execution_time_ms: 500,
        },
      });
    });

    it('should omit optional fields when not provided', async () => {
      const { trackTerminalCommandAction } = await import('./pulse.ts');
      const { enqueuePulseEventServer } = await import('../pulse.ts');

      await trackTerminalCommandAction({
        command_id: 'cmd-1',
        action_type: 'execute',
        success: true,
      });

      expect(enqueuePulseEventServer).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        content_type: null,
        content_slug: 'contact-terminal',
        interaction_type: 'contact_interact',
        session_id: null,
        metadata: {
          command_id: 'cmd-1',
          action_type: 'execute',
          success: true,
        },
      });
    });
  });
});

describe.skip('trackTerminalFormSubmissionAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate contact_category enum', async () => {
      const { trackTerminalFormSubmissionAction } = await import('./pulse.ts');
      const { contact_categorySchema } = await import('../prisma-zod-schemas.ts');
      
      // Test that valid enum values are accepted
      expect(() => {
        contact_categorySchema.parse('general');
      }).not.toThrow();
      
      // Test that invalid enum values are rejected
      expect(() => {
        contact_categorySchema.parse('invalid-category');
      }).toThrow();
    });

    it('should require category and success', async () => {
      const { trackTerminalFormSubmissionAction } = await import('./pulse.ts');

      await expect(
        trackTerminalFormSubmissionAction({
          // Missing required fields
        } as any)
      ).rejects.toThrow();
    });

    it('should accept optional error', async () => {
      const { trackTerminalFormSubmissionAction } = await import('./pulse.ts');
      const { enqueuePulseEventServer } = await import('../pulse.ts');

      await trackTerminalFormSubmissionAction({
        category: 'general',
        success: false,
        error: 'Validation failed',
      });

      expect(enqueuePulseEventServer).toHaveBeenCalled();
    });
  });

  describe('event enqueueing', () => {
    it('should call enqueuePulseEventServer with form submission data', async () => {
      const { trackTerminalFormSubmissionAction } = await import('./pulse.ts');
      const { enqueuePulseEventServer } = await import('../pulse.ts');

      await trackTerminalFormSubmissionAction({
        category: 'general',
        success: true,
        error: 'Validation failed',
      });

      expect(enqueuePulseEventServer).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        content_type: null,
        content_slug: 'contact-form',
        interaction_type: 'contact_submit',
        session_id: null,
        metadata: {
          category: 'general',
          success: true,
          error: 'Validation failed',
        },
      });
    });
  });
});

describe.skip('trackUsageAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate content_category enum', async () => {
      const { trackUsageAction } = await import('./pulse.ts');
      const { content_categorySchema } = await import('../prisma-zod-schemas.ts');
      
      // Test that valid enum values are accepted
      expect(() => {
        content_categorySchema.parse('agents');
      }).not.toThrow();
      
      // Test that invalid enum values are rejected
      expect(() => {
        content_categorySchema.parse('invalid-category');
      }).toThrow();
    });

    it('should validate action_type enum', async () => {
      const { trackUsageAction } = await import('./pulse.ts');

      await expect(
        trackUsageAction({
          content_type: 'agents',
          content_slug: 'test-agent',
          action_type: 'invalid-action',
        } as any)
      ).rejects.toThrow();
    });

    it('should require content_type, content_slug, and action_type', async () => {
      const { trackUsageAction } = await import('./pulse.ts');

      await expect(
        trackUsageAction({
          // Missing required fields
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('event enqueueing', () => {
    it('should map copy action_type to copy interaction_type', async () => {
      const { trackUsageAction } = await import('./pulse.ts');
      const { enqueuePulseEventServer } = await import('../pulse.ts');

      await trackUsageAction({
        content_type: 'agents',
        content_slug: 'test-agent',
        action_type: 'copy',
      });

      expect(enqueuePulseEventServer).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        content_type: 'agents',
        content_slug: 'test-agent',
        interaction_type: 'copy',
        metadata: {
          action_type: 'copy',
        },
      });
    });

    it('should map download action_types to download interaction_type', async () => {
      const { trackUsageAction } = await import('./pulse.ts');
      const { enqueuePulseEventServer } = await import('../pulse.ts');

      await trackUsageAction({
        content_type: 'agents',
        content_slug: 'test-agent',
        action_type: 'download_zip',
      });

      expect(enqueuePulseEventServer).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        content_type: 'agents',
        content_slug: 'test-agent',
        interaction_type: 'download',
        metadata: {
          action_type: 'download_zip',
        },
      });
    });
  });
});

describe.skip('generateConfigRecommendationsAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should validate useCase enum', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');
      const { useCaseTypeSchema } = await import('../prisma-zod-schemas.ts');
      
      // Test that valid enum values are accepted
      expect(() => {
        useCaseTypeSchema.parse('automation');
      }).not.toThrow();
      
      // Test that invalid enum values are rejected
      expect(() => {
        useCaseTypeSchema.parse('invalid-use-case');
      }).toThrow();
    });

    it('should validate experienceLevel enum', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');
      const { experience_levelSchema } = await import('../prisma-zod-schemas.ts');
      
      // Test that valid enum values are accepted
      expect(() => {
        experience_levelSchema.parse('beginner');
      }).not.toThrow();
      
      // Test that invalid enum values are rejected
      expect(() => {
        experience_levelSchema.parse('invalid-level');
      }).toThrow();
    });

    it('should require useCase, experienceLevel, and toolPreferences', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');

      // next-safe-action returns error responses, doesn't throw
      const result = await generateConfigRecommendationsAction({
        // Missing required fields
      } as any);

      expect(result).toHaveProperty('serverError');
      expect(result.serverError).toBeDefined();
    });

    it('should accept optional integrations and focusAreas arrays', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');
      const { getConfigRecommendations } = await import('../data/tools/recommendations.ts');

      vi.mocked(getConfigRecommendations).mockResolvedValue({
        results: [],
        total_matches: 0,
        algorithm: 'unknown',
        summary: {
          top_category: null,
          avg_match_score: 0,
          diversity_score: 0,
        },
      } as any);

      await generateConfigRecommendationsAction({
        useCase: 'automation',
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
        integrations: [],
        focusAreas: [],
      });

      expect(getConfigRecommendations).toHaveBeenCalled();
    });
  });

  describe('recommendations generation', () => {
    it('should call getConfigRecommendations and transform results', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');
      const { getConfigRecommendations } = await import('../data/tools/recommendations.ts');

      const mockRecommendations = {
        results: [
          {
            slug: 'test-config',
            title: 'Test Config',
            description: 'Test description',
            category: 'agents',
            tags: ['react'],
            author: 'Test Author',
            match_score: 0.9,
            match_percentage: 90,
            primary_reason: 'Matches your preferences',
            rank: 1,
            reasons: [{ type: 'tool_match', message: 'Uses Cursor' }],
          },
        ],
        total_matches: 1,
        algorithm: 'hybrid',
        summary: {
          top_category: 'agents',
          avg_match_score: 0.9,
          diversity_score: 0.8,
        },
      };

      vi.mocked(getConfigRecommendations).mockResolvedValue(mockRecommendations as any);

      const result = await generateConfigRecommendationsAction({
        useCase: 'automation',
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
        integrations: ['github'],
        focusAreas: ['productivity'],
      });

      expect(getConfigRecommendations).toHaveBeenCalledWith({
        useCase: 'automation',
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
        integrations: ['github'],
        focusAreas: ['productivity'],
      });

      expect(result.success).toBe(true);
      expect(result.recommendations).toMatchObject({
        results: expect.arrayContaining([
          expect.objectContaining({
            slug: 'test-config',
            title: 'Test Config',
          }),
        ]),
        total_matches: 1,
        algorithm: 'hybrid',
        answers: {
          useCase: 'automation',
          experienceLevel: 'beginner',
          toolPreferences: ['cursor'],
          integrations: ['github'],
          focusAreas: ['productivity'],
        },
      });
      expect(result.recommendations.id).toMatch(/^rec_\d+_[a-z0-9]+$/);
      expect(result.recommendations.generatedAt).toBeDefined();
    });

    it('should handle null results from getConfigRecommendations', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');
      const { getConfigRecommendations } = await import('../data/tools/recommendations.ts');

      vi.mocked(getConfigRecommendations).mockResolvedValue(null);

      const result = await generateConfigRecommendationsAction({
        useCase: 'automation',
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
      });

      expect(result.success).toBe(true);
      expect(result.recommendations.results).toEqual([]);
      expect(result.recommendations.total_matches).toBe(0);
    });

    it('should handle transformation errors gracefully', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');
      const { getConfigRecommendations } = await import('../data/tools/recommendations.ts');
      const { logger } = await import('../logger.ts');

      // Mock data that will cause transformation error
      vi.mocked(getConfigRecommendations).mockResolvedValue({
        results: [
          {
            // Missing required fields
            slug: null,
          },
        ],
      } as any);

      const result = await generateConfigRecommendationsAction({
        useCase: 'automation',
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
      });

      expect(logger.error).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.recommendations.results).toEqual([]);
    });

    it('should handle getConfigRecommendations errors gracefully', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');
      const { getConfigRecommendations } = await import('../data/tools/recommendations.ts');
      const { logger } = await import('../logger.ts');

      const mockError = new Error('Service error');
      vi.mocked(getConfigRecommendations).mockRejectedValue(mockError);

      const result = await generateConfigRecommendationsAction({
        useCase: 'automation',
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
      });

      expect(logger.error).toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.recommendations.results).toBeNull();
      expect(result.recommendations.total_matches).toBe(0);
      expect(result.recommendations.answers).toMatchObject({
        useCase: 'automation',
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
      });
    });
  });

  describe('edge cases', () => {
    it('should handle getConfigRecommendations returning data with null results', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');
      const { getConfigRecommendations } = await import('../data/tools/recommendations.ts');

      vi.mocked(getConfigRecommendations).mockResolvedValue({
        results: null,
        total_matches: 0,
        algorithm: 'unknown',
        summary: {
          top_category: null,
          avg_match_score: 0,
          diversity_score: 0,
        },
      } as any);

      const result = await generateConfigRecommendationsAction({
        useCase: 'automation',
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
      });

      expect(result.success).toBe(true);
      expect(result.recommendations.results).toEqual([]);
    });

    it('should handle getConfigRecommendations returning data with non-array results', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');
      const { getConfigRecommendations } = await import('../data/tools/recommendations.ts');
      const { logger } = await import('../logger.ts');

      vi.mocked(getConfigRecommendations).mockResolvedValue({
        results: 'not-an-array',
        total_matches: 0,
        algorithm: 'unknown',
        summary: {
          top_category: null,
          avg_match_score: 0,
          diversity_score: 0,
        },
      } as any);

      const result = await generateConfigRecommendationsAction({
        useCase: 'automation',
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
      });

      expect(result.success).toBe(true);
      expect(result.recommendations.results).toEqual([]);
    });

    it('should handle item.tags being non-array in transformation', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');
      const { getConfigRecommendations } = await import('../data/tools/recommendations.ts');
      const { logger } = await import('../logger.ts');

      vi.mocked(getConfigRecommendations).mockResolvedValue({
        results: [
          {
            slug: 'test-config',
            title: 'Test Config',
            tags: 'not-an-array',
          },
        ],
        total_matches: 1,
        algorithm: 'hybrid',
        summary: {
          top_category: 'agents',
          avg_match_score: 0.9,
          diversity_score: 0.8,
        },
      } as any);

      const result = await generateConfigRecommendationsAction({
        useCase: 'automation',
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
      });

      expect(result.success).toBe(true);
      expect(result.recommendations.results[0].tags).toEqual([]);
    });

    it('should handle item.reasons being non-array in transformation', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');
      const { getConfigRecommendations } = await import('../data/tools/recommendations.ts');

      vi.mocked(getConfigRecommendations).mockResolvedValue({
        results: [
          {
            slug: 'test-config',
            title: 'Test Config',
            tags: [],
            reasons: 'not-an-array',
          },
        ],
        total_matches: 1,
        algorithm: 'hybrid',
        summary: {
          top_category: 'agents',
          avg_match_score: 0.9,
          diversity_score: 0.8,
        },
      } as any);

      const result = await generateConfigRecommendationsAction({
        useCase: 'automation',
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
      });

      expect(result.success).toBe(true);
      expect(result.recommendations.results[0].reasons).toEqual([]);
    });

    it('should handle empty toolPreferences array', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');
      const { getConfigRecommendations } = await import('../data/tools/recommendations.ts');

      vi.mocked(getConfigRecommendations).mockResolvedValue(null);

      const result = await generateConfigRecommendationsAction({
        useCase: 'automation',
        experienceLevel: 'beginner',
        toolPreferences: [],
      });

      expect(result.success).toBe(true);
      expect(result.recommendations.answers.toolPreferences).toEqual([]);
    });

    it('should handle empty integrations array', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');
      const { getConfigRecommendations } = await import('../data/tools/recommendations.ts');

      vi.mocked(getConfigRecommendations).mockResolvedValue(null);

      const result = await generateConfigRecommendationsAction({
        useCase: 'automation',
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
        integrations: [],
      });

      expect(result.success).toBe(true);
      expect(result.recommendations.answers.integrations).toEqual([]);
    });

    it('should handle empty focusAreas array', async () => {
      const { generateConfigRecommendationsAction } = await import('./pulse.ts');
      const { getConfigRecommendations } = await import('../data/tools/recommendations.ts');

      vi.mocked(getConfigRecommendations).mockResolvedValue(null);

      const result = await generateConfigRecommendationsAction({
        useCase: 'automation',
        experienceLevel: 'beginner',
        toolPreferences: ['cursor'],
        focusAreas: [],
      });

      expect(result.success).toBe(true);
      expect(result.recommendations.answers.focusAreas).toEqual([]);
    });
  });
});
