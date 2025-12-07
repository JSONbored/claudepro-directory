import { ExternalLink, GitPullRequest } from '@heyclaude/web-runtime/icons';
import { Button } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';

/**
 * Renders a small outlined button that opens the given pull request URL in a new browser tab.
 *
 * @param href - The URL of the pull request to open; applied to the anchor's `href`.
 * @returns A button element containing an anchor that navigates to `href` in a new tab.
 * @see ContentLinkButton
 */
export function PrLinkButton({ href }: { href: string }) {
  return (
    <Button variant="outline" size="sm" asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <GitPullRequest className="mr-1 h-3 w-3" />
        View PR
      </a>
    </Button>
  );
}

/**
 * Renders a small outlined button that navigates to the provided `href` using Next.js client-side routing.
 *
 * @param href - Destination URL for the link
 * @returns A Button element that wraps a Next.js `Link` containing an external-link icon and the label "View Live"
 *
 * @see PrLinkButton
 * @see Button
 */
export function ContentLinkButton({ href }: { href: string }) {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={href}>
        <ExternalLink className="mr-1 h-3 w-3" />
        View Live
      </Link>
    </Button>
  );
}