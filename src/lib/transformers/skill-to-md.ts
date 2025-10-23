/**
 * Skill JSON to SKILL.md Transformer
 *
 * Transforms ClaudePro Directory skill JSON files into Claude Desktop-compatible
 * SKILL.md format with YAML frontmatter and markdown body.
 *
 * @see https://support.claude.com/en/articles/12512198-how-to-create-custom-skills
 */

import type { SkillContent } from '@/src/lib/schemas/content/skill.schema';

/**
 * Transform skill JSON to SKILL.md format
 *
 * @param skill - Validated skill content from JSON
 * @returns Complete SKILL.md file content
 */
export function transformSkillToMarkdown(skill: SkillContent): string {
  const frontmatter = generateYamlFrontmatter(skill);
  const body = generateMarkdownBody(skill);

  return `${frontmatter}\n\n${body}`.trim();
}

/**
 * Generate YAML frontmatter with required fields
 *
 * Required per official spec:
 * - name: 64 char max
 * - description: 200 char max (critical for Claude's invocation logic)
 *
 * @param skill - Skill content
 * @returns YAML frontmatter block
 */
export function generateYamlFrontmatter(skill: SkillContent): string {
  // Escape YAML special characters in strings
  const escapedDescription = escapeYamlString(skill.description);

  return `---
name: ${skill.slug}
description: ${escapedDescription}
---`;
}

/**
 * Generate markdown body from skill content
 *
 * Sections in order:
 * 1. Main content (from JSON content field)
 * 2. Prerequisites (from requirements array)
 * 3. Features (from features array)
 * 4. Use Cases (from useCases array)
 * 5. Examples (from examples array with syntax highlighting)
 * 6. Troubleshooting (from troubleshooting array)
 * 7. Learn More (from documentationUrl)
 *
 * @param skill - Skill content
 * @returns Markdown body
 */
export function generateMarkdownBody(skill: SkillContent): string {
  const sections: string[] = [];

  // Main content (always present)
  if (skill.content) {
    sections.push(skill.content);
  }

  // Optional sections (only add if data exists)
  const prerequisites = generatePrerequisitesSection(skill.requirements);
  if (prerequisites) sections.push(prerequisites);

  const features = generateFeaturesSection(skill.features);
  if (features) sections.push(features);

  const useCases = generateUseCasesSection(skill.useCases);
  if (useCases) sections.push(useCases);

  const examples = generateExamplesSection(skill.examples);
  if (examples) sections.push(examples);

  const troubleshooting = generateTroubleshootingSection(skill.troubleshooting);
  if (troubleshooting) sections.push(troubleshooting);

  const learnMore = generateLearnMoreSection(skill.documentationUrl);
  if (learnMore) sections.push(learnMore);

  return sections.filter(Boolean).join('\n\n');
}

/**
 * Generate Prerequisites section from requirements array
 *
 * @param requirements - Array of requirement strings
 * @returns Markdown section or empty string
 */
export function generatePrerequisitesSection(requirements: string[] | undefined): string {
  if (!requirements || requirements.length === 0) return '';

  const items = requirements.map((req) => `- ${req}`).join('\n');

  return `## Prerequisites\n\n${items}`;
}

/**
 * Generate Features section from features array
 *
 * @param features - Array of feature strings
 * @returns Markdown section or empty string
 */
export function generateFeaturesSection(features: string[] | undefined): string {
  if (!features || features.length === 0) return '';

  const items = features.map((feature) => `- ${feature}`).join('\n');

  return `## Key Features\n\n${items}`;
}

/**
 * Generate Use Cases section from useCases array
 *
 * @param useCases - Array of use case strings
 * @returns Markdown section or empty string
 */
export function generateUseCasesSection(useCases: string[] | undefined): string {
  if (!useCases || useCases.length === 0) return '';

  const items = useCases.map((useCase) => `- ${useCase}`).join('\n');

  return `## Use Cases\n\n${items}`;
}

/**
 * Generate Examples section from examples array
 *
 * @param examples - Array of code examples with syntax highlighting
 * @returns Markdown section or empty string
 */
export function generateExamplesSection(
  examples:
    | Array<{
        title: string;
        code: string;
        language: string;
        description?: string | undefined;
      }>
    | undefined
): string {
  if (!examples || examples.length === 0) return '';

  const exampleBlocks = examples
    .map((example, index) => {
      const parts: string[] = [];

      // Example title
      parts.push(`### Example ${index + 1}: ${example.title}`);

      // Optional description
      if (example.description) {
        parts.push(example.description);
      }

      // Code block with syntax highlighting
      parts.push(`\`\`\`${example.language}\n${example.code}\n\`\`\``);

      return parts.join('\n\n');
    })
    .join('\n\n');

  return `## Examples\n\n${exampleBlocks}`;
}

/**
 * Generate Troubleshooting section from troubleshooting array
 *
 * @param troubleshooting - Array of issue/solution pairs
 * @returns Markdown section or empty string
 */
export function generateTroubleshootingSection(
  troubleshooting:
    | Array<{
        issue: string;
        solution: string;
      }>
    | undefined
): string {
  if (!troubleshooting || troubleshooting.length === 0) return '';

  const items = troubleshooting
    .map((item) => {
      return `### ${item.issue}\n\n${item.solution}`;
    })
    .join('\n\n');

  return `## Troubleshooting\n\n${items}`;
}

/**
 * Generate Learn More section from documentation URL
 *
 * @param documentationUrl - External documentation URL
 * @returns Markdown section or empty string
 */
export function generateLearnMoreSection(documentationUrl: string | undefined): string {
  if (!documentationUrl) return '';

  return `## Learn More\n\nFor additional documentation and resources, visit:\n\n${documentationUrl}`;
}

/**
 * Escape YAML special characters in strings
 *
 * YAML requires escaping or quoting for:
 * - Colons followed by space
 * - Quotes
 * - Hash symbols at start
 * - Line breaks
 *
 * @param str - String to escape
 * @returns YAML-safe string
 */
function escapeYamlString(str: string): string {
  // If string contains special chars, wrap in double quotes and escape internal quotes
  const needsQuoting =
    str.includes(':') ||
    str.includes('"') ||
    str.includes("'") ||
    str.includes('#') ||
    str.includes('\n');

  if (needsQuoting) {
    // Escape double quotes
    const escaped = str.replace(/"/g, '\\"');
    return `"${escaped}"`;
  }

  return str;
}
