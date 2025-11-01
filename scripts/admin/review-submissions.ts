#!/usr/bin/env tsx
/**
 * Admin CLI - Content Submission Review Tool
 * Moderator interface for reviewing, approving, rejecting, and merging content submissions
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database.types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Use generated types from database
type SubmissionStatus = Database['public']['Enums']['submission_status'];
type SubmissionSummary = Pick<
  Database['public']['Tables']['content_submissions']['Row'],
  'id' | 'name' | 'submission_type' | 'status' | 'author' | 'created_at' | 'spam_score'
>;

/**
 * List submissions with optional filtering
 */
async function listSubmissions(status?: SubmissionStatus, limit = 20) {
  console.log(`\n📋 Fetching submissions${status ? ` (status: ${status})` : ''}...\n`);

  let query = supabase
    .from('content_submissions')
    .select('id, name, submission_type, status, author, created_at, spam_score')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error fetching submissions:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No submissions found.');
    return;
  }

  console.log(`Found ${data.length} submission(s):\n`);

  for (const submission of data) {
    const statusEmoji = getStatusEmoji(submission.status);
    const spamWarning = submission.spam_score && submission.spam_score > 0.7 ? ' ⚠️  SPAM' : '';

    console.log(`${statusEmoji} ${submission.id.slice(0, 8)} | ${submission.name}`);
    console.log(`   Type: ${submission.submission_type} | Author: ${submission.author}`);
    console.log(
      `   Status: ${submission.status} | Created: ${new Date(submission.created_at).toLocaleString()}${spamWarning}`
    );
    console.log('');
  }
}

/**
 * Show detailed submission information
 */
async function showSubmission(submissionId: string) {
  console.log(`\n🔍 Fetching submission ${submissionId}...\n`);

  const { data, error } = await supabase
    .from('content_submissions')
    .select('*')
    .eq('id', submissionId)
    .single();

  if (error) {
    console.error('❌ Error fetching submission:', error.message);
    process.exit(1);
  }

  if (!data) {
    console.error('❌ Submission not found');
    process.exit(1);
  }

  const statusEmoji = getStatusEmoji(data.status);

  console.log(`${statusEmoji} ${data.name}`);
  console.log('─'.repeat(60));
  console.log(`ID:               ${data.id}`);
  console.log(`Type:             ${data.submission_type}`);
  console.log(`Category:         ${data.category}`);
  console.log(`Status:           ${data.status}`);
  console.log(`Author:           ${data.author}`);
  if (data.author_profile_url) console.log(`Author Profile:   ${data.author_profile_url}`);
  if (data.github_url) console.log(`GitHub URL:       ${data.github_url}`);
  if (data.github_pr_url) console.log(`GitHub PR:        ${data.github_pr_url}`);
  console.log(`Description:      ${data.description}`);
  if (data.tags && data.tags.length > 0) console.log(`Tags:             ${data.tags.join(', ')}`);
  console.log(`Submitter Email:  ${data.submitter_email || 'N/A'}`);
  console.log(`Created:          ${new Date(data.created_at).toLocaleString()}`);

  if (data.spam_score !== null) {
    const spamEmoji = data.spam_score > 0.7 ? '⚠️' : '✅';
    console.log(`Spam Score:       ${spamEmoji} ${data.spam_score.toFixed(2)}`);
    if (data.spam_reasons && data.spam_reasons.length > 0) {
      console.log(`Spam Reasons:     ${data.spam_reasons.join(', ')}`);
    }
  }

  if (data.moderator_notes) {
    console.log(`\nModerator Notes:\n${data.moderator_notes}`);
  }

  if (data.moderated_at) {
    console.log(`\nModerated:        ${new Date(data.moderated_at).toLocaleString()}`);
    console.log(`Moderated By:     ${data.moderated_by || 'Unknown'}`);
  }

  console.log('\nContent Data:');
  console.log(JSON.stringify(data.content_data, null, 2));
}

/**
 * Approve a submission
 */
async function approveSubmission(submissionId: string, notes?: string) {
  console.log(`\n✅ Approving submission ${submissionId}...\n`);

  const { data, error } = await supabase
    .from('content_submissions')
    .update({
      status: 'approved',
      moderated_at: new Date().toISOString(),
      moderator_notes: notes || null,
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) {
    console.error('❌ Error approving submission:', error.message);
    process.exit(1);
  }

  console.log(`✅ Submission approved: ${data.name}`);
  if (notes) console.log(`Notes: ${notes}`);
}

/**
 * Reject a submission
 */
async function rejectSubmission(submissionId: string, reason: string) {
  console.log(`\n❌ Rejecting submission ${submissionId}...\n`);

  const { data, error } = await supabase
    .from('content_submissions')
    .update({
      status: 'rejected',
      moderated_at: new Date().toISOString(),
      moderator_notes: reason,
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) {
    console.error('❌ Error rejecting submission:', error.message);
    process.exit(1);
  }

  console.log(`❌ Submission rejected: ${data.name}`);
  console.log(`Reason: ${reason}`);
}

/**
 * Mark a submission as spam
 */
async function markAsSpam(submissionId: string, reason: string) {
  console.log(`\n🚫 Marking submission ${submissionId} as spam...\n`);

  const { data, error } = await supabase
    .from('content_submissions')
    .update({
      status: 'spam',
      spam_score: 1.0,
      spam_reasons: [reason],
      moderated_at: new Date().toISOString(),
      moderator_notes: `Marked as spam: ${reason}`,
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) {
    console.error('❌ Error marking as spam:', error.message);
    process.exit(1);
  }

  console.log(`🚫 Submission marked as spam: ${data.name}`);
}

/**
 * Merge an approved submission to the content table (Database-First via RPC)
 */
async function mergeSubmission(submissionId: string) {
  console.log(`\n🔀 Merging submission ${submissionId} to content table...\n`);

  // Call database RPC function (ALL logic in PostgreSQL)
  const { data, error } = await supabase.rpc('merge_submission_to_content', {
    p_submission_id: submissionId,
  });

  if (error) {
    console.error('❌ Error merging submission:', error.message);
    process.exit(1);
  }

  const result = data as {
    success: boolean;
    content_id: string;
    slug: string;
    url: string;
    category: string;
    name: string;
  };

  console.log('✅ Submission merged successfully!');
  console.log(`   Content ID: ${result.content_id}`);
  console.log(`   Slug: ${result.slug}`);
  console.log(`   URL: https://claudepro.directory${result.url}`);
}

/**
 * Bulk approve submissions
 */
async function bulkApprove(submissionIds: string[], notes?: string) {
  console.log(`\n✅ Bulk approving ${submissionIds.length} submissions...\n`);

  const { data, error } = await supabase
    .from('content_submissions')
    .update({
      status: 'approved',
      moderated_at: new Date().toISOString(),
      moderator_notes: notes || null,
    })
    .in('id', submissionIds)
    .select('id, name');

  if (error) {
    console.error('❌ Error bulk approving:', error.message);
    process.exit(1);
  }

  console.log(`✅ Approved ${data.length} submissions:`);
  for (const sub of data) {
    console.log(`   - ${sub.name} (${sub.id.slice(0, 8)})`);
  }
}

/**
 * Get emoji for submission status
 */
function getStatusEmoji(status: SubmissionStatus): string {
  const emojiMap: Record<SubmissionStatus, string> = {
    pending: '⏳',
    approved: '✅',
    rejected: '❌',
    spam: '🚫',
    merged: '🔀',
  };
  return emojiMap[status] || '📄';
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
📋 Content Submission Review Tool - Admin CLI

USAGE:
  pnpm admin:submissions:list [status] [limit]
  pnpm admin:submissions:show <id>
  pnpm admin:submissions:approve <id> [notes]
  pnpm admin:submissions:reject <id> <reason>
  pnpm admin:submissions:spam <id> <reason>
  pnpm admin:submissions:merge <id>
  pnpm admin:submissions:bulk-approve <id1,id2,id3> [notes]

COMMANDS:
  list [status] [limit]          List submissions (default: all statuses, limit 20)
  show <id>                      Show detailed submission info
  approve <id> [notes]           Approve a submission
  reject <id> <reason>           Reject a submission with reason
  spam <id> <reason>             Mark submission as spam
  merge <id>                     Merge approved submission to content table
  bulk-approve <ids> [notes]     Approve multiple submissions (comma-separated IDs)

STATUS OPTIONS:
  pending, approved, rejected, spam, merged

EXAMPLES:
  pnpm admin:submissions:list pending
  pnpm admin:submissions:show abc123def
  pnpm admin:submissions:approve abc123def "Great contribution!"
  pnpm admin:submissions:reject abc123def "Does not meet quality standards"
  pnpm admin:submissions:spam abc123def "Promotional content"
  pnpm admin:submissions:merge abc123def
  pnpm admin:submissions:bulk-approve abc123,def456,ghi789 "Batch approval"

ENVIRONMENT:
  NEXT_PUBLIC_SUPABASE_URL       Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY      Service role key (admin access)
`);
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  try {
    switch (command) {
      case 'list':
        await listSubmissions(
          args[1] as SubmissionStatus | undefined,
          Number.parseInt(args[2]) || 20
        );
        break;

      case 'show':
        if (!args[1]) {
          console.error('❌ Missing submission ID');
          process.exit(1);
        }
        await showSubmission(args[1]);
        break;

      case 'approve':
        if (!args[1]) {
          console.error('❌ Missing submission ID');
          process.exit(1);
        }
        await approveSubmission(args[1], args[2]);
        break;

      case 'reject':
        if (!(args[1] && args[2])) {
          console.error('❌ Missing submission ID or reason');
          process.exit(1);
        }
        await rejectSubmission(args[1], args[2]);
        break;

      case 'spam':
        if (!(args[1] && args[2])) {
          console.error('❌ Missing submission ID or reason');
          process.exit(1);
        }
        await markAsSpam(args[1], args[2]);
        break;

      case 'merge':
        if (!args[1]) {
          console.error('❌ Missing submission ID');
          process.exit(1);
        }
        await mergeSubmission(args[1]);
        break;

      case 'bulk-approve':
        if (!args[1]) {
          console.error('❌ Missing submission IDs (comma-separated)');
          process.exit(1);
        }
        await bulkApprove(
          args[1].split(',').map((id) => id.trim()),
          args[2]
        );
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('\nRun with --help to see available commands');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

main();
