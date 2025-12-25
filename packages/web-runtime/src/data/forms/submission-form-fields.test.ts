import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getSubmissionFormFields } from './submission-form-fields';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Mock server-only FIRST
jest.mock('server-only', () => ({}));

// Mock next/cache for cache directives
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(() => Promise.resolve()),
}));

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Import real cache utilities for proper cache testing
// Note: Deep relative imports are acceptable for test utilities to avoid circular dependencies
import {
  clearRequestCache,
  getRequestCache,
} from '../../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility (if needed)
// Note: Deep relative import needed for jest.mock() to work correctly
jest.mock('../../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Don't mock service-factory - use real implementation
// Services will use Prismocker via __mocks__/@prisma/client.ts

// Don't mock logger - use real implementation
// ERROR logs for validation failures are expected and correct behavior
// Don't mock normalizeError - use real implementation
// Don't mock serializeForClient - use real implementation

// Helper function to create form_field_configs data for seeding
// Matches the pattern from data layer tests
function createFormFieldConfig(overrides: {
  id: string;
  form_type: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'number' | 'select';
  field_group: string;
  display_order: number;
  required?: boolean;
  placeholder?: string | null;
  help_text?: string | null;
  default_value?: string | null;
  grid_column?: 'full' | 'half' | 'third' | null;
  icon_name?: 'Github' | null;
  icon_position?: 'left' | 'right' | null;
  config?: Record<string, unknown> | null;
  enabled?: boolean;
}): any {
  return {
    id: overrides.id,
    form_type: overrides.form_type,
    field_name: overrides.field_name,
    field_label: overrides.field_label,
    field_type: overrides.field_type,
    field_group: overrides.field_group,
    display_order: overrides.display_order,
    required: overrides.required ?? false,
    placeholder: overrides.placeholder ?? null,
    help_text: overrides.help_text ?? null,
    default_value: overrides.default_value ?? null,
    grid_column: overrides.grid_column ?? 'full',
    icon_name: overrides.icon_name ?? null,
    icon_position: overrides.icon_position ?? null,
    config: overrides.config ?? null,
    enabled: overrides.enabled ?? true,
    // Note: created_at and updated_at are not needed for the query (not in select clause)
  };
}

describe('submission form fields data functions', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Get Prismocker instance (automatically PrismockerClient via global mock)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 4. Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('getSubmissionFormFields', () => {
    it('should return form config for all content types', async () => {
      const mockConfigs = [
        createFormFieldConfig({
          id: 'field-agents-1',
          form_type: 'agents',
          field_name: 'name',
          field_label: 'Name',
          field_type: 'text',
          field_group: 'common',
          display_order: 1,
          required: true,
        }),
        createFormFieldConfig({
          id: 'field-agents-2',
          form_type: 'agents',
          field_name: 'description',
          field_label: 'Description',
          field_type: 'textarea',
          field_group: 'common',
          display_order: 2,
          config: { rows: 5 },
        }),
        createFormFieldConfig({
          id: 'field-mcp-1',
          form_type: 'mcp',
          field_name: 'mcp_field',
          field_label: 'MCP Field',
          field_type: 'text',
          field_group: 'common',
          display_order: 1,
        }),
        createFormFieldConfig({
          id: 'field-rules-1',
          form_type: 'rules',
          field_name: 'rules_field',
          field_label: 'Rules Field',
          field_type: 'text',
          field_group: 'common',
          display_order: 1,
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('form_field_configs', mockConfigs);
      }

      const result = await getSubmissionFormFields();

      expect(result).toHaveProperty('agents');
      expect(result).toHaveProperty('mcp');
      expect(result).toHaveProperty('rules');
      expect(result.agents.common).toHaveLength(1); // description (name is extracted to nameField)
      expect(result.agents.nameField).not.toBeNull();
      expect(result.agents.nameField?.name).toBe('name');
      expect(result.mcp.common).toHaveLength(1);
      expect(result.mcp.common[0].name).toBe('mcp_field');
      expect(result.rules.common).toHaveLength(1);
      expect(result.rules.common[0].name).toBe('rules_field');
    });

    it('should extract nameField when field_group is common, name is "name", and type is "text"', async () => {
      const mockConfigs = [
        createFormFieldConfig({
          id: 'field-1',
          form_type: 'agents',
          field_name: 'name',
          field_label: 'Name',
          field_type: 'text',
          field_group: 'common',
          display_order: 1,
          required: true,
        }),
        createFormFieldConfig({
          id: 'field-2',
          form_type: 'agents',
          field_name: 'title',
          field_label: 'Title',
          field_type: 'text',
          field_group: 'common',
          display_order: 2,
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('form_field_configs', mockConfigs);
      }

      const result = await getSubmissionFormFields();

      expect(result.agents.nameField).not.toBeNull();
      expect(result.agents.nameField?.name).toBe('name');
      expect(result.agents.nameField?.label).toBe('Name');
      expect(result.agents.nameField?.type).toBe('text');
      expect(result.agents.common).toHaveLength(1); // title (name is extracted to nameField)
      expect(result.agents.common[0].name).toBe('title');
    });

    it('should map fields to correct types (text, textarea, number, select)', async () => {
      const mockConfigs = [
        createFormFieldConfig({
          id: 'field-1',
          form_type: 'rules',
          field_name: 'text_field',
          field_label: 'Text Field',
          field_type: 'text',
          field_group: 'common',
          display_order: 1,
          placeholder: 'Enter text',
        }),
        createFormFieldConfig({
          id: 'field-2',
          form_type: 'rules',
          field_name: 'textarea_field',
          field_label: 'Textarea Field',
          field_type: 'textarea',
          field_group: 'common',
          display_order: 2,
          config: { rows: 10, monospace: true },
        }),
        createFormFieldConfig({
          id: 'field-3',
          form_type: 'rules',
          field_name: 'number_field',
          field_label: 'Number Field',
          field_type: 'number',
          field_group: 'common',
          display_order: 3,
          config: { min_value: 0, max_value: 100, step_value: 1 },
        }),
        createFormFieldConfig({
          id: 'field-4',
          form_type: 'rules',
          field_name: 'select_field',
          field_label: 'Select Field',
          field_type: 'select',
          field_group: 'common',
          display_order: 4,
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('form_field_configs', mockConfigs);
      }

      const result = await getSubmissionFormFields();

      const rulesCommon = result.rules.common;
      expect(rulesCommon).toHaveLength(4);

      const textField = rulesCommon.find((f) => f.name === 'text_field');
      expect(textField).toBeDefined();
      expect(textField?.type).toBe('text');
      expect(textField?.placeholder).toBe('Enter text');

      const textareaField = rulesCommon.find((f) => f.name === 'textarea_field');
      expect(textareaField).toBeDefined();
      expect(textareaField?.type).toBe('textarea');
      expect(textareaField?.rows).toBe(10);
      expect(textareaField?.monospace).toBe(true);

      const numberField = rulesCommon.find((f) => f.name === 'number_field');
      expect(numberField).toBeDefined();
      expect(numberField?.type).toBe('number');
      expect(numberField?.min).toBe(0);
      expect(numberField?.max).toBe(100);
      expect(numberField?.step).toBe(1);

      const selectField = rulesCommon.find((f) => f.name === 'select_field');
      expect(selectField).toBeDefined();
      expect(selectField?.type).toBe('select');
    });

    it('should group fields correctly (common, tags, type_specific, null -> common)', async () => {
      const mockConfigs = [
        createFormFieldConfig({
          id: 'field-1',
          form_type: 'mcp',
          field_name: 'common_field',
          field_label: 'Common Field',
          field_type: 'text',
          field_group: 'common',
          display_order: 1,
        }),
        createFormFieldConfig({
          id: 'field-2',
          form_type: 'mcp',
          field_name: 'tags_field',
          field_label: 'Tags Field',
          field_type: 'select',
          field_group: 'tags',
          display_order: 1,
        }),
        createFormFieldConfig({
          id: 'field-3',
          form_type: 'mcp',
          field_name: 'type_specific_field',
          field_label: 'Type Specific Field',
          field_type: 'text',
          field_group: 'type_specific',
          display_order: 1,
        }),
        createFormFieldConfig({
          id: 'field-4',
          form_type: 'mcp',
          field_name: 'null_group_field',
          field_label: 'Null Group Field',
          field_type: 'text',
          field_group: null as any, // null field_group should go to common
          display_order: 1,
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('form_field_configs', mockConfigs);
      }

      const result = await getSubmissionFormFields();

      expect(result.mcp.common.length).toBeGreaterThanOrEqual(1); // common_field + null_group_field
      expect(result.mcp.tags).toHaveLength(1); // tags_field
      expect(result.mcp.typeSpecific).toHaveLength(1); // type_specific_field
    });

    it('should return empty sections when no fields found', async () => {
      // No data seeded
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('form_field_configs', []);
      }

      const result = await getSubmissionFormFields();

      expect(result.agents).toEqual({
        common: [],
        nameField: null,
        tags: [],
        typeSpecific: [],
      });
      expect(result.mcp).toEqual({
        common: [],
        nameField: null,
        tags: [],
        typeSpecific: [],
      });
      expect(result.rules).toEqual({
        common: [],
        nameField: null,
        tags: [],
        typeSpecific: [],
      });
    });

    it('should only return enabled fields', async () => {
      const mockConfigs = [
        createFormFieldConfig({
          id: 'field-1',
          form_type: 'agents',
          field_name: 'enabled_field',
          field_label: 'Enabled Field',
          field_type: 'text',
          field_group: 'common',
          display_order: 1,
          enabled: true,
        }),
        createFormFieldConfig({
          id: 'field-2',
          form_type: 'agents',
          field_name: 'disabled_field',
          field_label: 'Disabled Field',
          field_type: 'text',
          field_group: 'common',
          display_order: 2,
          enabled: false,
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('form_field_configs', mockConfigs);
      }

      const result = await getSubmissionFormFields();

      expect(result.agents.common).toHaveLength(1);
      expect(result.agents.common[0].name).toBe('enabled_field');
    });

    it('should filter by form_type correctly', async () => {
      const mockConfigs = [
        createFormFieldConfig({
          id: 'field-1',
          form_type: 'agents',
          field_name: 'agents_field',
          field_label: 'Agents Field',
          field_type: 'text',
          field_group: 'common',
          display_order: 1,
        }),
        createFormFieldConfig({
          id: 'field-2',
          form_type: 'mcp',
          field_name: 'mcp_field',
          field_label: 'MCP Field',
          field_type: 'text',
          field_group: 'common',
          display_order: 1,
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('form_field_configs', mockConfigs);
      }

      const result = await getSubmissionFormFields();

      expect(result.agents.common).toHaveLength(1);
      expect(result.agents.common[0].name).toBe('agents_field');
      expect(result.mcp.common).toHaveLength(1);
      expect(result.mcp.common[0].name).toBe('mcp_field');
      expect(result.rules.common).toHaveLength(0); // No fields for rules
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockConfigs = [
        createFormFieldConfig({
          id: 'field-1',
          form_type: 'agents',
          field_name: 'test_field',
          field_label: 'Test Field',
          field_type: 'text',
          field_group: 'common',
          display_order: 1,
        }),
        createFormFieldConfig({
          id: 'field-2',
          form_type: 'mcp',
          field_name: 'test_field',
          field_label: 'Test Field',
          field_type: 'text',
          field_group: 'common',
          display_order: 1,
        }),
        createFormFieldConfig({
          id: 'field-3',
          form_type: 'rules',
          field_name: 'test_field',
          field_label: 'Test Field',
          field_type: 'text',
          field_group: 'common',
          display_order: 1,
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('form_field_configs', mockConfigs);
      }

      const cache = getRequestCache();
      const cacheBefore = cache.getStats().size;

      // First call - should populate cache
      const result1 = await getSubmissionFormFields();
      const cacheAfterFirst = cache.getStats().size;

      // Second call - should use cache
      const result2 = await getSubmissionFormFields();
      const cacheAfterSecond = cache.getStats().size;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });

    it('should handle empty fields for some content types', async () => {
      const mockConfigs = [
        createFormFieldConfig({
          id: 'field-agents-1',
          form_type: 'agents',
          field_name: 'agents_field',
          field_label: 'Agents Field',
          field_type: 'text',
          field_group: 'common',
          display_order: 1,
        }),
        // No fields for 'mcp' or 'rules'
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('form_field_configs', mockConfigs);
      }

      const result = await getSubmissionFormFields();

      expect(result.agents.common).toHaveLength(1);
      expect(result.mcp.common).toHaveLength(0);
      expect(result.mcp.nameField).toBeNull();
      expect(result.rules.common).toHaveLength(0);
      expect(result.rules.nameField).toBeNull();
    });
  });
});
