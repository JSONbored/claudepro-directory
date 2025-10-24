import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_CONFIG, SOCIAL_LINKS } from '@/src/lib/constants';

export const metadata: Metadata = {
  title: `Accessibility Statement - ${APP_CONFIG.name}`,
  description: `Accessibility Statement for ${APP_CONFIG.name}. Learn about our commitment to digital accessibility and WCAG 2.1 AA compliance for our Claude AI directory.`,
};

export default function AccessibilityPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
      <div className="prose prose-invert max-w-none">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">Accessibility Statement</h1>
        <p className="text-muted-foreground mb-8">
          Last updated:{' '}
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Commitment</h2>
          <p className="mb-4">
            {APP_CONFIG.name} is committed to ensuring digital accessibility for people with
            disabilities. We are continually improving the user experience for everyone and applying
            the relevant accessibility standards.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Conformance Status</h2>
          <p className="mb-4">
            We aim to conform to the{' '}
            <a
              href="https://www.w3.org/WAI/WCAG21/quickref/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Web Content Accessibility Guidelines (WCAG) 2.1
            </a>{' '}
            at the AA level. These guidelines explain how to make web content more accessible for
            people with disabilities.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Accessibility Features</h2>
          <p className="mb-4">Our website includes the following accessibility features:</p>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Keyboard Navigation</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>All interactive elements are keyboard accessible</li>
              <li>Skip to main content link for screen reader users</li>
              <li>Keyboard shortcuts (⌘K/Ctrl+K for search)</li>
              <li>Logical tab order throughout the site</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Visual Design</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>High contrast color ratios (WCAG AA compliant)</li>
              <li>Dark mode support for reduced eye strain</li>
              <li>Responsive design that works at different zoom levels</li>
              <li>Clear visual focus indicators</li>
              <li>Readable font sizes and line spacing</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Screen Reader Support</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Semantic HTML structure</li>
              <li>ARIA labels and descriptions where appropriate</li>
              <li>Alternative text for all meaningful images</li>
              <li>Proper heading hierarchy</li>
              <li>Form labels and error messages</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Content</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Clear and simple language</li>
              <li>Descriptive link text</li>
              <li>Consistent navigation</li>
              <li>Breadcrumb navigation for context</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Known Limitations</h2>
          <p className="mb-4">
            Despite our efforts, some areas may not be fully accessible. We are actively working to
            address these:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Some third-party embedded content may not be fully accessible</li>
            <li>Complex interactive components are being continuously improved</li>
            <li>Some user-generated content may not meet accessibility standards</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Testing and Validation</h2>
          <p className="mb-4">We regularly test our website using:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Automated accessibility testing tools</li>
            <li>Screen reader testing (NVDA, JAWS, VoiceOver)</li>
            <li>Keyboard-only navigation testing</li>
            <li>Color contrast validation</li>
            <li>Manual accessibility audits</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Compatible Technologies</h2>
          <p className="mb-4">Our website is designed to be compatible with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Modern web browsers (Chrome, Firefox, Safari, Edge)</li>
            <li>Screen readers (NVDA, JAWS, VoiceOver, TalkBack)</li>
            <li>Browser extensions for accessibility</li>
            <li>Assistive technologies following web standards</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Feedback and Support</h2>
          <p className="mb-4">
            We welcome feedback on the accessibility of {APP_CONFIG.name}. If you encounter any
            accessibility barriers or have suggestions for improvement, please let us know:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Email:{' '}
              <a href={`mailto:${SOCIAL_LINKS.email}`} className="text-accent hover:underline">
                {SOCIAL_LINKS.email}
              </a>
            </li>
            <li>
              Contact form:{' '}
              <Link href="/contact" className="text-accent hover:underline">
                Contact Us
              </Link>
            </li>
            <li>
              GitHub Issues:{' '}
              <a
                href={`${SOCIAL_LINKS.github}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Report an Issue
              </a>
            </li>
          </ul>
          <p className="mt-4">
            We will respond to accessibility feedback within 5 business days and work to resolve
            issues as quickly as possible.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Formal Complaints</h2>
          <p className="mb-4">
            If you are not satisfied with our response to your accessibility concern, you may file a
            complaint with:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              U.S. Department of Justice:{' '}
              <a
                href="https://www.ada.gov/filing_complaint.htm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                ADA Complaint Form
              </a>
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Ongoing Improvements</h2>
          <p className="mb-4">Accessibility is an ongoing effort. We regularly:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Review and update our accessibility practices</li>
            <li>Train our team on accessibility best practices</li>
            <li>Conduct accessibility audits of new features</li>
            <li>Incorporate user feedback into improvements</li>
            <li>Stay informed about evolving accessibility standards</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Assessment Approach</h2>
          <p className="mb-4">
            This accessibility statement was created using automated and manual testing methods,
            including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Self-evaluation using WCAG 2.1 criteria</li>
            <li>Automated accessibility testing tools (axe, Lighthouse)</li>
            <li>Manual testing with assistive technologies</li>
            <li>User feedback and testing</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
