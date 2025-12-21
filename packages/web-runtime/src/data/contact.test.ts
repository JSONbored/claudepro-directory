import { describe, expect, it, vi } from 'vitest';
import { fetchContactCommands, type ContactCommandsRow } from './contact';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock cached-data-factory
vi.mock('./cached-data-factory', () => ({
  createDataFunction: vi.fn((config: any) => {
    if (!(globalThis as any).__dataFunctionConfigs) {
      (globalThis as any).__dataFunctionConfigs = new Map();
    }
    (globalThis as any).__dataFunctionConfigs.set(config.operation, config);
    return vi.fn().mockResolvedValue(null);
  }),
}));

describe('contact data functions', () => {
  describe('fetchContactCommands', () => {
    it('should be created with correct configuration', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('fetchContactCommands');
      expect(config).toBeDefined();
      expect(config?.serviceKey).toBe('misc');
      expect(config?.methodName).toBe('getContactCommands');
      expect(config?.operation).toBe('fetchContactCommands');
      expect(config?.normalizeResult).toBeDefined();
    });

    it('should normalize result correctly', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('fetchContactCommands');
      const normalizeResult = config?.normalizeResult;
      
      const mockCommands = [
        {
          id: 'cmd-1',
          text: 'Command 1',
          action_type: 'link',
          action_value: '/path',
        },
      ];
      
      expect(normalizeResult(mockCommands)).toEqual(mockCommands[0]);
      expect(normalizeResult([])).toBeNull();
      expect(normalizeResult(null)).toBeNull();
      expect(normalizeResult(undefined)).toBeNull();
    });
  });
});

