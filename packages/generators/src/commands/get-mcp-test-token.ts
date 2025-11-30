#!/usr/bin/env tsx
/**
 * Get JWT Token for MCP Server Testing
 * 
 * This script helps you get a JWT token for testing the authenticated MCP server.
 * 
 * Usage:
 *   tsx packages/generators/src/commands/get-mcp-test-token.ts
 * 
 * Or with email/password:
 *   tsx packages/generators/src/commands/get-mcp-test-token.ts --email your@email.com --password yourpassword
 * 
 * Note: For a better experience, use `pnpm exec heyclaude-mcp-login` instead.
 */

import { type Database } from '@heyclaude/database-types';
import { createClient } from '@supabase/supabase-js';

// Simple CLI logger for this script (not using Pino since it doesn't have .log())
const cliLog = {
  log: (...args: unknown[]) => console.log(...args),
  error: (...args: unknown[]) => console.error(...args),
};

const SUPABASE_URL = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? 
  process.env['SUPABASE_URL'];

if (!SUPABASE_URL) {
  cliLog.error('❌ Error: SUPABASE_URL not found in environment variables');
  cliLog.error('   Set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  process.exit(1);
}

const SUPABASE_ANON_KEY = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? 
  process.env['SUPABASE_ANON_KEY'] ?? 
  '';

if (!SUPABASE_ANON_KEY) {
  cliLog.error('❌ Error: SUPABASE_ANON_KEY not found in environment variables');
  cliLog.error('   Set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Print token information and usage instructions.
 */
function printTokenInfo(
  session: { access_token: string; expires_at: number | null | undefined },
  user: { id: string; email?: string | null }
): void {
  cliLog.log('\n✅ Success!');
  cliLog.log('\n📋 Token Information:');
  cliLog.log('─'.repeat(60));
  cliLog.log('Access Token:');
  cliLog.log(session.access_token);
  cliLog.log('\nUser ID:', user.id);
  cliLog.log('User Email:', user.email ?? 'N/A');
  if (session.expires_at === null || session.expires_at === undefined) {
    cliLog.log('Token Expires: N/A');
  } else {
    cliLog.log('Token Expires:', new Date(session.expires_at * 1000).toISOString());
  }
  cliLog.log('─'.repeat(60));
  cliLog.log('\n💡 Usage:');
  cliLog.log(`  export MCP_TEST_TOKEN="${session.access_token}"`);
  cliLog.log(`  curl -X POST http://localhost:54321/functions/v1/mcp-directory/mcp \\`);
  cliLog.log(`    -H "Authorization: Bearer $MCP_TEST_TOKEN" \\`);
  cliLog.log(`    -H "Content-Type: application/json" \\`);
  cliLog.log(`    -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'`);
}

/**
 * Obtain a Supabase access token for MCP testing by signing in with provided credentials or reusing an existing session, and print the token and usage instructions.
 *
 * If the CLI is invoked with `--email <email>` and `--password <password>`, the function attempts to sign in with those credentials and prints the session token, user information, token expiry (ISO timestamp or `N/A`), and example export/curl usage. If credentials are not provided, the function checks for an active Supabase session and, when found, prints the same token information and usage instructions.
 *
 * Side effects:
 * - Writes informational and error messages to the console (stdout/stderr) via `cliLog`.
 * - Calls `process.exit(1)` on sign-in failure, when session retrieval fails, or when no active session exists.
 *
 * @param --email - The email address provided as a command-line argument (e.g., `--email you@example.com`).
 * @param --password - The password provided as a command-line argument (e.g., `--password yourpassword`).
 * @returns Promise<void> indicating completion after printing token information or exiting the process on error.
 *
 * @example
 * # Sign in with credentials and print token
 * tsx packages/generators/src/commands/get-mcp-test-token.ts --email you@example.com --password yourpassword
 *
 * @example
 * # Use an existing session (no args)
 * tsx packages/generators/src/commands/get-mcp-test-token.ts
 */
async function getToken() {
  const args = process.argv.slice(2);
  const emailIndex = args.indexOf('--email');
  const passwordIndex = args.indexOf('--password');
  
  let email: string | undefined;
  let password: string | undefined;
  
  if (emailIndex !== -1 && args[emailIndex + 1]) {
    email = args[emailIndex + 1];
  }
  
  if (passwordIndex !== -1 && args[passwordIndex + 1]) {
    password = args[passwordIndex + 1];
  }

  // If email/password provided, sign in
  if (email !== undefined && password !== undefined) {
    cliLog.log('🔐 Signing in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error !== null) {
      cliLog.error('❌ Sign in error:', error.message);
      process.exit(1);
    }

    printTokenInfo(data.session, data.user);
    return;
  }

  // Otherwise, check for existing session
  cliLog.log('🔍 Checking for existing session...');
  const { data, error } = await supabase.auth.getSession();

  if (error !== null) {
    cliLog.error('❌ Error getting session:', error.message);
    cliLog.error('\n💡 Try signing in with:');
    cliLog.error('   tsx packages/generators/src/commands/get-mcp-test-token.ts --email your@email.com --password yourpassword');
    process.exit(1);
  }

  const session = data.session;
  if (session === null) {
    cliLog.log('❌ No active session found');
    cliLog.log('\n💡 Sign in with:');
    cliLog.log('   tsx packages/generators/src/commands/get-mcp-test-token.ts --email your@email.com --password yourpassword');
    cliLog.log('\n💡 Or sign in via web app and extract token from browser DevTools');
    process.exit(1);
  }

  printTokenInfo(session, session.user);
}

getToken().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error : String(error);
  cliLog.error('❌ Unexpected error:', errorMessage);
  process.exit(1);
});