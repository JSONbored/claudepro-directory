import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { content_category } from '@heyclaude/data-layer/prisma';

export const ACRONYMS = [
  'API',
  'AWS',
  'CSS',
  'JSON',
  'SCSS',
  'HTML',
  'XML',
  'HTTP',
  'HTTPS',
  'URL',
  'URI',
  'SQL',
  'NoSQL',
  'REST',
  'GraphQL',
  'JWT',
  'SSH',
  'FTP',
  'SMTP',
  'DNS',
  'CDN',
  'SDK',
  'CLI',
  'IDE',
  'UI',
  'UX',
  'AI',
  'ML',
  'NPM',
  'CI',
  'CD',
  'CI/CD',
  'PDF',
  'CSV',
  'SVG',
  'PNG',
  'JPG',
  'JPEG',
  'GIF',
  'TCP',
  'UDP',
  'IP',
  'VPN',
  'SSL',
  'TLS',
  'OAuth',
  'SAML',
  'LDAP',
  'DB',
  'CRUD',
  'ORM',
  'MVC',
  'MVP',
  'MVVM',
  'SPA',
  'PWA',
  'SEO',
  'CMS',
  'CRM',
  'SaaS',
  'PaaS',
  'IaaS',
  'E2E',
  'QA',
  'TDD',
  'BDD',
  'CORS',
  'CSRF',
  'XSS',
  'MCP',
  'LLM',
  'GPT',
  'SRE',
  'DevOps',
] as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shallowEqual(objA: unknown, objB: unknown): boolean {
  if (Object.is(objA, objB)) return true;

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (
      !(
        Object.hasOwn(objB, key) &&
        Object.is((objA as Record<string, unknown>)[key], (objB as Record<string, unknown>)[key])
      )
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Deep equality comparison for arrays and objects.
 * 
 * Performs a deep comparison of two values, handling:
 * - Primitives (uses Object.is for strict equality)
 * - Arrays (compares length and elements recursively)
 * - Objects (compares keys and values recursively)
 * - Null/undefined values
 * 
 * **Performance:** Faster than JSON.stringify for memo comparisons.
 * **Use cases:** React.memo custom comparison, useMemo dependencies, array/object equality checks.
 * 
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns true if values are deeply equal
 * 
 * @example
 * ```typescript
 * import { deepEqual } from '@heyclaude/web-runtime/ui';
 * 
 * // In memo comparison
 * export const MyComponent = memo(Component, (prev, next) => {
 *   return deepEqual(prev.items, next.items);
 * });
 * 
 * // In useMemo dependency
 * const stableKey = useMemo(() => {
 *   return items; // Return original array, use deepEqual in dependency array
 * }, [deepEqual(items, prevItems) ? items : items]);
 * ```
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  // Fast path: same reference or strict equality
  if (Object.is(a, b)) return true;

  // Handle null/undefined
  if (a === null || b === null) return a === b;
  if (a === undefined || b === undefined) return a === b;

  // Type mismatch
  if (typeof a !== typeof b) return false;

  // Primitives (already handled by Object.is above, but defensive check)
  if (typeof a !== 'object') return false;

  // Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // One is array, other is not
  if (Array.isArray(a) || Array.isArray(b)) return false;

  // Objects
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!Object.hasOwn(b, key)) return false;
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
        return false;
      }
    }

    return true;
  }

  return false;
}

function capitalizeAcronyms(title: string): string {
  if (!title) return title;

  const words = title.split(/(\s+)/);

  return words
    .map((word) => {
      if (/^\s+$/.test(word)) {
        return word;
      }

      const cleanWord = word.replace(/[^\w]/g, '');

      if (!cleanWord) return word;

      const acronym = ACRONYMS.find((a) => a.toLowerCase() === cleanWord.toLowerCase());
      if (acronym) {
        return word.replace(new RegExp(cleanWord, 'i'), acronym);
      }

      if (cleanWord.toLowerCase().endsWith('js') && cleanWord.length > 2) {
        const baseWord = cleanWord.slice(0, -2);
        const baseAcronym = ACRONYMS.find((a) => a.toLowerCase() === baseWord.toLowerCase());
        if (baseAcronym) {
          return word.replace(new RegExp(cleanWord, 'i'), `${baseAcronym}.js`);
        }
      }

      return word;
    })
    .join('');
}

export function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => {
      const acronym = ACRONYMS.find((a) => a.toLowerCase() === word.toLowerCase());
      if (acronym) {
        return acronym;
      }

      if (word.toLowerCase().endsWith('js') && word.length > 2) {
        const baseWord = word.slice(0, -2);
        const baseAcronym = ACRONYMS.find((a) => a.toLowerCase() === baseWord.toLowerCase());
        if (baseAcronym) {
          return `${baseAcronym}.js`;
        }
      }

      if (word.toLowerCase() === 'cloudformation') {
        return 'CloudFormation';
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function formatTitle(title: string): string {
  return capitalizeAcronyms(title);
}

export function getDisplayTitle(item: {
  readonly title?: string | null;
  readonly slug?: string | null;
  readonly category?: content_category | null;
}): string {
  if (item.title) {
    return formatTitle(item.title);
  }

  const slug = item.slug || '';
  const baseTitle = slugToTitle(slug);

  if (item.category === 'commands') {
    return `/${slug}`;
  }

  return baseTitle;
}

/**
 * Get view transition name for a content item
 *
 * Generates a unique, stable view transition name for smooth card → detail morphing.
 * This is a pure string manipulation function that works in both server and client components.
 *
 * @param type - Content type (e.g., 'card', 'detail')
 * @param slug - Content slug (unique identifier)
 * @returns View transition name string
 *
 * @example
 * ```typescript
 * const transitionName = getViewTransitionName('card', 'code-reviewer');
 * // Returns: 'config-card-code-reviewer'
 *
 * // Apply to JSX element:
 * <div style={{ viewTransitionName: transitionName }}>
 *   Card content here
 * </div>
 * ```
 */
export function getViewTransitionName(type: 'card' | 'detail' | 'image', slug: string): string {
  // Sanitize slug (remove special characters for CSS compatibility)
  const sanitizedSlug = slug.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  return `config-${type}-${sanitizedSlug}`;
}
