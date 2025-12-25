import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
  createCrudActionHandlers,
  executeMutationAction,
  type ActionContext,
} from './action-factory';
import { z } from 'zod';

// Mock run-rpc-instance
const mockRunRpc = jest.fn();
jest.mock('./run-rpc-instance', () => ({
  runRpc: (...args: any[]) => mockRunRpc(...args),
}));

// Mock service-factory
const mockGetService = jest.fn();
jest.mock('../data/service-factory', () => ({
  getService: (...args: any[]) => mockGetService(...args),
}));

// Mock next/cache
const mockRevalidatePath = jest.fn();
const mockRevalidateTag = jest.fn();
jest.mock('next/cache', () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
  revalidateTag: (...args: any[]) => mockRevalidateTag(...args),
}));

// Mock errors
jest.mock('../errors', () => ({
  logActionFailure: jest.fn((name, error, context) => {
    throw error;
  }),
}));

// Mock logger (use real logger per user request)
// Note: We're not mocking logger since the user requested real logger usage
// However, action-factory dynamically imports logger, so we can't easily mock it here
// The test will use the real logger implementation

describe('action-factory', () => {
  const mockCtx: ActionContext = {
    userId: 'user-id',
    userEmail: 'user@example.com',
    authToken: 'token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeMutationAction', () => {
    it('should execute RPC action successfully', async () => {
      const mockResult = { id: 'result-id', success: true };
      mockRunRpc.mockResolvedValue(mockResult);

      const result = await executeMutationAction(
        {
          actionName: 'testAction',
          category: 'content',
          inputSchema: z.object({ name: z.string() }),
          rpcName: 'test_rpc',
          transformArgs: (input) => ({ p_name: input.name }),
        },
        { name: 'test' },
        mockCtx
      );

      expect(result).toEqual(mockResult);
      expect(mockRunRpc).toHaveBeenCalledWith(
        'test_rpc',
        { p_name: 'test' },
        { action: 'testAction.rpc', userId: 'user-id' }
      );
    });

    it('should execute service method action successfully', async () => {
      const mockService = {
        testMethod: jest.fn().mockResolvedValue({ success: true }),
      };
      mockGetService.mockResolvedValue(mockService);

      const result = await executeMutationAction(
        {
          actionName: 'testAction',
          category: 'content',
          inputSchema: z.object({ name: z.string() }),
          serviceMethod: { service: 'content', method: 'testMethod' },
          transformArgs: (input) => ({ p_name: input.name }),
        },
        { name: 'test' },
        mockCtx
      );

      expect(result).toEqual({ success: true });
      expect(mockService.testMethod).toHaveBeenCalledWith({ p_name: 'test' });
    });

    it('should handle cache invalidation', async () => {
      const mockResult = { id: 'result-id' };
      mockRunRpc.mockResolvedValue(mockResult);

      await executeMutationAction(
        {
          actionName: 'testAction',
          category: 'content',
          inputSchema: z.object({ id: z.string() }),
          rpcName: 'test_rpc',
          transformArgs: (input) => ({ p_id: input.id }),
          cacheInvalidation: {
            paths: ['/test'],
            tags: ['test-tag'],
          },
        },
        { id: 'test-id' },
        mockCtx
      );

      expect(mockRevalidatePath).toHaveBeenCalledWith('/test');
      expect(mockRevalidateTag).toHaveBeenCalledWith('test-tag', 'default');
    });

    it('should handle post-action hooks', async () => {
      const mockResult = { id: 'result-id' };
      mockRunRpc.mockResolvedValue(mockResult);
      const mockHook = jest.fn().mockResolvedValue({ id: 'result-id', modified: true });

      const result = await executeMutationAction(
        {
          actionName: 'testAction',
          category: 'content',
          inputSchema: z.object({ id: z.string() }),
          rpcName: 'test_rpc',
          transformArgs: (input) => ({ p_id: input.id }),
          hooks: [
            {
              name: 'testHook',
              handler: mockHook,
            },
          ],
        },
        { id: 'test-id' },
        mockCtx
      );

      expect(mockHook).toHaveBeenCalledWith(mockResult, { id: 'test-id' }, mockCtx);
      expect(result).toEqual({ id: 'result-id', modified: true });
    });

    it('should handle errors', async () => {
      const error = new Error('RPC failed');
      mockRunRpc.mockRejectedValue(error);

      await expect(
        executeMutationAction(
          {
            actionName: 'testAction',
            category: 'content',
            inputSchema: z.object({ id: z.string() }),
            rpcName: 'test_rpc',
            transformArgs: (input) => ({ p_id: input.id }),
          },
          { id: 'test-id' },
          mockCtx
        )
      ).rejects.toThrow('RPC failed');
    });
  });

  describe('createCrudActionHandlers', () => {
    it('should create CRUD handlers', () => {
      const createSchema = z.object({ name: z.string() });
      const updateSchema = z.object({ id: z.string(), name: z.string() });
      const deleteSchema = z.object({ id: z.string() });

      const handlers = createCrudActionHandlers({
        resource: 'test',
        category: 'content',
        schemas: {
          create: createSchema,
          update: updateSchema,
          delete: deleteSchema,
        },
        rpcs: {
          create: 'create_test',
          update: 'update_test',
          delete: 'delete_test',
        },
        transformArgs: {
          create: (input) => ({ p_name: input.name }),
          update: (input) => ({ p_id: input.id, p_name: input.name }),
          delete: (input) => ({ p_id: input.id }),
        },
        cacheInvalidation: {
          create: { tags: ['test'] },
          update: { tags: ['test'] },
          delete: { tags: ['test'] },
        },
      });

      expect(handlers.create).toBeDefined();
      expect(handlers.update).toBeDefined();
      expect(handlers.delete).toBeDefined();
    });
  });
});
