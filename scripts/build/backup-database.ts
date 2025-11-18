#!/usr/bin/env tsx

/**
 * Optimized Supabase Database Backup Script
 * Reduces egress by checking hash BEFORE dumping, compresses output
 * Uploads to Cloudflare R2 for offsite storage
 */

import { type ExecException, execSync } from 'node:child_process';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/src/lib/logger';
import { computeHash, hasHashChanged, setHash } from '../utils/build-cache.js';
import { ensureEnvVars } from '../utils/env.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');
const LATEST_BACKUP_DIR = join(ROOT, 'backups/latest');

const forceBackup = process.argv.includes('--force');

logger.info('🔒 Starting optimized incremental database backup...\n', {
  script: 'backup-database',
});

// ============================================================================
// Load environment and create Supabase client
// ============================================================================
await ensureEnvVars([
  'POSTGRES_URL_NON_POOLING',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
]);

// Properly handle environment variables with type safety
const dbUrl = process.env.POSTGRES_URL_NON_POOLING;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!(dbUrl && supabaseUrl && supabaseKey)) {
  throw new Error('Required environment variables are missing after ensureEnvVars');
}

const r2AccessKey = process.env.R2_ACCESS_KEY_ID;
const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY;
const r2Endpoint = process.env.R2_ENDPOINT;
const r2Bucket = process.env.R2_BUCKET_NAME;
const heartbeatUrl = process.env.BETTERSTACK_HEARTBEAT_DB_BACKUP;

// Initialize R2 client if credentials available
let r2Client: S3Client | null = null;
if (r2AccessKey && r2SecretKey && r2Endpoint && r2Bucket) {
  r2Client = new S3Client({
    region: 'auto',
    endpoint: r2Endpoint,
    credentials: {
      accessKeyId: r2AccessKey,
      secretAccessKey: r2SecretKey,
    },
  });
  logger.info('   ✓ R2 upload enabled', { script: 'backup-database' });
} else {
  logger.warn('   ⚠️  R2 credentials not found - skipping offsite backup', {
    script: 'backup-database',
  });
}

// ============================================================================
// OPTIMIZATION 1: Check database state hash BEFORE dumping (lightweight query)
// ============================================================================
logger.info('🔍 Checking database state (lightweight metadata query)...', {
  script: 'backup-database',
});

let currentHash: string;

if (supabaseUrl && supabaseKey) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get lightweight database state fingerprint (table row counts + modification times)
    // NOTE: Fingerprint includes last_vacuum timestamps which change frequently,
    // so hash may differ even without data changes. This is acceptable for backups.
    // This is ~1KB query vs ~50MB full dump - 50,000x less egress!
    const { data, error } = await supabase.rpc('get_database_fingerprint');

    if (error) throw error;

    // Create hash from fingerprint
    currentHash = computeHash(data);

    logger.info('   ✓ Using database fingerprint for change detection', {
      script: 'backup-database',
    });
  } catch (error) {
    logger.warn(`   ⚠️  Fingerprint RPC error: ${error instanceof Error ? error.message : error}`, {
      script: 'backup-database',
    });
    logger.info('   → Falling back to pg_dump hash', { script: 'backup-database' });
    currentHash = ''; // Will trigger full dump below
  }
} else {
  logger.warn('   ⚠️  Supabase credentials not found, using pg_dump hash', {
    script: 'backup-database',
  });
  currentHash = '';
}

// ============================================================================
// Check if backup needed (compare hashes)
// ============================================================================
if (!forceBackup && currentHash && !hasHashChanged('backup-db', currentHash)) {
  logger.info('   ⊘ Database unchanged - backup not needed', { script: 'backup-database' });
  if (existsSync(LATEST_BACKUP_DIR)) {
    logger.info(`   📁 Latest backup: ${LATEST_BACKUP_DIR}`, {
      script: 'backup-database',
      backupDir: LATEST_BACKUP_DIR,
    });
  }
  logger.info('\n💡 Use --force to create backup anyway\n', { script: 'backup-database' });
  process.exit(0);
}

logger.info('   → Database changed - creating backup...', { script: 'backup-database' });

// ============================================================================
// OPTIMIZATION 2: Stream pg_dump directly to gzip (no intermediate buffer)
// ============================================================================
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const BACKUP_DIR = join(ROOT, 'backups', timestamp);

mkdirSync(BACKUP_DIR, { recursive: true });

// Find pg_dump - prioritize version-specific paths to match server version
const findPgDump = (): string => {
  // Check versioned paths first (critical for version matching)
  const versionedPaths = [
    '/opt/homebrew/opt/postgresql@17/bin/pg_dump', // macOS Homebrew PG 17
    '/opt/homebrew/opt/postgresql@16/bin/pg_dump',
    '/opt/homebrew/opt/postgresql@15/bin/pg_dump',
  ];

  for (const path of versionedPaths) {
    if (existsSync(path)) {
      logger.info(`   ✓ Using ${path}`, { script: 'backup-database', pgDumpPath: path });
      return path;
    }
  }

  // Fallback to PATH (may cause version mismatch warnings)
  try {
    const pathPgDump = execSync('which pg_dump', { encoding: 'utf-8' }).trim();
    logger.warn(`   ⚠️  Using pg_dump from PATH: ${pathPgDump} (may not match server version)`, {
      script: 'backup-database',
      pgDumpPath: pathPgDump,
    });
    return pathPgDump;
  } catch {
    const genericPaths = [
      '/opt/homebrew/bin/pg_dump',
      '/usr/local/bin/pg_dump',
      '/usr/bin/pg_dump',
    ];
    for (const path of genericPaths) {
      if (existsSync(path)) {
        logger.warn(`   ⚠️  Using ${path} (may not match server version)`, {
          script: 'backup-database',
          pgDumpPath: path,
        });
        return path;
      }
    }
    throw new Error('pg_dump not found - install with: brew install postgresql@17');
  }
};

findPgDump(); // Verify pg_dump is installed
const outputPath = join(BACKUP_DIR, 'full_backup.sql.gz');

logger.info('📦 Creating compressed backup (using Supabase CLI)...', { script: 'backup-database' });

try {
  // Use Supabase CLI for full schema+data backup
  // This uses the same approach as Supabase's built-in backup system
  const result = execSync(
    `npx supabase db dump --db-url "${dbUrl}" 2>&1 | gzip -9 > "${outputPath}"`,
    {
      cwd: ROOT,
      stdio: 'pipe',
      maxBuffer: 200 * 1024 * 1024, // 200MB buffer
      encoding: 'utf-8',
    }
  );

  // Check if there were any errors in stderr
  if (result && (result.includes('error') || result.includes('ERROR'))) {
    logger.warn('   ⚠️  supabase db dump warnings', { script: 'backup-database', warnings: result });
  }

  logger.info('   ✓ full_backup.sql.gz (compressed schema + data)', { script: 'backup-database' });
} catch (error) {
  logger.error(
    '   ✗ Database dump failed',
    error instanceof Error ? error : new Error(String(error)),
    {
      script: 'backup-database',
    }
  );
  const execError = error as ExecException & { stdout?: string };
  if (execError.stdout) {
    logger.error('   Output', undefined, { script: 'backup-database', stdout: execError.stdout });
  }
  logger.error('   💡 Make sure Supabase CLI is installed: npm install -g supabase', undefined, {
    script: 'backup-database',
  });
  process.exit(1);
}

// ============================================================================
// OPTIMIZATION 3: Hash compressed file (3MB vs 10MB - 3x faster)
// ============================================================================
const backupStartTime = Date.now();
if (!currentHash) {
  logger.info('🔐 Computing backup hash...', { script: 'backup-database' });
  const compressedContent = readFileSync(outputPath);
  currentHash = computeHash(compressedContent.toString('base64'));
}

// Create 'latest' symlink (force overwrite if exists)
execSync(`ln -sf "${timestamp}" "${LATEST_BACKUP_DIR}"`, { cwd: join(ROOT, 'backups') });

// ============================================================================
// README
// ============================================================================
const readme = `Supabase Database Backup
========================
Date: ${new Date().toISOString()}
Hash: ${currentHash.slice(0, 16)}...

Files:
------
full_backup.sql.gz - Complete database dump (all schemas + data, gzip -9)

Restore:
--------
gunzip -c full_backup.sql.gz | psql "$POSTGRES_URL"

Notes:
------
- Complete 1:1 database copy (public, auth, storage, realtime, cron, vault, net schemas)
- Incremental: hash-based change detection (fingerprint RPC if available)
- Use --force to bypass change detection
`;

writeFileSync(join(BACKUP_DIR, 'README.txt'), readme, 'utf-8');

// ============================================================================
// Summary
// ============================================================================
const duOutput = execSync(`du -sk "${BACKUP_DIR}"`, { encoding: 'utf-8' });
const sizeKB = duOutput.split('\t')[0];
if (!sizeKB) {
  throw new Error('Failed to get backup directory size');
}
const sizeKBTrimmed = sizeKB.trim();
const sizeMB = (Number.parseInt(sizeKBTrimmed, 10) / 1024).toFixed(2);

// Calculate compression ratio
const uncompressedSize = execSync(`gunzip -l "${outputPath}" | tail -1 | awk '{print $2}'`, {
  encoding: 'utf-8',
}).trim();
const compressedSize = String(statSync(outputPath).size);
const compressionRatio = (
  (1 - Number.parseInt(compressedSize, 10) / Number.parseInt(uncompressedSize, 10)) *
  100
).toFixed(1);

const backupDuration = Date.now() - backupStartTime;

// Save hash with metadata
setHash('backup-db', currentHash, {
  reason: 'Scheduled database backup',
  duration: backupDuration,
  files: [timestamp],
});

logger.info('\n✅ Optimized backup created!', { script: 'backup-database' });
logger.info(`📁 Location: ${BACKUP_DIR}`, { script: 'backup-database', backupDir: BACKUP_DIR });
logger.info(`🔗 Symlink: backups/latest → ${timestamp}`, { script: 'backup-database', timestamp });
logger.info(`💽 Size: ${sizeMB} MB (${compressionRatio}% compression)`, {
  script: 'backup-database',
  sizeMB,
  compressionRatio: `${compressionRatio}%`,
});
logger.info(`🔐 Hash: ${currentHash.slice(0, 16)}...`, {
  script: 'backup-database',
  hash: currentHash.slice(0, 16),
});

// ============================================================================
// Upload to Cloudflare R2 (offsite backup)
// ============================================================================
if (r2Client && r2Bucket) {
  logger.info('\n📤 Uploading to Cloudflare R2...', { script: 'backup-database' });

  try {
    const fileStream = createReadStream(outputPath);
    const fileSize = statSync(outputPath).size;
    const r2Key = `backups/${timestamp}/full_backup.sql.gz`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: r2Key,
        Body: fileStream,
        ContentType: 'application/gzip',
        ContentLength: fileSize,
        Metadata: {
          'backup-hash': currentHash,
          'backup-timestamp': timestamp,
          'compression-ratio': compressionRatio,
          'original-size-mb': sizeMB,
        },
      })
    );

    logger.info(`   ✓ Uploaded to R2: ${r2Key}`, { script: 'backup-database', r2Key });
    logger.info(`   🌍 Offsite backup secured (${sizeMB} MB)`, {
      script: 'backup-database',
      sizeMB,
    });
  } catch (error) {
    logger.error(
      '   ✗ R2 upload failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        script: 'backup-database',
      }
    );
    logger.error('   ⚠️  Local backup preserved, but offsite backup failed', undefined, {
      script: 'backup-database',
    });

    // Report failure to BetterStack
    if (heartbeatUrl) {
      try {
        await fetch(`${heartbeatUrl}/fail`);
      } catch {
        logger.error('   ⚠️  Failed to report failure to BetterStack', undefined, {
          script: 'backup-database',
        });
      }
    }
    process.exit(1);
  }
}

// ============================================================================
// BetterStack Heartbeat (success signal)
// ============================================================================
if (heartbeatUrl) {
  logger.info('\n💓 Sending heartbeat to BetterStack...', { script: 'backup-database' });
  try {
    const response = await fetch(heartbeatUrl);
    if (response.ok) {
      logger.info('   ✓ Heartbeat sent successfully', { script: 'backup-database' });
    } else {
      logger.warn(`   ⚠️  Heartbeat response: ${response.status}`, {
        script: 'backup-database',
        status: response.status,
      });
    }
  } catch (error) {
    logger.warn(
      `   ⚠️  Failed to send heartbeat (non-critical): ${error instanceof Error ? error.message : error}`,
      { script: 'backup-database' }
    );
  }
} else {
  logger.info('\n💡 BetterStack heartbeat not configured (set BETTERSTACK_HEARTBEAT_DB_BACKUP)', {
    script: 'backup-database',
  });
}

logger.info('\n💡 Next run will skip backup if database unchanged (fingerprint check)\n', {
  script: 'backup-database',
});
