/**
 * Discord Embed Builders
 * 
 * Type-safe builders for Discord embed objects.
 * These are runtime-agnostic and can be used by any system that sends Discord webhooks.
 */

import { DISCORD_COLORS, DISCORD_EMOJI, DISCORD_LIMITS } from './constants.ts';
import { 
  sanitizeForDiscord, 
  sanitizeEmbedTitle, 
  sanitizeEmbedDescription,
  sanitizeFieldValue,
  sanitizeErrorForCodeBlock,
  isValidSlug,
} from './sanitization.ts';

/**
 * Discord embed field structure
 */
export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

/**
 * Discord embed structure (simplified)
 */
export interface DiscordEmbed {
  title?: string | undefined;
  description?: string | undefined;
  url?: string | undefined;
  color?: number | undefined;
  fields?: DiscordEmbedField[] | undefined;
  footer?: { text: string } | undefined;
  timestamp?: string | undefined;
  author?: {
    name: string;
    url?: string | undefined;
    icon_url?: string | undefined;
  } | undefined;
  thumbnail?: { url: string } | undefined;
  image?: { url: string } | undefined;
}

/**
 * Job data for building job embeds
 */
export interface JobEmbedData {
  id: string;
  slug: string | null;
  title: string | null;
  description: string | null;
  company: string | null;
  location: string | null;
  type: string | null;
  salary: string | null;
  tier: string | null;
  status?: string | null;
}

/**
 * Build a Discord embed for a job listing
 * 
 * @param job - Job data
 * @param options - Build options
 * @returns Discord embed object, or null if job data is invalid
 */
export function buildJobEmbed(
  job: JobEmbedData,
  options: {
    isNew?: boolean;
    siteUrl?: string;
  } = {}
): DiscordEmbed | null {
  const { isNew = true, siteUrl = 'https://claudepro.directory' } = options;
  
  // Validate slug for URL safety
  if (!isValidSlug(job.slug)) {
    return null;
  }
  
  const fields: DiscordEmbedField[] = [];
  
  // Add fields in order of importance (max 6 for readability)
  if (job.company) {
    fields.push({ 
      name: `${DISCORD_EMOJI.company} Company`, 
      value: sanitizeFieldValue(job.company), 
      inline: true 
    });
  }
  
  if (job.location) {
    fields.push({ 
      name: `${DISCORD_EMOJI.location} Location`, 
      value: sanitizeFieldValue(job.location), 
      inline: true 
    });
  }
  
  if (job.type) {
    fields.push({ 
      name: `${DISCORD_EMOJI.type} Type`, 
      value: sanitizeFieldValue(job.type), 
      inline: true 
    });
  }
  
  if (job.salary) {
    fields.push({ 
      name: `${DISCORD_EMOJI.salary} Salary`, 
      value: sanitizeFieldValue(job.salary), 
      inline: true 
    });
  }
  
  if (job.tier) {
    fields.push({ 
      name: `${DISCORD_EMOJI.tier} Tier`, 
      value: sanitizeFieldValue(job.tier), 
      inline: true 
    });
  }
  
  // Determine color based on tier
  const color = job.tier === 'featured' 
    ? DISCORD_COLORS.tier.featured 
    : DISCORD_COLORS.content.job;
  
  return {
    title: sanitizeEmbedTitle(job.title) || 'New Job Listing',
    description: sanitizeEmbedDescription(job.description) || 'No description provided.',
    url: `${siteUrl}/jobs/${encodeURIComponent(job.slug!)}`,
    color,
    fields: fields.slice(0, DISCORD_LIMITS.fieldsPerEmbed),
    footer: {
      text: isNew ? 'New job posted on Claude Pro Directory' : 'Job updated on Claude Pro Directory',
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Submission data for building submission embeds
 */
export interface SubmissionEmbedData {
  id: string;
  category: string | null;
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
  author?: string | null;
  submission_type?: string | null;
  status?: string | null;
}

/**
 * Build a Discord embed for a content submission
 * 
 * @param submission - Submission data
 * @param options - Build options
 * @returns Discord embed object
 */
export function buildSubmissionEmbed(
  submission: SubmissionEmbedData,
  options: {
    siteUrl?: string;
  } = {}
): DiscordEmbed {
  const { siteUrl = 'https://claudepro.directory' } = options;
  
  const fields: DiscordEmbedField[] = [];
  
  if (submission.category) {
    fields.push({
      name: 'Category',
      value: sanitizeFieldValue(submission.category),
      inline: true,
    });
  }
  
  if (submission.submission_type) {
    fields.push({
      name: 'Type',
      value: sanitizeFieldValue(submission.submission_type),
      inline: true,
    });
  }
  
  if (submission.author) {
    fields.push({
      name: 'Submitted by',
      value: sanitizeFieldValue(submission.author),
      inline: true,
    });
  }
  
  if (submission.url) {
    fields.push({
      name: `${DISCORD_EMOJI.link} URL`,
      value: sanitizeForDiscord(submission.url, DISCORD_LIMITS.fieldValue),
      inline: false,
    });
  }
  
  return {
    title: sanitizeEmbedTitle(submission.title) || 'New Submission',
    description: sanitizeEmbedDescription(submission.description) || 'No description provided.',
    url: submission.slug && isValidSlug(submission.slug) && submission.category
      ? `${siteUrl}/${encodeURIComponent(submission.category)}/${encodeURIComponent(submission.slug)}`
      : undefined,
    color: DISCORD_COLORS.content.submission,
    fields: fields.slice(0, DISCORD_LIMITS.fieldsPerEmbed),
    footer: {
      text: 'Content submission on Claude Pro Directory',
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Error data for building error notification embeds
 */
export interface ErrorEmbedData {
  title: string;
  error: string;
  source?: string;
  context?: Record<string, unknown>;
}

/**
 * Build a Discord embed for an error notification
 * 
 * @param errorData - Error data
 * @returns Discord embed object
 */
export function buildErrorEmbed(errorData: ErrorEmbedData): DiscordEmbed {
  const fields: DiscordEmbedField[] = [];
  
  if (errorData.source) {
    fields.push({
      name: 'Source',
      value: sanitizeFieldValue(errorData.source),
      inline: true,
    });
  }
  
  // Add context fields if present
  if (errorData.context) {
    const contextEntries = Object.entries(errorData.context).slice(0, 3);
    for (const [key, value] of contextEntries) {
      fields.push({
        name: sanitizeForDiscord(key, DISCORD_LIMITS.fieldName),
        value: sanitizeFieldValue(String(value)),
        inline: true,
      });
    }
  }
  
  return {
    title: `${DISCORD_EMOJI.error} ${sanitizeEmbedTitle(errorData.title)}`,
    description: `\`\`\`\n${sanitizeErrorForCodeBlock(errorData.error, 1000)}\n\`\`\``,
    color: DISCORD_COLORS.content.error,
    fields: fields.slice(0, DISCORD_LIMITS.fieldsPerEmbed),
    footer: {
      text: 'Error notification from Claude Pro Directory',
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Changelog data for building changelog embeds
 */
export interface ChangelogEmbedData {
  slug: string;
  title: string;
  tldr?: string | null;
  sections?: Array<{ title: string; items: string[] }>;
  date?: string;
}

/**
 * Build a Discord embed for a changelog entry
 * 
 * @param changelog - Changelog data
 * @param options - Build options
 * @returns Discord embed object
 */
export function buildChangelogEmbed(
  changelog: ChangelogEmbedData,
  options: {
    siteUrl?: string;
  } = {}
): DiscordEmbed {
  const { siteUrl = 'https://claudepro.directory' } = options;
  
  const fields: DiscordEmbedField[] = [];
  
  // Add sections as fields
  if (changelog.sections) {
    for (const section of changelog.sections.slice(0, 4)) {
      const items = section.items
        .slice(0, 5)
        .map(item => `• ${sanitizeForDiscord(item, 100)}`)
        .join('\n');
      
      if (items) {
        fields.push({
          name: sanitizeForDiscord(section.title, DISCORD_LIMITS.fieldName),
          value: items.slice(0, DISCORD_LIMITS.fieldValue),
          inline: false,
        });
      }
    }
  }
  
  return {
    title: `${DISCORD_EMOJI.changelog} ${sanitizeEmbedTitle(changelog.title)}`,
    description: changelog.tldr 
      ? sanitizeEmbedDescription(changelog.tldr) 
      : undefined,
    url: isValidSlug(changelog.slug) 
      ? `${siteUrl}/changelog/${encodeURIComponent(changelog.slug)}`
      : undefined,
    color: DISCORD_COLORS.content.changelog,
    fields: fields.slice(0, DISCORD_LIMITS.fieldsPerEmbed),
    footer: {
      text: 'Changelog update from Claude Pro Directory',
    },
    timestamp: changelog.date || new Date().toISOString(),
  };
}
