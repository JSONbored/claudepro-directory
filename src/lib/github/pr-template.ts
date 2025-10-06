/**
 * Pull Request Template Generator
 * Creates formatted PR descriptions for content submissions
 */

import type { ConfigSubmissionData } from '@/src/lib/schemas/form.schema';

/**
 * Content type display names
 */
const CONTENT_TYPE_LABELS: Record<ConfigSubmissionData['type'], string> = {
  agents: 'Claude Agent',
  mcp: 'MCP Server',
  rules: 'Claude Rule',
  commands: 'Command',
  hooks: 'Hook',
  statuslines: 'Statusline',
} as const;

/**
 * Generate PR title
 */
export function generatePRTitle(type: ConfigSubmissionData['type'], name: string): string {
  return `Add ${CONTENT_TYPE_LABELS[type]}: ${name}`;
}

/**
 * Generate PR body with all submission details
 * Includes checklist for maintainer review
 */
export function generatePRBody(data: {
  type: ConfigSubmissionData['type'];
  name: string;
  slug: string;
  description: string;
  category: string;
  author: string;
  github: string | undefined;
  tags: string[];
  submittedBy: { username: string; email: string } | undefined;
}): string {
  const sections: string[] = [];

  // Header
  sections.push('## 🤖 Community Submission');
  sections.push('');
  sections.push(`**Type:** ${CONTENT_TYPE_LABELS[data.type]}`);
  sections.push(`**Name:** ${data.name}`);
  sections.push(`**Slug:** \`${data.slug}\``);
  sections.push(`**Category:** ${data.category}`);
  sections.push(`**Author:** ${data.author}`);
  if (data.submittedBy) {
    sections.push(`**Submitted by:** @${data.submittedBy.username} (${data.submittedBy.email})`);
  }
  sections.push('');

  // Description
  sections.push('### 📝 Description');
  sections.push(data.description);
  sections.push('');

  // GitHub link if provided
  if (data.github) {
    sections.push('### 🔗 Repository');
    sections.push(`**GitHub:** ${data.github}`);
    sections.push('');
  }

  // Tags
  sections.push('### 🏷️ Tags');
  sections.push(data.tags.map((tag) => `\`${tag}\``).join(', '));
  sections.push('');

  // File location
  sections.push('### 📁 File Location');
  sections.push(`\`content/${data.type}/${data.slug}.json\``);
  sections.push('');

  // Maintainer checklist
  sections.push('---');
  sections.push('');
  sections.push('### ✅ Review Checklist');
  sections.push('');
  sections.push('- [ ] Content is valid JSON');
  sections.push('- [ ] All required fields present');
  sections.push('- [ ] No duplicate content exists');
  sections.push('- [ ] Description is clear and helpful');
  sections.push('- [ ] Tags are relevant and accurate');
  sections.push('- [ ] Category is appropriate');
  sections.push('- [ ] No security concerns (XSS, injection, etc.)');
  sections.push('- [ ] GitHub repository is accessible (if provided)');
  sections.push('- [ ] Content follows community guidelines');
  sections.push('- [ ] Quality standards met');
  sections.push('');

  // Metadata
  sections.push('---');
  sections.push('');
  sections.push('### 📊 Submission Metadata');
  sections.push('');
  sections.push(`**Submitted:** ${new Date().toISOString()}`);
  sections.push(`**Content Type:** \`${data.type}\``);
  sections.push('**Status:** Pending Review');
  sections.push('**Auto-generated:** Yes');
  sections.push('');

  // Footer
  sections.push('---');
  sections.push('');
  sections.push(
    '*This pull request was automatically generated from the [ClaudePro Directory](https://claudepro.directory) submission form.*'
  );
  sections.push('');
  sections.push(
    '**For maintainers:** Review the content, make any necessary edits, and merge when ready. The submitter will be notified automatically.'
  );

  return sections.join('\n');
}

/**
 * Generate PR labels
 * Returns array of label names for GitHub
 */
export function generatePRLabels(type: ConfigSubmissionData['type']): string[] {
  return ['community-submission', `type:${type}`, 'needs-review', 'automated'];
}

/**
 * Generate commit message
 */
export function generateCommitMessage(type: ConfigSubmissionData['type'], name: string): string {
  return `Add ${CONTENT_TYPE_LABELS[type]}: ${name}

Community submission via web form`;
}
