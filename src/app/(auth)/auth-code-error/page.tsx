import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { ROUTES } from '@/src/lib/data/config/constants';
import { AlertCircle } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/auth/auth-code-error');
}

interface AuthCodeErrorSearchParams {
  message?: string;
  code?: string;
  provider?: string;
}

export default function AuthCodeError({
  searchParams,
}: {
  searchParams?: AuthCodeErrorSearchParams;
}) {
  logger.error('AuthCodeErrorPage rendered', undefined, {
    code: searchParams?.code || 'unknown',
    provider: searchParams?.provider || 'unknown',
    hasMessage: Boolean(searchParams?.message),
    hasSearchParams: Boolean(searchParams),
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div
          className={
            'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'
          }
        >
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-2xl">Authentication Error</CardTitle>
        <CardDescription>
          There was a problem signing you in. This could be due to an invalid or expired link.
        </CardDescription>
      </CardHeader>
      <CardContent className={UI_CLASSES.FLEX_COL_GAP_2}>
        <Button asChild={true}>
          <Link href={ROUTES.LOGIN}>Try Again</Link>
        </Button>
        <Button variant="outline" asChild={true}>
          <Link href={ROUTES.HOME}>Return Home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
