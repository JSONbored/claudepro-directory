/**
 * App-level schemas and types for Next.js components
 */

import { z } from 'zod';
import { slugString } from '@/src/lib/schemas/primitives';

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

export type SEOPageData = {
  title: string;
  seoTitle?: string;
  description: string;
  keywords: string[];
  dateUpdated: string;
  content: string;
  author?: string;
  readingTime?: string;
  difficulty?: string;
  category?: string;
  sections?: Record<string, unknown>[];
  isJsonGuide?: boolean;
};

export type RelatedGuide = {
  title: string;
  slug: string;
  category: string;
};
