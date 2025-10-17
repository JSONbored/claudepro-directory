'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { PwaInstallTracker } from './pwa-install-tracker';

const meta = {
  title: 'Infra/PwaInstallTracker',
  component: PwaInstallTracker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Tracks PWA installation events using the standard trackEvent pattern. Listens to browser-level PWA events (pwa_installable, pwa_installed, pwa_launched) dispatched by service worker and forwards them to centralized analytics. This component renders nothing but tracks PWA lifecycle events in the background.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PwaInstallTracker>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default PWA install tracker
 */
export const Default: Story = {
  render: () => (
    <div className="p-8 border rounded-lg bg-card max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">PWA Install Tracker Active</h2>
      <p className="text-muted-foreground mb-4">
        The PwaInstallTracker component is listening for PWA events. It tracks:
      </p>
      <ul className="space-y-2 text-sm">
        <li className="flex items-start gap-2">
          <span className="text-primary">•</span>
          <div>
            <strong>pwa_installable:</strong> When browser shows PWA can be installed
          </div>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary">•</span>
          <div>
            <strong>pwa_installed:</strong> When user successfully installs the PWA
          </div>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary">•</span>
          <div>
            <strong>pwa_launched:</strong> When app is opened in standalone mode
          </div>
        </li>
      </ul>
      <PwaInstallTracker />
    </div>
  ),
};

/**
 * How it works
 */
export const HowItWorks: Story = {
  render: () => (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="border rounded-lg bg-card p-6">
        <h2 className="text-2xl font-bold mb-4">How PwaInstallTracker Works</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">1. Service Worker Events</h3>
            <p className="text-sm text-muted-foreground">
              The service worker initialization script (service-worker-init.js) dispatches custom
              DOM events when PWA lifecycle changes occur.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">2. Event Listeners</h3>
            <p className="text-sm text-muted-foreground mb-2">
              PwaInstallTracker sets up event listeners for:
            </p>
            <div className="p-3 bg-muted rounded space-y-1 font-mono text-xs">
              <div>window.addEventListener('pwa-installable', ...)</div>
              <div>window.addEventListener('pwa-installed', ...)</div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">3. Standalone Detection</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Checks if the app is running in standalone mode (launched from home screen):
            </p>
            <div className="p-3 bg-muted rounded font-mono text-xs">
              window.matchMedia('(display-mode: standalone)').matches
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">4. Analytics Tracking</h3>
            <p className="text-sm text-muted-foreground">
              All events are forwarded to the centralized trackEvent() function with platform
              information and timestamps.
            </p>
          </div>
        </div>
      </div>

      <div className="border rounded-lg bg-muted/50 p-6">
        <h3 className="font-semibold mb-2">Event Data Captured</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Platform (navigator.platform)</li>
          <li>• User agent (navigator.userAgent)</li>
          <li>• Timestamp (ISO string)</li>
          <li>• Display mode (standalone/browser)</li>
        </ul>
      </div>

      <PwaInstallTracker />
    </div>
  ),
};

/**
 * In layout context
 */
export const InLayout: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4">
        <h1 className="text-2xl font-bold">App Layout</h1>
        <p className="text-sm text-muted-foreground">PWA Install Tracker included in layout</p>
      </header>

      <main className="container mx-auto p-8">
        <div className="space-y-6">
          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-2">Main Content</h2>
            <p className="text-muted-foreground">
              The PwaInstallTracker is typically included at the root layout level to track PWA
              events across all pages.
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">Installation Status</h3>
            <p className="text-sm text-muted-foreground">
              Check your browser's install prompt (usually in the address bar or menu) to install
              this app as a PWA.
            </p>
          </div>
        </div>
      </main>

      <PwaInstallTracker />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

/**
 * Installation flow visualization
 */
export const InstallationFlow: Story = {
  render: () => (
    <div className="p-8 max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold mb-4">PWA Installation Flow</h2>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              1
            </div>
            <h3 className="font-semibold">PWA Installable</h3>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            Browser detects the app meets PWA requirements and shows install prompt. Tracker fires
            'pwa_installable' event.
          </p>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              2
            </div>
            <h3 className="font-semibold">User Accepts</h3>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            User clicks the install prompt and accepts. Browser begins installation process.
          </p>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              3
            </div>
            <h3 className="font-semibold">PWA Installed</h3>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            Installation completes successfully. Tracker fires 'pwa_installed' event with platform
            and timestamp.
          </p>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              4
            </div>
            <h3 className="font-semibold">Standalone Launch</h3>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            User opens app from home screen in standalone mode. Tracker fires 'pwa_launched' event
            on next visit.
          </p>
        </div>
      </div>

      <PwaInstallTracker />
    </div>
  ),
};

/**
 * Browser support info
 */
export const BrowserSupport: Story = {
  render: () => (
    <div className="p-8 max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold mb-4">Browser Support</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2 text-green-600 dark:text-green-400">
            ✓ Fully Supported
          </h3>
          <ul className="text-sm space-y-1">
            <li>• Chrome (Android & Desktop)</li>
            <li>• Edge (Desktop)</li>
            <li>• Safari (iOS 11.3+)</li>
            <li>• Samsung Internet</li>
          </ul>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2 text-yellow-600 dark:text-yellow-400">
            ⚠ Partial Support
          </h3>
          <ul className="text-sm space-y-1">
            <li>• Firefox (Desktop, limited)</li>
            <li>• Opera (Mobile & Desktop)</li>
            <li>• Brave Browser</li>
          </ul>
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-muted/50">
        <h3 className="font-semibold mb-2">Requirements</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• HTTPS connection (or localhost for development)</li>
          <li>• Valid manifest.json with required fields</li>
          <li>• Service worker registration</li>
          <li>• At least one icon (192x192 and 512x512 recommended)</li>
        </ul>
      </div>

      <PwaInstallTracker />
    </div>
  ),
};

/**
 * Analytics data structure
 */
export const AnalyticsData: Story = {
  render: () => (
    <div className="p-8 max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold mb-4">Analytics Data Structure</h2>

      <div className="space-y-4">
        <div className="border rounded-lg bg-card p-4">
          <h3 className="font-semibold mb-3">pwa_installable Event</h3>
          <div className="p-3 bg-muted rounded font-mono text-xs">
            {`{
  event: "pwa_installable",
  platform: "MacIntel",
  user_agent: "Mozilla/5.0..."
}`}
          </div>
        </div>

        <div className="border rounded-lg bg-card p-4">
          <h3 className="font-semibold mb-3">pwa_installed Event</h3>
          <div className="p-3 bg-muted rounded font-mono text-xs">
            {`{
  event: "pwa_installed",
  platform: "MacIntel",
  timestamp: "2024-01-15T10:30:00.000Z"
}`}
          </div>
        </div>

        <div className="border rounded-lg bg-card p-4">
          <h3 className="font-semibold mb-3">pwa_launched Event</h3>
          <div className="p-3 bg-muted rounded font-mono text-xs">
            {`{
  event: "pwa_launched",
  platform: "MacIntel",
  timestamp: "2024-01-15T10:35:00.000Z"
}`}
          </div>
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          All events are sent to Umami analytics for tracking PWA adoption and usage patterns.
        </p>
      </div>

      <PwaInstallTracker />
    </div>
  ),
};

/**
 * Note about rendering
 */
export const RenderingNote: Story = {
  render: () => (
    <div className="p-8 border rounded-lg bg-card max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">About This Component</h2>
      <div className="space-y-4 text-muted-foreground">
        <p>The PwaInstallTracker component does not render any visible UI elements.</p>
        <p>It uses React useEffect to set up event listeners when mounted:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Listens for PWA lifecycle events from service worker</li>
          <li>Checks for standalone display mode on mount</li>
          <li>Forwards all events to centralized analytics tracking</li>
          <li>Cleans up event listeners when unmounted</li>
        </ul>
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Note:</strong> This component should be included once at the root layout level
            to track PWA events across all pages. Multiple instances will work but are unnecessary.
          </p>
        </div>
      </div>
      <PwaInstallTracker />
    </div>
  ),
};

/**
 * Best practices
 */
export const BestPractices: Story = {
  render: () => (
    <div className="p-8 max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold mb-4">Best Practices</h2>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2 text-green-600 dark:text-green-400">
            ✓ DO: Include in Root Layout
          </h3>
          <div className="p-3 bg-muted rounded font-mono text-xs">
            {`// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PwaInstallTracker />
        {children}
      </body>
    </html>
  );
}`}
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2 text-green-600 dark:text-green-400">
            ✓ DO: Ensure Service Worker is Registered
          </h3>
          <p className="text-sm text-muted-foreground">
            Make sure your app has a properly registered service worker that dispatches the PWA
            events.
          </p>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2 text-red-600 dark:text-red-400">
            ✗ DON'T: Include on Every Page
          </h3>
          <p className="text-sm text-muted-foreground">
            Avoid including PwaInstallTracker on individual pages. One instance at the layout level
            is sufficient.
          </p>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2 text-red-600 dark:text-red-400">
            ✗ DON'T: Expect Immediate Events
          </h3>
          <p className="text-sm text-muted-foreground">
            PWA events are triggered by browser actions and user behavior. Don't expect them to fire
            immediately on component mount.
          </p>
        </div>
      </div>

      <PwaInstallTracker />
    </div>
  ),
};
