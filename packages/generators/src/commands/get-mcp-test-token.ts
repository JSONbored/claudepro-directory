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

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env['NEXT_PUBLIC_SUPABASE_URL'] || 
  process.env['SUPABASE_URL'] || 
  'https://hgtjdifxfapoltfflowc.supabase.co';

const SUPABASE_ANON_KEY = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 
  process.env['SUPABASE_ANON_KEY'] || 
  '';

if (!SUPABASE_ANON_KEY) {
  console.error('❌ Error: SUPABASE_ANON_KEY not found in environment variables');
  console.error('   Set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  if (email && password) {
    console.log('🔐 Signing in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Sign in error:', error.message);
      process.exit(1);
    }

    if (!data.session) {
      console.error('❌ No session returned');
      process.exit(1);
    }

    console.log('\n✅ Signed in successfully!');
    console.log('\n📋 Token Information:');
    console.log('─'.repeat(60));
    console.log('Access Token:');
    console.log(data.session.access_token);
    console.log('\nUser ID:', data.user?.id);
    console.log('User Email:', data.user?.email);
    console.log('Token Expires:', new Date(data.session.expires_at! * 1000).toISOString());
    console.log('─'.repeat(60));
    console.log('\n💡 Usage:');
    console.log(`  export MCP_TEST_TOKEN="${data.session.access_token}"`);
    console.log(`  curl -X POST http://localhost:54321/functions/v1/mcp-directory/mcp \\`);
    console.log(`    -H "Authorization: Bearer $MCP_TEST_TOKEN" \\`);
    console.log(`    -H "Content-Type: application/json" \\`);
    console.log(`    -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'`);
    
    return;
  }

  // Otherwise, check for existing session
  console.log('🔍 Checking for existing session...');
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('❌ Error getting session:', error.message);
    console.error('\n💡 Try signing in with:');
    console.error('   tsx packages/generators/src/commands/get-mcp-test-token.ts --email your@email.com --password yourpassword');
    process.exit(1);
  }

  if (!session) {
    console.log('❌ No active session found');
    console.log('\n💡 Sign in with:');
    console.log('   tsx packages/generators/src/commands/get-mcp-test-token.ts --email your@email.com --password yourpassword');
    console.log('\n💡 Or sign in via web app and extract token from browser DevTools');
    process.exit(1);
  }

  console.log('\n✅ Found active session!');
  console.log('\n📋 Token Information:');
  console.log('─'.repeat(60));
  console.log('Access Token:');
  console.log(session.access_token);
  console.log('\nUser ID:', session.user.id);
  console.log('User Email:', session.user.email);
  console.log('Token Expires:', session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A');
  console.log('─'.repeat(60));
  console.log('\n💡 Usage:');
  console.log(`  export MCP_TEST_TOKEN="${session.access_token}"`);
  console.log(`  curl -X POST http://localhost:54321/functions/v1/mcp-directory/mcp \\`);
  console.log(`    -H "Authorization: Bearer $MCP_TEST_TOKEN" \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'`);
}

getToken().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});