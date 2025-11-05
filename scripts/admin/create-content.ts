#!/usr/bin/env tsx

/**
 * Admin CLI - Database-First Content Creation Tool
 * Interactive discovery workflow → RPC submission → Discord announcement
 */

import * as readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import type { DiscoveryMetadata } from '@/config/content/discovery/run-discovery';
import {
  buildDatabasePayload,
  formatDiscoveryReport,
  validateDiscoveryQuality,
} from '@/config/content/discovery/run-discovery';
import { type CategoryId, isValidCategory } from '@/src/lib/config/category-config';
import type { Database } from '@/src/types/database.types';
import { ensureEnvVars } from '../utils/env.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Environment setup
await ensureEnvVars(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function prompt(question: string): Promise<string> {
  const answer = await rl.question(`${question} `);
  return answer.trim();
}

async function confirm(question: string): Promise<boolean> {
  const answer = await prompt(`${question} (y/n):`);
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

/**
 * Main CLI workflow
 */
async function main() {
  console.log('\n🎯 Database-First Content Creation Tool\n');
  console.log('This tool guides you through evidence-based content discovery.\n');

  // Get basic content info
  const categoryInput = await prompt(
    '📁 Category (agents/mcp/commands/rules/hooks/statuslines/skills/collections/guides):'
  );

  if (!isValidCategory(categoryInput)) {
    console.error(`❌ Invalid category: ${categoryInput}`);
    process.exit(1);
  }

  const category: CategoryId = categoryInput;
  const name = await prompt('📝 Content Name:');
  const description = await prompt('📄 Description:');
  const author = await prompt('👤 Author:');
  const authorProfileUrl = await prompt('🔗 Author Profile URL (optional):');
  const githubUrl = await prompt('📦 GitHub URL (optional):');
  const tagsInput = await prompt('🏷️  Tags (comma-separated):');
  const tags = tagsInput
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  console.log('\n🔍 Starting Discovery Workflow...\n');

  // Step 1: Trending Sources
  console.log('📋 STEP 1: Trending Sources Research');
  console.log('Search at least 2 sources: GitHub Trending, Reddit, Hacker News, Dev.to\n');

  const trendingSources: DiscoveryMetadata['trendingSources'] = [];
  let addMore = true;

  while (addMore) {
    const source = await prompt('Source (github_trending/reddit_programming/hacker_news/dev_to):');
    const evidence = await prompt('Evidence (what you found):');
    const url = await prompt('URL (optional):');
    const relevanceScore = await prompt('Relevance (high/medium/low):');

    trendingSources.push({
      source,
      evidence,
      url: url || undefined,
      relevanceScore: (relevanceScore as 'high' | 'medium' | 'low') || undefined,
    });

    addMore = await confirm('Add another source?');
  }

  // Step 2: Keyword Research
  console.log('\n📊 STEP 2: Keyword Research\n');

  const keywordsInput = await prompt('Primary keywords (comma-separated):');
  const primaryKeywords = keywordsInput
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  const searchVolume = await prompt('Search volume (high/medium/low/unknown):');
  const competitionLevel = await prompt('Competition level (high/medium/low/unknown):');

  // Step 3: Gap Analysis
  console.log('\n📈 STEP 3: Gap Analysis\n');

  const existingContentInput = await prompt('Existing similar content slugs (comma-separated):');
  const existingContent = existingContentInput
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const identifiedGap = await prompt("Identified gap (what's missing):");
  const priority = await prompt('Priority (high/medium/low):');

  // Step 4: Approval Rationale
  console.log('\n✅ STEP 4: Approval\n');

  const discoveryMetadata: DiscoveryMetadata = {
    researchDate: new Date().toISOString().split('T')[0],
    trendingSources,
    keywordResearch: {
      primaryKeywords,
      searchVolume: searchVolume as 'high' | 'medium' | 'low' | 'unknown',
      competitionLevel: competitionLevel as 'high' | 'medium' | 'low' | 'unknown',
    },
    gapAnalysis: {
      existingContent,
      identifiedGap,
      priority: priority as 'high' | 'medium' | 'low',
    },
    approvalRationale: '', // Will be filled after approval
  };

  // Show discovery report
  console.log(`\n${formatDiscoveryReport(discoveryMetadata)}`);

  // Quality validation (warnings only)
  const qualityCheck = validateDiscoveryQuality(discoveryMetadata);
  if (qualityCheck.warnings.length > 0) {
    console.log('\n⚠️  Quality Warnings (proceeding anyway):');
    for (const w of qualityCheck.warnings) {
      console.log(`   - ${w}`);
    }
  }

  const approved = await confirm('\nApprove and create this content?');
  if (!approved) {
    console.log('❌ Content creation cancelled');
    rl.close();
    return;
  }

  const approvalRationale = await prompt('Approval rationale (why create this):');
  discoveryMetadata.approvalRationale = approvalRationale;

  // Build content data
  const contentData = {
    // Add any category-specific fields here
    // For now, just the discovery metadata
  };

  // Build RPC payload
  const payload = buildDatabasePayload({
    category,
    name,
    description,
    author,
    contentData,
    discoveryMetadata,
    authorProfileUrl: authorProfileUrl || undefined,
    githubUrl: githubUrl || undefined,
    tags,
  });

  console.log('\n🚀 Submitting to database...\n');

  // Call submit_content_for_review RPC
  const { data: submission, error: submitError } = await supabase.rpc(
    'submit_content_for_review',
    payload
  );

  if (submitError || !submission) {
    console.error('❌ Submission failed:', submitError?.message);
    rl.close();
    return;
  }

  console.log('✅ Submission created:', submission);

  // Auto-merge if approved (or ask for confirmation)
  const shouldMerge = await confirm('\nMerge to content table now?');
  if (!shouldMerge) {
    console.log(
      'ℹ️  Submission created but not merged. Use admin:submissions:merge to merge later.'
    );
    rl.close();
    return;
  }

  // Call merge_submission_to_content RPC
  const submissionData = submission as { id: string };
  const { data: merged, error: mergeError } = await supabase.rpc('merge_submission_to_content', {
    p_submission_id: submissionData.id,
  });

  if (mergeError || !merged) {
    console.error('❌ Merge failed:', mergeError?.message);
    rl.close();
    return;
  }

  console.log('\n🎉 Content published!', merged);
  console.log('\n📢 Discord announcement will be sent automatically via Edge Function\n');

  rl.close();
}

main().catch((error) => {
  console.error('❌ Error:', error);
  rl.close();
  process.exit(1);
});
