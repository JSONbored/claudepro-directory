import { getContactChannels, getLastUpdatedDate } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { logger } from '@heyclaude/web-runtime/logging/server';
import { NavLink, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { Suspense } from 'react';

import Loading from './loading';

/**
 * Produce page metadata for the Terms page.
 *
 * @returns Page metadata for the "/terms" route.
 *
 * @see generatePageMetadata
 * @see {@link import('next').Metadata}
 */
/**
 * Produce the Next.js page metadata for the Terms page.
 *
 * Defers to request time by awaiting a server connection so non-deterministic operations
 * (e.g., current time used by cache components) are valid before metadata is generated.
 *
 * @returns The Metadata object for the '/terms' route.
 *
 * @see generatePageMetadata
 * @see connection
 */

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/terms');
}

/**
 * Render the Terms of Service page inside a Suspense boundary and supply a per-request logger.
 *
 * Awaits connection() to defer non-deterministic operations (e.g., current time) to request time,
 * creates a request-scoped logger which is passed to the
 * page content before rendering.
 *
 * @returns The React element for the Terms of Service page wrapped in a Suspense fallback.
 *
 * @see getLastUpdatedDate
 * @see getContactChannels
 * @see NavLink
 * @see APP_CONFIG
 */
export default async function TermsPage() {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: 'apps/web/src/app/terms',
    operation: 'TermsPage',
    route: '/terms',
  });

  return (
    <Suspense fallback={<Loading />}>
      <TermsPageContent reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Renders the Terms of Service content, including dynamic last-updated date and contact channels.
 *
 * Retrieves the site's last updated date and contact channels, logs a page-render event with the
 * provided request-scoped logger, and returns the Terms of Service JSX tree populated with
 * APP_CONFIG values and NavLink components.
 *
 * @param reqLogger - A request-scoped logger created via `logger.child` used to record render events.
 * @param reqLogger.reqLogger
 * @returns The Terms of Service React element.
 *
 * @see getLastUpdatedDate
 * @see getContactChannels
 * @see NavLink
 * @see APP_CONFIG
 * @see logger
 */
function TermsPageContent({ reqLogger }: { reqLogger: ReturnType<typeof logger.child> }) {
  const lastUpdated = getLastUpdatedDate();
  const channels = getContactChannels();

  reqLogger.info({ section: 'data-fetch', securityEvent: true }, 'TermsPage: rendering page');

  return (
    <div className={`container mx-auto max-w-4xl ${UI_CLASSES.PADDING_X_DEFAULT} py-8 sm:py-12`}>
      <div className="prose prose-invert max-w-none">
        <h1 className={`${UI_CLASSES.MARGIN_COMFORTABLE} text-3xl font-bold sm:text-4xl`}>
          Terms of Service
        </h1>
        <p className={`${UI_CLASSES.MARGIN_RELAXED} text-muted-foreground`}>
          Last updated: {lastUpdated}
        </p>

        <section className={UI_CLASSES.MARGIN_RELAXED}>
          <h2 className={`${UI_CLASSES.MARGIN_DEFAULT} text-2xl font-semibold`}>
            1. Acceptance of Terms
          </h2>
          <p className={UI_CLASSES.MARGIN_DEFAULT}>
            By accessing and using {APP_CONFIG.name}, you accept and agree to be bound by these
            Terms of Service and our <NavLink href="/privacy">Privacy Policy</NavLink>. If you do
            not agree to these terms, please do not use our service.
          </p>
        </section>

        <section className={UI_CLASSES.MARGIN_RELAXED}>
          <h2 className={`${UI_CLASSES.MARGIN_DEFAULT} text-2xl font-semibold`}>
            2. Use of Service
          </h2>
          <p className={UI_CLASSES.MARGIN_DEFAULT}>
            You agree to use our service only for lawful purposes and in accordance with these
            terms.
          </p>
          <p className={UI_CLASSES.MARGIN_DEFAULT}>You agree NOT to:</p>
          <ul className={`list-disc ${UI_CLASSES.SPACE_Y_2} pl-6`}>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others</li>
            <li>Upload malicious code or harmful content</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the service</li>
            <li>Impersonate another person or entity</li>
            <li>Harass, abuse, or harm other users</li>
          </ul>
        </section>

        <section className={UI_CLASSES.MARGIN_RELAXED}>
          <h2 className={`${UI_CLASSES.MARGIN_DEFAULT} text-2xl font-semibold`}>3. User Content</h2>
          <p className={UI_CLASSES.MARGIN_DEFAULT}>
            You retain ownership of content you submit to {APP_CONFIG.name}. By submitting content,
            you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify,
            and display your content in connection with operating and promoting the service.
          </p>
          <p className={UI_CLASSES.MARGIN_DEFAULT}>You represent and warrant that:</p>
          <ul className={`list-disc ${UI_CLASSES.SPACE_Y_2} pl-6`}>
            <li>You own or have the necessary rights to the content you submit</li>
            <li>Your content does not violate any third-party rights</li>
            <li>Your content complies with these Terms of Service</li>
          </ul>
        </section>

        <section className={UI_CLASSES.MARGIN_RELAXED}>
          <h2 className={`${UI_CLASSES.MARGIN_DEFAULT} text-2xl font-semibold`}>
            4. Intellectual Property
          </h2>
          <p className={UI_CLASSES.MARGIN_DEFAULT}>
            The service and its original content (excluding user-generated content), features, and
            functionality are owned by {APP_CONFIG.author} and are protected by international
            copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section className={UI_CLASSES.MARGIN_RELAXED}>
          <h2 className={`${UI_CLASSES.MARGIN_DEFAULT} text-2xl font-semibold`}>
            5. Account Termination
          </h2>
          <p className={UI_CLASSES.MARGIN_DEFAULT}>
            We reserve the right to suspend or terminate your account and access to the service at
            our sole discretion, without notice, for conduct that we believe violates these Terms of
            Service or is harmful to other users, us, or third parties, or for any other reason.
          </p>
        </section>

        <section className={UI_CLASSES.MARGIN_RELAXED}>
          <h2 className={`${UI_CLASSES.MARGIN_DEFAULT} text-2xl font-semibold`}>6. Disclaimers</h2>
          <p className={UI_CLASSES.MARGIN_DEFAULT}>
            The service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without
            warranties of any kind, either express or implied, including but not limited to implied
            warranties of merchantability, fitness for a particular purpose, or non-infringement.
          </p>
          <p className={UI_CLASSES.MARGIN_DEFAULT}>
            We do not warrant that the service will be uninterrupted, secure, or error-free, or that
            any defects will be corrected.
          </p>
        </section>

        <section className={UI_CLASSES.MARGIN_RELAXED}>
          <h2 className={`${UI_CLASSES.MARGIN_DEFAULT} text-2xl font-semibold`}>
            7. Limitation of Liability
          </h2>
          <p className={UI_CLASSES.MARGIN_DEFAULT}>
            In no event shall {APP_CONFIG.author}, its directors, employees, or agents be liable for
            any indirect, incidental, special, consequential, or punitive damages arising out of or
            relating to your use of or inability to use the service.
          </p>
        </section>

        <section className={UI_CLASSES.MARGIN_RELAXED}>
          <h2 className={`${UI_CLASSES.MARGIN_DEFAULT} text-2xl font-semibold`}>
            8. Indemnification
          </h2>
          <p className={UI_CLASSES.MARGIN_DEFAULT}>
            You agree to indemnify and hold harmless {APP_CONFIG.author} from any claims, damages,
            losses, liabilities, and expenses (including legal fees) arising from your use of the
            service or violation of these Terms of Service.
          </p>
        </section>

        <section className={UI_CLASSES.MARGIN_RELAXED}>
          <h2 className={`${UI_CLASSES.MARGIN_DEFAULT} text-2xl font-semibold`}>
            9. Changes to Terms
          </h2>
          <p className={UI_CLASSES.MARGIN_DEFAULT}>
            We reserve the right to modify these Terms of Service at any time. We will notify users
            of any material changes by posting the new terms on this page and updating the
            &quot;Last updated&quot; date. Your continued use of the service after changes
            constitutes acceptance of the new terms.
          </p>
        </section>

        <section className={UI_CLASSES.MARGIN_RELAXED}>
          <h2 className={`${UI_CLASSES.MARGIN_DEFAULT} text-2xl font-semibold`}>
            10. Governing Law
          </h2>
          <p className={UI_CLASSES.MARGIN_DEFAULT}>
            These Terms of Service shall be governed by and construed in accordance with applicable
            laws, without regard to conflict of law provisions.
          </p>
        </section>

        <section className={UI_CLASSES.MARGIN_RELAXED}>
          <h2 className={`${UI_CLASSES.MARGIN_DEFAULT} text-2xl font-semibold`}>11. Contact Us</h2>
          <p className={UI_CLASSES.MARGIN_DEFAULT}>
            If you have questions about these Terms of Service, please{' '}
            <NavLink external href={`mailto:${channels.email}`}>
              {channels.email}
            </NavLink>{' '}
            or <NavLink href="/contact">contact us</NavLink>.
          </p>
        </section>
      </div>
    </div>
  );
}
