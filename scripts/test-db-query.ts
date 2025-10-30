import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

async function test() {
  const envPath = join(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  const urlMatch = envContent.match(/(?:SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL)=(.+)/);
  const keyMatch = envContent.match(/SUPABASE_ANON_KEY=(.+)/);

  const url = urlMatch![1].trim().replace(/^["']|["']$/g, '');
  const key = keyMatch![1].trim().replace(/^["']|["']$/g, '');

  console.log('Supabase URL:', url.slice(0, 30) + '...');
  console.log('Has anon key:', !!key);

  const supabase = createClient(url, key);

  // Test 1: Direct table query
  console.log('\n=== Test 1: Direct agents table query ===');
  const { data: agentsData, error: agentsError } = await supabase
    .from('agents')
    .select('slug, title')
    .limit(5);

  if (agentsError) {
    console.error('Error:', agentsError);
  } else {
    console.log(`Found ${agentsData?.length || 0} agents:`, agentsData);
  }

  // Test 2: RPC function call
  console.log('\n=== Test 2: get_enriched_content RPC ===');
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_enriched_content', {
    p_category: 'agents',
    p_limit: 5,
    p_offset: 0,
  });

  if (rpcError) {
    console.error('Error:', rpcError);
  } else {
    console.log('RPC returned type:', typeof rpcData);
    console.log(
      'RPC returned:',
      Array.isArray(rpcData) ? `${rpcData.length} items` : 'NOT AN ARRAY'
    );
    if (Array.isArray(rpcData) && rpcData.length > 0) {
      console.log('First item keys:', Object.keys(rpcData[0]));
      console.log('First item slug:', rpcData[0].slug);
    } else {
      console.log('RPC data:', rpcData);
    }
  }
}

test().catch(console.error);
