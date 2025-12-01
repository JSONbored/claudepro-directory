import { iconLeading } from '@heyclaude/web-runtime/design-system';
import { ExternalLink, GitPullRequest } from '@heyclaude/web-runtime/icons';
import Link from 'next/link';
import { Button } from '@heyclaude/web-runtime/ui';

export function PrLinkButton({ href }: { href: string }) {
  return (
    <Button variant="outline" size="sm" asChild={true}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <GitPullRequest className={iconLeading.xs} />
        View PR
      </a>
    </Button>
  );
}

export function ContentLinkButton({ href }: { href: string }) {
  return (
    <Button variant="outline" size="sm" asChild={true}>
      <Link href={href}>
        <ExternalLink className={iconLeading.xs} />
        View Live
      </Link>
    </Button>
  );
}
