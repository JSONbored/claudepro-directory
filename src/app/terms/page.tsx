import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_CONFIG } from '@/src/lib/constants';

export const metadata: Metadata = {
  title: `Terms of Service - ${APP_CONFIG.name}`,
  description: `Terms of Service for ${APP_CONFIG.name}. Review our terms and conditions for using our Claude AI configuration directory and community platform.`,
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
      <div className="prose prose-invert max-w-none">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">
          Last updated:{' '}
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing and using {APP_CONFIG.name}, you accept and agree to be bound by these
            Terms of Service and our{' '}
            <Link href="/privacy" className="text-accent hover:underline">
              Privacy Policy
            </Link>
            . If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Use of Service</h2>
          <p className="mb-4">
            You agree to use our service only for lawful purposes and in accordance with these
            terms.
          </p>
          <p className="mb-4">You agree NOT to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others</li>
            <li>Upload malicious code or harmful content</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the service</li>
            <li>Impersonate another person or entity</li>
            <li>Harass, abuse, or harm other users</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Content</h2>
          <p className="mb-4">
            You retain ownership of content you submit to {APP_CONFIG.name}. By submitting content,
            you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify,
            and display your content in connection with operating and promoting the service.
          </p>
          <p className="mb-4">You represent and warrant that:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>You own or have the necessary rights to the content you submit</li>
            <li>Your content does not violate any third-party rights</li>
            <li>Your content complies with these Terms of Service</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
          <p className="mb-4">
            The service and its original content (excluding user-generated content), features, and
            functionality are owned by {APP_CONFIG.author} and are protected by international
            copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Account Termination</h2>
          <p className="mb-4">
            We reserve the right to suspend or terminate your account and access to the service at
            our sole discretion, without notice, for conduct that we believe violates these Terms of
            Service or is harmful to other users, us, or third parties, or for any other reason.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Disclaimers</h2>
          <p className="mb-4">
            The service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind,
            either express or implied, including but not limited to implied warranties of
            merchantability, fitness for a particular purpose, or non-infringement.
          </p>
          <p className="mb-4">
            We do not warrant that the service will be uninterrupted, secure, or error-free, or that
            any defects will be corrected.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
          <p className="mb-4">
            In no event shall {APP_CONFIG.author}, its directors, employees, or agents be liable for
            any indirect, incidental, special, consequential, or punitive damages arising out of or
            relating to your use of or inability to use the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Indemnification</h2>
          <p className="mb-4">
            You agree to indemnify and hold harmless {APP_CONFIG.author} from any claims, damages,
            losses, liabilities, and expenses (including legal fees) arising from your use of the
            service or violation of these Terms of Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
          <p className="mb-4">
            We reserve the right to modify these Terms of Service at any time. We will notify users
            of any material changes by posting the new terms on this page and updating the "Last
            updated" date. Your continued use of the service after changes constitutes acceptance of
            the new terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Governing Law</h2>
          <p className="mb-4">
            These Terms of Service shall be governed by and construed in accordance with applicable
            laws, without regard to conflict of law provisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
          <p className="mb-4">
            If you have questions about these Terms of Service, please{' '}
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
