/**
 * MCP Token Utility
 *
 * Helper functions for loading and managing MCP authentication tokens.
 * Used by MCP login command and other tools that need authentication.
 */

import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const CONFIG_DIR = path.join(homedir(), '.heyclaude-mcp');
const TOKEN_FILE = path.join(CONFIG_DIR, 'token.json');

export interface TokenData {
  access_token: string;
  expires_at: number;
  refresh_token: string;
  saved_at: string;
  user_email: string;
  user_id: string;
}

/**
 * Load saved token from disk
 */
export function loadToken(): null | TokenData {
  try {
    if (existsSync(TOKEN_FILE)) {
      const data = JSON.parse(readFileSync(TOKEN_FILE, 'utf8')) as TokenData;

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
export function getMcpToken(): null | string {
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
