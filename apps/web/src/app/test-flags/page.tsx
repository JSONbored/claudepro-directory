// Feature flags are server/middleware only - this test page should use server actions

import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { checkTestFlag } from '@heyclaude/web-runtime/data';

/**
 * Feature Flag Test Page
 * Visit /test-flags to verify Statsig integration
 */
export default async function TestFlagsPage() {
  // Feature flags are server/middleware only - check via server action
  let testEnabled = false;
  try {
    const result = await checkTestFlag({});
    testEnabled = result?.data ?? false;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to check test flag');
    logger.error('TestFlagsPage: checkTestFlag failed', normalized);
    // Keep default false on error
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-bold text-3xl">Feature Flag Test</h1>

        <div className="rounded-lg border p-6">
          <div className="mb-4">
            <p className="mb-2 text-lg">
              Test flag status:{' '}
              {testEnabled ? (
                <span className="font-bold text-green-600">✅ ENABLED</span>
              ) : (
                <span className="font-bold text-gray-500">❌ DISABLED</span>
              )}
            </p>
          </div>

          {testEnabled ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="mb-2 font-semibold text-green-800">🎉 Feature flags are working!</p>
              <p className="text-green-600 text-sm">
                Statsig → Vercel Edge Config → Next.js integration is live and working perfectly.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 text-gray-700 text-sm">
                Flag is currently disabled. To enable it:
              </p>
              <ol className="ml-4 list-decimal space-y-1 text-gray-600 text-sm">
                <li>Go to Statsig Console (console.statsig.com)</li>
                <li>Navigate to Gates</li>
                <li>Find or create gate named: test_flag</li>
                <li>Toggle it to "Pass 100%"</li>
                <li>Save and wait ~10 seconds</li>
                <li>Refresh this page</li>
              </ol>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-lg border bg-muted/30 p-6">
          <h2 className="mb-4 font-semibold text-lg">Available Feature Flags:</h2>
          <ul className="space-y-2 text-sm">
            <li>✓ test_flag (this page)</li>
            <li>✓ confetti_animations</li>
            <li>✓ referral_program</li>
            <li>✓ recently_viewed_sidebar</li>
            <li>✓ compare_configs</li>
            <li>✓ promoted_configs</li>
            <li>✓ job_alerts</li>
            <li>✓ self_service_checkout</li>
            <li>✓ content_detail_tabs</li>
            <li>✓ interactive_onboarding</li>
            <li>✓ config_playground</li>
            <li>✓ public_api</li>
            <li>✓ enhanced_skeletons</li>
          </ul>
          <p className="mt-4 text-muted-foreground text-xs">
            All flags defined in /src/lib/flags.ts
          </p>
        </div>
      </div>
    </div>
  );
}
