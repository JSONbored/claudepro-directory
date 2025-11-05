/**
 * Resend Webhook Handler - Supabase Edge Function
 * Database-First Architecture: Verify signature + insert to webhook_events table
 * PostgreSQL triggers handle ALL business logic (bounces, complaints, sequences)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, svix-id, svix-timestamp, svix-signature',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Get webhook body and headers
    const body = await req.text();
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response('Missing webhook headers', { status: 400 });
    }

    // Verify webhook signature (Svix standard)
    if (RESEND_WEBHOOK_SECRET) {
      const verified = await verifyWebhookSignature(
        body,
        svixId,
        svixTimestamp,
        svixSignature,
        RESEND_WEBHOOK_SECRET
      );

      if (!verified) {
        console.error('Webhook signature verification failed');
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // Parse webhook payload
    const payload = JSON.parse(body);
    const { type, created_at, data } = payload;

    if (!type || !created_at) {
      return new Response('Invalid webhook payload', { status: 400 });
    }

    // Insert into webhook_events table (triggers will handle business logic)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error } = await supabase.from('webhook_events').insert({
      svix_id: svixId,
      type,
      data,
      created_at,
      processed: false,
    });

    if (error) {
      // Check for duplicate (UNIQUE constraint on svix_id = idempotency)
      if (error.code === '23505') {
        console.log(`Webhook ${svixId} already processed (idempotent)`);
        return new Response('OK (duplicate)', { status: 200 });
      }

      console.error('Failed to insert webhook event:', error);
      return new Response('Internal server error', { status: 500 });
    }

    console.log(`Webhook ${type} inserted: ${svixId}`);
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});

/**
 * Verify Svix webhook signature
 * Based on Svix signature verification standard used by Resend
 */
async function verifyWebhookSignature(
  body: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string
): Promise<boolean> {
  try {
    // Svix signature format: "v1,signature1 v1,signature2"
    const signatures = svixSignature.split(' ').map((sig) => sig.split(',')[1]);

    // Construct signed content (Svix standard)
    const signedContent = `${svixId}.${svixTimestamp}.${body}`;

    // Import secret as key
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Generate signature
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signedContent));
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare with any of the provided signatures (Svix sends multiple for rotation)
    return signatures.some((sig) => sig === expectedSignature);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
