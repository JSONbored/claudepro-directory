import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Database } from '@heyclaude/database-types';

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
  readonly category?: Database['public']['Enums']['content_category'] | null;
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
