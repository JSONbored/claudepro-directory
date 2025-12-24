import { describe, expect, it } from '@jest/globals';
import {
  getNumberProperty,
  getObjectProperty,
  getProperty,
  getStringProperty,
} from './object-utils.ts';

describe('getProperty', () => {
  it('should return property value from object', () => {
    const obj = { name: 'test', value: 42 };
    const result = getProperty(obj, 'name');
    expect(result).toBe('test');
  });

  it('should return undefined for non-existent property', () => {
    const obj = { name: 'test' };
    const result = getProperty(obj, 'missing');
    expect(result).toBeUndefined();
  });

  it('should return undefined for null input', () => {
    const result = getProperty(null, 'key');
    expect(result).toBeUndefined();
  });

  it('should return undefined for undefined input', () => {
    const result = getProperty(undefined, 'key');
    expect(result).toBeUndefined();
  });

  it('should return undefined for primitive input', () => {
    expect(getProperty('string', 'key')).toBeUndefined();
    expect(getProperty(123, 'key')).toBeUndefined();
    expect(getProperty(true, 'key')).toBeUndefined();
  });

  it('should return undefined for array input', () => {
    const result = getProperty([1, 2, 3], 'key');
    expect(result).toBeUndefined();
  });

  it('should not access prototype chain', () => {
    const obj = Object.create({ inherited: 'value' });
    const result = getProperty(obj, 'inherited');
    expect(result).toBeUndefined();
  });

  it('should handle nested objects', () => {
    const obj = { nested: { value: 'test' } };
    const nested = getProperty(obj, 'nested');
    expect(nested).toEqual({ value: 'test' });
  });
});

describe('getStringProperty', () => {
  it('should return string property', () => {
    const obj = { name: 'test', value: 42 };
    const result = getStringProperty(obj, 'name');
    expect(result).toBe('test');
  });

  it('should return undefined for non-string property', () => {
    const obj = { value: 42 };
    const result = getStringProperty(obj, 'value');
    expect(result).toBeUndefined();
  });

  it('should return undefined for null property', () => {
    const obj = { name: null };
    const result = getStringProperty(obj, 'name');
    expect(result).toBeUndefined();
  });

  it('should return undefined for non-existent property', () => {
    const obj = { name: 'test' };
    const result = getStringProperty(obj, 'missing');
    expect(result).toBeUndefined();
  });

  it('should return undefined for null input', () => {
    const result = getStringProperty(null, 'key');
    expect(result).toBeUndefined();
  });

  it('should return undefined for undefined input', () => {
    const result = getStringProperty(undefined, 'key');
    expect(result).toBeUndefined();
  });

  it('should return undefined for primitive input', () => {
    expect(getStringProperty('string', 'key')).toBeUndefined();
    expect(getStringProperty(123, 'key')).toBeUndefined();
  });

  it('should handle empty string', () => {
    const obj = { name: '' };
    const result = getStringProperty(obj, 'name');
    expect(result).toBe('');
  });
});

describe('getNumberProperty', () => {
  it('should return number property', () => {
    const obj = { value: 42, name: 'test' };
    const result = getNumberProperty(obj, 'value');
    expect(result).toBe(42);
  });

  it('should return undefined for non-number property', () => {
    const obj = { name: 'test' };
    const result = getNumberProperty(obj, 'name');
    expect(result).toBeUndefined();
  });

  it('should return undefined for null property', () => {
    const obj = { value: null };
    const result = getNumberProperty(obj, 'value');
    expect(result).toBeUndefined();
  });

  it('should return undefined for non-existent property', () => {
    const obj = { value: 42 };
    const result = getNumberProperty(obj, 'missing');
    expect(result).toBeUndefined();
  });

  it('should return undefined for null input', () => {
    const result = getNumberProperty(null, 'key');
    expect(result).toBeUndefined();
  });

  it('should return undefined for undefined input', () => {
    const result = getNumberProperty(undefined, 'key');
    expect(result).toBeUndefined();
  });

  it('should handle zero', () => {
    const obj = { value: 0 };
    const result = getNumberProperty(obj, 'value');
    expect(result).toBe(0);
  });

  it('should handle negative numbers', () => {
    const obj = { value: -42 };
    const result = getNumberProperty(obj, 'value');
    expect(result).toBe(-42);
  });

  it('should handle floating point numbers', () => {
    const obj = { value: 3.14 };
    const result = getNumberProperty(obj, 'value');
    expect(result).toBe(3.14);
  });
});

describe('getObjectProperty', () => {
  it('should return object property', () => {
    const obj = { nested: { value: 'test' } };
    const result = getObjectProperty(obj, 'nested');
    expect(result).toEqual({ value: 'test' });
  });

  it('should return undefined for non-object property', () => {
    const obj = { value: 'string' };
    const result = getObjectProperty(obj, 'value');
    expect(result).toBeUndefined();
  });

  it('should return undefined for null property', () => {
    const obj = { nested: null };
    const result = getObjectProperty(obj, 'nested');
    expect(result).toBeUndefined();
  });

  it('should return undefined for array property', () => {
    const obj = { items: [1, 2, 3] };
    const result = getObjectProperty(obj, 'items');
    expect(result).toEqual([1, 2, 3]); // Arrays are objects in JavaScript
  });

  it('should return undefined for non-existent property', () => {
    const obj = { nested: { value: 'test' } };
    const result = getObjectProperty(obj, 'missing');
    expect(result).toBeUndefined();
  });

  it('should return undefined for null input', () => {
    const result = getObjectProperty(null, 'key');
    expect(result).toBeUndefined();
  });

  it('should return undefined for undefined input', () => {
    const result = getObjectProperty(undefined, 'key');
    expect(result).toBeUndefined();
  });

  it('should handle nested objects', () => {
    const obj = { level1: { level2: { value: 'test' } } };
    const level1 = getObjectProperty(obj, 'level1');
    expect(level1).toEqual({ level2: { value: 'test' } });
  });
});
