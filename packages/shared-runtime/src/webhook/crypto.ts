import { createUtilityContext } from '../logging.ts';
import { errorToString } from '../error-handling.ts';

type GlobalWithBuffer = typeof globalThis & {
  Buffer?: {
    from(input: string | Uint8Array, encoding?: string): {
      toString(encoding?: string): string;
      length: number;
      [index: number]: number;
    };
  };
};

const nodeBuffer = (globalThis as GlobalWithBuffer).Buffer;

function decodeBase64(value: string): Uint8Array {
  if (typeof globalThis.atob === 'function') {
    const binary = globalThis.atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  if (nodeBuffer) {
    const buffer = nodeBuffer.from(value, 'base64');
    return Uint8Array.from(buffer as ArrayLike<number>);
  }

  throw new Error('Base64 decoding is not supported in this environment');
}

function encodeBase64(bytes: Uint8Array): string {
  if (typeof globalThis.btoa === 'function') {
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return globalThis.btoa(binary);
  }

  if (nodeBuffer) {
    const buffer = nodeBuffer.from(bytes);
    return buffer.toString('base64');
  }

  throw new Error('Base64 encoding is not supported in this environment');
}

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
      secretBytes = decodeBase64(base64Secret);
    } else {
      const encoder = new TextEncoder();
      secretBytes = encoder.encode(secret);
    }

    // Type assertion needed for Web Crypto API - 'raw' format is valid but TypeScript may not infer correctly
    const key = await crypto.subtle.importKey(
      'raw' as const,
      secretBytes as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const encoder = new TextEncoder();
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedContent));
    const expectedSignature = encodeBase64(new Uint8Array(signatureBuffer));

    return signatures.some((sig) => sig === expectedSignature);
  } catch (error) {
    const logContext = createUtilityContext('webhook-crypto', 'verify-svix-signature');
    console.error('Svix signature verification error', {
      ...logContext,
      error: errorToString(error),
    });
    return false;
  }
}

export interface SupabaseDatabaseWebhookVerificationInput {
  rawBody: string;
  signature: string | null;
  timestamp?: string | null;
  secret: string;
}

/**
 * Verify Supabase database webhook signature using HMAC-SHA256
 * Supports both simple payload signing and timestamp-based signing for replay attack prevention
 * 
 * @param input - Verification parameters
 * @returns true if signature is valid, false otherwise
 */
export async function verifySupabaseDatabaseWebhook({
  rawBody,
  signature,
  timestamp,
  secret,
}: SupabaseDatabaseWebhookVerificationInput): Promise<boolean> {
  if (!signature) {
    return false;
  }

  try {
    // Prepare secret bytes
    const encoder = new TextEncoder();
    const secretBytes = encoder.encode(secret);

    // Create HMAC key
    const key = await crypto.subtle.importKey(
      'raw' as const,
      secretBytes as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Build signed content - include timestamp if provided for replay attack prevention
    const signedContent = timestamp ? `${timestamp}.${rawBody}` : rawBody;

    // Compute expected signature
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedContent)
    );
    const expectedSignature = encodeBase64(new Uint8Array(signatureBuffer));

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }

    return result === 0;
  } catch (error) {
    const logContext = createUtilityContext('webhook-crypto', 'verify-supabase-database-webhook');
    console.error('Supabase database webhook verification error', {
      ...logContext,
      error: errorToString(error),
    });
    return false;
  }
}
