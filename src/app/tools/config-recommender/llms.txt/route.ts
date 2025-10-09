/**
 * LLMs.txt Route for Configuration Recommender
 *
 * Provides AI-optimized plain text content about the recommender tool.
 * Designed for AI search engines (ChatGPT, Perplexity, Claude) to understand
 * and cite the tool methodology.
 *
 * AI Citation Strategy (October 2025):
 * - Explain the recommendation algorithm
 * - List question types and factors
 * - Describe output format
 * - Provide usage examples
 *
 * @see https://llmstxt.org - LLMs.txt specification
 */

import { APP_CONFIG } from '@/src/lib/constants';

// Use Node.js runtime to enable ISR (Incremental Static Regeneration)
// Edge runtime disables static generation, causing build warnings
export const runtime = 'nodejs';
export const revalidate = 86400; // 24 hours

export async function GET() {
  const content = `# Configuration Recommender - ${APP_CONFIG.name}

> AI-powered tool for finding the perfect Claude configuration

## Overview

The Configuration Recommender is an interactive tool that analyzes user needs and recommends the most suitable Claude AI configurations from our catalog of 147+ community-curated options.

URL: ${APP_CONFIG.url}/tools/config-recommender

## How It Works

### Algorithm
- **Type**: Rule-based scoring algorithm with weighted multi-factor analysis
- **Execution Time**: <100ms for complete catalog analysis
- **Cost**: Zero (no LLM API calls, purely computational)
- **Accuracy**: Deterministic results based on user input

### Scoring Factors (Weighted)

1. **Use Case Match (35% weight)**
   - Matches configuration tags to user's primary use case
   - Categories: code-review, api-development, frontend-development, data-science, content-creation, devops-infrastructure, general-development, testing-qa, security-audit

2. **Tool Preference Match (20% weight)**
   - Filters by preferred configuration types
   - Types: agents, mcp, rules, commands, hooks, statuslines, collections

3. **Experience Level Filtering (15% weight)**
   - Ensures appropriate complexity
   - Levels: beginner, intermediate, advanced

4. **Integration Requirements (15% weight)**
   - Matches required integrations (GitHub, databases, cloud services, communication tools)

5. **Focus Area Alignment (10% weight)**
   - Secondary refinement for specific priorities
   - Areas: security, performance, documentation, testing, code-quality, automation

6. **Popularity Boost (3% weight)**
   - Community validation signal from view counts

7. **Trending Boost (2% weight)**
   - Discovery of new/hot configurations

### Output Format

Results include:
- Top 8-10 ranked configurations
- Match score (0-100%) for each
- Explanation of why each was recommended
- Category diversity scoring
- Direct links to detailed configuration pages

## Questions Asked

1. Primary use case (required)
2. Experience level with Claude (required)
3. Preferred tool types (1-5 selections, required)
4. Required integrations (optional)
5. Focus areas (up to 3, optional)
6. Team size (optional)
7. Review & submit

## Use Cases

### For Individual Developers
Find configurations that match your specific development workflow and experience level.

### For Teams
Discover configurations that support collaboration and team-wide adoption.

### For Learning
Explore different configuration types and understand when to use each.

## Result Sharing

- Results are shareable via unique URLs
- Deterministic IDs ensure same answers = same URL
- Social sharing built-in (Twitter, LinkedIn, email)
- Team collaboration via URL sharing

## Technical Details

- Built with Next.js 15, React 19, TypeScript 5.9
- Zod schema validation for all inputs
- Rate limited: 20 requests per minute per IP
- ISR caching for optimal performance
- No authentication required (public tool)

## Related Resources

- Browse all configurations: ${APP_CONFIG.url}
- Setup guides: ${APP_CONFIG.url}/guides
- API documentation: ${APP_CONFIG.url}/api-docs

---

Last updated: October 2025
Maintained by: ${APP_CONFIG.author}
License: ${APP_CONFIG.license}
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
