/**
 * GitHub API Client
 * Wrapper around Octokit for automated PR creation
 * 
 * Security:
 * - Uses Fine-Grained PAT (Personal Access Token)
 * - Repository-scoped (only access to claudepro-directory)
 * - Requires: Contents (RW) + Pull Requests (RW)
 */

import { Octokit } from '@octokit/rest';
import { logger } from '@/src/lib/logger';
import { env } from '@/src/lib/env';

/**
 * Repository configuration
 * Hardcoded for security (prevents tampering)
 */
export const REPO_CONFIG = {
  owner: 'JSONbored',
  repo: 'claudepro-directory',
  defaultBranch: 'main',
} as const;

/**
 * Get authenticated Octokit instance
 * Validates token is present before creating client
 */
export function getOctokit(): Octokit {
  const token = env.GITHUB_BOT_TOKEN;

  if (!token) {
    throw new Error(
      'GITHUB_BOT_TOKEN is not configured. Please add it to your environment variables.'
    );
  }

  return new Octokit({
    auth: token,
    userAgent: 'claudepro-directory-bot/1.0.0',
    baseUrl: 'https://api.github.com',
    log: {
      debug: (message) => logger.debug(`GitHub API: ${message}`),
      info: (message) => logger.info(`GitHub API: ${message}`),
      warn: (message) => logger.warn(`GitHub API: ${message}`),
      error: (message) => logger.error(`GitHub API: ${message}`),
    },
  });
}

/**
 * Create a new branch from main
 * 
 * @param branchName - Name of the branch to create
 * @returns Branch reference SHA
 */
export async function createBranch(branchName: string): Promise<string> {
  const octokit = getOctokit();

  try {
    // Get main branch SHA
    const { data: mainBranch } = await octokit.git.getRef({
      ...REPO_CONFIG,
      ref: `heads/${REPO_CONFIG.defaultBranch}`,
    });

    const mainSha = mainBranch.object.sha;

    // Create new branch
    await octokit.git.createRef({
      ...REPO_CONFIG,
      ref: `refs/heads/${branchName}`,
      sha: mainSha,
    });

    logger.info(`Created branch: ${branchName} from ${mainSha}`);
    return mainSha;
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 422) {
      throw new Error(`Branch "${branchName}" already exists. Please try again.`);
    }
    throw error;
  }
}

/**
 * Commit a file to a branch
 * 
 * @param params - Commit parameters
 * @returns Commit SHA
 */
export async function commitFile(params: {
  branch: string;
  path: string;
  content: string;
  message: string;
}): Promise<string> {
  const octokit = getOctokit();

  try {
    // Create/update file
    const { data } = await octokit.repos.createOrUpdateFileContents({
      ...REPO_CONFIG,
      path: params.path,
      message: params.message,
      content: Buffer.from(params.content).toString('base64'),
      branch: params.branch,
    });

    logger.info(`Committed file: ${params.path} to ${params.branch}`);
    return data.commit.sha!;
  } catch (error) {
    logger.error('Failed to commit file', error instanceof Error ? error : new Error(String(error)));
    throw new Error(`Failed to commit file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create a pull request
 * 
 * @param params - PR parameters
 * @returns PR number and URL
 */
export async function createPullRequest(params: {
  title: string;
  body: string;
  head: string;
  labels?: string[];
}): Promise<{ number: number; url: string }> {
  const octokit = getOctokit();

  try {
    // Create PR
    const { data: pr } = await octokit.pulls.create({
      ...REPO_CONFIG,
      title: params.title,
      body: params.body,
      head: params.head,
      base: REPO_CONFIG.defaultBranch,
    });

    // Add labels if provided
    if (params.labels && params.labels.length > 0) {
      await octokit.issues.addLabels({
        ...REPO_CONFIG,
        issue_number: pr.number,
        labels: params.labels,
      });
    }

    logger.info(`Created PR #${pr.number}: ${params.title}`);

    return {
      number: pr.number,
      url: pr.html_url,
    };
  } catch (error) {
    logger.error('Failed to create PR', error instanceof Error ? error : new Error(String(error)));
    throw new Error(`Failed to create PR: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get file contents from repository
 * 
 * @param path - File path in repo
 * @param ref - Branch/tag/commit (defaults to main)
 * @returns File content as string
 */
export async function getFileContents(path: string, ref?: string): Promise<string | null> {
  const octokit = getOctokit();

  try {
    const { data } = await octokit.repos.getContent({
      ...REPO_CONFIG,
      path,
      ref: ref || REPO_CONFIG.defaultBranch,
    });

    // Type guard for file content
    if ('content' in data && typeof data.content === 'string') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }

    return null;
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 404) {
      return null; // File doesn't exist
    }
    throw error;
  }
}

/**
 * Check if file exists in repository
 * 
 * @param path - File path to check
 * @returns Boolean indicating if file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  const content = await getFileContents(path);
  return content !== null;
}

/**
 * List files in a directory
 * 
 * @param path - Directory path
 * @returns Array of file names
 */
export async function listFiles(path: string): Promise<string[]> {
  const octokit = getOctokit();

  try {
    const { data } = await octokit.repos.getContent({
      ...REPO_CONFIG,
      path,
    });

    if (Array.isArray(data)) {
      return data
        .filter((item) => item.type === 'file')
        .map((item) => item.name);
    }

    return [];
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 404) {
      return []; // Directory doesn't exist
    }
    throw error;
  }
}
