import { ExternalLink, GitPullRequest } from '@heyclaude/web-runtime/icons';
import { Button } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';

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
