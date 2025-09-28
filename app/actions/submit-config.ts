'use server';

import { redirect } from 'next/navigation';
import { ZodError } from 'zod';
import { githubService } from '@/lib/github.service';
import { logger } from '@/lib/logger';
import type { FormState } from '@/lib/schemas/app.schema';
import { type ConfigSubmissionData, parseConfigSubmissionForm } from '@/lib/schemas/form.schema';

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

    // Check if GitHub service is configured
    if (!githubService.isConfigured()) {
      logger.warn('GitHub service not configured, falling back to manual submission', {
        type: validatedData.type,
        name: validatedData.name,
      });

      return {
        error: 'Automated submission is currently unavailable. Please submit directly via GitHub.',
        fallback: true,
      };
    }

    try {
      // Create GitHub issue using real API
      const issueResponse = await githubService.createSubmissionIssue(validatedData);

      logger.info('Configuration submitted successfully via GitHub API', {
        issueUrl: issueResponse.issueUrl,
        issueNumber: issueResponse.issueNumber,
        type: validatedData.type,
        name: validatedData.name,
      });

      return {
        success: true,
        issueUrl: issueResponse.issueUrl,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error(
        'GitHub submission failed',
        error instanceof Error ? error : new Error(errorMessage),
        {
          type: validatedData.type,
          name: validatedData.name,
        }
      );

      // Provide fallback option for users
      return {
        error: `Submission failed: ${errorMessage}. Please try submitting directly via GitHub.`,
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
