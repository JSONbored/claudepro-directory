'use client';

/**
 * App-Specific Empty State Variants
 *
 * These are app-specific variants that use app primitives (Button component).
 * The base EmptyState component is in @heyclaude/web-runtime/ui.
 *
 * This file provides convenience wrappers that use the app's Button component
 * for consistent styling with the rest of the app.
 */

import {
  AlertCircle,
  AlertTriangle,
  Bookmark,
  FileText,
  Layers,
  Search,
  Sparkles,
} from '@heyclaude/web-runtime/icons';
import { EmptyState, Button } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';

/**
 * Empty search results variant
 */
export function EmptySearchResults({
  searchQuery,
  category,
  className,
}: {
  category?: string;
  className?: string;
  searchQuery: string;
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={
        category
          ? `No ${category} matching "${searchQuery}". Try different keywords or submit your own!`
          : `No results found for "${searchQuery}". Try different keywords or browse all content.`
      }
      renderAction={(href, label) => (
        <Button asChild size="lg">
          <Link href={href}>{label}</Link>
        </Button>
      )}
      renderSecondaryAction={(href, label) => (
        <Button asChild size="lg" variant="outline">
          <Link href={href}>{label}</Link>
        </Button>
      )}
      actionLabel="Submit New Config"
      actionHref="/submit/wizard"
      secondaryActionLabel="Browse All"
      secondaryActionHref="/"
      variant="search"
      {...(className ? { className } : {})}
    />
  );
}

/**
 * Empty bookmarks variant
 */
export function EmptyBookmarks({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Bookmark}
      title="No bookmarks yet"
      description="Start bookmarking your favorite configs to build your personal collection. Bookmarks sync across devices and help you quickly find content you love."
      renderAction={(href, label) => (
        <Button asChild size="lg">
          <Link href={href}>{label}</Link>
        </Button>
      )}
      actionLabel="Browse Configs"
      actionHref="/agents"
      variant="default"
      {...(className ? { className } : {})}
    />
  );
}

/**
 * Empty submissions variant
 */
export function EmptySubmissions({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={FileText}
      title="No submissions yet"
      description="You haven't submitted any configs yet. Share your Claude agents, MCP servers, and more with the community!"
      renderAction={(href, label) => (
        <Button asChild size="lg">
          <Link href={href}>{label}</Link>
        </Button>
      )}
      actionLabel="Submit Your First Config"
      actionHref="/submit/wizard"
      variant="default"
      {...(className ? { className } : {})}
    />
  );
}

/**
 * Empty collections variant
 */
export function EmptyCollections({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Layers}
      title="No collections yet"
      description="Collections help you organize and share groups of related configs. Create your first collection to get started."
      renderAction={(href, label) => (
        <Button asChild size="lg">
          <Link href={href}>{label}</Link>
        </Button>
      )}
      actionLabel="Create Collection"
      actionHref="/collections/new"
      variant="default"
      {...(className ? { className } : {})}
    />
  );
}

/**
 * Empty category variant
 */
export function EmptyCategory({ category, className }: { category: string; className?: string }) {
  return (
    <EmptyState
      icon={Sparkles}
      title={`No ${category} yet`}
      description={`Be the first to submit a ${category.slice(0, -1)} to the directory! Your contribution will help the community discover new Claude configurations.`}
      renderAction={(href, label) => (
        <Button asChild size="lg">
          <Link href={href}>{label}</Link>
        </Button>
      )}
      actionLabel={`Submit ${category.slice(0, -1)}`}
      actionHref="/submit/wizard"
      variant="default"
      {...(className ? { className } : {})}
    />
  );
}

/**
 * Not found empty state (uses app Button)
 */
export function NotFoundEmpty({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved. Let's get you back on track!"
      renderAction={(href, label) => (
        <Button asChild size="lg">
          <Link href={href}>{label}</Link>
        </Button>
      )}
      renderSecondaryAction={(href, label) => (
        <Button asChild size="lg" variant="outline">
          <Link href={href}>{label}</Link>
        </Button>
      )}
      actionLabel="Go to Homepage"
      actionHref="/"
      secondaryActionLabel="Browse Configs"
      secondaryActionHref="/agents"
      variant="error"
      {...(className ? { className } : {})}
    />
  );
}

/**
 * Error empty state (uses app Button)
 */
export function ErrorEmpty({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again or contact support if the problem persists.',
  className,
}: {
  className?: string;
  description?: string;
  title?: string;
}) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title={title}
      description={description}
      renderAction={(href, label) => (
        <Button asChild size="lg">
          <Link href={href}>{label}</Link>
        </Button>
      )}
      renderSecondaryAction={(href, label) => (
        <Button asChild size="lg" variant="outline">
          <Link href={href}>{label}</Link>
        </Button>
      )}
      actionLabel="Try Again"
      actionHref="#"
      secondaryActionLabel="Contact Support"
      secondaryActionHref="/contact"
      variant="error"
      {...(className ? { className } : {})}
    />
  );
}
