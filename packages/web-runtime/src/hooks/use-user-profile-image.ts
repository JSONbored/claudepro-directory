'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthenticatedUser } from './use-authenticated-user';

/**
 * Hook to fetch and cache the authenticated user's profile image from the database.
 *
 * Uses client-side caching (localStorage) to avoid repeated API calls.
 * Automatically invalidates cache when user changes.
 *
 * @returns The user's profile image URL from the database, or null if not available
 *
 * @example
 * ```tsx
 * function UserAvatar() {
 *   const profileImageUrl = useUserProfileImage();
 *   return <img src={profileImageUrl || '/default-avatar.png'} />;
 * }
 * ```
 */
export function useUserProfileImage(): string | null {
  const { user, isAuthenticated } = useAuthenticatedUser({ context: 'useUserProfileImage' });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchedUserIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Reset state when user changes
    if (user?.id !== fetchedUserIdRef.current) {
      setImageUrl(null);
      fetchedUserIdRef.current = null;
    }

    // Don't fetch if not authenticated or already fetched for this user
    if (!isAuthenticated || !user?.id || user.id === fetchedUserIdRef.current) {
      return;
    }

    // Check localStorage cache first
    const cacheKey = `user-profile-image-${user.id}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      try {
        const { imageUrl: cachedUrl, timestamp } = JSON.parse(cached);
        const cacheAge = Date.now() - timestamp;
        const cacheMaxAge = 5 * 60 * 1000; // 5 minutes

        // Use cached value if still fresh
        if (cacheAge < cacheMaxAge && cachedUrl !== null) {
          setImageUrl(cachedUrl);
          fetchedUserIdRef.current = user.id;
          return;
        }
      } catch {
        // Invalid cache, continue to fetch
      }
    }

    // Fetch from API
    setIsLoading(true);

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    fetch('/api/user/profile-image', {
      signal: abortControllerRef.current.signal,
      credentials: 'include',
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch profile image: ${response.statusText}`);
        }
        const data = await response.json();
        const fetchedUrl = data.imageUrl ?? null;

        // Update state
        setImageUrl(fetchedUrl);
        fetchedUserIdRef.current = user.id;

        // Cache in localStorage
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            imageUrl: fetchedUrl,
            timestamp: Date.now(),
          })
        );
      })
      .catch((error) => {
        // Ignore abort errors
        if (error.name === 'AbortError') {
          return;
        }
        // Log error but don't throw (graceful degradation)
        console.error('Failed to fetch user profile image:', error);
        // Set to null to fall back to metadata avatar
        setImageUrl(null);
      })
      .finally(() => {
        setIsLoading(false);
        abortControllerRef.current = null;
      });

    return () => {
      // Cleanup: abort request on unmount or user change
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user?.id, isAuthenticated]);

  return imageUrl;
}
