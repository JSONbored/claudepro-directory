/**
 * Language Detection - Minimal heuristics for filename generation
 * Detects common languages to generate accurate file extensions (e.g., .json, .ts, .py)
 */

import { isValidJSON } from '@/src/lib/utils/data.utils';

export async function detectLanguage(code: string, hint?: string): Promise<string> {
  if (hint && hint !== 'text') {
    return hint;
  }

  const trimmed = code.trim();

  if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && isValidJSON(code)) {
    return 'json';
  }

  if (trimmed.startsWith('#!') || /^(npm|npx|yarn|pnpm|cd|git|curl)\s/.test(trimmed)) {
    return 'bash';
  }

  if (
    /:\s*(string|number|boolean|any|unknown|void|Promise|Array|Record)\b/.test(code) ||
    /interface\s+\w+\s*\{/.test(code) ||
    /type\s+\w+\s*=/.test(code)
  ) {
    return 'typescript';
  }

  if (/^(import|export|const|let|var|async|function)\s/.test(trimmed)) {
    return 'javascript';
  }

  if (/^(def|class|async def|from .+ import)\s/.test(trimmed)) {
    return 'python';
  }

  if (/^[\w-]+:\s+.+$/m.test(code) && !code.includes('{')) {
    return 'yaml';
  }

  return 'text';
}
