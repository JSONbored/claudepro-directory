import { getContentDescriptionCopy } from '@heyclaude/web-runtime/data';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { type MetadataRoute } from 'next';

/**
 * Builds the web app manifest used for Progressive Web App metadata.
 *
 * Fetches the app description from getContentDescriptionCopy and composes a
 * MetadataRoute.Manifest containing app identity, display/orientation preferences,
 * colors, language/direction, categories, and a set of icon entries (including maskable variants).
 *
 * Edge cases:
 * - If the description fetch fails, the function will propagate the error from getContentDescriptionCopy.
 *
 * @returns The Web App Manifest object (MetadataRoute.Manifest) for this application.
 * @see getContentDescriptionCopy
 * @see APP_CONFIG
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