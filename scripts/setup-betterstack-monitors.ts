#!/usr/bin/env tsx
/**
 * BetterStack Monitor Setup Script
 * 
 * Creates BetterStack heartbeat monitors via API and outputs environment variables.
 * 
 * Usage:
 *   pnpm tsx scripts/setup-betterstack-monitors.ts
 * 
 * Requirements:
 *   - BETTERSTACK_API_TOKEN environment variable must be set
 *   - BetterStack free tier: 10 heartbeat monitors max
 * 
 * This script:
 *   1. Creates monitors for Inngest function monitoring
 *   2. Outputs the heartbeat URLs as environment variables
 *   3. You can then add these to Netlify/Vercel
 */

import { createHeartbeatMonitor, listHeartbeatMonitors } from '../packages/web-runtime/src/inngest/utils/betterstack-api';

interface MonitorConfig {
  name: string;
  period: number;
  grace: number;
  description: string;
  envVarName: string;
}

const MONITOR_CONFIGS: MonitorConfig[] = [
  {
    name: 'Inngest: Critical Function Failures',
    period: 3600, // 1 hour
    grace: 900, // 15 minutes
    description: 'Monitors when Inngest functions fail after all retries (polar webhooks, transactional emails, job lifecycle)',
    envVarName: 'BETTERSTACK_HEARTBEAT_CRITICAL_FAILURE',
  },
  {
    name: 'Inngest: Cron Function Success',
    period: 3600, // 1 hour
    grace: 900, // 15 minutes
    description: 'Monitors successful execution of cron-triggered Inngest functions (digest, sequence, pulse, trending, changelog, discord queues)',
    envVarName: 'BETTERSTACK_HEARTBEAT_INNGEST_CRON',
  },
];

async function main() {
  console.log('🚀 BetterStack Monitor Setup\n');

  // Check if API token is set
  if (!process.env.BETTERSTACK_API_TOKEN) {
    console.error('❌ Error: BETTERSTACK_API_TOKEN environment variable is not set');
    console.error('\nPlease set it before running this script:');
    console.error('  export BETTERSTACK_API_TOKEN=your_token_here');
    console.error('  pnpm tsx scripts/setup-betterstack-monitors.ts\n');
    process.exit(1);
  }

  // List existing monitors to check free tier limits
  console.log('📋 Checking existing monitors...');
  const existingMonitors = await listHeartbeatMonitors();
  
  if (existingMonitors) {
    console.log(`   Found ${existingMonitors.length} existing heartbeat monitor(s)`);
    
    // Check if we're at the free tier limit (10 monitors)
    if (existingMonitors.length >= 10) {
      console.error('\n❌ Error: You have reached the BetterStack free tier limit of 10 heartbeat monitors');
      console.error('   Please delete some monitors or upgrade your plan\n');
      process.exit(1);
    }
    
    // Check if monitors already exist
    const existingNames = existingMonitors.map(m => m.name);
    const toCreate = MONITOR_CONFIGS.filter(config => !existingNames.includes(config.name));
    
    if (toCreate.length === 0) {
      console.log('\n✅ All monitors already exist!');
      console.log('\n📝 Current environment variables:');
      existingMonitors.forEach(monitor => {
        const config = MONITOR_CONFIGS.find(c => c.name === monitor.name);
        if (config) {
          console.log(`   ${config.envVarName}=${monitor.url}`);
        }
      });
      process.exit(0);
    }
    
    console.log(`   Will create ${toCreate.length} new monitor(s)\n`);
  } else {
    console.log('   Could not fetch existing monitors (will attempt to create anyway)\n');
  }

  // Create monitors
  console.log('🔧 Creating monitors...\n');
  const createdMonitors: Array<{ config: MonitorConfig; monitor: { id: string; heartbeat_url: string; name: string } }> = [];

  for (const config of MONITOR_CONFIGS) {
    console.log(`   Creating: ${config.name}`);
    console.log(`   Description: ${config.description}`);
    
    const monitor = await createHeartbeatMonitor({
      name: config.name,
      period: config.period,
      grace: config.grace,
      email: true,
      push: true,
      sms: false,
      call: false,
      critical_alert: false,
    });

    if (monitor) {
      console.log(`   ✅ Created: ${monitor.id}`);
      console.log(`   URL: ${monitor.heartbeat_url}\n`);
      createdMonitors.push({ config, monitor });
    } else {
      console.log(`   ❌ Failed to create monitor\n`);
    }
  }

  // Output environment variables
  if (createdMonitors.length > 0) {
    console.log('📝 Add these environment variables to Netlify/Vercel:\n');
    createdMonitors.forEach(({ config, monitor }) => {
      console.log(`${config.envVarName}=${monitor.heartbeat_url}`);
    });
    console.log('');
  }

  // Summary
  console.log('✅ Setup complete!\n');
  console.log('Next steps:');
  console.log('1. Copy the environment variables above');
  console.log('2. Add them to Netlify/Vercel environment variables');
  console.log('3. Redeploy your application');
  console.log('4. Monitors will start receiving heartbeats automatically\n');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
