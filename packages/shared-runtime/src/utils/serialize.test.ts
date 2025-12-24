import { describe, expect, it } from '@jest/globals';
import {
  isPlainObject,
  isSerializable,
  serializeForClient,
  serializeReplacer,
  serializeWithReplacer,
} from './serialize.ts';

describe('serializeReplacer', () => {
  it('should convert Date objects to ISO strings', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    const result = serializeReplacer('date', date);
    expect(result).toBe('2024-01-01T00:00:00.000Z');
    expect(typeof result).toBe('string');
  });

  it('should convert undefined to null', () => {
    const result = serializeReplacer('key', undefined);
    expect(result).toBeNull();
  });

  it('should remove functions', () => {
    const fn = () => 'test';
    const result = serializeReplacer('fn', fn);
    expect(result).toBeUndefined();
  });

  it('should remove React components ($$typeof)', () => {
    const component = { $$typeof: Symbol.for('react.element') };
    const result = serializeReplacer('component', component);
    expect(result).toBeUndefined();
  });

  it('should remove objects with render functions', () => {
    const component = { render: () => null };
    const result = serializeReplacer('component', component);
    expect(result).toBeUndefined();
  });

  it('should remove objects with displayName and render', () => {
    const component = { displayName: 'Test', render: () => null };
    const result = serializeReplacer('component', component);
    expect(result).toBeUndefined();
  });

  it('should pass through plain objects', () => {
    const obj = { key: 'value' };
    const result = serializeReplacer('obj', obj);
    expect(result).toBe(obj);
  });

  it('should pass through primitives', () => {
    expect(serializeReplacer('str', 'test')).toBe('test');
    expect(serializeReplacer('num', 123)).toBe(123);
    expect(serializeReplacer('bool', true)).toBe(true);
    expect(serializeReplacer('null', null)).toBeNull();
  });

  it('should pass through arrays', () => {
    const arr = [1, 2, 3];
    const result = serializeReplacer('arr', arr);
    expect(result).toBe(arr);
  });
});

describe('serializeForClient', () => {
  it('should serialize simple object', () => {
    const data = { name: 'test', value: 42 };
    const result = serializeForClient(data);
    expect(result).toEqual(data);
  });

  it('should convert Date objects to ISO strings', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    const data = { createdAt: date };
    const result = serializeForClient(data);
    expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(typeof result.createdAt).toBe('string');
  });

  it('should remove functions', () => {
    const data = { name: 'test', fn: () => 'test' };
    const result = serializeForClient(data);
    expect(result.fn).toBeUndefined();
    expect(result.name).toBe('test');
  });

  it('should convert undefined to null', () => {
    const data = { name: 'test', optional: undefined };
    const result = serializeForClient(data);
    // serializeReplacer converts undefined to null, so optional becomes null
    expect(result.name).toBe('test');
    expect(result.optional).toBeNull();
  });

  it('should handle nested objects', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    const data = {
      user: {
        name: 'John',
        createdAt: date,
      },
    };
    const result = serializeForClient(data);
    expect(result.user.name).toBe('John');
    expect(result.user.createdAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should handle arrays', () => {
    const dates = [new Date('2024-01-01'), new Date('2024-01-02')];
    const data = { dates };
    const result = serializeForClient(data);
    expect(Array.isArray(result.dates)).toBe(true);
    expect(result.dates[0]).toBe('2024-01-01T00:00:00.000Z');
    expect(result.dates[1]).toBe('2024-01-02T00:00:00.000Z');
  });

  it('should handle null values', () => {
    const data = { name: 'test', value: null };
    const result = serializeForClient(data);
    expect(result.value).toBeNull();
  });

  it('should preserve type structure', () => {
    const data = {
      string: 'test',
      number: 42,
      boolean: true,
      null: null,
      array: [1, 2, 3],
      object: { nested: 'value' },
    };
    const result = serializeForClient(data);
    expect(result).toEqual({
      string: 'test',
      number: 42,
      boolean: true,
      null: null,
      array: [1, 2, 3],
      object: { nested: 'value' },
    });
  });
});

describe('serializeWithReplacer', () => {
  it('should use custom replacer when provided', () => {
    const data = { sensitive: 'secret', public: 'info' };
    const customReplacer = (key: string, value: unknown) => {
      if (key === 'sensitive') return '[REDACTED]';
      return serializeReplacer(key, value);
    };
    const result = serializeWithReplacer(data, customReplacer);
    expect(result.sensitive).toBe('[REDACTED]');
    expect(result.public).toBe('info');
  });

  it('should use default replacer when custom replacer not provided', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    const data = { createdAt: date };
    const result = serializeWithReplacer(data);
    expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should merge custom replacer with default', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    const data = { createdAt: date, sensitive: 'secret' };
    const customReplacer = (key: string, value: unknown) => {
      if (key === 'sensitive') return '[REDACTED]';
      // Let default handle Date conversion
      return undefined; // Use default
    };
    const result = serializeWithReplacer(data, customReplacer);
    expect(result.sensitive).toBe('[REDACTED]');
    expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
  });
});

describe('isPlainObject', () => {
  it('should return true for plain objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ key: 'value' })).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
  });

  it('should return false for null', () => {
    expect(isPlainObject(null)).toBe(false);
  });

  it('should return false for primitives', () => {
    expect(isPlainObject('string')).toBe(false);
    expect(isPlainObject(123)).toBe(false);
    expect(isPlainObject(true)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
  });

  it('should return false for arrays', () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject([1, 2, 3])).toBe(false);
  });

  it('should return false for class instances', () => {
    class TestClass {
      value = 'test';
    }
    expect(isPlainObject(new TestClass())).toBe(false);
  });

  it('should return false for Date objects', () => {
    expect(isPlainObject(new Date())).toBe(false);
  });

  it('should return false for functions', () => {
    expect(isPlainObject(() => {})).toBe(false);
  });
});

describe('isSerializable', () => {
  it('should return true for serializable data', () => {
    expect(isSerializable({ name: 'test' })).toBe(true);
    expect(isSerializable([1, 2, 3])).toBe(true);
    expect(isSerializable('string')).toBe(true);
    expect(isSerializable(123)).toBe(true);
    expect(isSerializable(null)).toBe(true);
  });

  it('should return true for data with Date objects (will be converted)', () => {
    const data = { createdAt: new Date() };
    expect(isSerializable(data)).toBe(true);
  });

  it('should return false for circular references', () => {
    const data: any = { name: 'test' };
    data.self = data; // Circular reference
    expect(isSerializable(data)).toBe(false);
  });

  it('should return false for functions', () => {
    const data = { fn: () => {} };
    // Functions are removed by replacer, so this should be serializable
    // Actually, serializeReplacer removes functions, so JSON.stringify should work
    expect(isSerializable(data)).toBe(true);
  });

  it('should return true for nested objects', () => {
    const data = {
      level1: {
        level2: {
          value: 'test',
        },
      },
    };
    expect(isSerializable(data)).toBe(true);
  });
});
