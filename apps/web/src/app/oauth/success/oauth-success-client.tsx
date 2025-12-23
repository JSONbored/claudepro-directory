'use client';

/**
 * OAuth Success Client Component
 *
 * Client-side component for displaying OAuth authorization success confirmation.
 * Matches Vercel's design with:
 * - Success message
 * - Connected icons visual (MCP ↔ Claude Pro Directory)
 * - Auto-redirect to client's redirect_uri after 2-3 seconds
 * - "You can now close this tab" message
 */

import { CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface OAuthSuccessClientProps {
  redirectUri: string | null;
}

/**
 * Client component for OAuth success screen.
 *
 * Displays success confirmation and auto-redirects to client's redirect_uri.
 *
 * @param redirectUri - The client's redirect URI to redirect to (optional)
 */
export function OAuthSuccessClient({ redirectUri }: OAuthSuccessClientProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!redirectUri) {
      return;
    }

    // Countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Redirect to client's redirect_uri
          globalThis.location.href = redirectUri;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [redirectUri]);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      {/* Success Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-8 w-8 text-green-600" aria-hidden="true" />
      </div>

      {/* Success Message */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-black">Authentication Successful</h1>
        <p className="text-gray-600 text-sm">
          {redirectUri
            ? `Redirecting in ${countdown} second${countdown !== 1 ? 's' : ''}...`
            : 'You have successfully authorized the application.'}
        </p>
      </div>

      {/* Connected Icons Visual (MCP ↔ Claude Pro Directory) */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-300 bg-white p-2">
          <Image
            src="/partners/mcp.svg"
            alt="MCP Client"
            width={32}
            height={32}
            className="h-full w-full object-contain"
            priority
          />
        </div>
        <div className="flex h-0.5 w-12 items-center justify-center bg-green-500">
          <div className="h-2 w-2 rounded-full bg-green-600" />
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-300 bg-white p-2">
          <Image
            src="/assets/icons/claudepro-directory-icon.svg"
            alt="Claude Pro Directory"
            width={32}
            height={32}
            className="h-full w-full object-contain"
            priority
          />
        </div>
      </div>

      {/* Close Tab Message */}
      {redirectUri ? (
        <p className="text-xs text-gray-500">You can now close this tab</p>
      ) : (
        <p className="text-xs text-gray-500">You can now return to the application</p>
      )}

      {/* Terms and Privacy Policy Links */}
      <div className="flex items-center justify-center gap-4 border-t border-gray-200 pt-4 w-full">
        <Link
          className="text-xs text-gray-600 hover:text-black underline transition-colors"
          href="/terms"
        >
          Terms of Service
        </Link>
        <span className="text-gray-400 text-xs">•</span>
        <Link
          className="text-xs text-gray-600 hover:text-black underline transition-colors"
          href="/privacy"
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}

