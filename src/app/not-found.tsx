import Link from 'next/link';
import { Button } from '@/src/components/primitives/button';
import { Card } from '@/src/components/primitives/card';
import { ROUTES } from '@/src/lib/constants';
import { AlertCircle, Home, Search } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata = generatePageMetadata('/404');

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg p-8 text-center">
        <div className="mb-6">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <AlertCircle className="h-12 w-12 text-primary" aria-hidden="true" />
            </div>
          </div>
          <h1 className="mb-2 font-bold text-6xl text-primary">404</h1>
          <h2 className="mb-2 font-semibold text-2xl">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className={UI_CLASSES.FLEX_COL_SM_ROW_GAP_3}>
          <Link href={ROUTES.HOME}>
            <Button size="lg">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Link href={ROUTES.GUIDES}>
            <Button variant="outline" size="lg">
              <Search className="mr-2 h-4 w-4" />
              Browse Guides
            </Button>
          </Link>
        </div>

        <div className="mt-8 text-muted-foreground text-sm">
          <p className="mb-2">Popular pages:</p>
          <div className={`flex ${UI_CLASSES.FLEX_WRAP_GAP_2} justify-center`}>
            <Link href={ROUTES.AGENTS} className="hover:text-primary">
              Agents
            </Link>
            <span>•</span>
            <Link href={ROUTES.MCP} className="hover:text-primary">
              MCP Servers
            </Link>
            <span>•</span>
            <Link href={ROUTES.RULES} className="hover:text-primary">
              Rules
            </Link>
            <span>•</span>
            <Link href={ROUTES.COMMANDS} className="hover:text-primary">
              Commands
            </Link>
            <span>•</span>
            <Link href={ROUTES.HOOKS} className="hover:text-primary">
              Hooks
            </Link>
            <span>•</span>
            <Link href={ROUTES.STATUSLINES} className="hover:text-primary">
              Statuslines
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
