'use server';

/**
 * Content Submission Actions
 * Server actions for community content submissions
 * 
 * Flow:
 * 1. Validate user is authenticated
 * 2. Check for duplicates
 * 3. Generate slug
 * 4. Format content file
 * 5. Create GitHub branch
 * 6. Commit file
 * 7. Create PR
 * 8. Track in database
 * 9. Return PR URL
 */

import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { configSubmissionSchema } from '@/src/lib/schemas/form.schema';
import { createClient } from '@/src/lib/supabase/server';
import { createBranch, commitFile, createPullRequest } from '@/src/lib/github/client';
import {
  generateSlug,
  getContentFilePath,
  formatContentFile,
  validateContentFile,
} from '@/src/lib/github/content-manager';
import {
  checkForDuplicates,
  validateSubmission,
} from '@/src/lib/github/duplicate-detection';
import {
  generatePRTitle,
  generatePRBody,
  generatePRLabels,
  generateCommitMessage,
} from '@/src/lib/github/pr-template';
import { logger } from '@/src/lib/logger';
import { revalidatePath } from 'next/cache';

/**
 * Submit new content configuration
 * Creates GitHub PR automatically
 */
export const submitConfiguration = rateLimitedAction
  .metadata({
    actionName: 'submitConfiguration',
    category: 'form',
  })
  .schema(configSubmissionSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    // 1. Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('You must be signed in to submit content');
    }

    // Get user profile for attribution
    const { data: profile } = await supabase
      .from('users')
      .select('name, slug')
      .eq('id', user.id)
      .single();

    // 2. Generate slug from name
    const slug = generateSlug(parsedInput.name);

    // 3. Validate submission
    const validation = await validateSubmission({
      type: parsedInput.type,
      name: parsedInput.name,
      slug,
      description: parsedInput.description,
      tags: parsedInput.tags || [],
    });

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // 4. Check for duplicates
    const duplicateCheck = await checkForDuplicates(parsedInput.type, slug, parsedInput.name);

    if (duplicateCheck.isDuplicate) {
      throw new Error(
        duplicateCheck.reason || 'This content already exists or is pending review'
      );
    }

    // Warn about similar content (but don't block)
    if (duplicateCheck.suggestions && duplicateCheck.suggestions.length > 0) {
      logger.warn(
        `Similar content found for ${slug}: ${duplicateCheck.suggestions.join(', ')}`
      );
    }

    // 5. Format content file (pass full parsed input with slug)
    const contentFile = formatContentFile({
      ...parsedInput,
      slug,
    });

    // 6. Validate formatted content
    if (!validateContentFile(contentFile)) {
      throw new Error('Generated content file failed validation. Please try again.');
    }

    // 7. Create GitHub branch
    const branchName = `submission/${parsedInput.type}/${slug}-${Date.now()}`;
    try {
      await createBranch(branchName);
    } catch (error) {
      logger.error('Failed to create branch', error instanceof Error ? error : new Error(String(error)));
      throw new Error(
        `Failed to create branch: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // 8. Commit file
    const filePath = getContentFilePath(parsedInput.type, slug);
    const commitMessage = generateCommitMessage(parsedInput.type, parsedInput.name);

    try {
      await commitFile({
        branch: branchName,
        path: filePath,
        content: contentFile,
        message: commitMessage,
      });
    } catch (error) {
      logger.error('Failed to commit file', error instanceof Error ? error : new Error(String(error)));
      throw new Error(
        `Failed to commit file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // 9. Create PR
    const prTitle = generatePRTitle(parsedInput.type, parsedInput.name);
    const prBody = generatePRBody({
      type: parsedInput.type,
      name: parsedInput.name,
      slug,
      description: parsedInput.description,
      category: parsedInput.category,
      author: parsedInput.author,
      github: parsedInput.github || undefined,
      tags: parsedInput.tags || [],
      submittedBy: profile
        ? {
            username: profile.slug || profile.name || 'anonymous',
            email: user.email || 'unknown',
          }
        : undefined,
    });
    const prLabels = generatePRLabels(parsedInput.type);

    let prNumber: number;
    let prUrl: string;

    try {
      const pr = await createPullRequest({
        title: prTitle,
        body: prBody,
        head: branchName,
        labels: prLabels,
      });

      prNumber = pr.number;
      prUrl = pr.url;
    } catch (error) {
      logger.error('Failed to create PR', error instanceof Error ? error : new Error(String(error)));
      throw new Error(
        `Failed to create pull request: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // 10. Track submission in database
    const { error: dbError } = await supabase.from('submissions').insert({
      user_id: user.id,
      content_type: parsedInput.type,
      content_slug: slug,
      content_name: parsedInput.name,
      pr_number: prNumber,
      pr_url: prUrl,
      branch_name: branchName,
      status: 'pending',
      submission_data: {
        ...parsedInput,
        slug,
        formatted_content: contentFile,
      },
    });

    if (dbError) {
      logger.error('Failed to track submission in database', dbError);
      // Don't throw - PR was created successfully, just log the error
    }

    // 11. Revalidate pages
    revalidatePath('/submit');
    revalidatePath('/account/submissions');

    // 12. Return success
    return {
      success: true,
      prNumber,
      prUrl,
      slug,
      message: 'Your submission has been created and is pending review!',
    };
  });

/**
 * Get user's submissions
 * Helper function for submissions page
 */
export async function getUserSubmissions() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch user submissions', error);
    return [];
  }

  return data || [];
}
