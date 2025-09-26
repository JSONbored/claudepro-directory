'use server';

import { redirect } from 'next/navigation';
import { ZodError } from 'zod';
import { logger } from '@/lib/logger';
import { type ConfigSubmissionData, parseConfigSubmissionForm } from '@/lib/schemas/form.schema';

interface FormState {
  success?: boolean;
  error?: string;
  errors?: Record<string, string[]>;
  issueUrl?: string;
  fallback?: boolean;
}

export async function submitConfiguration(
  _prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  try {
    // Parse and validate form data using Zod
    let validatedData: ConfigSubmissionData;

    try {
      validatedData = parseConfigSubmissionForm(formData);
    } catch (error) {
      if (error instanceof ZodError) {
        // Return field-specific errors for better UX
        const fieldErrors: Record<string, string[]> = {};

        for (const issue of error.issues) {
          const path = issue.path.join('.');
          if (!fieldErrors[path]) {
            fieldErrors[path] = [];
          }
          fieldErrors[path].push(issue.message);
        }

        return {
          error: 'Please correct the validation errors below',
          errors: fieldErrors,
        };
      }

      // Unexpected validation error
      logger.error(
        'Form validation failed',
        error instanceof Error ? error : new Error(String(error))
      );
      return {
        error: 'Invalid form data. Please check your input and try again.',
      };
    }

    // Log the submission attempt with validated data
    logger.info('Configuration submission attempt', {
      type: validatedData.type,
      name: validatedData.name,
      author: validatedData.author,
      hasGithub: !!validatedData.github,
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
        type: validatedData.type,
        name: validatedData.name,
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
