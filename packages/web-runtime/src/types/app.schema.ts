/**
 * App-level schemas and types for Next.js components
 */

import { slugString } from '@heyclaude/shared-runtime';
import { z } from 'zod';

export type PageProps = {
  params?: Promise<{ [key: string]: string | string[] | undefined }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export type PagePropsWithSearchParams = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const slugParamsSchema = z.object({
  slug: slugString,
});

export type SlugParams = z.infer<typeof slugParamsSchema>;

export type FormState = {
  success?: boolean;
  error?: string;
  errors?: Record<string, string[]>;
  issueUrl?: string | null;
  fallback?: boolean;
};

export type LazyLoadedData<T> = {
  isLoaded: boolean;
  data: T | null;
  loadPromise: Promise<T> | null;
};

export type LazyLoaderOptions<T> = {
  preload?: boolean;
  cacheTimeout?: number;
  onLoad?: (data: T) => void;
  onError?: (error: Error) => void;
};

export type RelatedGuide = {
  title: string;
  slug: string;
  category: string;
};
