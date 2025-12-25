import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { createDataFunction, type DataFunctionConfig } from './cached-data-factory';

// Mock server-only (required for server-only modules in tests)
jest.mock('server-only', () => ({}));

// Mock logger
jest.mock('../logger.ts', () => ({
  logger: {
    child: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    })),
  },
}));

// Mock normalizeError
jest.mock('../errors.ts', () => ({
  normalizeError: jest.fn((error, message) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(message || String(error));
  }),
}));

// Mock service factory
// Create fresh mock service for each test to avoid state leakage
const createMockService = () => ({
  testMethod: jest.fn(),
  getItems: jest.fn(),
});

const mockService = createMockService();

jest.mock('./service-factory.ts', () => ({
  getService: jest.fn(async (serviceKey: string) => {
    if (serviceKey === 'test') {
      return mockService;
    }
    throw new Error(`Unknown service: ${serviceKey}`);
  }),
}));

describe('createDataFunction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock service methods - ensure they return fresh promises
    mockService.testMethod.mockReset();
    mockService.getItems.mockReset();
  });

  describe('basic functionality', () => {
    it('should create a data function that calls service method', async () => {
      mockService.testMethod.mockResolvedValue({ data: 'test' });

      const config: DataFunctionConfig<string, { data: string }> = {
        methodName: 'testMethod',
        module: 'data/test',
        operation: 'testOperation',
        serviceKey: 'test',
      };

      const dataFunction = createDataFunction(config);
      const result = await dataFunction('input');

      expect(mockService.testMethod).toHaveBeenCalledWith('input');
      expect(result).toEqual({ data: 'test' });
    });

    it('should handle service method returning null', async () => {
      mockService.testMethod.mockResolvedValue(null);

      const config: DataFunctionConfig<string, string | null> = {
        methodName: 'testMethod',
        module: 'data/test',
        operation: 'testOperation',
        serviceKey: 'test',
      };

      const dataFunction = createDataFunction(config);
      const result = await dataFunction('input');

      expect(result).toBeNull();
    });
  });

  describe('transformArgs', () => {
    it('should transform arguments before calling service', async () => {
      mockService.testMethod.mockResolvedValue({ success: true });

      const config: DataFunctionConfig<{ id: string }, { success: boolean }> = {
        methodName: 'testMethod',
        module: 'data/test',
        operation: 'testOperation',
        serviceKey: 'test',
        transformArgs: (args) => ({ p_id: args.id }),
      };

      const dataFunction = createDataFunction(config);
      await dataFunction({ id: '123' });

      expect(mockService.testMethod).toHaveBeenCalledWith({ p_id: '123' });
    });
  });

  describe('transformResult', () => {
    it('should transform result before returning', async () => {
      mockService.testMethod.mockResolvedValue({ items: [{ id: '1' }, { id: '2' }] });

      const config: DataFunctionConfig<void, string[]> = {
        methodName: 'testMethod',
        module: 'data/test',
        operation: 'testOperation',
        serviceKey: 'test',
        transformResult: (result) => {
          const data = result as { items: Array<{ id: string }> };
          return data.items.map((item) => item.id);
        },
      };

      const dataFunction = createDataFunction(config);
      const result = await dataFunction();

      expect(result).toEqual(['1', '2']);
    });

    it('should pass args to transformResult', async () => {
      mockService.testMethod.mockResolvedValue({ count: 5 });

      const config: DataFunctionConfig<{ multiplier: number }, number> = {
        methodName: 'testMethod',
        module: 'data/test',
        operation: 'testOperation',
        serviceKey: 'test',
        transformResult: (result, args) => {
          const data = result as { count: number };
          const multiplier = (args as { multiplier: number })?.multiplier ?? 1;
          return data.count * multiplier;
        },
      };

      const dataFunction = createDataFunction(config);
      const result = await dataFunction({ multiplier: 2 });

      expect(result).toBe(10);
    });
  });

  describe('normalizeResult', () => {
    it('should normalize result when provided', async () => {
      mockService.testMethod.mockResolvedValue([{ id: '1' }]);

      const config: DataFunctionConfig<void, { id: string } | null> = {
        methodName: 'testMethod',
        module: 'data/test',
        operation: 'testOperation',
        serviceKey: 'test',
        normalizeResult: (result) => {
          const arr = result as Array<{ id: string }>;
          return arr[0] ?? null;
        },
      };

      const dataFunction = createDataFunction(config);
      const result = await dataFunction();

      expect(result).toEqual({ id: '1' });
    });

    it('should return null when normalizeResult returns null', async () => {
      mockService.testMethod.mockResolvedValue([]);

      const config: DataFunctionConfig<void, { id: string } | null> = {
        methodName: 'testMethod',
        module: 'data/test',
        operation: 'testOperation',
        serviceKey: 'test',
        normalizeResult: (result) => {
          const arr = result as Array<{ id: string }>;
          return arr[0] ?? null;
        },
      };

      const dataFunction = createDataFunction(config);
      const result = await dataFunction();

      expect(result).toBeNull();
    });
  });

  describe('validation', () => {
    it('should validate arguments and return null on failure', async () => {
      const config: DataFunctionConfig<string, string> = {
        methodName: 'testMethod',
        module: 'data/test',
        operation: 'testOperation',
        serviceKey: 'test',
        validate: (args) => typeof args === 'string' && args.length > 0,
        validateError: 'Input must be non-empty string',
      };

      const dataFunction = createDataFunction(config);
      const result = await dataFunction('');

      expect(result).toBeNull();
      expect(mockService.testMethod).not.toHaveBeenCalled();
    });

    it('should proceed when validation passes', async () => {
      mockService.testMethod.mockResolvedValue('valid');

      const config: DataFunctionConfig<string, string> = {
        methodName: 'testMethod',
        module: 'data/test',
        operation: 'testOperation',
        serviceKey: 'test',
        validate: (args) => typeof args === 'string' && args.length > 0,
      };

      const dataFunction = createDataFunction(config);
      const result = await dataFunction('valid-input');

      expect(result).toBe('valid');
      expect(mockService.testMethod).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return null on error by default', async () => {
      mockService.testMethod.mockRejectedValue(new Error('Service error'));

      const config: DataFunctionConfig<string, string> = {
        methodName: 'testMethod',
        module: 'data/test',
        operation: 'testOperation',
        serviceKey: 'test',
      };

      const dataFunction = createDataFunction(config);
      const result = await dataFunction('input');

      expect(result).toBeNull();
    });

    it('should throw error when throwOnError is true', async () => {
      const error = new Error('Service error');
      mockService.testMethod.mockRejectedValue(error);

      const config: DataFunctionConfig<string, string> = {
        methodName: 'testMethod',
        module: 'data/test',
        operation: 'testOperation',
        serviceKey: 'test',
        throwOnError: true,
      };

      const dataFunction = createDataFunction(config);

      await expect(dataFunction('input')).rejects.toThrow();
    });

    it('should use custom onError handler when provided', async () => {
      mockService.testMethod.mockRejectedValue(new Error('Service error'));

      const config: DataFunctionConfig<string, string> = {
        methodName: 'testMethod',
        module: 'data/test',
        operation: 'testOperation',
        serviceKey: 'test',
        onError: (error, args) => {
          expect(error).toBeInstanceOf(Error);
          expect(args).toBe('input');
          return 'fallback-value';
        },
      };

      const dataFunction = createDataFunction(config);
      const result = await dataFunction('input');

      expect(result).toBe('fallback-value');
    });

    it('should handle service method not found error', async () => {
      const invalidService = {
        // Missing testMethod
      };

      const { getService } = await import('./service-factory.ts');
      jest.mocked(getService).mockResolvedValueOnce(invalidService as any);

      const config: DataFunctionConfig<string, string> = {
        methodName: 'nonexistentMethod',
        module: 'data/test',
        operation: 'testOperation',
        serviceKey: 'test',
      };

      const dataFunction = createDataFunction(config);
      const result = await dataFunction('input');

      expect(result).toBeNull();

      // Restore mock for subsequent tests
      jest.mocked(getService).mockResolvedValue(mockService);
    });
  });

  describe('logContext', () => {
    it('should include log context in logger calls', async () => {
      // Reset and setup mock before test - use mockReset to clear all state
      mockService.testMethod.mockReset();
      mockService.testMethod.mockResolvedValue({ count: 5 });

      const logContextFn = jest.fn((args, result?) => {
        return {
          inputLength: (args as string).length,
          resultCount: (result as { count: number })?.count ?? 0,
        };
      });

      const config: DataFunctionConfig<string, { count: number }> = {
        methodName: 'testMethod',
        module: 'data/test',
        operation: 'testOperation',
        serviceKey: 'test',
        logContext: logContextFn,
      };

      const dataFunction = createDataFunction(config);
      const result = await dataFunction('test-input');

      // Verify the function executed successfully
      expect(result).toEqual({ count: 5 });
      expect(mockService.testMethod).toHaveBeenCalledWith('test-input');

      // logContext is called twice:
      // 1. With args only (initial context for logger.child) - line 215: fnConfig.logContext(args)
      // 2. With args + result (success log) - line 266: fnConfig.logContext(args, transformedResult)
      expect(logContextFn).toHaveBeenCalledTimes(2);
      // First call: args only (second parameter is not passed at all, not undefined)
      expect(logContextFn).toHaveBeenNthCalledWith(1, 'test-input');
      // Second call: args + result
      expect(logContextFn).toHaveBeenNthCalledWith(2, 'test-input', { count: 5 });
    });
  });

  describe('multiple function instances', () => {
    it('should create independent function instances', async () => {
      // Create a service with both methods
      const mockServiceWithBothMethods = {
        testMethod: jest.fn().mockResolvedValue('result1'),
        getItems: jest.fn().mockResolvedValue(['item1', 'item2']),
      };

      // Update the mock to return service with both methods
      const { getService } = await import('./service-factory');
      jest.mocked(getService).mockResolvedValue(mockServiceWithBothMethods as any);

      const config1: DataFunctionConfig<string, string> = {
        methodName: 'testMethod',
        module: 'data/test1',
        operation: 'operation1',
        serviceKey: 'test',
      };

      const config2: DataFunctionConfig<void, string[]> = {
        methodName: 'getItems',
        module: 'data/test2',
        operation: 'operation2',
        serviceKey: 'test',
      };

      const fn1 = createDataFunction(config1);
      const fn2 = createDataFunction(config2);

      const result1 = await fn1('input1');
      const result2 = await fn2();

      expect(result1).toBe('result1');
      expect(result2).toEqual(['item1', 'item2']);
      expect(mockServiceWithBothMethods.testMethod).toHaveBeenCalledWith('input1');
      expect(mockServiceWithBothMethods.getItems).toHaveBeenCalled();
    });
  });
});
