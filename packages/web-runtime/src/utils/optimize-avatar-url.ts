/**
 * Avatar URL Optimization Utilities
 * 
 * Optimizes external avatar URLs (GitHub, Google) by adding size parameters
 * to reduce download size. GitHub avatars are 225x225 by default but can be
 * requested at specific sizes using ?s= parameter.
 * 
 * This reduces image payload size by ~75% (from 225x225 to 112x112 for typical avatars)
 */

/**
 * Optimize GitHub avatar URL by adding size parameter
 * 
 * GitHub avatars support ?s= parameter to request specific size in pixels
 * Format: https://avatars.githubusercontent.com/u/{id}?v=4&s={size}
 * 
 * OPTIMIZATION: GitHub avatars default to 225x225px, but we can request smaller sizes.
 * For community member avatars (max 200px display), we request exactly what we need.
 * 
 * @param url - GitHub avatar URL
 * @param size - Desired size in pixels (requested size, not display size)
 * @returns Optimized URL with size parameter, or original URL if not a GitHub avatar
 */
export function optimizeGitHubAvatarUrl(url: string, size: number = 112): string {
  if (!url || typeof url !== 'string') {
    return url;
  }
  
  try {
    const urlObj = new URL(url);
    
    // Check if it's a GitHub avatar URL
    if (urlObj.hostname === 'avatars.githubusercontent.com' || urlObj.hostname === 'github.com') {
      // GitHub avatars: add or update ?s= parameter
      urlObj.searchParams.set('s', String(size));
      // Keep existing ?v=4 parameter if present
      return urlObj.toString();
    }
    
    // Not a GitHub avatar, return as-is
    return url;
  } catch {
    // Invalid URL, return as-is
    return url;
  }
}

/**
 * Optimize Google avatar URL by adding size parameter
 * 
 * Google avatars from lh3.googleusercontent.com support size parameters
 * Format: https://lh3.googleusercontent.com/a/{path}?s={size}
 * 
 * OPTIMIZATION: Google avatars can be large by default, but we can request specific sizes.
 * For community member avatars (max 200px display), we request exactly what we need.
 * 
 * @param url - Google avatar URL
 * @param size - Desired size in pixels (requested size, not display size)
 * @returns Optimized URL with size parameter, or original URL if not a Google avatar
 */
export function optimizeGoogleAvatarUrl(url: string, size: number = 112): string {
  if (!url || typeof url !== 'string') {
    return url;
  }
  
  try {
    const urlObj = new URL(url);
    
    // Check if it's a Google avatar URL
    if (urlObj.hostname === 'lh3.googleusercontent.com') {
      // Google avatars: add or update ?s= parameter
      urlObj.searchParams.set('s', String(size));
      return urlObj.toString();
    }
    
    // Not a Google avatar, return as-is
    return url;
  } catch {
    // Invalid URL, return as-is
    return url;
  }
}

/**
 * Optimize any avatar URL (GitHub, Google, or other)
 * 
 * Automatically detects the avatar provider and applies appropriate optimization.
 * 
 * OPTIMIZATION: For community member avatars, we request 2x the display size for retina displays,
 * but cap at 200px max since avatars are never displayed larger than that.
 * 
 * @param url - Avatar URL (GitHub, Google, or other)
 * @param displaySize - Display size in pixels (actual rendered size, not retina)
 * @returns Optimized URL with size parameter, or original URL if optimization not applicable
 */
export function optimizeAvatarUrl(url: string | null | undefined, displaySize: number = 112): string | null | undefined {
  if (!url || typeof url !== 'string') {
    return url;
  }
  
  // OPTIMIZATION: Request 2x for retina displays, but cap at 200px max
  // Community member avatars are never displayed larger than 200px
  // This ensures crisp display on retina screens while minimizing download size
  const requestedSize = Math.min(displaySize * 2, 200);
  
  // Try GitHub optimization first
  const githubOptimized = optimizeGitHubAvatarUrl(url, requestedSize);
  if (githubOptimized !== url) {
    return githubOptimized;
  }
  
  // Try Google optimization
  const googleOptimized = optimizeGoogleAvatarUrl(url, requestedSize);
  if (googleOptimized !== url) {
    return googleOptimized;
  }
  
  // No optimization applicable, return original
  return url;
}
