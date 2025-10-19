import Link from 'next/link';
import { Button } from '@/src/components/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { ROUTES } from '@/src/lib/constants/routes';
import { AlertCircle } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export const metadata = generatePageMetadata('/auth/auth-code-error');

export default function AuthCodeError() {
  return (
    <div className={'min-h-screen flex items-center justify-center bg-background px-4'}>
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
        <CardContent className="flex flex-col gap-2">
          <Button asChild>
            <Link href={ROUTES.LOGIN}>Try Again</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={ROUTES.HOME}>Return Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
