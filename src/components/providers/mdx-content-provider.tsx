/**
 * MDX Content Context Provider
 *
 * Provides category and slug context to MDX components for email capture integration.
 * Allows copyable components (headings, code blocks) to trigger email modal with proper context.
 *
 * Architecture:
 * - Wraps MDX content at page level
 * - Components access via useMDXContent() hook
 * - Graceful degradation if context unavailable (direct copy, no modal)
 *
 * @module components/providers/mdx-content-provider
 */

'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * MDX content context value
 */
interface MDXContentContextValue {
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
const MDXContentContext = createContext<MDXContentContextValue | undefined>(undefined);

/**
 * Props for MDXContentProvider
 */
interface MDXContentProviderProps {
  /**
   * Content category
   */
  category: string;

  /**
   * Content slug
   */
  slug: string;

  /**
   * Child components (MDX content)
   */
  children: ReactNode;
}

/**
 * Provider component for MDX content context
 *
 * Wraps MDX content to provide category/slug to copyable components.
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
 *     <MDXContentProvider category={params.category} slug={params.slug}>
 *       <MDXRemote {...mdxSource} components={mdxComponents} />
 *     </MDXContentProvider>
 *   );
 * }
 * ```
 */
export function MDXContentProvider({ category, slug, children }: MDXContentProviderProps) {
  return (
    <MDXContentContext.Provider value={{ category, slug }}>{children}</MDXContentContext.Provider>
  );
}

/**
 * Hook to access MDX content context
 *
 * Returns undefined if used outside provider (graceful degradation).
 * Components should handle undefined case appropriately.
 *
 * @returns Context value or undefined
 *
 * @example
 * ```tsx
 * function CopyableCodeBlock({ children }) {
 *   const mdxContext = useMDXContent();
 *
 *   const { copied, copy } = useCopyWithEmailCapture({
 *     emailContext: {
 *       copyType: 'code',
 *       ...(mdxContext && {
 *         category: mdxContext.category,
 *         slug: mdxContext.slug,
 *       }),
 *     },
 *   });
 *
 *   // ... rest of component
 * }
 * ```
 */
export function useMDXContent(): MDXContentContextValue | undefined {
  return useContext(MDXContentContext);
}
