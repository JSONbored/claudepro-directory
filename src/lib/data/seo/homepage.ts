import { unstable_cache } from 'next/cache';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

const getCachedHomeMetadata = unstable_cache(
  async () => {
    return await generatePageMetadata('/');
  },
  ['layout-home-metadata'],
  {
    revalidate: 86400,
    tags: ['homepage-metadata'],
  }
);

export async function getHomeMetadata() {
  return getCachedHomeMetadata();
}
