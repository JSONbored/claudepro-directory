'use server';

import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';

interface FormState {
  success?: boolean;
  error?: string;
  issueUrl?: string;
  fallback?: boolean;
}

interface ConfigSubmissionData {
  type: string;
  name: string;
  description: string;
  category: string;
  author: string;
  github: string;
  content: string;
  tags: string;
}

export async function submitConfiguration(
  _prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  try {
    // Extract form data
    const data: ConfigSubmissionData = {
      type: formData.get('type') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      author: formData.get('author') as string,
      github: formData.get('github') as string,
      content: formData.get('content') as string,
      tags: formData.get('tags') as string,
    };

    // Validate required fields
    const requiredFields = ['type', 'name', 'description', 'category', 'author', 'content'];
    const missingFields = requiredFields.filter(
      (field) => !data[field as keyof ConfigSubmissionData]
    );

    if (missingFields.length > 0) {
      return {
        error: `Missing required fields: ${missingFields.join(', ')}`,
      };
    }

    // Validate JSON content
    try {
      JSON.parse(data.content);
    } catch {
      return {
        error: 'Invalid JSON format in configuration content',
      };
    }

    // Log the submission attempt
    logger.info('Configuration submission attempt', {
      type: data.type,
      name: data.name,
      author: data.author,
      hasGithub: !!data.github,
    });

    // For now, simulate a successful submission
    // In a real implementation, you would:
    // 1. Create a GitHub issue or PR
    // 2. Send email notifications
    // 3. Store in database for review

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

    // Simulate different outcomes
    const shouldSucceed = Math.random() > 0.1; // 90% success rate for demo

    if (shouldSucceed) {
      const mockIssueUrl = `https://github.com/JSONbored/claudepro-directory/issues/${Math.floor(Math.random() * 1000) + 100}`;

      logger.info('Configuration submitted successfully', {
        issueUrl: mockIssueUrl,
        type: data.type,
        name: data.name,
      });

      return {
        success: true,
        issueUrl: mockIssueUrl,
      };
    } else {
      // Simulate rate limiting or API issues
      return {
        error: 'GitHub API rate limit exceeded. Please try submitting directly via GitHub.',
        fallback: true,
      };
    }
  } catch (error) {
    logger.error(
      'Server action submission failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        action: 'submitConfiguration',
      }
    );

    return {
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

export async function resetForm(): Promise<void> {
  redirect('/submit');
}
