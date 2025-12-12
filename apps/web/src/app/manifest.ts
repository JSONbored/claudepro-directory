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
    background_color: '#ffffff',
    categories: ['productivity', 'developer', 'utilities'],
    description,
    dir: 'ltr',
    display: 'standalone',
    icons: [
      {
        purpose: 'any',
        sizes: '16x16',
        src: '/assets/icons/favicon-16x16.png',
        type: 'image/png',
      },
      {
        purpose: 'any',
        sizes: '32x32',
        src: '/assets/icons/favicon-32x32.png',
        type: 'image/png',
      },
      {
        purpose: 'any',
        sizes: '192x192',
        src: '/assets/icons/icon-192.png',
        type: 'image/png',
      },
      {
        purpose: 'maskable',
        sizes: '192x192',
        src: '/assets/icons/icon-192.png',
        type: 'image/png',
      },
      {
        purpose: 'any',
        sizes: '512x512',
        src: '/assets/icons/icon-512.png',
        type: 'image/png',
      },
      {
        purpose: 'maskable',
        sizes: '512x512',
        src: '/assets/icons/icon-512.png',
        type: 'image/png',
      },
      {
        purpose: 'any',
        sizes: '180x180',
        src: '/assets/icons/apple-touch-icon.png',
        type: 'image/png',
      },
    ],
    lang: 'en-US',
    name: APP_CONFIG.name,
    orientation: 'portrait-primary',
    prefer_related_applications: false,
    scope: '/',
    short_name: 'ClaudePro',
    start_url: '/',
    theme_color: '#000000',
  };
}
