import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');
export const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');

export function resolveRepoPath(...segments: string[]): string {
  return path.resolve(REPO_ROOT, ...segments);
}

export function resolvePackagePath(...segments: string[]): string {
  return path.resolve(PACKAGE_ROOT, ...segments);
}
