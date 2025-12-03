import { getContentDescriptionCopy } from '@heyclaude/web-runtime/data';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { type MetadataRoute } from 'next';

/**
 * Builds the web app manifest used as Next.js metadata for the site.
 *
 * This function fetches the site's descriptive copy and returns a complete
 * MetadataRoute.Manifest object populated with application name (from
 * APP_CONFIG), short name, description, start URL, display/orientation settings,
 * theme/background colors, categories, language/direction, and a set of icon
 * descriptors (including maskable and Apple touch icons).
 *
 * @returns A MetadataRoute.Manifest describing the Progressive Web App (PWA)
 *          metadata — includes name, short_name, description, start_url, scope,
 *          display, orientation, background_color, theme_color, categories,
 *          language/direction, prefer_related_applications, and icons.
 *
 * @see getContentDescriptionCopy — provides the manifest description text
 * @see APP_CONFIG — provides the application name used in the manifest
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const description = await getContentDescriptionCopy();

  return {
    name: APP_CONFIG.name,
    short_name: 'ClaudePro',
    description,
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
        src: '/assets/icons/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/icons/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/assets/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/assets/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}