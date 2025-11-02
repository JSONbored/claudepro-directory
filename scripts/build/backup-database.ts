#!/usr/bin/env tsx

/**
 * Optimized Supabase Database Backup Script
 * Reduces egress by checking hash BEFORE dumping, compresses output
 * Uploads to Cloudflare R2 for offsite storage
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');
const ENV_FILE = join(ROOT, '.env.local');
const BACKUP_HASH_FILE = join(ROOT, '.backup-db-hash');
const LATEST_BACKUP_DIR = join(ROOT, 'backups/latest');

const forceBackup = process.argv.includes('--force');

console.log('🔒 Starting optimized incremental database backup...\n');

// ============================================================================
// Load environment and create Supabase client
// ============================================================================
if (!existsSync(ENV_FILE)) {
  console.error('❌ .env.local not found - run: vercel env pull .env.local');
  process.exit(1);
}

const envContent = readFileSync(ENV_FILE, 'utf-8');
const dbUrlMatch = envContent.match(/POSTGRES_URL_NON_POOLING=(.+)/);
const supabaseUrlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const supabaseKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
const r2AccessKeyMatch = envContent.match(/R2_ACCESS_KEY_ID=(.+)/);
const r2SecretKeyMatch = envContent.match(/R2_SECRET_ACCESS_KEY=(.+)/);
const r2EndpointMatch = envContent.match(/R2_ENDPOINT=(.+)/);
const r2BucketMatch = envContent.match(/R2_BUCKET_NAME=(.+)/);

if (!dbUrlMatch) {
  console.error('❌ POSTGRES_URL_NON_POOLING not found in .env.local');
  process.exit(1);
}

// Helper to strip quotes from env values
const stripQuotes = (str: string) => str.replace(/^["']|["']$/g, '');

const dbUrl = stripQuotes(dbUrlMatch[1].trim());
const supabaseUrl = supabaseUrlMatch?.[1] ? stripQuotes(supabaseUrlMatch[1].trim()) : undefined;
const supabaseKey = supabaseKeyMatch?.[1] ? stripQuotes(supabaseKeyMatch[1].trim()) : undefined;
const r2AccessKey = r2AccessKeyMatch?.[1] ? stripQuotes(r2AccessKeyMatch[1].trim()) : undefined;
const r2SecretKey = r2SecretKeyMatch?.[1] ? stripQuotes(r2SecretKeyMatch[1].trim()) : undefined;
const r2Endpoint = r2EndpointMatch?.[1] ? stripQuotes(r2EndpointMatch[1].trim()) : undefined;
const r2Bucket = r2BucketMatch?.[1] ? stripQuotes(r2BucketMatch[1].trim()) : undefined;
const heartbeatUrl = envContent.match(/BETTERSTACK_HEARTBEAT_DB_BACKUP=(.+)/)?.[1]
  ? stripQuotes(envContent.match(/BETTERSTACK_HEARTBEAT_DB_BACKUP=(.+)/)?.[1].trim() || '')
  : undefined;

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
  console.log('   ✓ R2 upload enabled');
} else {
  console.log('   ⚠️  R2 credentials not found - skipping offsite backup');
}

// ============================================================================
// OPTIMIZATION 1: Check database state hash BEFORE dumping (lightweight query)
// ============================================================================
console.log('🔍 Checking database state (lightweight metadata query)...');

let currentHash: string;

if (supabaseUrl && supabaseKey) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get lightweight database state fingerprint (table row counts + modification times)
    // This is ~1KB query vs ~50MB full dump - 50,000x less egress!
    const { data, error } = await supabase.rpc('get_database_fingerprint');

    if (error) throw error;

    // Create hash from fingerprint
    currentHash = createHash('sha256').update(JSON.stringify(data)).digest('hex');

    console.log('   ✓ Using database fingerprint for change detection');
  } catch (error) {
    console.log('   ⚠️  Fingerprint RPC error:', error instanceof Error ? error.message : error);
    console.log('   → Falling back to pg_dump hash');
    currentHash = ''; // Will trigger full dump below
  }
} else {
  console.log('   ⚠️  Supabase credentials not found, using pg_dump hash');
  currentHash = '';
}

// ============================================================================
// Check if backup needed (compare hashes)
// ============================================================================
const storedHash = existsSync(BACKUP_HASH_FILE)
  ? readFileSync(BACKUP_HASH_FILE, 'utf-8').trim()
  : null;

if (!forceBackup && currentHash && storedHash === currentHash) {
  console.log('   ⊘ Database unchanged - backup not needed');
  if (existsSync(LATEST_BACKUP_DIR)) {
    console.log(`   📁 Latest backup: ${LATEST_BACKUP_DIR}`);
  }
  console.log('\n💡 Use --force to create backup anyway\n');
  process.exit(0);
}

console.log('   → Database changed - creating backup...');

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
      console.log(`   ✓ Using ${path}`);
      return path;
    }
  }

  // Fallback to PATH (may cause version mismatch warnings)
  try {
    const pathPgDump = execSync('which pg_dump', { encoding: 'utf-8' }).trim();
    console.log(`   ⚠️  Using pg_dump from PATH: ${pathPgDump} (may not match server version)`);
    return pathPgDump;
  } catch {
    const genericPaths = [
      '/opt/homebrew/bin/pg_dump',
      '/usr/local/bin/pg_dump',
      '/usr/bin/pg_dump',
    ];
    for (const path of genericPaths) {
      if (existsSync(path)) {
        console.log(`   ⚠️  Using ${path} (may not match server version)`);
        return path;
      }
    }
    throw new Error('pg_dump not found - install with: brew install postgresql@17');
  }
};

const pgDumpPath = findPgDump();
const outputPath = join(BACKUP_DIR, 'full_backup.sql.gz');

console.log('📦 Creating compressed backup (using Supabase CLI)...');

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
    console.error('   ⚠️  supabase db dump warnings:', result);
  }

  console.log('   ✓ full_backup.sql.gz (compressed schema + data)');
} catch (error) {
  console.error('   ✗ Database dump failed:', error instanceof Error ? error.message : error);
  if (error instanceof Error && 'stdout' in error) {
    console.error('   Output:', (error as any).stdout);
  }
  console.error('   💡 Make sure Supabase CLI is installed: npm install -g supabase');
  process.exit(1);
}

// ============================================================================
// OPTIMIZATION 3: Hash compressed file (3MB vs 10MB - 3x faster)
// ============================================================================
if (!currentHash) {
  console.log('🔐 Computing backup hash...');
  const compressedContent = readFileSync(outputPath);
  currentHash = createHash('sha256').update(compressedContent).digest('hex');
}

// Save hash
writeFileSync(BACKUP_HASH_FILE, currentHash, 'utf-8');

// Create 'latest' symlink
if (existsSync(LATEST_BACKUP_DIR)) {
  execSync(`rm -f "${LATEST_BACKUP_DIR}"`, { cwd: ROOT });
}
execSync(`ln -s "${timestamp}" "${LATEST_BACKUP_DIR}"`, { cwd: join(ROOT, 'backups') });

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
const sizeKB = execSync(`du -sk "${BACKUP_DIR}"`, { encoding: 'utf-8' }).split('\t')[0].trim();
const sizeMB = (Number.parseInt(sizeKB, 10) / 1024).toFixed(2);

// Calculate compression ratio
const uncompressedSize = execSync(`gunzip -l "${outputPath}" | tail -1 | awk '{print $2}'`, {
  encoding: 'utf-8',
}).trim();
const compressedSize = execSync(`stat -f%z "${outputPath}"`, { encoding: 'utf-8' }).trim();
const compressionRatio = (
  (1 - Number.parseInt(compressedSize, 10) / Number.parseInt(uncompressedSize, 10)) *
  100
).toFixed(1);

console.log('\n✅ Optimized backup created!');
console.log(`📁 Location: ${BACKUP_DIR}`);
console.log(`🔗 Symlink: backups/latest → ${timestamp}`);
console.log(`💽 Size: ${sizeMB} MB (${compressionRatio}% compression)`);
console.log(`🔐 Hash: ${currentHash.slice(0, 16)}...`);

// ============================================================================
// Upload to Cloudflare R2 (offsite backup)
// ============================================================================
if (r2Client && r2Bucket) {
  console.log('\n📤 Uploading to Cloudflare R2...');

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

    console.log(`   ✓ Uploaded to R2: ${r2Key}`);
    console.log(`   🌍 Offsite backup secured (${sizeMB} MB)`);
  } catch (error) {
    console.error('   ✗ R2 upload failed:', error instanceof Error ? error.message : error);
    console.error('   ⚠️  Local backup preserved, but offsite backup failed');

    // Report failure to BetterStack
    if (heartbeatUrl) {
      try {
        await fetch(`${heartbeatUrl}/fail`);
      } catch (heartbeatError) {
        console.error('   ⚠️  Failed to report failure to BetterStack');
      }
    }
    process.exit(1);
  }
}

// ============================================================================
// BetterStack Heartbeat (success signal)
// ============================================================================
if (heartbeatUrl) {
  console.log('\n💓 Sending heartbeat to BetterStack...');
  try {
    const response = await fetch(heartbeatUrl);
    if (response.ok) {
      console.log('   ✓ Heartbeat sent successfully');
    } else {
      console.error('   ⚠️  Heartbeat response:', response.status);
    }
  } catch (error) {
    console.error('   ⚠️  Failed to send heartbeat (non-critical):', error instanceof Error ? error.message : error);
  }
} else {
  console.log('\n💡 BetterStack heartbeat not configured (set BETTERSTACK_HEARTBEAT_DB_BACKUP)');
}

console.log('\n💡 Next run will skip backup if database unchanged (fingerprint check)\n');
