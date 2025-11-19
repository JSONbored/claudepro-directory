/**
 * Skill JSON to SKILL.md Transformer
 * Transforms database skill records into Claude Desktop-compatible SKILL.md format
 */

import type { Database } from '@/src/types/database.types';

type SkillRow = Database['public']['Tables']['content']['Row'] & { category: 'skills' };

interface SkillExample {
  title: string;
  code: string;
  language: string;
  description?: string;
}

interface TroubleshootingItem {
  issue: string;
  solution: string;
}

export function transformSkillToMarkdown(skill: SkillRow): string {
  const frontmatter = generateYamlFrontmatter(skill);
  const body = generateMarkdownBody(skill);
  return `${frontmatter}\n\n${body}`.trim();
}

export function generateYamlFrontmatter(skill: SkillRow): string {
  const escapedDescription = escapeYamlString(skill.description);
  return `---
name: ${skill.slug}
description: ${escapedDescription}
---`;
}

export function generateMarkdownBody(skill: SkillRow): string {
  const sections: string[] = [];
  const metadata = (skill.metadata as Record<string, unknown>) || {};

  if (skill.content) sections.push(skill.content);

  const dependencies = metadata['dependencies'] as string[] | null;
  const prerequisites = generatePrerequisitesSection(dependencies);
  if (prerequisites) sections.push(prerequisites);

  const features = generateFeaturesSection(skill.features);
  if (features) sections.push(features);

  const useCases = generateUseCasesSection(skill.use_cases as string[] | null);
  if (useCases) sections.push(useCases);

  const examples = generateExamplesSection(skill.examples as SkillExample[] | null);
  if (examples) sections.push(examples);

  const troubleshooting = metadata['troubleshooting'] as TroubleshootingItem[] | null;
  const troubleshootingSection = generateTroubleshootingSection(troubleshooting);
  if (troubleshootingSection) sections.push(troubleshootingSection);

  const learnMore = generateLearnMoreSection(skill.documentation_url);
  if (learnMore) sections.push(learnMore);

  return sections.filter(Boolean).join('\n\n');
}

export function generatePrerequisitesSection(requirements: string[] | null): string {
  if (!requirements || requirements.length === 0) return '';
  const items = requirements.map((req) => `- ${req}`).join('\n');
  return `## Prerequisites\n\n${items}`;
}

export function generateFeaturesSection(features: string[] | null): string {
  if (!features || features.length === 0) return '';
  const items = features.map((feature) => `- ${feature}`).join('\n');
  return `## Key Features\n\n${items}`;
}

export function generateUseCasesSection(useCases: string[] | null): string {
  if (!useCases || useCases.length === 0) return '';
  const items = useCases.map((useCase) => `- ${useCase}`).join('\n');
  return `## Use Cases\n\n${items}`;
}

export function generateExamplesSection(examples: SkillExample[] | null): string {
  if (!examples || examples.length === 0) return '';

  const exampleBlocks = examples
    .map((example, index) => {
      const parts: string[] = [];
      parts.push(`### Example ${index + 1}: ${example.title}`);
      if (example.description) parts.push(example.description);
      parts.push(`\`\`\`${example.language}\n${example.code}\n\`\`\``);
      return parts.join('\n\n');
    })
    .join('\n\n');

  return `## Examples\n\n${exampleBlocks}`;
}

export function generateTroubleshootingSection(
  troubleshooting: TroubleshootingItem[] | null
): string {
  if (!troubleshooting || troubleshooting.length === 0) return '';

  const items = troubleshooting.map((item) => `### ${item.issue}\n\n${item.solution}`).join('\n\n');

  return `## Troubleshooting\n\n${items}`;
}

export function generateLearnMoreSection(documentationUrl: string | null): string {
  if (!documentationUrl) return '';
  return `## Learn More\n\nFor additional documentation and resources, visit:\n\n${documentationUrl}`;
}

function escapeYamlString(str: string): string {
  const needsQuoting =
    str.includes(':') ||
    str.includes('"') ||
    str.includes("'") ||
    str.includes('#') ||
    str.includes('\n');

  if (needsQuoting) {
    // Escape backslashes first, then double quotes (CodeQL security recommendation)
    const escaped = str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${escaped}"`;
  }

  return str;
}
