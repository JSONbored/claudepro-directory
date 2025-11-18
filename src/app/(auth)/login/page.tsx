import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthBrandPanel } from '@/src/components/core/auth/auth-brand-panel';
import { SplitAuthLayout } from '@/src/components/core/auth/auth-layout';
import { AuthMobileHeader } from '@/src/components/core/auth/auth-mobile-header';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { normalizeError } from '@/src/lib/utils/error.utils';
import { LoginPanelClient } from './login-panel-client';

export const metadata: Promise<Metadata> = generatePageMetadata('/login');

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  let redirectTo: string | undefined;
  try {
    const resolvedSearchParams = await searchParams;
    redirectTo = resolvedSearchParams.redirect;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to resolve login search params');
    logger.error('LoginPage: resolving searchParams failed', normalized);
    redirectTo = undefined;
  }

  return (
    <Suspense fallback={null}>
      <SplitAuthLayout
        brandPanel={<AuthBrandPanel />}
        mobileHeader={<AuthMobileHeader />}
        authPanel={<LoginPanelClient redirectTo={redirectTo} />}
      />
    </Suspense>
  );
}
