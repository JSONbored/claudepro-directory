/**
 * Content Context Provider
 *
 * Provides category and slug context to content components for email capture integration.
 * Allows copyable components (headings, code blocks) to trigger email modal with proper context.
 *
 * Architecture:
 * - Wraps structured content at page level
 * - Components access via useContentContext() hook
 * - Graceful degradation if context unavailable (direct copy, no modal)
 *
 * @module components/providers/content-context
 */

'use client';

import { createContext, type ReactNode, useContext } from 'react';

/**
 * Content context value
 */
interface ContentContextValue {
  /**
   * Content category (guides, tutorials, etc.)
   */
  category: string;

  /**
   * Content slug identifier
   */
  slug: string;
}

/**
 * Create context with undefined default (requires provider)
 */
const ContentContext = createContext<ContentContextValue | undefined>(undefined);

/**
 * Props for ContentProvider
 */
interface ContentProviderProps {
  /**
   * Content category
   */
  category: string;

  /**
   * Content slug
   */
  slug: string;

  /**
   * Child components (structured content)
   */
  children: ReactNode;
}

/**
 * Provider component for content context
 *
 * Wraps structured content to provide category/slug to copyable components.
 * Enables email capture modal with proper content context.
 *
 * @param props - Provider props
 * @returns Provider wrapper
 *
 * @example
 * ```tsx
 * // In guide page
 * export default function GuidePage({ params }) {
 *   return (
 *     <ContentProvider category={params.category} slug={params.slug}>
 *       <JsonContentRenderer json={guideJson} />
 *     </ContentProvider>
 *   );
 * }
 * ```
 */
export function ContentProvider({ category, slug, children }: ContentProviderProps) {
  return <ContentContext.Provider value={{ category, slug }}>{children}</ContentContext.Provider>;
}

/**
 * Legacy export for backwards compatibility
 * @deprecated Use ContentProvider instead
 */
export const MDXContentProvider = ContentProvider;

/**
 * Hook to access content context
 *
 * Returns undefined if used outside provider (graceful degradation).
 * Components should handle undefined case appropriately.
 *
 * @returns Context value or undefined
 *
 * @example
 * ```tsx
 * function CopyableCodeBlock({ children }) {
 *   const contentContext = useContentContext();
 *
 *   const { copied, copy } = useCopyWithEmailCapture({
 *     emailContext: {
 *       copyType: 'code',
 *       ...(contentContext && {
 *         category: contentContext.category,
 *         slug: contentContext.slug,
 *       }),
 *     },
 *   });
 *
 *   // ... rest of component
 * }
 * ```
 */
export function useContentContext(): ContentContextValue | undefined {
  return useContext(ContentContext);
}

/**
 * Legacy export for backwards compatibility
 * @deprecated Use useContentContext instead
 */
export const useMDXContent = useContentContext;
