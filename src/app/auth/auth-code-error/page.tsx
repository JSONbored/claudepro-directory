import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { ROUTES } from '@/src/lib/constants';
import { AlertCircle } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata = await generatePageMetadata('/auth/auth-code-error');

export default function AuthCodeError() {
  return (
    <div
      className={`${UI_CLASSES.MIN_H_SCREEN} ${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.JUSTIFY_CENTER} bg-background px-4`}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div
            className={`${UI_CLASSES.MX_AUTO} ${UI_CLASSES.MB_4} ${UI_CLASSES.FLEX} h-12 w-12 ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.JUSTIFY_CENTER} ${UI_CLASSES.ROUNDED_FULL} bg-destructive/10`}
          >
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <CardDescription>
            There was a problem signing you in. This could be due to an invalid or expired link.
          </CardDescription>
        </CardHeader>
        <CardContent className={UI_CLASSES.FLEX_COL_GAP_2}>
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
