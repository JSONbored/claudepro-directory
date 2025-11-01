/**
 * Discovery Workflow - Database-First Content Discovery
 * All logic in PostgreSQL via content_submissions RPC functions.
 */

import type { CategoryId } from '@/src/lib/config/category-types';
import type { Database } from '@/src/types/database.types';

/**
 * Discovery Metadata Type (matches database JSONB structure)
 * Stored in content.discovery_metadata (JSONB column)
 */
export interface DiscoveryMetadata {
  researchDate: string;
  trendingSources: Array<{
    source: string;
    evidence: string;
    url?: string;
    relevanceScore?: 'high' | 'medium' | 'low';
  }>;
  keywordResearch: {
    primaryKeywords: string[];
    searchVolume: 'high' | 'medium' | 'low' | 'unknown';
    competitionLevel: 'high' | 'medium' | 'low' | 'unknown';
  };
  gapAnalysis: {
    existingContent: string[];
    identifiedGap: string;
    priority: 'high' | 'medium' | 'low';
  };
  approvalRationale: string;
}

/**
 * Discovery Workflow Instructions
 *
 * This function provides step-by-step instructions for the discovery process.
 * Claude should follow these steps and document findings in discoveryMetadata.
 *
 * @param category - Content category to research
 * @returns Instructions for completing discovery research
 */
export function getDiscoveryInstructions(category: CategoryId): string {
  return `
🔍 MANDATORY DISCOVERY WORKFLOW for ${category}
===============================================

You CANNOT create content without completing this discovery research.
Document all findings in the discoveryMetadata field.

📋 STEP 1: Discover Trending Topics (REQUIRED)
------------------------------------------------
Search AT LEAST 2 of these sources:

1. **GitHub Trending** (weight: 0.35)
   - Search: https://github.com/trending
   - Look for: Trending repos related to ${category}
   - Document: Repo name, stars, what it does

2. **Reddit Programming** (weight: 0.30)
   - Search: r/programming, r/webdev, r/javascript, r/typescript
   - Look for: Popular discussions, upvoted posts
   - Document: Thread title, upvotes, key points

3. **Hacker News** (weight: 0.20)
   - Search: https://news.ycombinator.com/
   - Look for: Front page items, highly commented
   - Document: Post title, points, comments

4. **Dev.to** (weight: 0.15)
   - Search: https://dev.to/
   - Look for: Trending articles, high reactions
   - Document: Article title, reactions, topic

REQUIRED OUTPUT: trendingSources array with minimum 2 entries
Each entry must have: source, evidence, url (optional)

📊 STEP 2: Keyword Research (REQUIRED)
---------------------------------------
Validate search demand for your topic:

1. **Primary Keywords**
   - What keywords would users search?
   - Example for Biome: ["biome linter", "biome configuration", "biome vs eslint"]

2. **Search Volume** (estimate based on research)
   - high: Trending topic, lots of discussion
   - medium: Some discussion, growing interest
   - low: Niche topic, limited discussion
   - unknown: Unable to determine

3. **Competition Level** (how much content exists)
   - high: Many existing resources
   - medium: Some existing resources
   - low: Few existing resources
   - unknown: Unable to determine

REQUIRED OUTPUT: keywordResearch object with primaryKeywords, searchVolume, competitionLevel

📈 STEP 3: Gap Analysis (REQUIRED)
-----------------------------------
Identify what content gap this fills:

1. **Existing Content**
   - List existing content slugs in this category
   - Example: Check content/${category}/ directory
   - Document: What already exists that's similar

2. **Identified Gap**
   - What's missing that this content will provide?
   - Why is this valuable vs what exists?
   - Minimum 50 characters, maximum 500

3. **Priority**
   - high: Critical gap, high demand, no alternatives
   - medium: Useful gap, moderate demand
   - low: Nice-to-have gap, low demand

REQUIRED OUTPUT: gapAnalysis object with existingContent, identifiedGap, priority

✅ STEP 4: User Approval (REQUIRED)
------------------------------------
Present findings to user and get approval:

1. Show trending sources found
2. Show keyword research results
3. Show gap analysis
4. Ask: "Should I create content for [topic]?"
5. Document their approval rationale (100-500 chars)

REQUIRED OUTPUT: approvalRationale string (100-500 chars)

📝 FINAL STEP: Create discoveryMetadata
-----------------------------------------
After completing all 4 steps, create the discoveryMetadata field:

{
  "discoveryMetadata": {
    "researchDate": "2025-10-19",
    "trendingSources": [
      {
        "source": "github_trending",
        "evidence": "biomejs/biome - 10k stars, trending #1 in TypeScript",
        "url": "https://github.com/biomejs/biome",
        "relevanceScore": "high"
      },
      {
        "source": "reddit_programming",
        "evidence": "Post: 'Migrating from ESLint to Biome' - 450 upvotes",
        "url": "https://reddit.com/r/programming/...",
        "relevanceScore": "high"
      }
    ],
    "keywordResearch": {
      "primaryKeywords": ["biome linter", "biome configuration", "biome vs eslint"],
      "searchVolume": "high",
      "competitionLevel": "medium"
    },
    "gapAnalysis": {
      "existingContent": ["typescript-5x-strict-mode-expert"],
      "identifiedGap": "No existing content covers Biome-specific linting configuration. TypeScript content focuses on tsc, not Biome's unified toolchain. Growing adoption of Biome needs dedicated configuration guidance.",
      "priority": "high"
    },
    "approvalRationale": "Biome is trending heavily on GitHub and Reddit. High search volume with medium competition. Clear gap - existing content covers ESLint/TypeScript but not Biome's modern approach. User approved."
  }
}

🚫 VALIDATION WILL FAIL WITHOUT THIS FIELD
============================================
The schema REQUIRES discoveryMetadata. Content cannot be created without it.
This enforces evidence-based content creation instead of assumptions.
`;
}

/**
 * Validate Discovery Metadata Quality
 *
 * Additional validation beyond schema to ensure discovery is thorough.
 *
 * @param discovery - Discovery metadata to validate
 * @returns Validation result with quality warnings
 */
export function validateDiscoveryQuality(discovery: DiscoveryMetadata): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check trending sources quality
  if (discovery.trendingSources.length < 3) {
    warnings.push(
      'Discovery: Only 2 trending sources provided. Recommend 3+ for better validation.'
    );
  }

  const sourcesWithUrls = discovery.trendingSources.filter((s) => s.url);
  if (sourcesWithUrls.length < discovery.trendingSources.length / 2) {
    warnings.push(
      'Discovery: Less than 50% of trending sources have URLs. Add links for verification.'
    );
  }

  const highRelevanceSources = discovery.trendingSources.filter((s) => s.relevanceScore === 'high');
  if (highRelevanceSources.length === 0) {
    warnings.push(
      'Discovery: No high-relevance sources found. This topic may not be trending enough.'
    );
  }

  // Check keyword research
  if (discovery.keywordResearch.searchVolume === 'unknown') {
    warnings.push(
      'Keyword Research: Search volume is unknown. Try to estimate based on discussion.'
    );
  }

  if (discovery.keywordResearch.competitionLevel === 'unknown') {
    warnings.push('Keyword Research: Competition level is unknown. Check existing content.');
  }

  if (
    discovery.keywordResearch.searchVolume === 'low' &&
    discovery.gapAnalysis.priority !== 'low'
  ) {
    warnings.push(
      'Mismatch: Low search volume but high/medium priority. Reconsider priority level.'
    );
  }

  // Check gap analysis
  if (discovery.gapAnalysis.existingContent.length === 0) {
    warnings.push('Gap Analysis: No existing content listed. Are you sure nothing similar exists?');
  }

  if (discovery.gapAnalysis.identifiedGap.length < 100) {
    warnings.push(
      'Gap Analysis: Gap description is short (<100 chars). Provide more detail on what makes this unique.'
    );
  }

  // Check approval rationale
  if (discovery.approvalRationale.length < 150) {
    warnings.push(
      'Approval: Rationale is short (<150 chars). Provide more justification for topic selection.'
    );
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Format Discovery Report
 *
 * Creates a formatted report of discovery findings for user approval.
 *
 * @param discovery - Discovery metadata to format
 * @returns Formatted markdown report
 */
export function formatDiscoveryReport(discovery: DiscoveryMetadata): string {
  const lines: string[] = [];

  lines.push('# Discovery Research Report');
  lines.push('');
  lines.push(`**Research Date:** ${discovery.researchDate}`);
  lines.push('');

  // Trending Sources
  lines.push('## Trending Sources');
  lines.push('');
  for (const source of discovery.trendingSources) {
    lines.push(`### ${source.source}`);
    lines.push(`- **Evidence:** ${source.evidence}`);
    if (source.url) lines.push(`- **URL:** ${source.url}`);
    if (source.relevanceScore) lines.push(`- **Relevance:** ${source.relevanceScore}`);
    lines.push('');
  }

  // Keyword Research
  lines.push('## Keyword Research');
  lines.push('');
  lines.push(`- **Primary Keywords:** ${discovery.keywordResearch.primaryKeywords.join(', ')}`);
  lines.push(`- **Search Volume:** ${discovery.keywordResearch.searchVolume}`);
  lines.push(`- **Competition:** ${discovery.keywordResearch.competitionLevel}`);
  lines.push('');

  // Gap Analysis
  lines.push('## Gap Analysis');
  lines.push('');
  lines.push(`**Priority:** ${discovery.gapAnalysis.priority}`);
  lines.push('');
  lines.push(`**Existing Content (${discovery.gapAnalysis.existingContent.length}):**`);
  for (const slug of discovery.gapAnalysis.existingContent) {
    lines.push(`- ${slug}`);
  }
  lines.push('');
  lines.push('**Identified Gap:**');
  lines.push(discovery.gapAnalysis.identifiedGap);
  lines.push('');

  // Approval Rationale
  lines.push('## Approval Rationale');
  lines.push('');
  lines.push(discovery.approvalRationale);
  lines.push('');

  // Quality warnings
  const qualityCheck = validateDiscoveryQuality(discovery);
  if (qualityCheck.warnings.length > 0) {
    lines.push('## ⚠️ Quality Warnings');
    lines.push('');
    for (const warning of qualityCheck.warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Build Database Payload for RPC Submission
 *
 * Converts discovery metadata and content data to submit_content_for_review parameters.
 * Uses generated Database types for type safety.
 *
 * @param params - Content and discovery data
 * @returns Parameters for submit_content_for_review RPC function
 */
export function buildDatabasePayload(params: {
  category: CategoryId;
  name: string;
  description: string;
  author: string;
  contentData: Record<string, unknown>;
  discoveryMetadata: DiscoveryMetadata;
  authorProfileUrl?: string;
  githubUrl?: string;
  tags?: string[];
}): {
  p_submission_type: string;
  p_name: string;
  p_description: string;
  p_category: string;
  p_author: string;
  p_content_data: Record<string, unknown>;
  p_author_profile_url?: string;
  p_github_url?: string;
  p_tags?: string[];
} {
  return {
    p_submission_type: params.category,
    p_name: params.name,
    p_description: params.description,
    p_category: params.category,
    p_author: params.author,
    p_content_data: {
      ...params.contentData,
      discovery_metadata: params.discoveryMetadata,
    },
    p_author_profile_url: params.authorProfileUrl,
    p_github_url: params.githubUrl,
    p_tags: params.tags || [],
  };
}
