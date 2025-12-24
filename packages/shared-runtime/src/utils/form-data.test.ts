import { describe, expect, it } from '@jest/globals';
import {
  getFormDataBoolean,
  getFormDataEnum,
  getFormDataNumber,
  getFormDataString,
  getFormDataStringRequired,
} from './form-data.ts';

describe('getFormDataString', () => {
  it('should return string value from FormData', () => {
    const formData = new FormData();
    formData.append('name', 'John Doe');
    const result = getFormDataString(formData, 'name');
    expect(result).toBe('John Doe');
  });

  it('should trim whitespace', () => {
    const formData = new FormData();
    formData.append('name', '  John Doe  ');
    const result = getFormDataString(formData, 'name');
    expect(result).toBe('John Doe');
  });

  it('should return null for missing key', () => {
    const formData = new FormData();
    const result = getFormDataString(formData, 'missing');
    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    const formData = new FormData();
    formData.append('name', '');
    const result = getFormDataString(formData, 'name');
    expect(result).toBeNull();
  });

  it('should return null for whitespace-only string', () => {
    const formData = new FormData();
    formData.append('name', '   ');
    const result = getFormDataString(formData, 'name');
    expect(result).toBeNull();
  });

  it('should return null for File object', () => {
    const formData = new FormData();
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    formData.append('file', file);
    const result = getFormDataString(formData, 'file');
    expect(result).toBeNull();
  });
});

describe('getFormDataStringRequired', () => {
  it('should return string value from FormData', () => {
    const formData = new FormData();
    formData.append('name', 'John Doe');
    const result = getFormDataStringRequired(formData, 'name');
    expect(result).toBe('John Doe');
  });

  it('should throw error for missing key', () => {
    const formData = new FormData();
    expect(() => getFormDataStringRequired(formData, 'missing')).toThrow(
      "Required form field 'missing' is missing or empty"
    );
  });

  it('should throw error for empty string', () => {
    const formData = new FormData();
    formData.append('name', '');
    expect(() => getFormDataStringRequired(formData, 'name')).toThrow(
      "Required form field 'name' is missing or empty"
    );
  });

  it('should throw error for whitespace-only string', () => {
    const formData = new FormData();
    formData.append('name', '   ');
    expect(() => getFormDataStringRequired(formData, 'name')).toThrow(
      "Required form field 'name' is missing or empty"
    );
  });

  it('should trim whitespace', () => {
    const formData = new FormData();
    formData.append('name', '  John Doe  ');
    const result = getFormDataStringRequired(formData, 'name');
    expect(result).toBe('John Doe');
  });
});

describe('getFormDataEnum', () => {
  type WorkType = 'remote' | 'hybrid' | 'onsite';
  const isWorkType = (value: unknown): value is WorkType => {
    return value === 'remote' || value === 'hybrid' || value === 'onsite';
  };

  it('should return enum value when valid', () => {
    const formData = new FormData();
    formData.append('workplace', 'remote');
    const result = getFormDataEnum(formData, 'workplace', isWorkType);
    expect(result).toBe('remote');
  });

  it('should return null for invalid enum value', () => {
    const formData = new FormData();
    formData.append('workplace', 'invalid');
    const result = getFormDataEnum(formData, 'workplace', isWorkType);
    expect(result).toBeNull();
  });

  it('should return null for missing key', () => {
    const formData = new FormData();
    const result = getFormDataEnum(formData, 'workplace', isWorkType);
    expect(result).toBeNull();
  });

  it('should return null for non-string value', () => {
    const formData = new FormData();
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    formData.append('workplace', file);
    const result = getFormDataEnum(formData, 'workplace', isWorkType);
    expect(result).toBeNull();
  });

  it('should handle all valid enum values', () => {
    const formData = new FormData();
    const validValues: WorkType[] = ['remote', 'hybrid', 'onsite'];
    for (const value of validValues) {
      formData.set('workplace', value);
      const result = getFormDataEnum(formData, 'workplace', isWorkType);
      expect(result).toBe(value);
    }
  });
});

describe('getFormDataBoolean', () => {
  it('should return true for "on" value', () => {
    const formData = new FormData();
    formData.append('remote', 'on');
    const result = getFormDataBoolean(formData, 'remote');
    expect(result).toBe(true);
  });

  it('should return true for "true" value', () => {
    const formData = new FormData();
    formData.append('remote', 'true');
    const result = getFormDataBoolean(formData, 'remote');
    expect(result).toBe(true);
  });

  it('should return false for other values', () => {
    const formData = new FormData();
    formData.append('remote', 'false');
    const result = getFormDataBoolean(formData, 'remote');
    expect(result).toBe(false);
  });

  it('should return false for missing key', () => {
    const formData = new FormData();
    const result = getFormDataBoolean(formData, 'remote');
    expect(result).toBe(false);
  });

  it('should return false for empty string', () => {
    const formData = new FormData();
    formData.append('remote', '');
    const result = getFormDataBoolean(formData, 'remote');
    expect(result).toBe(false);
  });

  it('should be case-sensitive for "on"', () => {
    const formData = new FormData();
    formData.append('remote', 'ON');
    const result = getFormDataBoolean(formData, 'remote');
    expect(result).toBe(false);
  });

  it('should be case-sensitive for "true"', () => {
    const formData = new FormData();
    formData.append('remote', 'TRUE');
    const result = getFormDataBoolean(formData, 'remote');
    expect(result).toBe(false);
  });
});

describe('getFormDataNumber', () => {
  it('should return number value from FormData', () => {
    const formData = new FormData();
    formData.append('limit', '20');
    const result = getFormDataNumber(formData, 'limit');
    expect(result).toBe(20);
  });

  it('should handle floating point numbers', () => {
    const formData = new FormData();
    formData.append('price', '99.99');
    const result = getFormDataNumber(formData, 'price');
    expect(result).toBe(99.99);
  });

  it('should handle negative numbers', () => {
    const formData = new FormData();
    formData.append('offset', '-10');
    const result = getFormDataNumber(formData, 'offset');
    expect(result).toBe(-10);
  });

  it('should return null for missing key', () => {
    const formData = new FormData();
    const result = getFormDataNumber(formData, 'limit');
    expect(result).toBeNull();
  });

  it('should return null for invalid number', () => {
    const formData = new FormData();
    formData.append('limit', 'abc');
    const result = getFormDataNumber(formData, 'limit');
    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    const formData = new FormData();
    formData.append('limit', '');
    const result = getFormDataNumber(formData, 'limit');
    expect(result).toBeNull();
  });

  it('should return null for whitespace-only string', () => {
    const formData = new FormData();
    formData.append('limit', '   ');
    const result = getFormDataNumber(formData, 'limit');
    expect(result).toBeNull();
  });

  it('should handle zero', () => {
    const formData = new FormData();
    formData.append('limit', '0');
    const result = getFormDataNumber(formData, 'limit');
    expect(result).toBe(0);
  });

  it('should handle scientific notation', () => {
    const formData = new FormData();
    formData.append('value', '1e5');
    const result = getFormDataNumber(formData, 'value');
    expect(result).toBe(100000);
  });
});
