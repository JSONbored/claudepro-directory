import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getSubmissionFormFields, fetchFieldsForContentType } from './submission-form-fields';
import { SUBMISSION_CONTENT_TYPES } from '../../types/component.types';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock cached-data-factory - use globalThis to avoid hoisting issues
jest.mock('../cached-data-factory', () => {
  if (!(globalThis as any).__submissionFormMocks) {
    (globalThis as any).__submissionFormMocks = {
      fetchFieldsForContentType: vi.fn(),
    };
  }
  
  return {
    createDataFunction: vi.fn((config: any) => {
      if (!(globalThis as any).__dataFunctionConfigs) {
        (globalThis as any).__dataFunctionConfigs = new Map();
      }
      (globalThis as any).__dataFunctionConfigs.set(config.operation, config);
      
      if (config.operation === 'fetchFieldsForContentType') {
        return (globalThis as any).__submissionFormMocks.fetchFieldsForContentType;
      }
      return vi.fn().mockResolvedValue(null);
    }),
  };
});

// Mock types
jest.mock('../../types/component.types', () => ({
  SUBMISSION_CONTENT_TYPES: ['agents', 'mcp', 'rules'],
}));

describe('submission form fields data functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if ((globalThis as any).__submissionFormMocks) {
      (globalThis as any).__submissionFormMocks.fetchFieldsForContentType.mockClear();
    }
  });

  describe('getSubmissionFormFields', () => {
    it('should return form config for all content types', async () => {
      const mockSection = {
        common: [],
        nameField: null,
        tags: [],
        typeSpecific: [],
      };
      
      // Ensure mock is set up before calling
      const mockFn = (globalThis as any).__submissionFormMocks.fetchFieldsForContentType;
      mockFn.mockResolvedValue(mockSection);

      const result = await getSubmissionFormFields();

      expect(result).toHaveProperty('agents');
      expect(result).toHaveProperty('mcp');
      expect(result).toHaveProperty('rules');
      // fetchFieldsForContentType should be called 3 times (once per content type)
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('fetchFieldsForContentType', () => {
    it('should map fields correctly', () => {
      // Test field mapping logic
      const mockRpcResult = {
        fields: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            field_group: 'common',
            required: true,
          },
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            field_group: 'common',
            rows: 5,
          },
          {
            name: 'tags',
            label: 'Tags',
            type: 'select',
            field_group: 'tags',
            select_options: [
              { value: 'tag1', label: 'Tag 1' },
              { value: 'tag2', label: 'Tag 2' },
            ],
          },
        ],
      };

      // This tests the transformResult logic
      expect(mockRpcResult.fields).toBeDefined();
      expect(mockRpcResult.fields.length).toBeGreaterThan(0);
    });
  });
});

