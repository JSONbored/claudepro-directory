import { createUtilityContext } from '../logging.ts';
import { errorToString } from '../error-handling.ts';
import { logger } from '../logger/index.ts';

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
    const errorObj = error instanceof Error ? error : new Error(errorToString(error));
    logger.error({ ...logContext, err: errorObj }, 'Svix signature verification error');
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
    const errorObj = error instanceof Error ? error : new Error(errorToString(error));
    logger.error({ ...logContext, err: errorObj }, 'Supabase database webhook verification error');
    return false;
  }
}

export interface DiscordWebhookVerificationInput {
  rawBody: string;
  signature: string;
  timestamp: string;
  publicKey: string;
}

/**
 * Verify Discord webhook signature using Ed25519
 * Discord uses Ed25519 signatures with X-Signature-Ed25519 and X-Signature-Timestamp headers
 * The signature is computed over: timestamp + rawBody
 * 
 * @param input - Verification parameters
 * @returns true if signature is valid, false otherwise
 */
export async function verifyDiscordWebhookSignature({
  rawBody,
  signature,
  timestamp,
  publicKey,
}: DiscordWebhookVerificationInput): Promise<boolean> {
  if (!signature || !timestamp || !publicKey) {
    return false;
  }

  try {
    // Decode the hex-encoded signature (Discord sends signatures as hex strings)
    const signatureBytes = hexToBytes(signature);
    if (signatureBytes.length !== 64) {
      // Ed25519 signatures are exactly 64 bytes
      return false;
    }

    // Decode the public key (Discord public keys are hex-encoded)
    const publicKeyBytes = hexToBytes(publicKey);
    if (publicKeyBytes.length !== 32) {
      // Ed25519 public keys are exactly 32 bytes
      return false;
    }

    // Build the signed message: timestamp + rawBody
    const encoder = new TextEncoder();
    const signedMessage = encoder.encode(timestamp + rawBody);

    // Import the public key for Ed25519 verification
    // Type assertion needed: Uint8Array is compatible with BufferSource for Web Crypto API
    const key = await crypto.subtle.importKey(
      'raw',
      publicKeyBytes as BufferSource,
      {
        name: 'Ed25519',
      },
      false,
      ['verify']
    );

    // Verify the signature
    // Type assertion needed: Uint8Array is compatible with BufferSource for Web Crypto API
    const isValid = await crypto.subtle.verify(
      'Ed25519',
      key,
      signatureBytes as BufferSource,
      signedMessage
    );

    return isValid;
  } catch (error) {
    const logContext = createUtilityContext('webhook-crypto', 'verify-discord-webhook-signature');
    const errorObj = error instanceof Error ? error : new Error(errorToString(error));
    logger.error({ ...logContext, err: errorObj }, 'Discord webhook signature verification error');
    return false;
  }
}

/**
 * Convert a hex string to Uint8Array
 * Matches Discord's expected format (hex-encoded strings)
 */
function hexToBytes(hex: string): Uint8Array {
  // Remove any whitespace or 0x prefix
  const cleanHex = hex.replace(/^0x/i, '').replace(/\s/g, '');
  
  // Validate hex string format
  if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
    throw new Error('Invalid hex string: contains non-hexadecimal characters');
  }
  
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Invalid hex string: odd length');
  }

  // Match Discord's pattern: split into pairs and parse
  const matches = cleanHex.match(/.{1,2}/g);
  if (!matches) {
    throw new Error('Invalid hex string: failed to parse');
  }

  return new Uint8Array(matches.map((val) => Number.parseInt(val, 16)));
}
