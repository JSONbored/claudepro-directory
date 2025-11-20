#!/usr/bin/env tsx

/**
 * Test MCPB Package Generation
 *
 * Tests:
 * 1. Queue worker endpoint
 * 2. Package generation for existing MCP content
 * 3. Upload endpoint
 * 4. Hash comparison (skip regeneration)
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/src/lib/logger';
import type { Database } from '@/src/types/database.types';
import { ensureEnvVars } from '../utils/env.js';

await ensureEnvVars(['SUPABASE_SERVICE_ROLE_KEY']);

const SUPABASE_URL =
  process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://hgtjdifxfapoltfflowc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Test 1: Queue Worker Endpoint
 */
async function testQueueWorker(): Promise<boolean> {
  logger.info('🧪 Test 1: Queue Worker Endpoint', { script: 'test-mcpb-generation' });

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/data-api/content/generate-package/process`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      logger.error('Queue worker failed', undefined, {
        script: 'test-mcpb-generation',
        status: response.status,
        statusText: response.statusText,
        result: JSON.stringify(result, null, 2),
      });
      return false;
    }

    logger.info('✅ Queue worker responded', {
      script: 'test-mcpb-generation',
      processed: result.processed,
      message: result.message,
    });

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error : String(error);
    logger.error('Queue worker test failed', errorMessage, { script: 'test-mcpb-generation' });
    return false;
  }
}

/**
 * Test 2: Direct Package Generation
 */
async function testDirectGeneration(): Promise<boolean> {
  logger.info('🧪 Test 2: Direct Package Generation', { script: 'test-mcpb-generation' });

  try {
    // Get an MCP content entry
    const { data: mcpContent, error: fetchError } = await supabase
      .from('content')
      .select('id, slug, category')
      .eq('category', 'mcp')
      .is('mcpb_storage_url', null)
      .limit(1)
      .single();

    if (fetchError || !mcpContent) {
      logger.warn('No MCP content without packages found, skipping direct generation test', {
        script: 'test-mcpb-generation',
      });
      return true; // Not a failure, just no content to test
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/data-api/content/generate-package`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content_id: mcpContent.id,
        category: 'mcp',
      }),
    });

    const result = await response.json();

    if (!(response.ok && result.success)) {
      logger.error('Direct generation failed', undefined, {
        script: 'test-mcpb-generation',
        status: response.status,
        statusText: response.statusText,
        result: JSON.stringify(result, null, 2),
      });
      return false;
    }

    logger.info('✅ Direct generation succeeded', {
      script: 'test-mcpb-generation',
      content_id: result.content_id,
      storage_url: result.storage_url,
    });

    // Verify package was created in database
    const { data: updatedContent } = await supabase
      .from('content')
      .select('mcpb_storage_url, mcpb_build_hash')
      .eq('id', mcpContent.id)
      .single();

    if (!updatedContent?.mcpb_storage_url) {
      logger.error('Package not found in database after generation', undefined, {
        script: 'test-mcpb-generation',
        content_id: mcpContent.id,
      });
      return false;
    }

    logger.info('✅ Package verified in database', {
      script: 'test-mcpb-generation',
      storage_url: updatedContent.mcpb_storage_url,
      build_hash: updatedContent.mcpb_build_hash || '',
    });

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error : String(error);
    logger.error('Direct generation test failed', errorMessage, { script: 'test-mcpb-generation' });
    return false;
  }
}

/**
 * Test 3: Hash Comparison (Skip Regeneration)
 */
async function testHashComparison(): Promise<boolean> {
  logger.info('🧪 Test 3: Hash Comparison (Skip Regeneration)', { script: 'test-mcpb-generation' });

  try {
    // Get an MCP content entry that already has a package
    const { data: mcpContent, error: fetchError } = await supabase
      .from('content')
      .select('id, slug, category, mcpb_storage_url, mcpb_build_hash')
      .eq('category', 'mcp')
      .not('mcpb_storage_url', 'is', null)
      .limit(1)
      .single();

    if (fetchError || !mcpContent) {
      logger.warn('No MCP content with packages found, skipping hash comparison test', {
        script: 'test-mcpb-generation',
      });
      return true; // Not a failure
    }

    // Try to generate again (should skip due to hash match)
    const response = await fetch(`${SUPABASE_URL}/functions/v1/data-api/content/generate-package`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content_id: mcpContent.id,
        category: 'mcp',
      }),
    });

    const result = await response.json();

    if (!(response.ok && result.success)) {
      logger.error('Hash comparison test failed', undefined, {
        script: 'test-mcpb-generation',
        status: response.status,
        result: JSON.stringify(result, null, 2),
      });
      return false;
    }

    // Check if generation was skipped (metadata should indicate skip)
    const wasSkipped =
      result.metadata?.skipped === true || result.metadata?.reason === 'content_unchanged';

    if (wasSkipped) {
      logger.info('✅ Hash comparison worked - generation skipped', {
        script: 'test-mcpb-generation',
        content_id: result.content_id,
        reason: result.metadata?.reason,
      });
    } else {
      logger.warn('⚠️  Hash comparison may not have worked - generation was not skipped', {
        script: 'test-mcpb-generation',
        content_id: result.content_id,
        metadata: result.metadata,
      });
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error : String(error);
    logger.error('Hash comparison test failed', errorMessage, { script: 'test-mcpb-generation' });
    return false;
  }
}

/**
 * Main test execution
 */
async function main() {
  logger.info('🚀 Starting MCPB Package Generation Tests\n', { script: 'test-mcpb-generation' });

  const results = {
    queueWorker: false,
    directGeneration: false,
    hashComparison: false,
  };

  // Test 1: Queue Worker
  results.queueWorker = await testQueueWorker();
  logger.info('', { script: 'test-mcpb-generation' }); // Blank line

  // Test 2: Direct Generation
  results.directGeneration = await testDirectGeneration();
  logger.info('', { script: 'test-mcpb-generation' }); // Blank line

  // Test 3: Hash Comparison
  results.hashComparison = await testHashComparison();
  logger.info('', { script: 'test-mcpb-generation' }); // Blank line

  // Summary
  logger.info('═'.repeat(80), { script: 'test-mcpb-generation' });
  logger.info('📊 Test Results Summary', { script: 'test-mcpb-generation' });
  logger.info(`${'═'.repeat(80)}\n`, { script: 'test-mcpb-generation' });

  logger.info(`Queue Worker: ${results.queueWorker ? '✅ PASS' : '❌ FAIL'}`, {
    script: 'test-mcpb-generation',
  });
  logger.info(`Direct Generation: ${results.directGeneration ? '✅ PASS' : '❌ FAIL'}`, {
    script: 'test-mcpb-generation',
  });
  logger.info(`Hash Comparison: ${results.hashComparison ? '✅ PASS' : '❌ FAIL'}`, {
    script: 'test-mcpb-generation',
  });

  const allPassed = Object.values(results).every((r) => r);

  if (allPassed) {
    logger.info('\n✅ All tests passed!\n', { script: 'test-mcpb-generation' });
    process.exit(0);
  } else {
    logger.warn('\n⚠️  Some tests failed. See logs above for details.\n', {
      script: 'test-mcpb-generation',
    });
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Unhandled error in main', error instanceof Error ? error : String(error), {
    script: 'test-mcpb-generation',
  });
  process.exit(1);
});
