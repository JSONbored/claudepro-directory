import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ACRONYMS } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Performs shallow equality comparison between two objects (SHA-2090)
 * Optimized for React.memo comparison - faster than JSON.stringify
 *
 * @param objA - First object to compare
 * @param objB - Second object to compare
 * @returns true if objects are shallowly equal, false otherwise
 */
export function shallowEqual(objA: unknown, objB: unknown): boolean {
  if (Object.is(objA, objB)) return true;

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  // Test for A's keys different from B
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
export function getDisplayTitle(
  item:
    | {
        readonly title?: string | undefined;
        readonly name?: string | undefined;
        readonly slug: string;
        readonly category: string | undefined;
      }
    | {
        readonly title?: string | undefined;
        readonly name?: string | undefined;
        readonly slug: string;
        readonly category?: string | undefined;
      }
): string {
  // For hooks (no title/name), use enhanced slugToTitle directly
  // For other content (has title/name), use formatTitle for consistency
  const titleOrName = item.title || item.name;
  if (titleOrName) {
    return formatTitle(titleOrName);
  }

  const baseTitle = slugToTitle(item.slug);

  // Commands should display with "/" prefix using the original slug
  if (item.category === 'commands') {
    return `/${item.slug}`;
  }

  return baseTitle;
}
