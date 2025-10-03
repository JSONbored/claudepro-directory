import type { MetadataRoute } from 'next';
import { APP_CONFIG, SEO_CONFIG } from '@/src/lib/constants';

// Route segment configuration
export const runtime = 'nodejs';
export const maxDuration = 5;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_CONFIG.name,
    short_name: 'ClaudePro',
    description: SEO_CONFIG.defaultDescription,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#000000',
    categories: ['productivity', 'developer', 'utilities'],
    lang: 'en-US',
    dir: 'ltr',
    prefer_related_applications: false,
    icons: [
      {
        src: '/favicon.ico',
        sizes: '16x16 32x32 48x48',
        type: 'image/x-icon',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
