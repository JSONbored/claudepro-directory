import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { type Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { AuthBrandPanel } from '@/src/components/core/auth/auth-brand-panel';
import { SplitAuthLayout } from '@/src/components/core/auth/auth-layout';
import { AuthMobileHeader } from '@/src/components/core/auth/auth-mobile-header';

import { LoginPanelClient } from './login-panel-client';

/**
 * Dynamic Rendering Required
 *
 * This page is dynamic because searchParams is async (Next.js 15+) and requires runtime resolution.
 */

/**
 * Provide the page metadata for the login route.
 *
 * @returns The Next.js page `Metadata` object for the "/login" route.
 * @see generatePageMetadata
 * @see {@link Metadata}
 */
export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  return generatePageMetadata('/login');
}

/**
 * Render the login page layout and provide an optional redirect target to the client-side login panel.
 *
 * Resolves the incoming `searchParams` promise to obtain an optional `redirect` value; if resolution fails or no `redirect` is present, the login panel receives no redirect target.
 *
 * @param props.searchParams - Promise that resolves to an object that may contain a `redirect` string (e.g., `{ redirect?: string }`)
 * @returns The React element for the login page layout
 *
 * @see {@link LoginPanelClient}
 * @see {@link SplitAuthLayout}
 * @see {@link AuthBrandPanel}
 * @see {@link AuthMobileHeader}
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const operation = 'LoginPage';
  const route = '/login';
  const modulePath = 'apps/web/src/app/(auth)/login/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    route,
    module: modulePath,
  });

  return (
    <Suspense fallback={null}>
      <LoginPageContent searchParams={searchParams} reqLogger={reqLogger} />
    </Suspense>
  );
}

async function LoginPageContent({
  searchParams,
  reqLogger,
}: {
  reqLogger: ReturnType<typeof logger.child>;
  searchParams: Promise<{ redirect?: string }>;
}) {
  let redirectTo: string | undefined;
  try {
    const resolvedSearchParameters = await searchParams;
    redirectTo = resolvedSearchParameters.redirect;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to resolve login search params');
    reqLogger.error('LoginPage: resolving searchParams failed', normalized);
    redirectTo = undefined;
  }

  return (
    <SplitAuthLayout
      brandPanel={<AuthBrandPanel />}
      mobileHeader={<AuthMobileHeader />}
      authPanel={<LoginPanelClient {...(redirectTo ? { redirectTo } : {})} />}
    />
  );
}
