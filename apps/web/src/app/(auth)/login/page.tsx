import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
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
 * Render the login page layout and initialize request-scoped context for the login flow.
 *
 * Awaits request-time connection setup, creates a request-scoped logger, and returns the page wrapped
 * in a Suspense boundary that renders the login content component with the provided `searchParams`
 * and `reqLogger`.
 *
 * @param searchParams - Promise resolving to an object that may contain a `redirect` string (e.g., `{ redirect?: string }`)
 * @param searchParams.searchParams
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

  const operation = 'LoginPage';
  const route = '/login';
  const modulePath = 'apps/web/src/app/(auth)/login/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
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

/**
 * Resolve the optional `redirect` search parameter and render the login layout.
 *
 * Attempts to read `redirect` from `searchParams`; on failure logs the normalized error
 * with `reqLogger` and proceeds without a redirect. Renders a SplitAuthLayout where
 * LoginPanelClient receives `redirectTo` only when a redirect value was successfully resolved.
 *
 * @param searchParams.reqLogger
 * @param searchParams - A promise that should resolve to an object that may contain `redirect`.
 * @param reqLogger - Request-scoped logger used to record resolution errors and contextual logs.
 * @param searchParams.searchParams
 * @returns A React element containing the composed login layout.
 *
 * @see LoginPanelClient
 * @see SplitAuthLayout
 * @see normalizeError
 */
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
