import type { Metadata } from 'next';
import { NavLink } from '@/src/components/core/navigation/navigation-link';
import { APP_CONFIG } from '@/src/lib/data/config/constants';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { getLastUpdatedDate } from '@/src/lib/utils/data.utils';

export const metadata: Promise<Metadata> = generatePageMetadata('/privacy');

/**
 * Static Generation: Legal pages are fully static and never change
 * revalidate: false = Static generation at build time (no automatic revalidation)
 */
export const revalidate = false;

export default function PrivacyPage() {
  const lastUpdated = getLastUpdatedDate();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="prose prose-invert max-w-none">
        <h1 className="mb-6 font-bold text-3xl sm:text-4xl">Privacy Policy</h1>
        <p className="mb-8 text-muted-foreground">Last updated: {lastUpdated}</p>

        <section className="mb-8">
          <h2 className="mb-4 font-semibold text-2xl">1. Information We Collect</h2>
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
          <h2 className="mb-4 font-semibold text-2xl">2. How We Use Your Information</h2>
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
          <h2 className="mb-4 font-semibold text-2xl">3. Information Sharing</h2>
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
          <h2 className="mb-4 font-semibold text-2xl">4. Cookies and Tracking</h2>
          <p className="mb-4">
            We use cookies and similar tracking technologies to collect and track information about
            your activity on our service. You can control cookies through your browser settings.
          </p>
          <p className="mb-4">
            For more details, see our <NavLink href="/cookies">Cookie Policy</NavLink>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 font-semibold text-2xl">5. Data Security</h2>
          <p className="mb-4">
            We implement appropriate technical and organizational measures to protect your personal
            information. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 font-semibold text-2xl">6. Your Rights</h2>
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
          <h2 className="mb-4 font-semibold text-2xl">7. Children's Privacy</h2>
          <p className="mb-4">
            Our service is not directed to children under 13 years of age. We do not knowingly
            collect personal information from children under 13.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 font-semibold text-2xl">8. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes
            by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 font-semibold text-2xl">9. Contact Us</h2>
          <p className="mb-4">
            If you have questions about this Privacy Policy, please{' '}
            <NavLink href="/contact">contact us</NavLink>.
          </p>
        </section>
      </div>
    </div>
  );
}
