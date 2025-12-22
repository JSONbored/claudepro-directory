export * from './services/trending';
export * from './services/search';
export * from './services/content';
export * from './services/newsletter';
export * from './services/jobs';
export * from './services/changelog';
export * from './services/companies';
export * from './services/account';
export * from './services/misc'; // Consolidated: includes SEO, Community, Quiz, Email methods

export { BasePrismaService } from './services/base-prisma-service';
// Note: prisma export removed to prevent Cloudflare Workers bundling issues
// Services accept injected PrismaClient via constructor for Cloudflare Workers
// For Node.js usage, import prisma directly: import { prisma } from '@heyclaude/data-layer/prisma/client'
export { withSmartCache } from './utils/request-cache';
