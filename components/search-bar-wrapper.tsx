'use client';

// Re-export the original SearchBar for now
// Dynamic import with generics is complex and may not provide significant benefits
// since Fuse.js is relatively small (30kb gzipped)
export { SearchBar } from './search-bar';
