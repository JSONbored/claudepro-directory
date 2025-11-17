/**
 * Auth hook webhook verification utility
 * Handles webhook signature verification for OAuth signup webhooks
 */

import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { badRequestResponse, publicCorsHeaders } from '../http.ts';
import { MAX_BODY_SIZE, validateBodySize } from '../input-validation.ts';

/**
 * Verified auth hook payload structure
 */
export interface VerifiedAuthHookPayload {
  user: {
    id: string;
    email: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email';
    site_url: string;
    token_new: string;
    token_hash_new: string;
  };
}

/**
 * Verify auth hook webhook signature and extract user data and email metadata
 */
export async function verifyAuthHookWebhook(
  req: Request,
  hookSecret: string
): Promise<VerifiedAuthHookPayload | Response> {
  // Validate body size for webhook payload
  const contentLength = req.headers.get('content-length');
  const bodySizeValidation = validateBodySize(contentLength, MAX_BODY_SIZE.webhook);
  if (!bodySizeValidation.valid) {
    return badRequestResponse(
      bodySizeValidation.error ?? 'Request body too large',
      publicCorsHeaders
    );
  }

  const payloadText = await req.text();

  // Double-check size after reading
  if (payloadText.length > MAX_BODY_SIZE.webhook) {
    return badRequestResponse(
      `Request body too large (max ${MAX_BODY_SIZE.webhook} bytes)`,
      publicCorsHeaders
    );
  }

  const headers = Object.fromEntries(req.headers);
  const wh = new Webhook(hookSecret);

  try {
    const verified = wh.verify(payloadText, headers) as VerifiedAuthHookPayload;
    return verified;
  } catch {
    return badRequestResponse('Invalid webhook signature');
  }
}
