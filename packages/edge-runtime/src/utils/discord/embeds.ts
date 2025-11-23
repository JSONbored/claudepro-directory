import { SITE_URL } from '../../clients/supabase.ts';
import { edgeEnv } from '../../config/env.ts';
import type { Database as DatabaseGenerated } from '@heyclaude/database-types';

const CATEGORY_COLORS: Record<string, number> = {
  agents: 0x5865f2,
  mcp: 0x57f287,
  commands: 0xfee75c,
  hooks: 0xeb459e,
  rules: 0xed4245,
  statuslines: 0xf26522,
  skills: 0x3ba55d,
  collections: 0x7289da,
  guides: 0x99aab5,
};

const CATEGORY_EMOJIS: Record<string, string> = {
  agents: '🤖',
  mcp: '🔌',
  commands: '⚡',
  hooks: '🪝',
  rules: '📜',
  statuslines: '📊',
  skills: '🛠️',
  collections: '📚',
  guides: '📖',
};

type ContentRow = DatabaseGenerated['public']['Tables']['content']['Row'];
type SubmissionRow = DatabaseGenerated['public']['Tables']['content_submissions']['Row'];

interface WebhookEventRecord {
  id: string;
  type: string;
  created_at: string;
  error: string | null;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
}

export interface ChangelogSection {
  title: string;
  items: string[];
}

const SUPABASE_PROJECT_ID =
  edgeEnv.supabase.url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'unknown';

export function buildContentEmbed(content: ContentRow) {
  const {
    category,
    slug,
    title,
    display_title,
    description,
    author,
    author_profile_url,
    tags,
    date_added,
  } = content;

  const validCategory = category ?? 'agents';
  const validSlug = slug ?? '';
  const color = CATEGORY_COLORS[validCategory] || CATEGORY_COLORS['agents'];
  const contentUrl = `${SITE_URL}/${validCategory}/${validSlug}`;
  const contentTitle = display_title || title;
  const authorField = author_profile_url ? `[${author}](${author_profile_url})` : author;
  const tagsField = tags && tags.length > 0 ? tags.map((tag) => `#${tag}`).join(' ') : 'None';
  const dateField = new Date(date_added).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const truncatedDescription =
    description.length > 200 ? `${description.slice(0, 200)}...` : description;

  return {
    title: `${CATEGORY_EMOJIS[validCategory] ?? '📄'} ${contentTitle}`,
    description: truncatedDescription,
    color,
    url: contentUrl,
    fields: [
      { name: '✨ Type', value: `\`${validCategory}\``, inline: true },
      { name: '👤 Author', value: authorField, inline: true },
      { name: '🏷️ Tags', value: tagsField, inline: false },
      {
        name: '🔗 Try it now',
        value: `[View on Claude Pro Directory](${contentUrl})`,
        inline: false,
      },
    ],
    footer: { text: `Added on ${dateField} • Claude Pro Directory` },
    timestamp: new Date().toISOString(),
  };
}

export function buildSubmissionEmbed(submission: SubmissionRow) {
  const {
    id,
    name,
    description,
    category,
    submission_type,
    author,
    author_profile_url,
    github_url,
    tags,
    submitter_email,
    created_at,
  } = submission;

  // Safety checks for required fields
  const safeId = id || 'unknown';
  const safeName = name || 'Untitled Submission';
  const safeDescription = description
    ? description.slice(0, 300) + (description.length > 300 ? '...' : '')
    : 'No description provided.';
  const safeCategory = category || 'unknown';
  const safeSubmissionType = submission_type || 'unknown';
  const safeAuthor = author || 'Unknown';
  const safeAuthorField =
    author_profile_url && author ? `[${author}](${author_profile_url})` : safeAuthor;
  const safeCreatedAt = created_at ? new Date(created_at).toISOString() : new Date().toISOString();

  const color = CATEGORY_COLORS[safeCategory] || CATEGORY_COLORS['agents'];
  const dashboardUrl = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/editor/${encodeURIComponent(
    'content_submissions'
  )}?filter=id%3Aeq%3A${safeId}`;

  const fields = [
    { name: '📝 Type', value: `\`${safeSubmissionType}\``, inline: true },
    { name: '📂 Category', value: `\`${safeCategory}\``, inline: true },
    { name: '👤 Author', value: safeAuthorField, inline: true },
  ];

  if (github_url) {
    fields.push({
      name: '🔗 GitHub',
      value: `[View Repository](${github_url})`,
      inline: false,
    });
  }

  if (tags && Array.isArray(tags) && tags.length > 0) {
    fields.push({
      name: '🏷️ Tags',
      value: tags.map((tag) => `\`${tag}\``).join(', '),
      inline: false,
    });
  }

  if (submitter_email) {
    fields.push({
      name: '📧 Submitted by',
      value: submitter_email,
      inline: false,
    });
  }

  fields.push({
    name: '⚙️ Actions',
    value: `[Review in Supabase Dashboard](${dashboardUrl})`,
    inline: false,
  });

  return {
    title: `${CATEGORY_EMOJIS[safeCategory] || '📄'} ${safeName}`,
    description: safeDescription,
    color,
    fields,
    footer: { text: `Submission ID: ${safeId.slice(0, 8)}` },
    timestamp: safeCreatedAt,
  };
}

export function buildErrorEmbed(event: WebhookEventRecord) {
  return {
    title: '🚨 Edge Function Error',
    description: event.error || 'Unknown error',
    color: 15158332,
    fields: [
      { name: '🔧 Event Type', value: `\`${event.type}\``, inline: true },
      {
        name: '📅 Timestamp',
        value: new Date(event.created_at).toLocaleString('en-US', {
          timeZone: 'UTC',
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        inline: true,
      },
      { name: '🆔 Event ID', value: `\`${event.id}\``, inline: false },
    ],
    footer: { text: 'ClaudePro Directory - Edge Function Monitoring' },
    timestamp: event.created_at,
  };
}

export function buildChangelogEmbed(params: {
  slug: string;
  title: string;
  tldr: string;
  sections: ChangelogSection[];
  commits: GitHubCommit[];
  date: string;
}) {
  const { slug, title, tldr, sections, commits, date } = params;
  // Safely extract contributors, filtering out commits without author info
  const contributors = [
    ...new Set(
      commits
        .map((c) => c.commit?.author?.name)
        .filter((name): name is string => typeof name === 'string' && name.length > 0)
    ),
  ];

  const addedSection = sections.find((s) => s.title === 'Added');
  const changedSection = sections.find((s) => s.title === 'Changed');
  const fixedSection = sections.find((s) => s.title === 'Fixed');
  const addedCount = addedSection?.['items']?.length || 0;
  const changedCount = changedSection?.['items']?.length || 0;
  const fixedCount = fixedSection?.['items']?.length || 0;

  const highlights: string[] = [];
  if (addedCount > 0)
    highlights.push(`✨ **${addedCount}** new feature${addedCount === 1 ? '' : 's'}`);
  if (changedCount > 0)
    highlights.push(`🔧 **${changedCount}** improvement${changedCount === 1 ? '' : 's'}`);
  if (fixedCount > 0)
    highlights.push(`🐛 **${fixedCount}** bug fix${fixedCount === 1 ? '' : 'es'}`);

  const description = highlights.join(' • ');
  const fields: Array<{ name: string; value: string; inline: boolean }> = [];

  if (tldr && tldr.length > 0) {
    fields.push({
      name: '📝 TL;DR',
      value: tldr.slice(0, 300) + (tldr.length > 300 ? '...' : ''),
      inline: false,
    });
  }

  addSectionField(fields, sections, 'Added', "✨ What's New");
  addSectionField(fields, sections, 'Changed', '🔧 Improvements');
  addSectionField(fields, sections, 'Fixed', '🐛 Bug Fixes');

  if (commits.length > 0) {
    const latestCommit = commits[commits.length - 1];
    // Safety check: ensure commit has sha property
    if (latestCommit?.sha) {
      const repoOwner = edgeEnv.github.repoOwner || 'unknown';
      const repoName = edgeEnv.github.repoName || 'unknown';
      const commitUrl = `https://github.com/${repoOwner}/${repoName}/commit/${latestCommit.sha}`;
      const shortSha = latestCommit.sha.slice(0, 7);

      fields.push({
        name: '📊 Release Stats',
        value: `${commits.length} commit${commits.length === 1 ? '' : 's'} • ${
          contributors.length
        } contributor${contributors.length === 1 ? '' : 's'}\n[View commit \`${shortSha}\` on GitHub](${commitUrl})`,
        inline: false,
      });
    }
  }

  return {
    title: `📋 ${title}`,
    description,
    color: 0x3ba55d,
    url: `${SITE_URL}/changelog/${slug}`,
    fields,
    footer: {
      text: `Claude Pro Directory • Released ${date}`,
      icon_url: 'https://claudepro.directory/favicon.ico',
    },
    timestamp: new Date().toISOString(),
  };
}

function addSectionField(
  fields: Array<{ name: string; value: string; inline: boolean }>,
  sections: ChangelogSection[],
  sectionTitle: string,
  fieldLabel: string
) {
  const section = sections.find((s) => s.title === sectionTitle);
  if (!section?.['items'] || section['items'].length === 0) return;

  const items = section['items'].slice(0, 5);
  const value = items
    .map((item) => `• ${item.slice(0, 80)}${item.length > 80 ? '...' : ''}`)
    .join('\n');

  fields.push({
    name: fieldLabel,
    value:
      value + (section['items'].length > 5 ? `\n*...and ${section['items'].length - 5} more*` : ''),
    inline: false,
  });
}
