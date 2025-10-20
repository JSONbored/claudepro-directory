/**
 * Trending Calculation Cron Job
 * 
 * OPTIMIZATION: Pre-calculate trending content every 15 minutes
 * Centralizes Redis queries instead of calculating on-demand per page load
 * 
 * Triggered by: Vercel Cron (vercel.json)
 * Schedule: Every 15 minutes
 * 
 * Saves: ~2,000 Redis commands/day by computing once and caching results
 */

import { NextResponse } from 'next/server';
import {
  agents,
  collections,
  commands,
  hooks,
  mcp,
  rules,
  skills,
  statuslines,
} from '@/generated/content';
import { contentCache } from '@/src/lib/cache.server';
import { logger } from '@/src/lib/logger';
import { getBatchTrendingData } from '@/src/lib/trending/calculator.server';
import { batchLoadContent } from '@/src/lib/utils/batch.utils';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max execution

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Trending calculation cron started');

    // Load all content
    const {
      rules: rulesData,
      mcp: mcpData,
      agents: agentsData,
      commands: commandsData,
      hooks: hooksData,
      statuslines: statuslinesData,
      collections: collectionsData,
      skills: skillsData,
    } = await batchLoadContent({
      rules,
      mcp,
      agents,
      commands,
      hooks,
      statuslines,
      collections,
      skills,
    });

    // Calculate trending data (this does the Redis queries)
    const trendingData = await getBatchTrendingData(
      {
        agents: agentsData.map((item: { [key: string]: unknown }) => ({
          ...item,
          category: 'agents' as const,
        })),
        mcp: mcpData.map((item: { [key: string]: unknown }) => ({
          ...item,
          category: 'mcp' as const,
        })),
        rules: rulesData.map((item: { [key: string]: unknown }) => ({
          ...item,
          category: 'rules' as const,
        })),
        commands: commandsData.map((item: { [key: string]: unknown }) => ({
          ...item,
          category: 'commands' as const,
        })),
        hooks: hooksData.map((item: { [key: string]: unknown }) => ({
          ...item,
          category: 'hooks' as const,
        })),
        statuslines: statuslinesData.map((item: { [key: string]: unknown }) => ({
          ...item,
          category: 'statuslines' as const,
        })),
        collections: collectionsData.map((item: { [key: string]: unknown }) => ({
          ...item,
          category: 'collections' as const,
        })),
        skills: skillsData.map((item: { [key: string]: unknown }) => ({
          ...item,
          category: 'skills' as const,
        })),
      },
      { includeSponsored: true }
    );

    // Store in cache for 15 minutes
    await contentCache.set(
      'trending:all',
      {
        trending: trendingData.trending,
        popular: trendingData.popular,
        recent: trendingData.recent,
        metadata: trendingData.metadata,
        calculatedAt: new Date().toISOString(),
      },
      900 // 15 minutes TTL
    );

    logger.info('Trending calculation completed', {
      trendingCount: trendingData.trending.length,
      popularCount: trendingData.popular.length,
      recentCount: trendingData.recent.length,
    });

    return NextResponse.json({
      success: true,
      counts: {
        trending: trendingData.trending.length,
        popular: trendingData.popular.length,
        recent: trendingData.recent.length,
      },
    });
  } catch (error) {
    logger.error(
      'Trending calculation cron failed',
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      { error: 'Trending calculation failed' },
      { status: 500 }
    );
  }
}
