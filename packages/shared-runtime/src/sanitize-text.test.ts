import { describe, expect, it, vi } from 'vitest';
import { sanitizeFilename, sanitizeText, sanitizeUrl } from './sanitize-text.ts';

// Mock logger to prevent console output during tests
vi.mock('./logger/index.ts', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

describe('sanitizeText', () => {
  describe('basic sanitization', () => {
    it('should return empty string for null', () => {
      const result = sanitizeText(null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined', () => {
      const result = sanitizeText(undefined);
      expect(result).toBe('');
    });

    it('should convert number to string', () => {
      const result = sanitizeText(123);
      expect(result).toBe('123');
    });

    it('should convert boolean to string', () => {
      const result = sanitizeText(true);
      expect(result).toBe('true');
    });

    it('should return empty string for objects', () => {
      const result = sanitizeText({ key: 'value' });
      expect(result).toBe('');
    });

    it('should return empty string for arrays', () => {
      const result = sanitizeText(['item1', 'item2']);
      expect(result).toBe('');
    });
  });

  describe('HTML sanitization', () => {
    it('should remove HTML tags by default', () => {
      const result = sanitizeText('<script>alert("xss")</script>Hello');
      expect(result).toBe('Hello');
    });

    it('should allow HTML when allowHtml is true', () => {
      const result = sanitizeText('<p>Hello</p>', { allowHtml: true });
      expect(result).toContain('<p>');
      expect(result).toContain('Hello');
    });

    it('should remove dangerous HTML tags even when allowHtml is true', () => {
      const result = sanitizeText('<script>alert("xss")</script>', { allowHtml: true });
      expect(result).not.toContain('<script>');
    });

    it('should sanitize allowed HTML attributes', () => {
      const result = sanitizeText('<a href="https://example.com" onclick="alert(1)">Link</a>', {
        allowHtml: true,
      });
      expect(result).toContain('href="https://example.com"');
      expect(result).not.toContain('onclick');
    });
  });

  describe('dangerous URL schemes', () => {
    it('should remove javascript: protocol', () => {
      const result = sanitizeText('Click javascript:alert(1)');
      expect(result).not.toContain('javascript:');
    });

    it('should remove data: protocol', () => {
      const result = sanitizeText('Data data:text/html,<script>alert(1)</script>');
      expect(result).not.toContain('data:');
    });

    it('should remove vbscript: protocol', () => {
      const result = sanitizeText('VBScript vbscript:msgbox("xss")');
      expect(result).not.toContain('vbscript:');
    });

    it('should handle case-insensitive protocol removal', () => {
      const result = sanitizeText('JAVASCRIPT:alert(1)');
      expect(result).not.toContain('JAVASCRIPT:');
    });
  });

  describe('newline handling', () => {
    it('should preserve newlines by default', () => {
      const result = sanitizeText('Line 1\nLine 2');
      expect(result).toContain('\n');
    });

    it('should remove newlines when allowNewlines is false', () => {
      const result = sanitizeText('Line 1\nLine 2', { allowNewlines: false });
      expect(result).not.toContain('\n');
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
    });

    it('should normalize line endings', () => {
      const result = sanitizeText('Line 1\r\nLine 2\rLine 3');
      expect(result).toContain('\n');
      expect(result).not.toContain('\r');
    });
  });

  describe('whitespace normalization', () => {
    it('should trim leading and trailing whitespace', () => {
      const result = sanitizeText('  Hello World  ');
      expect(result).toBe('Hello World');
    });

    it('should collapse multiple spaces', () => {
      const result = sanitizeText('Hello    World');
      expect(result).toBe('Hello World');
    });

    it('should collapse tabs', () => {
      const result = sanitizeText('Hello\t\tWorld');
      expect(result).toBe('Hello World');
    });
  });

  describe('length limits', () => {
    it('should truncate text exceeding max length', () => {
      const longText = 'a'.repeat(15000);
      const result = sanitizeText(longText, { maxLength: 10000 });
      expect(result.length).toBe(10000);
    });

    it('should not truncate text within limit', () => {
      const text = 'a'.repeat(5000);
      const result = sanitizeText(text, { maxLength: 10000 });
      expect(result.length).toBeLessThanOrEqual(10000);
    });

    it('should use custom max length', () => {
      const text = 'a'.repeat(200);
      const result = sanitizeText(text, { maxLength: 100 });
      expect(result.length).toBe(100);
    });
  });

  describe('null byte removal', () => {
    it('should remove null bytes', () => {
      const result = sanitizeText('Hello\0World');
      expect(result).not.toContain('\0');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });
  });
});

describe('sanitizeUrl', () => {
  it('should return empty string for null', () => {
    const result = sanitizeUrl(null);
    expect(result).toBe('');
  });

  it('should return empty string for undefined', () => {
    const result = sanitizeUrl(undefined);
    expect(result).toBe('');
  });

  it('should return empty string for non-string input', () => {
    const result = sanitizeUrl(123 as any);
    expect(result).toBe('');
  });

  it('should validate and return valid HTTP URL', () => {
    const result = sanitizeUrl('http://example.com');
    expect(result).toBe('http://example.com');
  });

  it('should validate and return valid HTTPS URL', () => {
    const result = sanitizeUrl('https://example.com');
    expect(result).toBe('https://example.com');
  });

  it('should trim whitespace', () => {
    const result = sanitizeUrl('  https://example.com  ');
    expect(result).toBe('https://example.com');
  });

  it('should remove null bytes', () => {
    const result = sanitizeUrl('https://example\0.com');
    expect(result).not.toContain('\0');
  });

  it('should remove dangerous protocols', () => {
    const result = sanitizeUrl('javascript:alert(1)');
    expect(result).toBe('');
  });

  it('should remove data: protocol', () => {
    const result = sanitizeUrl('data:text/html,<script>alert(1)</script>');
    expect(result).toBe('');
  });

  it('should remove vbscript: protocol', () => {
    const result = sanitizeUrl('vbscript:msgbox("xss")');
    expect(result).toBe('');
  });

  it('should remove path traversal attempts', () => {
    const result = sanitizeUrl('https://example.com/../etc/passwd');
    expect(result).not.toContain('..');
  });

  it('should return empty string for URL without http/https', () => {
    const result = sanitizeUrl('example.com');
    expect(result).toBe('');
  });

  it('should return empty string for relative URL', () => {
    const result = sanitizeUrl('/path/to/resource');
    expect(result).toBe('');
  });

  it('should handle case-insensitive protocol', () => {
    const result = sanitizeUrl('HTTPS://example.com');
    expect(result).toBe('HTTPS://example.com');
  });
});

describe('sanitizeFilename', () => {
  it('should return "untitled" for null', () => {
    const result = sanitizeFilename(null);
    expect(result).toBe('untitled');
  });

  it('should return "untitled" for undefined', () => {
    const result = sanitizeFilename(undefined);
    expect(result).toBe('untitled');
  });

  it('should return "untitled" for non-string input', () => {
    const result = sanitizeFilename(123 as any);
    expect(result).toBe('untitled');
  });

  it('should return "untitled" for empty string', () => {
    const result = sanitizeFilename('');
    expect(result).toBe('untitled');
  });

  it('should sanitize valid filename', () => {
    const result = sanitizeFilename('my-file.txt');
    expect(result).toBe('my-file.txt');
  });

  it('should trim whitespace', () => {
    const result = sanitizeFilename('  my-file.txt  ');
    expect(result).toBe('my-file.txt');
  });

  it('should remove null bytes', () => {
    const result = sanitizeFilename('file\0name.txt');
    expect(result).not.toContain('\0');
  });

  it('should remove path separators', () => {
    const result = sanitizeFilename('../../etc/passwd');
    expect(result).not.toContain('/');
    expect(result).not.toContain('\\');
  });

  it('should remove path traversal attempts', () => {
    const result = sanitizeFilename('../../../etc/passwd');
    expect(result).not.toContain('..');
  });

  it('should remove leading/trailing dots and hyphens', () => {
    const result = sanitizeFilename('...file...');
    expect(result).not.toMatch(/^[.-]+|[.-]+$/);
  });

  it('should collapse multiple hyphens', () => {
    const result = sanitizeFilename('my---file---name');
    expect(result).not.toContain('---');
  });

  it('should truncate filename exceeding 255 characters', () => {
    const longName = 'a'.repeat(300) + '.txt';
    const result = sanitizeFilename(longName);
    expect(result.length).toBeLessThanOrEqual(255);
  });

  it('should handle filename at max length', () => {
    const name = 'a'.repeat(250) + '.txt';
    const result = sanitizeFilename(name);
    expect(result.length).toBeLessThanOrEqual(255);
  });

  it('should return "untitled" if sanitization results in empty string', () => {
    const result = sanitizeFilename('...');
    expect(result).toBe('untitled');
  });
});
