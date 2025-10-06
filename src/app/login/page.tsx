import { AuthButtons } from '@/src/components/auth/auth-buttons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - ClaudePro Directory',
  description: 'Sign in to save bookmarks, submit content, and join the community',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  return (
    <div className={`${UI_CLASSES.MIN_H_SCREEN} ${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} ${UI_CLASSES.JUSTIFY_CENTER} bg-background px-4`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to ClaudePro</CardTitle>
          <CardDescription>
            Sign in to bookmark configurations, submit content, and join the community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthButtons redirectTo={searchParams.redirect} />
          
          <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} text-center mt-4`}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
