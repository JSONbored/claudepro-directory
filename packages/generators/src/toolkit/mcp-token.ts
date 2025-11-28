/**
 * MCP Token Utility
 *
 * Helper functions for loading and managing MCP authentication tokens.
 * Used by MCP login command and other tools that need authentication.
 */

import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_DIR = join(homedir(), '.heyclaude-mcp');
const TOKEN_FILE = join(CONFIG_DIR, 'token.json');

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
  user_email: string;
  saved_at: string;
}

/**
 * Load saved token from disk
 */
export function loadToken(): TokenData | null {
  try {
    if (existsSync(TOKEN_FILE)) {
      const data = JSON.parse(readFileSync(TOKEN_FILE, 'utf-8')) as TokenData;

      // Check if token is expired (with 5 minute buffer)
      const expiresAt = data.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      const buffer = 5 * 60 * 1000; // 5 minutes

      if (now < expiresAt - buffer) {
        return data;
      }
    }
  } catch {
    // File doesn't exist or invalid JSON
  }
  return null;
}

/**
 * Get token string (for use in scripts)
 * Checks environment variable first, then saved token file
 */
export function getMcpToken(): string | null {
  // Check environment variable first
  if (process.env['MCP_TOKEN']) {
    return process.env['MCP_TOKEN'];
  }

  // Check saved token
  const tokenData = loadToken();
  if (tokenData) {
    return tokenData.access_token;
  }

  return null;
}

/**
 * Get token file path (for display purposes)
 */
export function getTokenFilePath(): string {
  return TOKEN_FILE;
}
