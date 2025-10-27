/**
 * Auto-generated content index
 *
 * Modern lazy loading architecture:
 * - Metadata loaded on-demand via metadataLoader
 * - Full content lazy-loaded for detail pages
 * - Minimal initial bundle size
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import { metadataLoader } from '@/src/lib/content/lazy-content-loaders';
import type { ContentStats } from '@/src/lib/schemas/content/content-types';

// Lazy metadata getters
export const getAgents = () => metadataLoader.get('agentsMetadata');
export const getMcp = () => metadataLoader.get('mcpMetadata');
export const getCommands = () => metadataLoader.get('commandsMetadata');
export const getRules = () => metadataLoader.get('rulesMetadata');
export const getHooks = () => metadataLoader.get('hooksMetadata');
export const getStatuslines = () => metadataLoader.get('statuslinesMetadata');
export const getCollections = () => metadataLoader.get('collectionsMetadata');
export const getSkills = () => metadataLoader.get('skillsMetadata');
export const getGuides = () => metadataLoader.get('guidesMetadata');
export const getJobs = () => metadataLoader.get('jobsMetadata');
export const getChangelog = () => metadataLoader.get('changelogMetadata');

// Backward compatibility exports
export const agents = getAgents();
export const mcp = getMcp();
export const commands = getCommands();
export const rules = getRules();
export const hooks = getHooks();
export const statuslines = getStatuslines();
export const collections = getCollections();
export const skills = getSkills();
export const guides = getGuides();
export const jobs = getJobs();
export const changelog = getChangelog();

// By-slug getters
export const getAgentBySlug = async (slug: string) => {
  const agentsData = await getAgents();
  return (agentsData as any[]).find(item => item.slug === slug);
};

export const getMcpBySlug = async (slug: string) => {
  const mcpData = await getMcp();
  return (mcpData as any[]).find(item => item.slug === slug);
};

export const getCommandBySlug = async (slug: string) => {
  const commandsData = await getCommands();
  return (commandsData as any[]).find(item => item.slug === slug);
};

export const getRuleBySlug = async (slug: string) => {
  const rulesData = await getRules();
  return (rulesData as any[]).find(item => item.slug === slug);
};

export const getHookBySlug = async (slug: string) => {
  const hooksData = await getHooks();
  return (hooksData as any[]).find(item => item.slug === slug);
};

export const getStatuslineBySlug = async (slug: string) => {
  const statuslinesData = await getStatuslines();
  return (statuslinesData as any[]).find(item => item.slug === slug);
};

export const getCollectionBySlug = async (slug: string) => {
  const collectionsData = await getCollections();
  return (collectionsData as any[]).find(item => item.slug === slug);
};

export const getSkillBySlug = async (slug: string) => {
  const skillsData = await getSkills();
  return (skillsData as any[]).find(item => item.slug === slug);
};

export const getGuideBySlug = async (slug: string) => {
  const guidesData = await getGuides();
  return (guidesData as any[]).find(item => item.slug === slug);
};

export const getJobBySlug = async (slug: string) => {
  const jobsData = await getJobs();
  return (jobsData as any[]).find(item => item.slug === slug);
};

export const getChangelogBySlug = async (slug: string) => {
  const changelogData = await getChangelog();
  return (changelogData as any[]).find(item => item.slug === slug);
};

// Full content lazy loaders
export async function getAgentFullContent(slug: string) {
  const module = await import('./agents-full');
  return module.getAgentFullBySlug(slug);
}

export async function getMcpFullContent(slug: string) {
  const module = await import('./mcp-full');
  return module.getMcpFullBySlug(slug);
}

export async function getCommandFullContent(slug: string) {
  const module = await import('./commands-full');
  return module.getCommandFullBySlug(slug);
}

export async function getRuleFullContent(slug: string) {
  const module = await import('./rules-full');
  return module.getRuleFullBySlug(slug);
}

export async function getHookFullContent(slug: string) {
  const module = await import('./hooks-full');
  return module.getHookFullBySlug(slug);
}

export async function getStatuslineFullContent(slug: string) {
  const module = await import('./statuslines-full');
  return module.getStatuslineFullBySlug(slug);
}

export async function getCollectionFullContent(slug: string) {
  const module = await import('./collections-full');
  return module.getCollectionFullBySlug(slug);
}

export async function getSkillFullContent(slug: string) {
  const module = await import('./skills-full');
  return module.getSkillFullBySlug(slug);
}

export async function getGuideFullContent(slug: string) {
  const module = await import('./guides-full');
  return module.getGuideFullBySlug(slug);
}

export async function getJobFullContent(slug: string) {
  const module = await import('./jobs-full');
  return module.getJobFullBySlug(slug);
}

export async function getChangelogFullContent(slug: string) {
  const module = await import('./changelog-full');
  return module.getChangelogFullBySlug(slug);
}

// Content statistics
export const contentStats: ContentStats = {
  "agents": 37,
  "mcp": 40,
  "commands": 26,
  "rules": 26,
  "hooks": 65,
  "statuslines": 21,
  "collections": 9,
  "skills": 26,
  "guides": 20,
  "jobs": 0,
  "changelog": 40
};
