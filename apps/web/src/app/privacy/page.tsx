import { getLastUpdatedDate } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { NavLink } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';

/**
 * Produce the page metadata for the privacy page.
 *
 * @returns The Next.js `Metadata` object for the "/privacy" page.
 * @see generatePageMetadata
 * @see {@link Metadata}
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/privacy');
}

/**
 * Static Generation: Legal pages are fully static and never change
 * revalidate: false = Static generation at build time (no automatic revalidation)
 */
export const revalidate = false;

/**
 * Renders the Privacy Policy page, including the last-updated date and policy sections.
 *
 * The component reads the site's last updated date and displays policy sections covering
 * information collection, use, sharing, cookies, security, user rights, children's privacy,
 * policy changes, and contact information. Internal navigation links point to the Cookies and
 * Contact pages.
 *
 * @returns The rendered Privacy Policy page as a JSX element.
 *
 * @see getLastUpdatedDate
 * @see APP_CONFIG
 * @see NavLink
 */
export default function PrivacyPage() {
  const lastUpdated = getLastUpdatedDate();

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
