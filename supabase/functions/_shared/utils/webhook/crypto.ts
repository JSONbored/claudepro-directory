import { createUtilityContext } from '../logging.ts';

export interface SvixVerificationInput {
  rawBody: string;
  svixId: string;
  svixTimestamp: string;
  svixSignature: string;
  secret: string;
}

/**
 * Verify Svix-compatible signatures (Resend, Polar)
 */
export async function verifySvixSignature({
  rawBody,
  svixId,
  svixTimestamp,
  svixSignature,
  secret,
}: SvixVerificationInput): Promise<boolean> {
  try {
    const signatures = svixSignature.split(' ').map((sig) => sig.split(',')[1]);
    const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;

    let secretBytes: Uint8Array;
    if (secret.startsWith('whsec_')) {
      const base64Secret = secret.substring(6);
      secretBytes = Uint8Array.from(atob(base64Secret), (c) => c.charCodeAt(0));
    } else {
      const encoder = new TextEncoder();
      secretBytes = encoder.encode(secret);
    }

    // Type assertion needed for Deno's Web Crypto API - 'raw' format is valid but TypeScript may not infer correctly
    // The importKey method has overloads that require specific format types, but 'raw' is valid for HMAC
    // Ensure secretBytes is compatible with BufferSource (Uint8Array extends ArrayBufferView which is BufferSource)
    const key = await crypto.subtle.importKey(
      'raw' as const,
      secretBytes as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const encoder = new TextEncoder();
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedContent));
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    return signatures.some((sig) => sig === expectedSignature);
  } catch (error) {
    const logContext = createUtilityContext('webhook-crypto', 'verify-svix-signature');
    console.error('Svix signature verification error', {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
