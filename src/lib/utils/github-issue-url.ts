/**
 * GitHub Issue URL Generator
 *
 * Production-grade utility for generating pre-filled GitHub issue URLs.
 * This approach eliminates the need for GitHub API authentication while providing
 * a seamless submission experience.
 *
 * Security:
 * - All user input is sanitized and validated via Zod schemas
 * - URL encoding prevents injection attacks
 * - No secrets or tokens required
 * - Client-side only, no server exposure
 *
 * Performance:
 * - Zero API calls, instant URL generation
 * - No rate limiting concerns
 * - No network latency
 *
 * UX Benefits:
 * - Users can review/edit before submitting
 * - Transparent process (users see what's being submitted)
 * - One-click submission on GitHub
 * - Works even if our backend is down
 *
 * @see https://docs.github.com/en/issues/tracking-your-work-with-issues/creating-an-issue#creating-an-issue-from-a-url-query
 */

import type { ConfigSubmissionData } from '@/src/lib/schemas/form.schema';

/**
 * GitHub repository configuration
 * Hardcoded for security - prevents tampering via environment variables
 */
const GITHUB_CONFIG = {
  owner: 'JSONbored',
  repo: 'claudepro-directory',
  baseUrl: 'https://github.com',
} as const;

/**
 * Content type display names for issue titles
 */
const CONTENT_TYPE_LABELS: Record<ConfigSubmissionData['type'], string> = {
  agents: 'Agent',
  mcp: 'MCP Server',
  rules: 'Rule',
  commands: 'Command',
  hooks: 'Hook',
  statuslines: 'Statusline',
} as const;

/**
 * Generate formatted issue body from submission data
 * Uses markdown for readability and includes all relevant metadata
 */
function generateIssueBody(data: ConfigSubmissionData): string {
  const sections: string[] = [
    '## New Configuration Submission',
    '',
    `**Submission Type:** ${CONTENT_TYPE_LABELS[data.type]}`,
    `**Name:** ${data.name}`,
    `**Author:** ${data.author}`,
    `**Category:** ${data.category}`,
    '',
  ];

  // Description section
  sections.push('### Description');
  sections.push(data.description);
  sections.push('');

  // GitHub URL if provided
  if (data.github?.trim()) {
    sections.push('### Repository');
    sections.push(`**GitHub URL:** ${data.github}`);
    sections.push('');
  }

  // Configuration content (type-specific)
  sections.push('### Configuration');
  sections.push('```');
  sections.push('Type-specific content fields - see PR for details');
  sections.push('```');
  sections.push('');

  // Tags if provided (already an array after Zod transform)
  if (data.tags && data.tags.length > 0) {
    const tagList = data.tags.map((tag) => `\`${tag}\``).join(', ');

    sections.push('### Tags');
    sections.push(tagList);
    sections.push('');
  }

  // Review checklist for maintainers
  sections.push('---');
  sections.push('### Review Checklist');
  sections.push('- [ ] Configuration format is valid JSON');
  sections.push('- [ ] All required fields are present');
  sections.push('- [ ] Content follows community guidelines');
  sections.push('- [ ] No security concerns identified');
  sections.push('- [ ] GitHub repository is accessible (if provided)');
  sections.push('- [ ] Appropriate labels have been added');
  sections.push('');

  // Metadata
  sections.push('### Submission Metadata');
  sections.push(`**Submitted:** ${new Date().toISOString()}`);
  sections.push(`**Type:** ${data.type}`);
  sections.push('**Status:** Pending Review');
  sections.push('');

  // Footer with attribution
  sections.push('---');
  sections.push('');
  sections.push(
    '*This issue was generated automatically from the ClaudePro Directory submission form.*'
  );

  return sections.join('\n');
}

/**
 * Generate GitHub issue creation URL with pre-filled data
 *
 * @param data - Validated submission data from the form
 * @returns Complete GitHub issue URL with encoded parameters
 *
 * @example
 * ```ts
 * const url = generateGitHubIssueUrl({
 *   type: 'agents',
 *   name: 'Code Review Agent',
 *   description: 'AI-powered code reviewer',
 *   category: 'Development',
 *   author: 'johndoe',
 *   github: 'https://github.com/user/repo',
 *   content: '{"name": "code-reviewer", "version": "1.0.0"}',
 *   tags: 'productivity, code-review',
 * });
 * // Returns: https://github.com/JSONbored/claudepro-directory/issues/new?title=...&body=...&labels=...
 * ```
 */
export function generateGitHubIssueUrl(data: ConfigSubmissionData): string {
  // Generate issue title
  const title = `New ${CONTENT_TYPE_LABELS[data.type]} Submission: ${data.name}`;

  // Generate formatted issue body
  const body = generateIssueBody(data);

  // Generate labels (GitHub supports comma-separated labels)
  const labels = ['submission', `type:${data.type}`, 'needs-review'].join(',');

  // Construct URL with query parameters
  // Using URLSearchParams ensures proper encoding
  const baseUrl = `${GITHUB_CONFIG.baseUrl}/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/issues/new`;
  const params = new URLSearchParams({
    title,
    body,
    labels,
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Validate GitHub issue URL length
 * GitHub has URL length limits (~8KB), though in practice we're well below this
 *
 * @param url - The generated GitHub issue URL
 * @returns Boolean indicating if URL is within safe limits
 */
export function validateIssueUrlLength(url: string): boolean {
  const MAX_URL_LENGTH = 8000; // Conservative limit (GitHub's actual limit is higher)
  return url.length <= MAX_URL_LENGTH;
}

/**
 * Open GitHub issue in new tab
 * Provides fallback for popup blockers
 *
 * @param url - The GitHub issue URL to open
 * @returns Boolean indicating if window was opened successfully
 */
export function openGitHubIssue(url: string): boolean {
  // Validate URL before opening
  if (!validateIssueUrlLength(url)) {
    throw new Error('Issue content is too large. Please reduce the configuration size.');
  }

  // Open in new tab with security attributes
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

  // Check if popup was blocked
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    return false; // Popup blocked
  }

  return true; // Success
}

/**
 * Generate direct link element for GitHub issue
 * Useful for creating downloadable links or fallbacks
 *
 * @param data - Validated submission data
 * @returns HTML anchor element with pre-filled GitHub issue URL
 */
export function createGitHubIssueLink(data: ConfigSubmissionData): HTMLAnchorElement {
  const url = generateGitHubIssueUrl(data);
  const link = document.createElement('a');

  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Open GitHub Issue';

  return link;
}
