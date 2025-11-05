import { Suspense } from 'react';
import { AuthBrandPanel } from '@/src/components/auth/auth-brand-panel';
import { AuthFormPanel } from '@/src/components/auth/auth-form-panel';
import { AuthMobileHeader } from '@/src/components/auth/auth-mobile-header';
import { OAuthProviderButton } from '@/src/components/auth/oauth-provider-button';
import { SplitAuthLayout } from '@/src/components/auth/split-auth-layout';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

export const metadata = generatePageMetadata('/login');

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const redirectTo = resolvedSearchParams.redirect;

  return (
    <Suspense fallback={null}>
      <SplitAuthLayout
        brandPanel={
          <AuthBrandPanel
          // Optional: Add real stats when available
          // stats={[
          //   { value: '10,000+', label: 'Configurations' },
          //   { value: '5,000+', label: 'Community Members' },
          // ]}
          />
        }
        mobileHeader={<AuthMobileHeader />}
        authPanel={
          <AuthFormPanel
            title="Welcome back"
            description="Sign in to bookmark configurations, submit content, and join the community"
          >
            <OAuthProviderButton provider="github" redirectTo={redirectTo} />
            <OAuthProviderButton provider="google" redirectTo={redirectTo} />
            <OAuthProviderButton provider="discord" redirectTo={redirectTo} />
          </AuthFormPanel>
        }
      />
    </Suspense>
  );
}
