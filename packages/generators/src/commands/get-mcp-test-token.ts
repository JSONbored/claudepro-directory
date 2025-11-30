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
  process.env['SUPABASE_URL'] ?? 
  'https://hgtjdifxfapoltfflowc.supabase.co';

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
 * Obtain a Supabase access token for MCP testing by signing in with provided credentials or reusing an existing session, and print the token and usage instructions.
 *
 * Reads `--email` and `--password` from process arguments; if both are provided, attempts to sign in and prints the session token and user info. If no credentials are provided, checks for an existing Supabase session and prints the session token and user info when found.
 *
 * Exits the process with code 1 on sign-in failure, when no session is returned, or when no active session exists.
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

    const session = data.session;
    const user = data.user;

    cliLog.log('\n✅ Signed in successfully!');
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

  cliLog.log('\n✅ Found active session!');
  cliLog.log('\n📋 Token Information:');
  cliLog.log('─'.repeat(60));
  cliLog.log('Access Token:');
  cliLog.log(session.access_token);
  cliLog.log('\nUser ID:', session.user.id);
  cliLog.log('User Email:', session.user.email ?? 'N/A');
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

getToken().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error : String(error);
  cliLog.error('❌ Unexpected error:', errorMessage);
  process.exit(1);
});