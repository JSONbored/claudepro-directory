/**
 * HTML Sanitizer
 * Lightweight HTML sanitization to prevent XSS attacks
 * Part of unified lib/security/ module
 */

/**
 * Configuration for HTML sanitization
 */
interface SanitizerConfig {
  allowedTags?: string[];
  allowedAttributes?: string[];
  allowDataAttributes?: boolean;
  stripAll?: boolean; // If true, removes all HTML tags
  keepContent?: boolean; // If true when stripping, keeps text content
}

/**
 * Default safe tags for content
 */
const DEFAULT_ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  'b',
  'i',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
  'code',
  'pre',
  'span',
  'div',
  'table',
  'thead',
  'tbody',
  'tr',
  'td',
  'th',
  'img',
  'hr',
  'small',
  'sub',
  'sup',
  'mark',
  'del',
  'ins',
  'kbd',
  'samp',
  'var',
];

/**
 * Default safe attributes
 */
const DEFAULT_ALLOWED_ATTRIBUTES = [
  'href',
  'target',
  'rel',
  'title',
  'alt',
  'src',
  'width',
  'height',
  'class',
  'id',
  'lang',
  'dir',
  'cite',
  'datetime',
];

/**
 * Dangerous patterns to always remove
 * Updated to handle whitespace in closing tags (e.g., </script >, </script  >)
 */
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script\s*>)<[^<]*)*<\/script\s*>/gi,
  /<style\b[^<]*(?:(?!<\/style\s*>)<[^<]*)*<\/style\s*>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe\s*>)<[^<]*)*<\/iframe\s*>/gi,
  /<object\b[^<]*(?:(?!<\/object\s*>)<[^<]*)*<\/object\s*>/gi,
  /<embed\b[^>]*>/gi,
  /<applet\b[^<]*(?:(?!<\/applet\s*>)<[^<]*)*<\/applet\s*>/gi,
  /<form\b[^<]*(?:(?!<\/form\s*>)<[^<]*)*<\/form\s*>/gi,
  /<input\b[^>]*>/gi,
  /<textarea\b[^<]*(?:(?!<\/textarea\s*>)<[^<]*)*<\/textarea\s*>/gi,
  /<button\b[^<]*(?:(?!<\/button\s*>)<[^<]*)*<\/button\s*>/gi,
  /<select\b[^<]*(?:(?!<\/select\s*>)<[^<]*)*<\/select\s*>/gi,
  /<option\b[^<]*(?:(?!<\/option\s*>)<[^<]*)*<\/option\s*>/gi,
  /<link\b[^>]*>/gi,
  /<meta\b[^>]*>/gi,
  /<base\b[^>]*>/gi,
];

/**
 * Event handler attributes to remove
 */
const EVENT_HANDLERS = [
  'onabort',
  'onblur',
  'onchange',
  'onclick',
  'oncontextmenu',
  'ondblclick',
  'ondrag',
  'ondragend',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'onerror',
  'onfocus',
  'oninput',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onload',
  'onmousedown',
  'onmousemove',
  'onmouseout',
  'onmouseover',
  'onmouseup',
  'onmousewheel',
  'onscroll',
  'onselect',
  'onsubmit',
  'onunload',
  'onwheel',
  'oncopy',
  'oncut',
  'onpaste',
];

/**
 * Decode HTML entities safely
 * Prevents double-unescaping attacks by processing &amp; last
 */
function decodeHtmlEntities(str: string): string {
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
  }

  // Server-side: Decode entities in safe order to prevent double-unescaping
  // Use a temporary placeholder to prevent &amp;lt; from becoming <
  const TEMP_AMP = '\x00AMP\x00';
  return str
    .replace(/&amp;/g, TEMP_AMP) // Store &amp; temporarily
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x5C;/g, '\\')
    .replace(/&#96;/g, '`')
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&euro;/g, '€')
    .replace(new RegExp(TEMP_AMP, 'g'), '&'); // Restore & at the end
}

/**
 * Strip all HTML tags from a string
 * Uses secure ordering: decode entities first, then remove tags, then sanitize
 */
function stripHtmlTags(str: string): string {
  // First, decode HTML entities BEFORE tag removal to prevent bypasses
  // This prevents patterns like &lt;script&gt; from becoming <script> after tag removal
  let result = decodeHtmlEntities(str);

  // Remove dangerous content
  for (const pattern of DANGEROUS_PATTERNS) {
    result = result.replace(pattern, '');
  }

  // Remove all remaining HTML tags
  result = result.replace(/<[^>]*>/g, '');

  // Additional safety: remove any remaining < or > that could be injection attempts
  result = result.replace(/[<>]/g, '');

  // Normalize whitespace
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

/**
 * Sanitize HTML with allowed tags and attributes
 */
function sanitizeHtml(html: string, config: SanitizerConfig = {}): string {
  // If stripAll is true, just strip all tags
  if (config.stripAll) {
    return stripHtmlTags(html);
  }

  const allowedTags = config.allowedTags || DEFAULT_ALLOWED_TAGS;
  const allowedAttributes = config.allowedAttributes || DEFAULT_ALLOWED_ATTRIBUTES;
  const allowDataAttributes = config.allowDataAttributes;

  // Remove dangerous content first
  let sanitized = html;
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Remove javascript:, vbscript:, and data: protocols (allow data:image/ only)
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  sanitized = sanitized.replace(/data:(?!image\/)/gi, '');

  // Parse and filter tags
  const tagPattern = /<([^>]+)>/g;
  sanitized = sanitized.replace(tagPattern, (_, tagContent) => {
    // Extract tag name
    const tagMatch = tagContent.match(/^\/?\s*([a-zA-Z0-9]+)/);
    if (!tagMatch) return '';

    const tagName = tagMatch[1].toLowerCase();
    const isClosingTag = tagContent.startsWith('/');

    // Check if tag is allowed
    if (!allowedTags.includes(tagName)) {
      return '';
    }

    // For closing tags, return as-is
    if (isClosingTag) {
      return `</${tagName}>`;
    }

    // For opening tags, filter attributes
    let filteredTag = tagName;
    const attributePattern = /\s+([a-zA-Z0-9\-:]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let attributeMatch: RegExpExecArray | null;

    attributeMatch = attributePattern.exec(tagContent);
    while (attributeMatch !== null) {
      const attrName = (attributeMatch[1] || '').toLowerCase();
      const attrValue = attributeMatch[2] || attributeMatch[3] || attributeMatch[4] || '';

      // Skip event handlers
      if (EVENT_HANDLERS.includes(attrName)) {
        continue;
      }

      // Skip style attribute (can contain XSS)
      if (attrName === 'style') {
        continue;
      }

      // Check if attribute is allowed
      const isDataAttr = attrName.startsWith('data-');
      if (!(allowedAttributes.includes(attrName) || (isDataAttr && allowDataAttributes))) {
        continue;
      }

      // Special handling for href and src
      if ((attrName === 'href' || attrName === 'src') && attrValue) {
        const lowerValue = attrValue.toLowerCase();
        // Block dangerous protocols (allow data:image/ for images)
        if (
          lowerValue.startsWith('javascript:') ||
          lowerValue.startsWith('vbscript:') ||
          (lowerValue.startsWith('data:') && !lowerValue.startsWith('data:image/'))
        ) {
          continue;
        }
      }

      // Add the filtered attribute
      if (attrValue) {
        filteredTag += ` ${attrName}="${attrValue.replace(/"/g, '&quot;')}"`;
      } else {
        filteredTag += ` ${attrName}`;
      }

      // Get next match
      attributeMatch = attributePattern.exec(tagContent);
    }

    // Handle self-closing tags
    if (tagContent.endsWith('/')) {
      filteredTag += ' /';
    }

    return `<${filteredTag}>`;
  });

  return sanitized;
}

/**
 * DOMPurify configuration type
 */
interface DOMPurifyConfig {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
  ALLOW_DATA_ATTR?: boolean;
  KEEP_CONTENT?: boolean;
  ADD_ATTR?: string[];
  FORBID_TAGS?: string[];
  FORBID_ATTR?: string[];
}

/**
 * DOMPurify-compatible interface for easy migration
 */
export const DOMPurify = {
  sanitize(html: string, config?: DOMPurifyConfig): string {
    const sanitizerConfig: SanitizerConfig = {};

    if (config) {
      if (config.ALLOWED_TAGS) {
        sanitizerConfig.allowedTags = config.ALLOWED_TAGS.map((tag: string) => tag.toLowerCase());
      }
      if (config.ALLOWED_ATTR) {
        sanitizerConfig.allowedAttributes = config.ALLOWED_ATTR.map((attr: string) =>
          attr.toLowerCase()
        );
      }
      if (config.ALLOW_DATA_ATTR !== undefined) {
        sanitizerConfig.allowDataAttributes = config.ALLOW_DATA_ATTR;
      }
      if (config.ALLOWED_TAGS && config.ALLOWED_TAGS.length === 0) {
        sanitizerConfig.stripAll = true;
        sanitizerConfig.keepContent = config.KEEP_CONTENT !== false;
      }

      // Add any additional attributes from ADD_ATTR
      if (config.ADD_ATTR && Array.isArray(config.ADD_ATTR)) {
        sanitizerConfig.allowedAttributes = [
          ...(sanitizerConfig.allowedAttributes || DEFAULT_ALLOWED_ATTRIBUTES),
          ...config.ADD_ATTR.map((attr: string) => attr.toLowerCase()),
        ];
      }

      // Remove forbidden tags from allowed list
      if (config.FORBID_TAGS && Array.isArray(config.FORBID_TAGS)) {
        const forbiddenTags = config.FORBID_TAGS.map((tag: string) => tag.toLowerCase());
        if (sanitizerConfig.allowedTags) {
          sanitizerConfig.allowedTags = sanitizerConfig.allowedTags.filter(
            (tag) => !forbiddenTags.includes(tag)
          );
        }
      }

      // Remove forbidden attributes from allowed list
      if (config.FORBID_ATTR && Array.isArray(config.FORBID_ATTR)) {
        const forbiddenAttrs = config.FORBID_ATTR.map((attr: string) => attr.toLowerCase());
        if (sanitizerConfig.allowedAttributes) {
          sanitizerConfig.allowedAttributes = sanitizerConfig.allowedAttributes.filter(
            (attr) => !forbiddenAttrs.includes(attr)
          );
        }
      }
    }

    return sanitizeHtml(html, sanitizerConfig);
  },
};
