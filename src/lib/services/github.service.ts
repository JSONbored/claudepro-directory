/**
 * Production-Grade GitHub Service
 * Handles GitHub API integration for issue creation and content submissions
 * Uses native fetch API for minimal bundle size
 */

import type { z } from 'zod';
import { logger } from '@/src/lib/logger';
import { githubConfig, hasGitHubConfig } from '@/src/lib/schemas/env.schema';
import {
  type ConfigSubmissionData,
  gitHubConfigValidationSchema,
  githubApiRateLimitSchema,
  githubHealthCheckResponseSchema,
  issueCreationRequestSchema,
  issueCreationResponseSchema,
} from '@/src/lib/schemas/form.schema';

type IssueCreationRequest = z.infer<typeof issueCreationRequestSchema>;
type IssueCreationResponse = z.infer<typeof issueCreationResponseSchema>;

/**
 * GitHub Service for issue creation and content management
 * Uses native fetch API instead of @octokit/rest for minimal bundle size
 */
class GitHubService {
  private readonly baseUrl = 'https://api.github.com';
  private readonly userAgent = 'claudepro-directory/1.0.0';

  /**
   * Create fetch headers for GitHub API requests
   */
  private getHeaders(): HeadersInit {
    return {
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': this.userAgent,
      ...(githubConfig.token && { Authorization: `Bearer ${githubConfig.token}` }),
    };
  }

  /**
   * Check if GitHub is properly configured with Zod validation
   */
  isConfigured(): boolean {
    if (!hasGitHubConfig()) {
      return false;
    }

    // Validate GitHub configuration with Zod
    try {
      gitHubConfigValidationSchema.parse({
        token: githubConfig.token,
        owner: githubConfig.owner,
        repo: githubConfig.repo,
      });
      return true;
    } catch (_error) {
      logger.warn('GitHub configuration validation failed', undefined, {
        hasToken: !!githubConfig.token,
        hasOwner: !!githubConfig.owner,
        hasRepo: !!githubConfig.repo,
      });
      return false;
    }
  }

  /**
   * Create a GitHub issue for configuration submission
   */
  async createSubmissionIssue(
    submissionData: ConfigSubmissionData
  ): Promise<IssueCreationResponse> {
    if (!this.isConfigured()) {
      throw new Error('GitHub service is not properly configured');
    }

    try {
      // Generate issue content based on submission type
      const issueContent = this.generateIssueContent(submissionData);

      // Validate issue creation request
      const issueRequest = issueCreationRequestSchema.parse(issueContent);

      // Create the issue using GitHub REST API
      const url = `${this.baseUrl}/repos/${githubConfig.owner}/${githubConfig.repo}/issues`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          title: issueRequest.title,
          body: issueRequest.body,
          labels: issueRequest.labels,
          assignees: issueRequest.assignees,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(
          `GitHub API error: ${response.status} - ${errorData.message || response.statusText}`
        );
      }

      const data = await response.json();

      // Validate and return response
      const issueResponse = issueCreationResponseSchema.parse({
        issueNumber: data.number,
        issueUrl: data.html_url,
        success: true,
      });

      logger.info('GitHub issue created successfully', {
        issueNumber: issueResponse.issueNumber,
        issueUrl: issueResponse.issueUrl,
        submissionType: submissionData.type,
        submissionName: submissionData.name,
      });

      return issueResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error(
        'Failed to create GitHub issue',
        error instanceof Error ? error : new Error(errorMessage),
        {
          submissionType: submissionData.type,
          submissionName: submissionData.name,
          githubOwner: githubConfig.owner || 'unknown',
          githubRepo: githubConfig.repo || 'unknown',
        }
      );

      throw new Error(`GitHub API error: ${errorMessage}`);
    }
  }

  /**
   * Generate formatted issue content based on submission data
   */
  private generateIssueContent(data: ConfigSubmissionData): IssueCreationRequest {
    const title = `New ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Submission: ${data.name}`;

    const body = this.formatIssueBody(data);

    const labels = ['submission', `type:${data.type}`, 'needs-review'];

    return {
      title,
      body,
      labels,
      assignees: [], // Can be configured based on submission type
    };
  }

  /**
   * Format the issue body with structured content
   */
  private formatIssueBody(data: ConfigSubmissionData): string {
    const sections = [
      '## New Configuration Submission',
      '',
      `**Submission Type:** ${data.type.charAt(0).toUpperCase() + data.type.slice(1)}`,
      `**Name:** ${data.name}`,
      `**Author:** ${data.author}`,
      '',
      '### Description',
      data.description,
      '',
    ];

    // Add GitHub URL if provided
    if (data.github) {
      sections.push('### Repository');
      sections.push(`**GitHub URL:** ${data.github}`);
      sections.push('');
    }

    // Add configuration JSON
    sections.push('### Configuration');
    sections.push('```json');
    sections.push(data.content);
    sections.push('```');
    sections.push('');

    // Add review checklist
    sections.push('### Review Checklist');
    sections.push('- [ ] Configuration format is valid');
    sections.push('- [ ] All required fields are present');
    sections.push('- [ ] GitHub repository is accessible (if provided)');
    sections.push('- [ ] No security concerns identified');
    sections.push('- [ ] Content follows community guidelines');
    sections.push('');

    // Add metadata
    sections.push('### Submission Metadata');
    sections.push(`**Submitted:** ${new Date().toISOString()}`);
    sections.push(`**Type:** ${data.type}`);
    sections.push('**Status:** Pending Review');
    sections.push('');

    // Add instructions for reviewers
    sections.push('---');
    sections.push('**Review Instructions:**');
    sections.push('1. Validate the configuration format and content');
    sections.push('2. Check the GitHub repository if provided');
    sections.push('3. Ensure compliance with security guidelines');
    sections.push('4. Add appropriate labels and assign reviewers');
    sections.push('5. Close this issue once the configuration is processed');

    return sections.join('\n');
  }

  /**
   * Health check for GitHub service with Zod validation
   */
  async healthCheck(): Promise<z.infer<typeof githubHealthCheckResponseSchema>> {
    if (!this.isConfigured()) {
      return githubHealthCheckResponseSchema.parse({
        configured: false,
        authenticated: false,
      });
    }

    try {
      // Test authentication and get rate limit info
      const url = `${this.baseUrl}/rate_limit`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      // Validate GitHub API response structure
      const rateLimit = githubApiRateLimitSchema.parse({
        remaining: data.rate.remaining,
        resetTime: new Date(data.rate.reset * 1000).toISOString(),
      });

      return githubHealthCheckResponseSchema.parse({
        configured: true,
        authenticated: true,
        rateLimit,
      });
    } catch (error) {
      logger.error(
        'GitHub health check failed',
        error instanceof Error ? error : new Error(String(error))
      );

      return githubHealthCheckResponseSchema.parse({
        configured: true,
        authenticated: false,
      });
    }
  }
}

// Export singleton instance
export const githubService = new GitHubService();

// Export types for external use
export type { IssueCreationRequest, IssueCreationResponse };
export type GitHubHealthCheckResponse = z.infer<typeof githubHealthCheckResponseSchema>;
export type GitHubRateLimit = z.infer<typeof githubApiRateLimitSchema>;

// Note: Schemas are exported from @/lib/schemas/form.schema for centralized validation
