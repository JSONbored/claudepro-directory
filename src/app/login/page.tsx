import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { UnifiedButton } from '@/src/components/ui/unified-button';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export const metadata = generatePageMetadata('/login');

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  return (
    <div className={'min-h-screen flex items-center justify-center bg-background px-4'}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to ClaudePro</CardTitle>
          <CardDescription>
            Sign in to bookmark configurations, submit content, and join the community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <UnifiedButton
              variant="auth-signin"
              provider="github"
              className="w-full mb-2"
              {...(resolvedSearchParams.redirect
                ? { redirectTo: resolvedSearchParams.redirect }
                : {})}
            />

            <UnifiedButton
              variant="auth-signin"
              provider="google"
              buttonVariant="outline"
              className="w-full"
              {...(resolvedSearchParams.redirect
                ? { redirectTo: resolvedSearchParams.redirect }
                : {})}
            />
          </div>

          <p className={'text-xs text-muted-foreground text-center mt-4'}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
