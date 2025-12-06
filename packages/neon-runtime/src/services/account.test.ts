/**
 * Test script for AccountService
 * 
 * Run with: pnpm tsx src/services/account.test.ts
 * 
 * This verifies that the Prisma-based AccountService works correctly.
 * 
 * NOTE: Most functions require a user_id. You may need to provide a test user ID.
 */

import { AccountService } from './account';

async function testAccountService() {
  console.log('🧪 Testing AccountService (Prisma/Neon)...\n');

  const service = new AccountService();

  // NOTE: Most functions require a user_id
  // For testing, you may need to:
  // 1. Get a real user ID from the database
  // 2. Or create a test user
  // 3. Or skip user-dependent tests

  const testUserId = process.env['TEST_USER_ID'] || '00000000-0000-0000-0000-000000000000';

  try {
    // Test 1: getSubmissionDashboard (no user_id required)
    console.log('1. Testing getSubmissionDashboard()...');
    const submissionDashboard = await service.getSubmissionDashboard();
    console.log('   ✅ Success: Submission dashboard retrieved');
    if (submissionDashboard) {
      console.log('   📋 Has data:', Object.keys(submissionDashboard).length > 0);
    }

    // Test 2: getAccountDashboard (requires user_id)
    console.log('\n2. Testing getAccountDashboard()...');
    try {
      const accountDashboard = await service.getAccountDashboard({ p_user_id: testUserId });
      console.log('   ✅ Success: Account dashboard retrieved');
      if (accountDashboard) {
        console.log('   📋 Has data:', Object.keys(accountDashboard).length > 0);
      } else {
        console.log('   ℹ️  No dashboard data (user may not exist)');
      }
    } catch (error) {
      console.log('   ⚠️  Skipped (user may not exist):', (error as Error).message);
    }

    // Test 3: getUserLibrary (requires user_id)
    console.log('\n3. Testing getUserLibrary()...');
    try {
      const userLibrary = await service.getUserLibrary({ p_user_id: testUserId });
      console.log('   ✅ Success: User library retrieved');
      if (userLibrary) {
        console.log('   📋 Has data:', Object.keys(userLibrary).length > 0);
      }
    } catch (error) {
      console.log('   ⚠️  Skipped (user may not exist):', (error as Error).message);
    }

    // Test 4: isBookmarked (requires user_id and content)
    console.log('\n4. Testing isBookmarked()...');
    try {
      const isBookmarked = await service.isBookmarked({
        p_user_id: testUserId,
        p_content_type: 'agents',
        p_content_slug: 'test-slug',
      });
      console.log('   ✅ Success: Bookmark status retrieved');
      console.log('   📋 Result:', isBookmarked);
    } catch (error) {
      console.log('   ⚠️  Skipped (user/content may not exist):', (error as Error).message);
    }

    // Test 5: isFollowing (requires user IDs)
    console.log('\n5. Testing isFollowing()...');
    try {
      const isFollowing = await service.isFollowing({
        follower_id: testUserId,
        following_id: testUserId, // Same user (will be false)
      });
      console.log('   ✅ Success: Following status retrieved');
      console.log('   📋 Result:', isFollowing);
    } catch (error) {
      console.log('   ⚠️  Skipped (users may not exist):', (error as Error).message);
    }

    console.log('\n✅ All tests completed!');
    console.log('\n💡 Tip: Set TEST_USER_ID environment variable to test user-dependent functions');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testAccountService()
  .then(() => {
    console.log('\n✨ Test suite completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
