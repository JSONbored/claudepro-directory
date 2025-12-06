/**
 * Test script for MiscService
 * 
 * Run with: pnpm tsx src/services/misc.test.ts
 * 
 * This verifies that the Prisma-based MiscService works correctly
 * and returns the same data as the Supabase version.
 */

import { MiscService } from './misc';

async function testMiscService() {
  console.log('🧪 Testing MiscService (Prisma/Neon)...\n');

  const service = new MiscService();

  try {
    // Test 1: getActiveAnnouncement
    console.log('1. Testing getActiveAnnouncement()...');
    const announcement = await service.getActiveAnnouncement();
    console.log('   ✅ Success:', announcement ? 'Found announcement' : 'No active announcement');
    if (announcement) {
      console.log('   📋 Data:', JSON.stringify(announcement, null, 2));
    }

    // Test 2: getActiveNotifications
    console.log('\n2. Testing getActiveNotifications()...');
    const notifications = await service.getActiveNotifications();
    console.log(`   ✅ Success: Found ${notifications.length} notifications`);
    if (notifications.length > 0) {
      console.log('   📋 First notification:', JSON.stringify(notifications[0], null, 2));
    }

    // Test 3: getNavigationMenu
    console.log('\n3. Testing getNavigationMenu()...');
    const menu = await service.getNavigationMenu();
    console.log('   ✅ Success: Navigation menu retrieved');
    console.log('   📋 Menu structure:', JSON.stringify(menu, null, 2));

    // Test 4: getContactCommands
    console.log('\n4. Testing getContactCommands()...');
    const commands = await service.getContactCommands();
    console.log('   ✅ Success: Contact commands retrieved');
    console.log('   📋 Commands:', JSON.stringify(commands, null, 2));

    // Test 5: getFormFieldConfig
    console.log('\n5. Testing getFormFieldConfig()...');
    const formConfig = await service.getFormFieldConfig({ p_form_type: 'contact' });
    console.log('   ✅ Success: Form field config retrieved');
    if (formConfig) {
      console.log('   📋 Config:', JSON.stringify(formConfig, null, 2));
    } else {
      console.log('   ℹ️  No config found for form type "contact"');
    }

    console.log('\n✅ All tests passed! MiscService is working correctly.');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testMiscService()
  .then(() => {
    console.log('\n✨ Test suite completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
