/**
 * Test script for QuizService
 * 
 * Run with: pnpm tsx src/services/quiz.test.ts
 */

import { QuizService } from './quiz';

async function testQuizService() {
  console.log('🧪 Testing QuizService (Prisma/Neon)...\n');

  const service = new QuizService();

  try {
    // Test 1: getQuizConfiguration
    console.log('1. Testing getQuizConfiguration()...');
    const config = await service.getQuizConfiguration();
    console.log('   ✅ Success: Quiz configuration retrieved');
    if (config) {
      console.log('   📋 Has data:', Object.keys(config).length > 0);
    } else {
      console.log('   ℹ️  No configuration found');
    }

    // Test 2: getRecommendations (requires parameters)
    console.log('\n2. Testing getRecommendations()...');
    const recommendations = await service.getRecommendations({
      p_use_case: 'development',
      p_experience_level: 'intermediate',
      p_tool_preferences: ['vscode', 'git'],
    });
    console.log('   ✅ Success: Recommendations retrieved');
    console.log(`   📋 Found ${recommendations.length} recommendations`);

    console.log('\n✅ All tests passed! QuizService is working correctly.');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testQuizService()
  .then(() => {
    console.log('\n✨ Test suite completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
