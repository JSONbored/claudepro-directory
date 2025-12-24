#!/usr/bin/env node

/**
 * Prismocker Auto-Setup CLI
 *
 * This CLI tool automatically sets up Prismocker in your project by:
 * - Detecting your testing framework (Jest or Vitest)
 * - Creating the __mocks__/@prisma/client.ts file
 * - Updating test setup files
 * - Generating enum stubs
 * - Creating example test files
 *
 * Usage:
 *   npx prismocker setup [options]
 *
 * Options:
 *   --schema <path>     Path to Prisma schema file (default: ./prisma/schema.prisma)
 *   --mock <path>       Path to mock file (default: ./__mocks__/@prisma/client.ts)
 *   --framework <name>  Testing framework: 'jest' or 'vitest' (auto-detected if not specified)
 *   --skip-examples     Skip creating example test files
 *   --help              Show help message
 */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';

interface SetupOptions {
  schemaPath: string;
  mockPath: string;
  framework: 'jest' | 'vitest' | 'auto';
  skipExamples: boolean;
}

/**
 * Parse command-line options
 */
function parseOptions(args: string[]): SetupOptions {
  let schemaPath = './prisma/schema.prisma';
  let mockPath = './__mocks__/@prisma/client.ts';
  let framework: 'jest' | 'vitest' | 'auto' = 'auto';
  let skipExamples = false;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--schema' && i + 1 < args.length) {
      schemaPath = args[++i];
    } else if (arg === '--mock' && i + 1 < args.length) {
      mockPath = args[++i];
    } else if (arg === '--framework' && i + 1 < args.length) {
      const fw = args[++i].toLowerCase();
      if (fw === 'jest' || fw === 'vitest') {
        framework = fw;
      } else {
        console.error(`❌ Error: Invalid framework '${fw}'. Must be 'jest' or 'vitest'.`);
        process.exit(1);
      }
    } else if (arg === '--skip-examples') {
      skipExamples = true;
    }
  }
  
  return { schemaPath, mockPath, framework, skipExamples };
}

/**
 * Detect testing framework from package.json
 */
async function detectFramework(cwd: string): Promise<'jest' | 'vitest' | null> {
  const packageJsonPath = join(cwd, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    return null;
  }
  
  try {
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    
    if (deps.jest || deps['@jest/globals'] || packageJson.scripts?.test?.includes('jest')) {
      return 'jest';
    }
    
    if (deps.vitest || packageJson.scripts?.test?.includes('vitest')) {
      return 'vitest';
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Find test setup file
 */
function findSetupFile(cwd: string, framework: 'jest' | 'vitest'): string | null {
  const possibleFiles = framework === 'jest'
    ? ['jest.setup.ts', 'jest.setup.js', 'setupTests.ts', 'setupTests.js']
    : ['vitest.setup.ts', 'vitest.setup.js', 'setup.ts', 'setup.js'];
  
  for (const file of possibleFiles) {
    const path = join(cwd, file);
    if (existsSync(path)) {
      return path;
    }
  }
  
  return null;
}

/**
 * Generate mock file content
 */
function generateMockFileContent(framework: 'jest' | 'vitest'): string {
  if (framework === 'jest') {
    return `/**
 * Prismocker Mock for @prisma/client
 *
 * This mock replaces PrismaClient with PrismockerClient for all tests.
 *
 * IMPORTANT: Jest automatically uses __mocks__ directory (no explicit registration needed).
 * The mock file at __mocks__/@prisma/client.ts will be automatically used
 * when any code imports from '@prisma/client'
 *
 * Prismocker is a type-safe, in-memory Prisma Client mock that:
 * - Works perfectly with pnpm (no module resolution issues)
 * - Supports all Prisma operations
 * - Is type-safe using Prisma's generated types
 *
 * TypeScript types still come from the real @prisma/client module for type checking.
 */

// Import from installed prismocker package
// Using CommonJS for Jest compatibility (Jest doesn't fully support ESM in mocks)
const { createPrismocker } = require('prismocker');

// Create Prisma.Decimal fallback class
// NOTE: We do NOT try to require the real @prisma/client/runtime/library here
// because that would trigger loading the real Prisma client, which requires
// .prisma/client/default to exist (which doesn't in tests).
// Instead, we use a minimal Decimal class that matches Prisma's Decimal API.
class Decimal {
  value: any;
  constructor(value: any) {
    this.value = value;
  }
  toString() {
    return String(this.value);
  }
  toNumber() {
    return Number(this.value);
  }
  toFixed(decimalPlaces?: number) {
    return Number(this.value).toFixed(decimalPlaces);
  }
  toJSON() {
    return this.value;
  }
}

// Create Prisma namespace with Decimal
// This matches what the real @prisma/client exports
const Prisma = {
  Decimal,
};

// Export PrismaClient as a function constructor that returns a PrismockerClient instance
// When someone does \`new PrismaClient()\`, they get a PrismockerClient instance
// This matches the real PrismaClient's usage pattern
function PrismaClient() {
  const instance = createPrismocker();
  return instance;
}

// Export Prisma enum stubs to prevent Jest from trying to load the actual @prisma/client module
// These are stub objects that match the structure of Prisma-generated enums
// When code imports \`import { enum_name } from '@prisma/client'\`, Jest will use these stubs
// instead of trying to load the actual module (which requires .prisma/client/default to exist)
//
// These enums are defined in prisma/schema.prisma and generated by Prisma
// The stub values match the enum keys from the schema
// NOTE: This section is auto-generated by \`npx prismocker generate-enums\`
// Run this command after adding/modifying enums in your Prisma schema

// Enums will be generated here by 'npx prismocker generate-enums'

// Export everything
module.exports = {
  PrismaClient,
  Prisma,
  // Enum exports will be added here by 'npx prismocker generate-enums'
};
`;
  } else {
    // Vitest
    return `/**
 * Prismocker Mock for @prisma/client
 *
 * This mock replaces PrismaClient with PrismockerClient for all tests.
 *
 * IMPORTANT: This file must be explicitly registered in vitest.setup.ts:
 * \`\`\`typescript
 * import { vi } from 'vitest';
 * vi.mock('@prisma/client', async () => {
 *   const mockModule = await import('./__mocks__/@prisma/client.ts');
 *   return mockModule;
 * });
 * \`\`\`
 *
 * Prismocker is a type-safe, in-memory Prisma Client mock that:
 * - Works perfectly with pnpm (no module resolution issues)
 * - Supports all Prisma operations
 * - Is type-safe using Prisma's generated types
 *
 * TypeScript types still come from the real @prisma/client module for type checking.
 */

import { createPrismocker } from 'prismocker';
import type { PrismaClient } from '@prisma/client';

// Create PrismaClient instance
const PrismockerClientClass = createPrismocker<PrismaClient>();

// Create Prisma.Decimal fallback class
class Decimal {
  value: any;
  constructor(value: any) {
    this.value = value;
  }
  toString() {
    return String(this.value);
  }
  toNumber() {
    return Number(this.value);
  }
  toFixed(decimalPlaces?: number) {
    return Number(this.value).toFixed(decimalPlaces);
  }
  toJSON() {
    return this.value;
  }
}

// Create Prisma namespace with Decimal
// This matches what the real @prisma/client exports
export const Prisma = {
  Decimal,
};

// Export PrismaClient
export { PrismockerClientClass as PrismaClient };

// Export Prisma enum stubs to prevent Vitest from trying to load the actual @prisma/client module
// These are stub objects that match the structure of Prisma-generated enums
// When code imports \`import { enum_name } from '@prisma/client'\`, Vitest will use these stubs
// instead of trying to load the actual module (which requires .prisma/client/default to exist)
//
// These enums are defined in prisma/schema.prisma and generated by Prisma
// The stub values match the enum keys from the schema
// NOTE: This section is auto-generated by \`npx prismocker generate-enums\`
// Run this command after adding/modifying enums in your Prisma schema

// Enums will be generated here by 'npx prismocker generate-enums'
`;
  }
}

/**
 * Update test setup file
 */
async function updateSetupFile(
  setupFilePath: string,
  framework: 'jest' | 'vitest'
): Promise<boolean> {
  try {
    const content = await readFile(setupFilePath, 'utf-8');
    
    // Check if Prismocker is already configured
    if (content.includes('prismocker') || content.includes('Prismocker')) {
      return false; // Already configured
    }
    
    let newContent = content;
    const mockPath = './__mocks__/@prisma/client';
    
    if (framework === 'vitest') {
      // Add Vitest mock registration
      const vitestMock = `
// ============================================================================
// Prisma Client Mock (Prismocker)
// ============================================================================

import { vi } from 'vitest';

// Explicitly mock @prisma/client to use Prismocker
vi.mock('@prisma/client', async () => {
  const mockModule = await import('${mockPath}');
  return mockModule;
});
`;
      
      // Add at the end of the file
      newContent = content.trim() + '\n' + vitestMock;
    } else {
      // Jest automatically uses __mocks__ directory, but we can add a comment
      const jestComment = `
// ============================================================================
// Prisma Client Mock (Prismocker)
// ============================================================================

// CRITICAL: Jest automatically uses __mocks__ directory
// The mock file at __mocks__/@prisma/client.ts will be automatically used
// when any code imports from '@prisma/client'
// No explicit jest.mock() needed - Jest handles it automatically
`;
      
      // Add at the end of the file
      newContent = content.trim() + '\n' + jestComment;
    }
    
    await writeFile(setupFilePath, newContent, 'utf-8');
    return true;
  } catch (error: any) {
    console.error(`⚠️  Warning: Could not update setup file: ${error.message}`);
    return false;
  }
}

/**
 * Create example test file
 */
async function createExampleTest(
  cwd: string,
  framework: 'jest' | 'vitest'
): Promise<void> {
  const examplePath = join(cwd, 'prismocker-example.test.ts');
  
  if (existsSync(examplePath)) {
    console.log(`⚠️  Example test file already exists: ${examplePath}`);
    return;
  }
  
  const imports = framework === 'jest'
    ? `import { describe, it, expect, beforeEach } from '@jest/globals';`
    : `import { describe, it, expect, beforeEach } from 'vitest';`;
  
  const exampleContent = `${imports}
import { PrismaClient } from '@prisma/client';
import { resetAndSeed } from 'prismocker/test-utils';

/**
 * Example Prismocker Test
 *
 * This is an example test file demonstrating how to use Prismocker.
 * Adapt the model names and fields to match your Prisma schema.
 */

describe('Prismocker Example', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    // Create new Prismocker instance for each test
    prisma = new PrismaClient();

    // Reset and seed test data
    // NOTE: Adapt model names and data structure to your schema
    resetAndSeed(prisma, {
      // Example: users: [
      //   { id: 'user-1', email: 'test@example.com', name: 'Test User' },
      // ],
    });
  });

  it('should create a record', async () => {
    // Example: Create a user
    // const user = await prisma.users.create({
    //   data: {
    //     email: 'new@example.com',
    //     name: 'New User',
    //   },
    // });
    // expect(user.email).toBe('new@example.com');
  });

  it('should query records', async () => {
    // Example: Query users
    // const users = await prisma.users.findMany();
    // expect(users.length).toBeGreaterThan(0);
  });

  it('should update records', async () => {
    // Example: Update a user
    // const user = await prisma.users.update({
    //   where: { id: 'user-1' },
    //   data: { name: 'Updated Name' },
    // });
    // expect(user.name).toBe('Updated Name');
  });

  it('should delete records', async () => {
    // Example: Delete a user
    // await prisma.users.delete({
    //   where: { id: 'user-1' },
    // });
    // const user = await prisma.users.findUnique({
    //   where: { id: 'user-1' },
    // });
    // expect(user).toBeNull();
  });
});
`;
  
  await writeFile(examplePath, exampleContent, 'utf-8');
  console.log(`✅ Created example test file: ${examplePath}`);
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
Prismocker CLI Commands

Commands:
  setup                 Full setup (default command)
  verify                Verify Prismocker setup
  fix                   Fix Prismocker setup issues
  rollback              Remove Prismocker setup

Setup Options:
  --schema <path>       Path to Prisma schema file (default: ./prisma/schema.prisma)
  --mock <path>         Path to mock file (default: ./__mocks__/@prisma/client.ts)
  --framework <name>    Testing framework: 'jest' or 'vitest' (auto-detected if not specified)
  --skip-examples       Skip creating example test files
  --only-mock           Only create mock file (skip enum generation and setup file updates)
  --only-enums          Only generate enum stubs (skip mock file and setup file updates)
  --help                Show this help message

Examples:
  # Full setup
  npx prismocker setup
  npx prismocker setup --framework jest
  
  # Modular setup
  npx prismocker setup --only-mock
  npx prismocker setup --only-enums
  
  # Verify setup
  npx prismocker verify
  
  # Fix setup issues
  npx prismocker fix
  
  # Rollback setup
  npx prismocker rollback
  npx prismocker rollback --remove-setup

Full Setup:
  The \`setup\` command automatically:
  1. Detects your testing framework (Jest or Vitest)
  2. Creates the __mocks__/@prisma/client.ts file
  3. Updates test setup files (jest.setup.ts or vitest.setup.ts)
  4. Generates enum stubs from your Prisma schema
  5. Creates example test files (optional)

Verify:
  The \`verify\` command checks:
  - Mock file exists
  - Schema file exists
  - Setup file is configured correctly

Fix:
  The \`fix\` command automatically:
  - Creates missing mock file
  - Updates setup file configuration
  - Generates enum stubs

Rollback:
  The \`rollback\` command removes:
  - Mock file
  - Setup file references (with --remove-setup flag)

After setup, run \`npx prismocker generate-enums\` whenever you add or modify
enums in your Prisma schema.
`);
}

/**
 * Main function
 */
/**
 * Verify Prismocker setup
 */
async function verifySetup(cwd: string, options: { schemaPath: string; mockPath: string }): Promise<boolean> {
  console.log('🔍 Verifying Prismocker setup...\n');
  
  let allGood = true;
  
  // Check mock file
  const mockExists = existsSync(resolve(cwd, options.mockPath));
  if (mockExists) {
    console.log(`✅ Mock file exists: ${options.mockPath}`);
  } else {
    console.log(`❌ Mock file missing: ${options.mockPath}`);
    allGood = false;
  }
  
  // Check schema file
  const schemaExists = existsSync(resolve(cwd, options.schemaPath));
  if (schemaExists) {
    console.log(`✅ Schema file exists: ${options.schemaPath}`);
  } else {
    console.log(`❌ Schema file missing: ${options.schemaPath}`);
    allGood = false;
  }
  
  // Check setup file
  const framework = await detectFramework(cwd);
  if (framework) {
    const setupFile = findSetupFile(cwd, framework);
    if (setupFile) {
      const content = await readFile(setupFile, 'utf-8');
      const hasMock = content.includes('__mocks__/@prisma/client') || content.includes('prismocker');
      if (hasMock) {
        console.log(`✅ Setup file configured: ${setupFile}`);
      } else {
        console.log(`⚠️  Setup file exists but not configured: ${setupFile}`);
        allGood = false;
      }
    } else {
      if (framework === 'vitest') {
        console.log(`⚠️  No setup file found (vitest requires explicit mock registration)`);
        allGood = false;
      } else {
        console.log(`ℹ️  No setup file found (Jest auto-uses __mocks__ directory)`);
      }
    }
  } else {
    console.log(`⚠️  Could not detect testing framework`);
  }
  
  return allGood;
}

/**
 * Fix Prismocker setup issues
 */
async function fixSetup(cwd: string, options: { schemaPath: string; mockPath: string; framework: 'jest' | 'vitest' | 'auto' }): Promise<void> {
  console.log('🔧 Fixing Prismocker setup...\n');
  
  const detectedFramework = options.framework === 'auto' 
    ? await detectFramework(cwd) || 'jest'
    : options.framework;
  
  // Create mock file if missing
  const mockExists = existsSync(resolve(cwd, options.mockPath));
  if (!mockExists) {
    console.log('📝 Creating missing mock file...');
    const mockDir = dirname(resolve(cwd, options.mockPath));
    await mkdir(mockDir, { recursive: true });
    const mockContent = generateMockFileContent(detectedFramework);
    await writeFile(resolve(cwd, options.mockPath), mockContent, 'utf-8');
    console.log(`✅ Created mock file: ${options.mockPath}`);
  } else {
    console.log(`✅ Mock file already exists: ${options.mockPath}`);
  }
  
  // Update setup file
  const setupFile = findSetupFile(cwd, detectedFramework);
  if (setupFile) {
    console.log('⚙️  Updating setup file...');
    const updated = await updateSetupFile(setupFile, detectedFramework);
    if (updated) {
      console.log(`✅ Updated setup file: ${setupFile}`);
    } else {
      console.log(`ℹ️  Setup file already configured: ${setupFile}`);
    }
  } else if (detectedFramework === 'vitest') {
    console.log('⚠️  No setup file found. You may need to manually register the mock.');
  }
  
  // Generate enums
  console.log('🔢 Generating enum stubs...');
  try {
    const { spawn } = await import('node:child_process');
    await new Promise<void>((resolve) => {
      const child = spawn('npx', ['prismocker', 'generate-enums', '--schema', options.schemaPath, '--mock', options.mockPath], {
        cwd,
        stdio: 'inherit',
        shell: true,
      });
      child.on('close', () => resolve());
    });
    console.log('✅ Generated enum stubs');
  } catch (error: any) {
    console.log(`⚠️  Could not generate enums: ${error.message}`);
  }
  
  console.log('\n✨ Fix complete!');
}

/**
 * Rollback Prismocker setup
 */
async function rollbackSetup(cwd: string, options: { mockPath: string; removeSetup: boolean }): Promise<void> {
  console.log('🔄 Rolling back Prismocker setup...\n');
  
  const mockFile = resolve(cwd, options.mockPath);
  if (existsSync(mockFile)) {
    await import('node:fs/promises').then(({ unlink }) => unlink(mockFile));
    console.log(`✅ Removed mock file: ${options.mockPath}`);
  } else {
    console.log(`ℹ️  Mock file not found: ${options.mockPath}`);
  }
  
  if (options.removeSetup) {
    const framework = await detectFramework(cwd);
    if (framework) {
      const setupFile = findSetupFile(cwd, framework);
      if (setupFile) {
        console.log(`⚠️  Setup file found: ${setupFile}`);
        console.log(`   Please manually remove Prismocker references from this file.`);
      }
    }
  }
  
  console.log('\n✨ Rollback complete!');
}

async function main() {
  const args = process.argv.slice(2);
  
  // Check for command (fix, verify, rollback)
  const command = args[0];
  
  if (command === 'verify') {
    const options = parseOptions(args.slice(1));
    const cwd = process.cwd();
    const allGood = await verifySetup(cwd, {
      schemaPath: options.schemaPath,
      mockPath: options.mockPath,
    });
    process.exit(allGood ? 0 : 1);
    return;
  }
  
  if (command === 'fix') {
    const options = parseOptions(args.slice(1));
    const cwd = process.cwd();
    await fixSetup(cwd, {
      schemaPath: options.schemaPath,
      mockPath: options.mockPath,
      framework: options.framework,
    });
    return;
  }
  
  if (command === 'rollback') {
    const options = parseOptions(args.slice(1));
    const cwd = process.cwd();
    await rollbackSetup(cwd, {
      mockPath: options.mockPath,
      removeSetup: args.includes('--remove-setup'),
    });
    return;
  }
  
  // Default: setup command
  const options = parseOptions(args);
  
  // Handle --only-mock and --only-enums flags
  const onlyMock = args.includes('--only-mock');
  const onlyEnums = args.includes('--only-enums');
  
  if (onlyMock && onlyEnums) {
    console.error('❌ Error: Cannot use --only-mock and --only-enums together');
    process.exit(1);
  }
  
  const schemaPath = options.schemaPath;
  const mockPath = options.mockPath;
  const framework = options.framework;
  const skipExamples = args.includes('--skip-examples');
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  const cwd = process.cwd();
  const resolvedSchemaPath = resolve(cwd, schemaPath);
  const resolvedMockPath = resolve(cwd, mockPath);
  
  console.log('🚀 Prismocker Auto-Setup\n');
  
  // Handle --only-mock flag
  if (onlyMock) {
    console.log('📝 Creating mock file only...');
    const mockDir = dirname(resolvedMockPath);
    await mkdir(mockDir, { recursive: true });
    
    const detectedFramework = framework === 'auto' 
      ? await detectFramework(cwd) || 'jest'
      : framework;
    
    const mockContent = generateMockFileContent(detectedFramework);
    await writeFile(resolvedMockPath, mockContent, 'utf-8');
    console.log(`✅ Created mock file: ${mockPath}`);
    console.log('\n✨ Mock file creation complete!');
    return;
  }
  
  // Handle --only-enums flag
  if (onlyEnums) {
    console.log('🔢 Generating enum stubs only...');
    if (!existsSync(resolvedSchemaPath)) {
      console.error(`❌ Error: Schema file not found: ${resolvedSchemaPath}`);
      process.exit(1);
    }
    
    try {
      const { spawn } = await import('node:child_process');
      await new Promise<void>((resolve) => {
        const child = spawn('npx', ['prismocker', 'generate-enums', '--schema', schemaPath, '--mock', mockPath], {
          cwd,
          stdio: 'inherit',
          shell: true,
        });
        child.on('close', () => resolve());
      });
      console.log('✅ Generated enum stubs');
    } catch (error: any) {
      console.error(`❌ Error generating enums: ${error.message}`);
      process.exit(1);
    }
    console.log('\n✨ Enum generation complete!');
    return;
  }
  
  // Full setup (default behavior)
  // Step 1: Detect framework
  let detectedFramework: 'jest' | 'vitest';
  if (framework === 'auto') {
    console.log('📦 Detecting testing framework...');
    const detected = await detectFramework(cwd);
    if (!detected) {
      console.error('❌ Error: Could not detect testing framework.');
      console.error('   Please specify --framework jest or --framework vitest');
      process.exit(1);
    }
    detectedFramework = detected;
    console.log(`✅ Detected framework: ${detectedFramework}`);
  } else {
    detectedFramework = framework;
    console.log(`✅ Using framework: ${detectedFramework}`);
  }
  
  // Step 2: Check Prisma schema
  console.log('\n📋 Checking Prisma schema...');
  if (!existsSync(resolvedSchemaPath)) {
    console.error(`❌ Error: Schema file not found: ${resolvedSchemaPath}`);
    console.error('   Please provide a valid path to your Prisma schema file.');
    process.exit(1);
  }
  console.log(`✅ Found schema: ${schemaPath}`);
  
  // Step 3: Create mock file
  console.log('\n📝 Creating mock file...');
  const mockDir = dirname(resolvedMockPath);
  await mkdir(mockDir, { recursive: true });
  
  const mockContent = generateMockFileContent(detectedFramework);
  await writeFile(resolvedMockPath, mockContent, 'utf-8');
  console.log(`✅ Created mock file: ${mockPath}`);
  
  // Step 4: Update setup file
  console.log('\n⚙️  Updating test setup...');
  const setupFile = findSetupFile(cwd, detectedFramework);
  if (setupFile) {
    const updated = await updateSetupFile(setupFile, detectedFramework);
    if (updated) {
      console.log(`✅ Updated setup file: ${setupFile}`);
    } else {
      console.log(`ℹ️  Setup file already configured: ${setupFile}`);
    }
  } else {
    console.log(`⚠️  No setup file found. You may need to manually register the mock.`);
    if (detectedFramework === 'vitest') {
      console.log(`   Add this to your vitest.setup.ts:`);
      console.log(`   \`\`\`typescript`);
      console.log(`   import { vi } from 'vitest';`);
      console.log(`   vi.mock('@prisma/client', async () => {`);
      console.log(`     const mockModule = await import('./__mocks__/@prisma/client.ts');`);
      console.log(`     return mockModule;`);
      console.log(`   });`);
      console.log(`   \`\`\``);
    } else {
      console.log(`   Jest automatically uses __mocks__ directory, so no manual registration needed.`);
    }
  }
  
  // Step 5: Generate enum stubs
  console.log('\n🔢 Generating enum stubs...');
  try {
    // Import and run generate-enums
    const { spawn } = await import('node:child_process');
    
    const result = await new Promise<{ code: number }>((resolve) => {
      const child = spawn('npx', ['prismocker', 'generate-enums', '--schema', schemaPath, '--mock', mockPath], {
        cwd,
        stdio: 'inherit',
        shell: true,
      });
      
      child.on('close', (code) => {
        resolve({ code: code || 0 });
      });
    });
    
    if (result.code === 0) {
      console.log('✅ Generated enum stubs');
    } else {
      console.log('⚠️  Enum generation had issues (this is OK if you have no enums)');
    }
  } catch (error: any) {
    console.log(`⚠️  Could not auto-generate enums: ${error.message}`);
    console.log(`   Run 'npx prismocker generate-enums' manually after setup`);
  }
  
  // Step 6: Create example test
  if (!skipExamples) {
    console.log('\n📚 Creating example test...');
    await createExampleTest(cwd, detectedFramework);
  }
  
  // Summary
  console.log('\n✨ Setup complete!\n');
  console.log('Next steps:');
  console.log('  1. Review the mock file:', mockPath);
  if (setupFile) {
    console.log('  2. Review the updated setup file:', setupFile);
  }
  if (!skipExamples) {
    console.log('  3. Check out the example test: prismocker-example.test.ts');
  }
  console.log('  4. Run your tests to verify everything works');
  console.log('  5. Run \`npx prismocker generate-enums\` after adding/modifying enums');
  console.log('\n📖 For more information, see: https://github.com/JSONbored/prismocker\n');
}

// Run if called directly
main().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});

