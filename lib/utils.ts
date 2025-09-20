import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * List of acronyms and tool names that should be fully capitalized
 */
const ACRONYMS = [
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
];

/**
 * Capitalizes acronyms and tool names in a title
 */
function capitalizeAcronyms(title: string): string {
  if (!title) return title;

  // Split on spaces, keeping the spaces
  const words = title.split(/(\s+)/);

  return words
    .map((word) => {
      // Skip whitespace
      if (/^\s+$/.test(word)) {
        return word;
      }

      // Extract the clean word (letters/numbers only) and any punctuation
      const cleanWord = word.replace(/[^\w]/g, '');

      if (!cleanWord) return word;

      // Check if this word matches an acronym (case-insensitive)
      const acronym = ACRONYMS.find((a) => a.toLowerCase() === cleanWord.toLowerCase());
      if (acronym) {
        // Replace the clean word with the properly capitalized acronym, preserving punctuation
        return word.replace(new RegExp(cleanWord, 'i'), acronym);
      }

      // Handle special cases like "Next.js", "Vue.js"
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
      // Check if this word is an acronym that should be all caps
      const acronym = ACRONYMS.find((a) => a.toLowerCase() === word.toLowerCase());
      if (acronym) {
        return acronym;
      }

      // Handle special cases like "Next.js", "Vue.js"
      if (word.toLowerCase().endsWith('js') && word.length > 2) {
        const baseWord = word.slice(0, -2);
        const baseAcronym = ACRONYMS.find((a) => a.toLowerCase() === baseWord.toLowerCase());
        if (baseAcronym) {
          return `${baseAcronym}.js`;
        }
      }

      // Handle CloudFormation as special case
      if (word.toLowerCase() === 'cloudformation') {
        return 'CloudFormation';
      }

      // Default: Title Case
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Formats a title for display with proper capitalization
 */
export function formatTitle(title: string): string {
  return capitalizeAcronyms(title);
}

/**
 * Universal function to get display title from any content item
 * This ensures consistent title display across the entire application
 */
export function getDisplayTitle(item: { title?: string; name?: string; slug: string }): string {
  // For hooks (no title/name), use enhanced slugToTitle directly
  // For other content (has title/name), use formatTitle for consistency
  const titleOrName = item.title || item.name;
  if (titleOrName) {
    return formatTitle(titleOrName);
  }
  return slugToTitle(item.slug);
}
