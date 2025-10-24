import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_CONFIG } from '@/src/lib/constants';

export const metadata: Metadata = {
  title: `Privacy Policy - ${APP_CONFIG.name}`,
  description: `Privacy Policy for ${APP_CONFIG.name}. Learn how we collect, use, and protect your personal information when you use our Claude AI configuration directory.`,
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
      <div className="prose prose-invert max-w-none">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated:{' '}
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            We collect information that you provide directly to us when using {APP_CONFIG.name}:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account information (email address, username)</li>
            <li>Profile information (optional bio, avatar)</li>
            <li>Content you submit (configurations, comments, interactions)</li>
            <li>Usage data (pages visited, features used, interactions)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Personalize your experience and provide recommendations</li>
            <li>Send you technical notices and support messages</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, prevent, and address technical issues and abuse</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
          <p className="mb-4">
            We do not sell your personal information. We may share your information only in the
            following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>With your consent</li>
            <li>For legal compliance or to protect rights</li>
            <li>With service providers who assist our operations (analytics, hosting)</li>
            <li>Public content you choose to share (configurations, profiles)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Cookies and Tracking</h2>
          <p className="mb-4">
            We use cookies and similar tracking technologies to collect and track information about
            your activity on our service. You can control cookies through your browser settings.
          </p>
          <p className="mb-4">
            For more details, see our{' '}
            <Link href="/cookies" className="text-accent hover:underline">
              Cookie Policy
            </Link>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
          <p className="mb-4">
            We implement appropriate technical and organizational measures to protect your personal
            information. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access and receive a copy of your personal data</li>
            <li>Correct inaccurate or incomplete data</li>
            <li>Request deletion of your data</li>
            <li>Object to or restrict processing of your data</li>
            <li>Data portability</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Children's Privacy</h2>
          <p className="mb-4">
            Our service is not directed to children under 13 years of age. We do not knowingly
            collect personal information from children under 13.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes
            by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
          <p className="mb-4">
            If you have questions about this Privacy Policy, please{' '}
            <Link href="/contact" className="text-accent hover:underline">
              contact us
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
