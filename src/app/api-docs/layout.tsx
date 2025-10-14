/**
 * API Documentation Layout
 *
 * Fumadocs-powered layout for OpenAPI 3.1.0 documentation.
 * Provides a professional docs UI with sidebar navigation, search, and theme support.
 *
 * Features:
 * - Fumadocs DocsLayout with sidebar navigation
 * - Inherits dark theme from globals.css (Claude Orange OKLCH colors)
 * - RootProvider for Fumadocs context
 * - Collapsible sidebar for mobile responsiveness
 * - SEO-optimized metadata
 *
 * Theme:
 * - Automatically uses app/globals.css OKLCH color system
 * - Claude Orange primary: oklch(62% 0.155 42)
 * - Dark mode default with light mode support
 *
 * @module app/api-docs/layout
 * @see {@link https://fumadocs.dev/docs/ui/layouts/docs Fumadocs DocsLayout Documentation}
 */

import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { APP_CONFIG } from '@/src/lib/constants';
import { METADATA_DEFAULTS } from '@/src/lib/seo/metadata-registry';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// Dynamic imports for Fumadocs components (only loads on /api-docs routes for better performance)
const DocsLayout = dynamic(
  () =>
    import('fumadocs-ui/layouts/docs').then((mod) => ({
      default: mod.DocsLayout,
    })),
  {
    ssr: true,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading documentation...</p>
        </div>
      </div>
    ),
  }
);

const RootProvider = dynamic(
  () =>
    import('fumadocs-ui/provider').then((mod) => ({
      default: mod.RootProvider,
    })),
  {
    ssr: true,
    loading: () => null, // RootProvider wraps DocsLayout, use DocsLayout skeleton
  }
);

/**
 * Metadata for API documentation section
 *
 * SEO Configuration:
 * - Title template for dynamic page titles
 * - Default title for root /api-docs page
 * - Comprehensive description for search engines
 * - Inherits OpenGraph/Twitter metadata from root layout
 *
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: {
    template: `%s${METADATA_DEFAULTS.separator}${METADATA_DEFAULTS.siteName}`,
    default: `API Documentation${METADATA_DEFAULTS.separator}${METADATA_DEFAULTS.siteName}`,
  },
  description:
    'Comprehensive REST API documentation for ClaudePro Directory. Browse and search 8 endpoints for content discovery, analytics, and caching with full request/response examples.',
};

/**
 * Layout component props
 *
 * @interface LayoutProps
 * @property {ReactNode} children - Page content (API docs pages)
 */
interface LayoutProps {
  /** Child components to render within the layout */
  children: ReactNode;
}

/**
 * API Documentation Layout Component
 *
 * Wraps API documentation pages with Fumadocs UI layout.
 * Provides consistent navigation, sidebar, and theme across all API docs.
 *
 * Layout Structure:
 * - RootProvider: Fumadocs context provider
 *   - DocsLayout: Main docs layout with sidebar
 *     - Navigation header with app name
 *     - Collapsible sidebar (auto-generated from page tree)
 *     - Main content area (children)
 *
 * Configuration:
 * - tree: Page tree for sidebar (empty for now, will be populated by generateFiles)
 * - nav.title: Custom branded navigation title
 * - sidebar.enabled: Enable sidebar navigation
 * - sidebar.collapsible: Allow sidebar collapse on mobile
 * - search.enabled: Disabled (can enable with Orama integration)
 *
 * @param {LayoutProps} props - Component props
 * @param {ReactNode} props.children - API documentation page content
 * @returns {JSX.Element} Rendered layout with children
 *
 * @example
 * ```tsx
 * // Automatically wraps all pages in app/api-docs/
 * // app/api-docs/page.tsx
 * export default function APIDocsPage() {
 *   return <div>API documentation content</div>;
 * }
 * ```
 */
export default function APIDocsLayout({ children }: LayoutProps) {
  return (
    <RootProvider
      search={{
        // Disable built-in search for now
        // Can enable later with Orama Cloud integration for indexed search
        enabled: false,
      }}
    >
      <DocsLayout
        tree={{
          name: 'API Documentation',
          children: [],
        }}
        nav={{
          // Custom navigation title
          title: (
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="font-semibold">{APP_CONFIG.name}</span>
              <span className="text-fd-muted-foreground">API</span>
            </div>
          ),
        }}
        sidebar={{
          // Enable sidebar with endpoint navigation
          enabled: true,
          // Allow collapsing on mobile for better UX
          collapsible: true,
        }}
      >
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
