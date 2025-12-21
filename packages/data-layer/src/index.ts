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
export { prisma } from './prisma/client';
export { withSmartCache } from './utils/request-cache';
