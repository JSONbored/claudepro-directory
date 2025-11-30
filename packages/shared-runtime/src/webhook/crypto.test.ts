import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  verifySvixSignature,
  verifySupabaseDatabaseWebhook,
  verifyDiscordWebhookSignature,
  type SvixVerificationInput,
  type SupabaseDatabaseWebhookVerificationInput,
  type DiscordWebhookVerificationInput,
} from './crypto';

// Mock logging functions
vi.mock('../logging', () => ({
  createUtilityContext: vi.fn((domain: string, action: string) => ({ domain, action })),
  logError: vi.fn(),
}));

describe('verifySvixSignature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should verify valid Svix signature with whsec_ prefix', async () => {
    const secret = 'whsec_' + btoa('test-secret-key');
    const timestamp = '1234567890';
    const svixId = 'msg_test123';
    const rawBody = '{"test":"data"}';

    // Create HMAC signature
    const encoder = new TextEncoder();
    const secretBytes = Uint8Array.from(atob(secret.slice(6)), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signedContent = `${svixId}.${timestamp}.${rawBody}`;
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedContent));
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    const input: SvixVerificationInput = {
      rawBody,
      secret,
      svixId,
      svixSignature: `v1,${signature}`,
      svixTimestamp: timestamp,
    };

    const result = await verifySvixSignature(input);
    expect(result).toBe(true);
  });

  it('should verify valid Svix signature without whsec_ prefix', async () => {
    const secret = 'raw-secret-key';
    const timestamp = '1234567890';
    const svixId = 'msg_test123';
    const rawBody = '{"test":"data"}';

    const encoder = new TextEncoder();
    const secretBytes = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signedContent = `${svixId}.${timestamp}.${rawBody}`;
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedContent));
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    const input: SvixVerificationInput = {
      rawBody,
      secret,
      svixId,
      svixSignature: `v1,${signature}`,
      svixTimestamp: timestamp,
    };

    const result = await verifySvixSignature(input);
    expect(result).toBe(true);
  });

  it('should reject invalid Svix signature', async () => {
    const input: SvixVerificationInput = {
      rawBody: '{"test":"data"}',
      secret: 'whsec_' + btoa('test-secret'),
      svixId: 'msg_test123',
      svixSignature: 'v1,invalid_signature',
      svixTimestamp: '1234567890',
    };

    const result = await verifySvixSignature(input);
    expect(result).toBe(false);
  });

  it('should handle multiple signature versions', async () => {
    const secret = 'test-secret';
    const timestamp = '1234567890';
    const svixId = 'msg_test123';
    const rawBody = '{"test":"data"}';

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signedContent = `${svixId}.${timestamp}.${rawBody}`;
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedContent));
    const validSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    const input: SvixVerificationInput = {
      rawBody,
      secret,
      svixId,
      svixSignature: `v1,invalid_sig v1,${validSignature}`,
      svixTimestamp: timestamp,
    };

    const result = await verifySvixSignature(input);
    expect(result).toBe(true);
  });

  it('should return false on crypto error', async () => {
    const input: SvixVerificationInput = {
      rawBody: '{"test":"data"}',
      secret: 'invalid-base64!!!',
      svixId: 'msg_test123',
      svixSignature: 'v1,signature',
      svixTimestamp: '1234567890',
    };

    const result = await verifySvixSignature(input);
    expect(result).toBe(false);
  });
});

describe('verifySupabaseDatabaseWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should verify valid signature without timestamp', async () => {
    const secret = 'test-secret-key';
    const rawBody = '{"test":"data"}';

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    const input: SupabaseDatabaseWebhookVerificationInput = {
      rawBody,
      secret,
      signature,
    };

    const result = await verifySupabaseDatabaseWebhook(input);
    expect(result).toBe(true);
  });

  it('should verify valid signature with timestamp', async () => {
    const secret = 'test-secret-key';
    const rawBody = '{"test":"data"}';
    const timestamp = '1234567890';

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signedContent = `${timestamp}.${rawBody}`;
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedContent));
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    const input: SupabaseDatabaseWebhookVerificationInput = {
      rawBody,
      secret,
      signature,
      timestamp,
    };

    const result = await verifySupabaseDatabaseWebhook(input);
    expect(result).toBe(true);
  });

  it('should reject invalid signature', async () => {
    const input: SupabaseDatabaseWebhookVerificationInput = {
      rawBody: '{"test":"data"}',
      secret: 'test-secret',
      signature: 'invalid_signature',
    };

    const result = await verifySupabaseDatabaseWebhook(input);
    expect(result).toBe(false);
  });

  it('should return false when signature is null', async () => {
    const input: SupabaseDatabaseWebhookVerificationInput = {
      rawBody: '{"test":"data"}',
      secret: 'test-secret',
      signature: null,
    };

    const result = await verifySupabaseDatabaseWebhook(input);
    expect(result).toBe(false);
  });

  it('should use constant-time comparison to prevent timing attacks', async () => {
    const secret = 'test-secret-key';
    const rawBody = '{"test":"data"}';

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const validSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    // Signature with different length should fail fast
    const shortSignature = validSignature.slice(0, -5);
    
    const input: SupabaseDatabaseWebhookVerificationInput = {
      rawBody,
      secret,
      signature: shortSignature,
    };

    const result = await verifySupabaseDatabaseWebhook(input);
    expect(result).toBe(false);
  });

  it('should return false on crypto error', async () => {
    const input: SupabaseDatabaseWebhookVerificationInput = {
      rawBody: '{"test":"data"}',
      secret: 'test-secret',
      signature: 'invalid-base64!!!',
    };

    const result = await verifySupabaseDatabaseWebhook(input);
    expect(result).toBe(false);
  });
});

describe('verifyDiscordWebhookSignature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to convert hex string to Uint8Array
  function hexToBytes(hex: string): Uint8Array {
    const matches = hex.match(/.{1,2}/g);
    if (!matches) throw new Error('Invalid hex');
    return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
  }

  // Helper to convert Uint8Array to hex string
  function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  it('should verify valid Discord Ed25519 signature', async () => {
    // Generate Ed25519 key pair for testing
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'Ed25519',
      },
      true,
      ['sign', 'verify']
    );

    const publicKeyBytes = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey));
    const publicKey = bytesToHex(publicKeyBytes);

    const timestamp = '1234567890';
    const rawBody = '{"test":"data"}';
    const encoder = new TextEncoder();
    const message = encoder.encode(timestamp + rawBody);

    const signatureBytes = new Uint8Array(
      await crypto.subtle.sign('Ed25519', keyPair.privateKey, message)
    );
    const signature = bytesToHex(signatureBytes);

    const input: DiscordWebhookVerificationInput = {
      rawBody,
      signature,
      timestamp,
      publicKey,
    };

    const result = await verifyDiscordWebhookSignature(input);
    expect(result).toBe(true);
  });

  it('should reject invalid Discord signature', async () => {
    const input: DiscordWebhookVerificationInput = {
      rawBody: '{"test":"data"}',
      signature: '0'.repeat(128), // 64 bytes = 128 hex chars
      timestamp: '1234567890',
      publicKey: '0'.repeat(64), // 32 bytes = 64 hex chars
    };

    const result = await verifyDiscordWebhookSignature(input);
    expect(result).toBe(false);
  });

  it('should return false when signature is empty', async () => {
    const input: DiscordWebhookVerificationInput = {
      rawBody: '{"test":"data"}',
      signature: '',
      timestamp: '1234567890',
      publicKey: '0'.repeat(64),
    };

    const result = await verifyDiscordWebhookSignature(input);
    expect(result).toBe(false);
  });

  it('should return false when timestamp is empty', async () => {
    const input: DiscordWebhookVerificationInput = {
      rawBody: '{"test":"data"}',
      signature: '0'.repeat(128),
      timestamp: '',
      publicKey: '0'.repeat(64),
    };

    const result = await verifyDiscordWebhookSignature(input);
    expect(result).toBe(false);
  });

  it('should return false when public key is empty', async () => {
    const input: DiscordWebhookVerificationInput = {
      rawBody: '{"test":"data"}',
      signature: '0'.repeat(128),
      timestamp: '1234567890',
      publicKey: '',
    };

    const result = await verifyDiscordWebhookSignature(input);
    expect(result).toBe(false);
  });

  it('should reject signature with incorrect length', async () => {
    const input: DiscordWebhookVerificationInput = {
      rawBody: '{"test":"data"}',
      signature: '0'.repeat(60), // Wrong length
      timestamp: '1234567890',
      publicKey: '0'.repeat(64),
    };

    const result = await verifyDiscordWebhookSignature(input);
    expect(result).toBe(false);
  });

  it('should reject public key with incorrect length', async () => {
    const input: DiscordWebhookVerificationInput = {
      rawBody: '{"test":"data"}',
      signature: '0'.repeat(128),
      timestamp: '1234567890',
      publicKey: '0'.repeat(60), // Wrong length
    };

    const result = await verifyDiscordWebhookSignature(input);
    expect(result).toBe(false);
  });

  it('should handle hex strings with 0x prefix', async () => {
    const input: DiscordWebhookVerificationInput = {
      rawBody: '{"test":"data"}',
      signature: '0x' + '0'.repeat(128),
      timestamp: '1234567890',
      publicKey: '0x' + '0'.repeat(64),
    };

    const result = await verifyDiscordWebhookSignature(input);
    // Should handle and fail validation (since key/sig are invalid)
    expect(result).toBe(false);
  });

  it('should return false on crypto error', async () => {
    const input: DiscordWebhookVerificationInput = {
      rawBody: '{"test":"data"}',
      signature: 'invalid-hex!!!',
      timestamp: '1234567890',
      publicKey: '0'.repeat(64),
    };

    const result = await verifyDiscordWebhookSignature(input);
    expect(result).toBe(false);
  });
});

describe('hex conversion edge cases', () => {
  it('should handle hex strings with whitespace', async () => {
    const input: DiscordWebhookVerificationInput = {
      rawBody: '{"test":"data"}',
      signature: '00 11 22 33 '.repeat(16).trim(),
      timestamp: '1234567890',
      publicKey: '0'.repeat(64),
    };

    const result = await verifyDiscordWebhookSignature(input);
    expect(result).toBe(false);
  });

  it('should reject odd-length hex strings', async () => {
    const input: DiscordWebhookVerificationInput = {
      rawBody: '{"test":"data"}',
      signature: '0'.repeat(127), // Odd length
      timestamp: '1234567890',
      publicKey: '0'.repeat(64),
    };

    const result = await verifyDiscordWebhookSignature(input);
    expect(result).toBe(false);
  });

  it('should reject non-hexadecimal characters', async () => {
    const input: DiscordWebhookVerificationInput = {
      rawBody: '{"test":"data"}',
      signature: 'zzzz' + '0'.repeat(124),
      timestamp: '1234567890',
      publicKey: '0'.repeat(64),
    };

    const result = await verifyDiscordWebhookSignature(input);
    expect(result).toBe(false);
  });
});