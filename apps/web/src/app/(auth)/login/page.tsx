import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthBrandPanel } from '@/src/components/core/auth/auth-brand-panel';
import { SplitAuthLayout } from '@/src/components/core/auth/auth-layout';
import { AuthMobileHeader } from '@/src/components/core/auth/auth-mobile-header';
import { LoginPanelClient } from './login-panel-client';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/login');
}

/**
 * Dynamic Rendering Required
 *
 * This page is dynamic because it handles authentication state and redirects.
 */
export const dynamic = 'force-dynamic';

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
