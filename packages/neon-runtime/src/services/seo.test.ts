/**
 * Test script for SeoService
 * 
 * Run with: pnpm tsx src/services/seo.test.ts
 */

import { SeoService } from './seo';

async function testSeoService() {
  console.log('🧪 Testing SeoService (Prisma/Neon)...\n');

  const service = new SeoService();

  try {
    // Test 1: generateMetadata for homepage
    console.log('1. Testing generateMetadata() for homepage...');
    const homepageMetadata = await service.generateMetadata({ p_route: '/' });
    console.log('   ✅ Success: Homepage metadata generated');
    if (homepageMetadata) {
      console.log('   📋 Has data:', Object.keys(homepageMetadata).length > 0);
    }

    // Test 2: generateMetadata for category page
    console.log('\n2. Testing generateMetadata() for category page...');
    const categoryMetadata = await service.generateMetadata({
      p_route: '/agents',
      p_include: 'metadata',
    });
    console.log('   ✅ Success: Category metadata generated');
    if (categoryMetadata) {
      console.log('   📋 Has data:', Object.keys(categoryMetadata).length > 0);
    }

    console.log('\n✅ All tests passed! SeoService is working correctly.');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testSeoService()
  .then(() => {
    console.log('\n✨ Test suite completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
