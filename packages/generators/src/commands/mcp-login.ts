/**
 * MCP Login Command
 *
 * Interactive authentication for MCP server.
 * Provides a clean login experience:
 * 1. Email/password (interactive prompts)
 * 2. OAuth browser flow (opens browser, captures token automatically)
 */

import { createClient } from '@supabase/supabase-js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { createServer } from 'http';
import { homedir } from 'os';
import { join, resolve } from 'path';
import * as readline from 'readline';
import { parse } from 'url';
import { logger } from '../toolkit/logger.js';
import { getTokenFilePath, loadToken, type TokenData } from '../toolkit/mcp-token.js';

const CONFIG_DIR = join(homedir(), '.heyclaude-mcp');
const TOKEN_FILE = getTokenFilePath();

/**
 * Load environment variables from .env.local if it exists
 */
function loadEnvFile(): void {
  const envPath = resolve(process.cwd(), '.env.local');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          // Remove quotes if present
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }
}

// Load .env.local if it exists
loadEnvFile();

const SUPABASE_URL =
  process.env['NEXT_PUBLIC_SUPABASE_URL'] ||
  process.env['SUPABASE_URL'] ||
  'https://hgtjdifxfapoltfflowc.supabase.co';

const SUPABASE_ANON_KEY =
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || process.env['SUPABASE_ANON_KEY'] || '';

if (!SUPABASE_ANON_KEY) {
  throw new Error(
    'SUPABASE_ANON_KEY not found in environment variables. Set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY'
  );
}

/**
 * Save token to disk
 */
function saveToken(
  session: { access_token: string; refresh_token: string; expires_at: number },
  user: { id: string; email?: string }
): void {
  try {
    mkdirSync(CONFIG_DIR, { recursive: true });

    const tokenData: TokenData = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user_id: user.id,
      user_email: user.email || '',
      saved_at: new Date().toISOString(),
    };

    writeFileSync(TOKEN_FILE, JSON.stringify(tokenData, null, 2), 'utf-8');
    logger.info(`Token saved to: ${TOKEN_FILE}`);
  } catch (error) {
    logger.error('Failed to save token', error as Error);
    throw error;
  }
}

/**
 * Prompt for user input
 */
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Email/password login (interactive)
 */
async function loginWithPassword(): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log('🔐 Email/Password Login');
  console.log('─'.repeat(60));

  const email = await prompt('Email: ');
  const password = await prompt('Password: ');

  if (!(email && password)) {
    throw new Error('Email and password are required');
  }

  logger.info('Signing in...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim(),
  });

  if (error || !data.session) {
    throw new Error(error?.message || 'No session returned');
  }

  if (!data.session.expires_at) {
    throw new Error('Session missing expires_at');
  }

  saveToken(
    {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
    data.user
  );
  displaySuccess(
    {
      access_token: data.session.access_token,
      expires_at: data.session.expires_at,
    },
    data.user
  );
}

/**
 * OAuth browser login flow
 */
async function loginWithOAuth(): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: true,
    },
  });

  const PORT = 48421;
  const callbackUrl = `http://localhost:${PORT}/callback`;

  console.log('🚀 Starting OAuth login flow...');
  console.log(`   Callback URL: ${callbackUrl}`);
  console.log('   Opening browser...\n');

  // Create promise to wait for callback
  const callbackPromise = new Promise<{ code: string }>((resolve, reject) => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url || '', true);

      if (parsedUrl.pathname === '/callback') {
        const code = parsedUrl.query['code'] as string;
        const error = parsedUrl.query['error'] as string | undefined;

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 2rem; text-align: center;">
                <h1>❌ Authentication Failed</h1>
                <p>${error}</p>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
          reject(new Error(`OAuth error: ${error}`));
          server.close();
          return;
        }

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 2rem; text-align: center;">
                <h1>✅ Authentication Successful!</h1>
                <p>You can close this window and return to the terminal.</p>
                <script>setTimeout(() => window.close(), 2000);</script>
              </body>
            </html>
          `);
          resolve({ code });
          server.close();
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 2rem; text-align: center;">
                <h1>❌ No authorization code received</h1>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
          reject(new Error('No authorization code in callback'));
          server.close();
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      }
    });

    server.listen(PORT, () => {
      logger.info(`Local server listening on port ${PORT}`);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        reject(
          new Error(
            `Port ${PORT} is already in use. Please close any other applications using this port.`
          )
        );
      } else {
        reject(error);
      }
    });

    // Timeout after 5 minutes
    setTimeout(
      () => {
        server.close();
        reject(new Error('Login timeout - no response received'));
      },
      5 * 60 * 1000
    );
  });

  try {
    // Use web app's login page with special callback parameter
    const webAppUrl = process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000';
    const loginUrl = `${webAppUrl}/auth/signin?redirect=${encodeURIComponent(callbackUrl)}&mcp_login=true`;

    // Open browser
    const { default: open } = await import('open');
    await open(loginUrl);

    console.log('   Browser opened! Please complete the login in your browser.');
    console.log('   Waiting for callback...\n');

    // Wait for callback
    const { code } = await callbackPromise;

    // Exchange code for session
    logger.info('Exchanging authorization code for session...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
      throw new Error(error?.message || 'Failed to exchange code for session');
    }

    if (!data.session.expires_at) {
      throw new Error('Session missing expires_at');
    }

    saveToken(
      {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
      data.user
    );
    displaySuccess(
      {
        access_token: data.session.access_token,
        expires_at: data.session.expires_at,
      },
      data.user
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('Login timeout. Please try again.');
      }
      if (error.message.includes('EADDRINUSE')) {
        throw new Error('Port is already in use. Please close other applications.');
      }
    }
    throw error;
  }
}

/**
 * Display success message
 */
function displaySuccess(
  session: { access_token: string; expires_at: number },
  user: { id: string; email?: string }
): void {
  console.log('\n✅ Login successful!');
  console.log('\n📋 Token Information:');
  console.log('─'.repeat(60));
  console.log('User ID:', user.id);
  console.log('User Email:', user.email || 'N/A');
  console.log('Token Expires:', new Date(session.expires_at * 1000).toISOString());
  console.log('─'.repeat(60));
  console.log(`\n💾 Token saved to: ${TOKEN_FILE}`);
  console.log('\n💡 The token will be automatically used by MCP tools.');
  console.log('   You can also set it manually:');
  console.log(`   export MCP_TOKEN="${session.access_token}"`);
}

/**
 * Main login function
 */
export async function mcpLogin(): Promise<void> {
  // Check for existing valid token
  const existingToken = loadToken();
  if (existingToken) {
    console.log('✅ Found valid saved token!');
    console.log(`   User: ${existingToken.user_email || existingToken.user_id}`);
    console.log(`   Expires: ${new Date(existingToken.expires_at * 1000).toISOString()}`);
    console.log(`\n💡 Token location: ${TOKEN_FILE}`);
    console.log(`\n💡 To use this token, set: export MCP_TOKEN="${existingToken.access_token}"`);
    console.log('   Or it will be automatically loaded by MCP tools.');

    const args = process.argv.slice(2);
    if (!args.includes('--force')) {
      return;
    }
    console.log('\n🔄 Forcing new login...\n');
  }

  const args = process.argv.slice(2);
  const useOAuth = args.includes('--oauth');

  if (useOAuth) {
    await loginWithOAuth();
  } else {
    await loginWithPassword();
  }
}
