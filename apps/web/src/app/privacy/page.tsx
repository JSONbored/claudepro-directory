import { getLastUpdatedDate } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import { NavLink } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

/**
 * Provide page metadata used by Next.js for the site's Privacy page.
 *
 * @returns The Next.js Metadata object for the "/privacy" page.
 * @see generatePageMetadata
 * @see {@link Metadata}
 */
/**
 * Provide Next.js metadata for the Privacy page, deferring non-deterministic operations to request time.
 *
 * Awaits a server connection to allow safe use of non-deterministic values (e.g., current date) in Cache Components, then returns generated metadata for the '/privacy' route.
 *
 * @returns The page metadata for the privacy route.
 * @see generatePageMetadata
 * @see connection
 */

export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  return generatePageMetadata('/privacy');
}

/**
 * Render the Privacy Policy page with its last-updated date and policy sections.
 *
 * This server component defers non-deterministic operations by awaiting the runtime
 * connection, creates a request-scoped logger for the page request, and renders the
 * Privacy Policy content within a Suspense boundary (fallback shown while loading).
 *
 * @returns The Privacy Policy page as a JSX element.
 *
 * @see getLastUpdatedDate
 * @see APP_CONFIG
 * @see NavLink
 */
export default async function PrivacyPage() {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request (after connection() to allow Date.now())
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'PrivacyPage',
    route: '/privacy',
    module: 'apps/web/src/app/privacy',
  });

  return (
    <Suspense
      fallback={<div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">Loading...</div>}
    >
      <PrivacyPageContent reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Renders the Privacy Policy page content and emits a request-scoped render log.
 *
 * @param reqLogger - Request-scoped logger (created via `logger.child`) used to record structured log entries for this render.
 * @returns The JSX element containing the privacy policy content, including the last-updated date and sectioned policy text.
 *
 * @see getLastUpdatedDate
 * @see NavLink
 * @see APP_CONFIG
 */
function PrivacyPageContent({ reqLogger }: { reqLogger: ReturnType<typeof logger.child> }) {
  const lastUpdated = getLastUpdatedDate();

  reqLogger.info('PrivacyPage: rendering page', {
    section: 'page-render',
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="prose prose-invert max-w-none">
        <h1 className="mb-6 text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: {lastUpdated}</p>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">1. Information We Collect</h2>
          <p className="mb-4">
            We collect information that you provide directly to us when using {APP_CONFIG.name}:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Account information (email address, username)</li>
            <li>Profile information (optional bio, avatar)</li>
            <li>Content you submit (configurations, comments, interactions)</li>
            <li>Usage data (pages visited, features used, interactions)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">2. How We Use Your Information</h2>
          <p className="mb-4">We use the information we collect to:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Provide, maintain, and improve our services</li>
            <li>Personalize your experience and provide recommendations</li>
            <li>Send you technical notices and support messages</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, prevent, and address technical issues and abuse</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">3. Information Sharing</h2>
          <p className="mb-4">
            We do not sell your personal information. We may share your information only in the
            following circumstances:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>With your consent</li>
            <li>For legal compliance or to protect rights</li>
            <li>With service providers who assist our operations (analytics, hosting)</li>
            <li>Public content you choose to share (configurations, profiles)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">4. Cookies and Tracking</h2>
          <p className="mb-4">
            We use cookies and similar tracking technologies to collect and track information about
            your activity on our service. You can control cookies through your browser settings.
          </p>
          <p className="mb-4">
            For more details, see our <NavLink href="/cookies">Cookie Policy</NavLink>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">5. Data Security</h2>
          <p className="mb-4">
            We implement appropriate technical and organizational measures to protect your personal
            information. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">6. Your Rights</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Access and receive a copy of your personal data</li>
            <li>Correct inaccurate or incomplete data</li>
            <li>Request deletion of your data</li>
            <li>Object to or restrict processing of your data</li>
            <li>Data portability</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">7. Children's Privacy</h2>
          <p className="mb-4">
            Our service is not directed to children under 13 years of age. We do not knowingly
            collect personal information from children under 13.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">8. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes
            by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">9. Contact Us</h2>
          <p className="mb-4">
            If you have questions about this Privacy Policy, please{' '}
            <NavLink href="/contact">contact us</NavLink>.
          </p>
        </section>
      </div>
    </div>
  );
}