/**
 * submitContent Tool Handler
 *
 * Guides users through content submission using MCP elicitation.
 * Collects submission data step-by-step and provides submission instructions.
 *
 * Note: Actual submission requires authentication via the web interface.
 * This tool collects data and provides instructions/URLs for submission.
 */

import { submission_type, content_category } from '@prisma/client';

import type { SubmitContentInput } from '../../lib/types';
import { McpErrorCode, createErrorResponse } from '../../lib/errors';
import { sanitizeString, isValidUrl } from '../../lib/utils';
import { getEnvOrDefault } from '@heyclaude/cloudflare-runtime/config/env';
import { normalizeError } from '@heyclaude/cloudflare-runtime/utils/errors';
import type { ToolContext } from './categories';

const SubmissionType = submission_type;
const ContentCategory = content_category;

/**
 * Validates submission type
 */
function isValidSubmissionType(type: string): type is submission_type {
  return Object.values(SubmissionType).includes(type as submission_type);
}

/**
 * Validates category
 */
function isValidCategory(category: string): category is content_category {
  return Object.values(ContentCategory).includes(category as content_category);
}

/**
 * Generates submission URL with pre-filled data
 */
function generateSubmissionUrl(submissionData: SubmitContentInput, appUrl: string): string {
  const url = new URL(`${appUrl}/submit`);

  // Add basic parameters that can be pre-filled
  if (submissionData.submission_type) {
    url.searchParams.set('type', submissionData.submission_type);
  }
  if (submissionData.name) {
    url.searchParams.set('name', submissionData.name);
  }

  return url.toString();
}

/**
 * Formats submission data for display
 */
function formatSubmissionData(
  data: SubmitContentInput,
  sanitized: {
    name?: string;
    description?: string;
    author?: string;
    authorProfileUrl?: string;
    githubUrl?: string;
  }
): string {
  const sections: string[] = [];

  sections.push('## Submission Data Summary\n');
  sections.push(`**Type:** ${data.submission_type || 'Not specified'}`);
  sections.push(`**Category:** ${data.category || 'Not specified'}`);
  sections.push(`**Name:** ${sanitized.name || 'Not specified'}`);
  sections.push(`**Author:** ${sanitized.author || 'Not specified'}`);

  if (sanitized.description) {
    sections.push(`\n**Description:**\n${sanitized.description}`);
  }

  if (data.tags && data.tags.length > 0) {
    const sanitizedTags = data.tags.map((tag) => sanitizeString(tag)).filter(Boolean);
    if (sanitizedTags.length > 0) {
      sections.push(`\n**Tags:** ${sanitizedTags.join(', ')}`);
    }
  }

  if (sanitized.authorProfileUrl) {
    sections.push(`\n**Author Profile:** ${sanitized.authorProfileUrl}`);
  }

  if (sanitized.githubUrl) {
    sections.push(`\n**GitHub URL:** ${sanitized.githubUrl}`);
  }

  if (data.content_data && typeof data.content_data === 'object') {
    sections.push('\n**Content Data:**');
    sections.push('```json');
    sections.push(JSON.stringify(data.content_data, null, 2));
    sections.push('```');
  }

  return sections.join('\n');
}

/**
 * Guides users through content submission
 *
 * This tool uses MCP elicitation to collect submission data step-by-step,
 * then provides instructions and URLs for completing the submission via the web interface.
 *
 * @param input - Tool input with submission data (may be partial for elicitation)
 * @param context - Tool handler context
 * @returns Submission instructions and pre-filled URL
 * @throws If validation fails
 */
export async function handleSubmitContent(
  input: SubmitContentInput,
  context: ToolContext
): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  _meta: {
    submissionUrl: string;
    hasMinimumData: boolean;
    submissionType: string | null;
    category: string | null;
    name: string | null;
    author: string | null;
    appUrl: string;
    webFormUrl: string;
    nextSteps: string[];
  };
}> {
  const { env, logger } = context;
  const startTime = Date.now();

  const APP_URL = getEnvOrDefault(env, 'APP_URL', 'https://claudepro.directory');

  try {
    // Sanitize string inputs
    const sanitizedName = input.name ? sanitizeString(input.name) : undefined;
    const sanitizedDescription = input.description ? sanitizeString(input.description) : undefined;
    const sanitizedAuthor = input.author ? sanitizeString(input.author) : undefined;
    const sanitizedAuthorProfileUrl = input.author_profile_url
      ? sanitizeString(input.author_profile_url)
      : undefined;
    const sanitizedGithubUrl = input.github_url ? sanitizeString(input.github_url) : undefined;

    // Validate submission type if provided
    if (input.submission_type && !isValidSubmissionType(input.submission_type)) {
      const error = createErrorResponse(
        McpErrorCode.INVALID_SUBMISSION_TYPE,
        `Invalid submission_type: ${input.submission_type}. Valid types: agents, mcp, rules, commands, hooks, statuslines, skills`
      );
      throw new Error(error.message);
    }

    // Validate category if provided
    if (input.category && !isValidCategory(input.category)) {
      const error = createErrorResponse(
        McpErrorCode.INVALID_CATEGORY,
        `Invalid category: ${input.category}. Valid categories: agents, mcp, rules, commands, hooks, statuslines, skills, collections, guides, jobs, changelog`
      );
      throw new Error(error.message);
    }

    // Validate URLs if provided
    if (sanitizedAuthorProfileUrl && !isValidUrl(sanitizedAuthorProfileUrl)) {
      const error = createErrorResponse(
        McpErrorCode.INVALID_INPUT,
        `Invalid author_profile_url: ${sanitizedAuthorProfileUrl}`
      );
      throw new Error(error.message);
    }

    if (sanitizedGithubUrl && !isValidUrl(sanitizedGithubUrl)) {
      const error = createErrorResponse(
        McpErrorCode.INVALID_INPUT,
        `Invalid github_url: ${sanitizedGithubUrl}`
      );
      throw new Error(error.message);
    }

    // Validate name if provided (should be valid slug-like)
    if (sanitizedName && sanitizedName.length > 200) {
      const error = createErrorResponse(
        McpErrorCode.INVALID_INPUT,
        'Name must be 200 characters or less'
      );
      throw new Error(error.message);
    }

    // Check if we have minimum required data (use sanitized values)
    const hasMinimumData = Boolean(
      input.submission_type && sanitizedName && sanitizedDescription && sanitizedAuthor
    );

    // Generate submission URL (use sanitized name if available)
    const submissionUrl = generateSubmissionUrl(
      {
        ...input,
        name: sanitizedName || input.name,
      },
      APP_URL
    );

    // Build response
    const instructions: string[] = [];

    if (hasMinimumData) {
      instructions.push('## Content Submission Ready\n');
      instructions.push(
        "Your submission data has been collected. Here's how to complete your submission:\n"
      );
      instructions.push('### Step 1: Visit Submission Page\n');
      instructions.push(`Visit: ${submissionUrl}\n`);
      instructions.push('### Step 2: Sign In (Required)\n');
      instructions.push("You must be signed in to submit content. If you don't have an account:");
      instructions.push('- Use the `createAccount` tool to create one');
      instructions.push('- Or visit the website and sign in with GitHub, Google, or Discord\n');
      instructions.push('### Step 3: Complete Submission\n');
      instructions.push(
        'The submission form will be pre-filled with your data. Review and submit.\n'
      );
      instructions.push('### Your Submission Data\n');
      instructions.push(
        formatSubmissionData(input, {
          ...(sanitizedName && { name: sanitizedName }),
          ...(sanitizedDescription && { description: sanitizedDescription }),
          ...(sanitizedAuthor && { author: sanitizedAuthor }),
          ...(sanitizedAuthorProfileUrl && { authorProfileUrl: sanitizedAuthorProfileUrl }),
          ...(sanitizedGithubUrl && { githubUrl: sanitizedGithubUrl }),
        })
      );
    } else {
      instructions.push('## Content Submission Guide\n');
      instructions.push(
        'To submit content to Claude Pro Directory, I need to collect some information.\n'
      );
      instructions.push('### Required Information\n');
      instructions.push(
        '- **Submission Type**: agents, mcp, rules, commands, hooks, statuslines, or skills'
      );
      instructions.push('- **Category**: Content category (usually matches submission type)');
      instructions.push('- **Name**: Title of your content');
      instructions.push('- **Description**: Brief description of your content');
      instructions.push('- **Author**: Your name or handle');
      instructions.push('- **Content Data**: The actual content (varies by type)\n');
      instructions.push('### Optional Information\n');
      instructions.push('- **Tags**: Array of relevant tags');
      instructions.push('- **Author Profile URL**: Link to your profile');
      instructions.push('- **GitHub URL**: Link to GitHub repository (if applicable)\n');
      instructions.push('### Next Steps\n');
      instructions.push("I'll ask you for this information step-by-step using MCP elicitation.\n");
      instructions.push("Once I have all the required data, I'll provide you with:");
      instructions.push('- A pre-filled submission URL');
      instructions.push('- Step-by-step instructions');
      instructions.push('- Your complete submission data for review\n');
      instructions.push('### Alternative: Use Web Form\n');
      instructions.push(`You can also submit directly via the web form: ${APP_URL}/submit`);
      instructions.push(
        'The web form provides dynamic validation and a better submission experience.'
      );
    }

    const instructionsText = instructions.join('\n');

    logger.info(
      {
        tool: 'submitContent',
        duration_ms: Date.now() - startTime,
        hasMinimumData,
        submissionType: input.submission_type || null,
      },
      'submitContent completed successfully'
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: instructionsText,
        },
      ],
      _meta: {
        submissionUrl,
        hasMinimumData,
        submissionType: input.submission_type || null,
        category: input.category || null,
        name: sanitizedName || null,
        author: sanitizedAuthor || null,
        appUrl: APP_URL,
        webFormUrl: `${APP_URL}/submit`,
        nextSteps: hasMinimumData
          ? ['Visit the submission URL', 'Sign in to your account', 'Review and submit your content']
          : [
              'Provide submission type',
              'Provide name and description',
              'Provide author information',
              'Provide content data',
              'Complete submission via web form',
            ],
      },
    };
  } catch (error) {
    const normalized = normalizeError(error, 'submitContent tool failed');
    logger.error({ error: normalized, tool: 'submitContent' }, 'submitContent tool error');
    throw normalized;
  }
}
