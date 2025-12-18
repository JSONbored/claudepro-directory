// Export types only - actions should be imported directly from action files
// This prevents TypeScript from losing callable function signatures through re-exports

// Export input types (can't export from 'use server' files, but types are OK)
export type { CreateJobInput } from '../actions/jobs-crud.ts';
export type { AddBookmarkInput, RemoveBookmarkInput } from '../actions/bookmarks.ts';

// NOTE: Actions are NOT re-exported here to preserve next-safe-action callable function signatures.
// Import actions directly from their source files:
// - import { createJob, updateJob, deleteJob } from '@heyclaude/web-runtime/actions/jobs-crud';
// - import { addBookmark } from '@heyclaude/web-runtime/actions/bookmarks';
// etc.
