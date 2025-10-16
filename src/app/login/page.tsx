import { AuthButtons } from '@/src/components/auth/auth-buttons';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
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
          <AuthButtons
            {...(resolvedSearchParams.redirect
              ? { redirectTo: resolvedSearchParams.redirect }
              : {})}
          />

          <p className={'text-xs text-muted-foreground text-center mt-4'}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
