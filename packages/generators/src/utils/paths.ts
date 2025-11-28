import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const PACKAGE_ROOT = resolve(__dirname, '..', '..');
export const REPO_ROOT = resolve(PACKAGE_ROOT, '..', '..');

export function resolveRepoPath(...segments: string[]): string {
  return resolve(REPO_ROOT, ...segments);
}

export function resolvePackagePath(...segments: string[]): string {
  return resolve(PACKAGE_ROOT, ...segments);
}
