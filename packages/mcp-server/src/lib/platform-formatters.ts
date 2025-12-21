/**
 * Platform-Specific Content Formatters
 *
 * Formats content items for different development platforms:
 * - Claude Code: .claude/CLAUDE.md format
 * - Cursor IDE: .cursor/rules/ directory
 * - OpenAI Codex: AGENTS.md format (project root)
 * - Generic: Plain markdown format
 */

/**
 * Content item structure from getContentDetail
 */
export interface ContentItem {
  slug: string;
  title: string;
  displayTitle: string;
  category: string;
  description: string;
  content: string;
  tags: string[];
  author: string;
  authorProfileUrl: string | null;
  dateAdded: Date | null;
  dateUpdated: Date | null;
  createdAt: Date;
  metadata: {
    examples?: Array<{
      title?: string;
      description?: string;
      code?: string;
      language?: string;
    }>;
    features?: string[];
    use_cases?: string[];
    requirements?: string[];
    troubleshooting?: Array<{
      issue?: string;
      solution?: string;
      question?: string;
      answer?: string;
    }>;
    configuration?: Record<string, unknown>;
    installation?: {
      claudeCode?: {
        steps?: string[];
      };
      claudeDesktop?: {
        steps?: string[];
        configPath?: Record<string, string>;
      };
    };
  };
  stats: {
    views: number;
    bookmarks: number;
    copies: number;
  };
}

/**
 * Format content for Claude Code (.claude/CLAUDE.md)
 */
export function formatForClaudeCode(item: ContentItem): string {
  const sections: string[] = [];

  sections.push(`# ${item.title}\n`);
  if (item.description) {
    sections.push(`${item.description}\n`);
  }

  if (item.content) {
    sections.push(item.content);
  }

  if (item.metadata.features && item.metadata.features.length > 0) {
    sections.push('\n## Features\n');
    item.metadata.features.forEach((feature) => {
      sections.push(`- ${feature}`);
    });
  }

  if (item.metadata.use_cases && item.metadata.use_cases.length > 0) {
    sections.push('\n## Use Cases\n');
    item.metadata.use_cases.forEach((useCase) => {
      sections.push(`- ${useCase}`);
    });
  }

  if (item.metadata.examples && item.metadata.examples.length > 0) {
    sections.push('\n## Examples\n');
    item.metadata.examples.forEach((example, index) => {
      if (example.title) {
        sections.push(`### ${example.title}\n`);
      } else {
        sections.push(`### Example ${index + 1}\n`);
      }
      if (example.description) {
        sections.push(`${example.description}\n`);
      }
      if (example.code) {
        const language = example.language || 'plaintext';
        sections.push(`\`\`\`${language}\n${example.code}\n\`\`\`\n`);
      }
    });
  }

  if (item.metadata.requirements && item.metadata.requirements.length > 0) {
    sections.push('\n## Requirements\n');
    item.metadata.requirements.forEach((requirement) => {
      sections.push(`- ${requirement}`);
    });
  }

  if (item.metadata.configuration) {
    sections.push('\n## Configuration\n');
    sections.push('```json');
    sections.push(JSON.stringify(item.metadata.configuration, null, 2));
    sections.push('```\n');
  }

  if (item.metadata.troubleshooting && item.metadata.troubleshooting.length > 0) {
    sections.push('\n## Troubleshooting\n');
    item.metadata.troubleshooting.forEach((item) => {
      if (item.issue && item.solution) {
        sections.push(`### ${item.issue}\n`);
        sections.push(`${item.solution}\n`);
      } else if (item.question && item.answer) {
        sections.push(`### ${item.question}\n`);
        sections.push(`${item.answer}\n`);
      }
    });
  }

  sections.push('\n---\n');
  sections.push(`**Source:** ${item.author}`);
  if (item.authorProfileUrl) {
    sections.push(` | [Profile](${item.authorProfileUrl})`);
  }
  sections.push(
    ` | [Claude Pro Directory](https://claudepro.directory/${item.category}/${item.slug})`
  );
  if (item.tags.length > 0) {
    sections.push(`\n**Tags:** ${item.tags.join(', ')}`);
  }

  return sections.join('\n');
}

/**
 * Format content for Cursor IDE (.cursor/rules/)
 */
export function formatForCursor(item: ContentItem): string {
  const sections: string[] = [];

  sections.push(`# ${item.title}\n`);
  if (item.description) {
    sections.push(`${item.description}\n`);
  }

  if (item.content) {
    sections.push(item.content);
  }

  if (item.metadata.features && item.metadata.features.length > 0) {
    sections.push('\n## Features\n');
    item.metadata.features.forEach((feature) => {
      sections.push(`- ${feature}`);
    });
    sections.push('');
  }

  if (item.metadata.use_cases && item.metadata.use_cases.length > 0) {
    sections.push('\n## Use Cases\n');
    item.metadata.use_cases.forEach((useCase) => {
      sections.push(`- ${useCase}`);
    });
    sections.push('');
  }

  if (item.metadata.examples && item.metadata.examples.length > 0) {
    sections.push('\n## Examples\n');
    item.metadata.examples.forEach((example, index) => {
      if (example.title) {
        sections.push(`### ${example.title}\n`);
      } else {
        sections.push(`### Example ${index + 1}\n`);
      }
      if (example.description) {
        sections.push(`${example.description}\n`);
      }
      if (example.code) {
        const language = example.language || 'typescript';
        sections.push(`\`\`\`${language}\n${example.code}\n\`\`\`\n`);
      }
    });
  }

  if (item.metadata.requirements && item.metadata.requirements.length > 0) {
    sections.push('\n## Requirements\n');
    item.metadata.requirements.forEach((requirement) => {
      sections.push(`- ${requirement}`);
    });
    sections.push('');
  }

  if (item.metadata.configuration && Object.keys(item.metadata.configuration).length > 0) {
    sections.push('\n## Configuration\n');
    sections.push('```json');
    sections.push(JSON.stringify(item.metadata.configuration, null, 2));
    sections.push('```\n');
  }

  if (item.metadata.troubleshooting && item.metadata.troubleshooting.length > 0) {
    sections.push('\n## Troubleshooting\n');
    item.metadata.troubleshooting.forEach((item) => {
      if (item.issue && item.solution) {
        sections.push(`### ${item.issue}\n`);
        sections.push(`${item.solution}\n`);
      } else if (item.question && item.answer) {
        sections.push(`### ${item.question}\n`);
        sections.push(`${item.answer}\n`);
      }
    });
  }

  sections.push('\n---\n');
  sections.push(`**Source:** ${item.author}`);
  if (item.authorProfileUrl) {
    sections.push(` | [Profile](${item.authorProfileUrl})`);
  }
  sections.push(`\n**Category:** ${item.category}`);
  if (item.dateAdded) {
    sections.push(` | **Added:** ${new Date(item.dateAdded).toLocaleDateString()}`);
  }

  return sections.join('\n');
}

/**
 * Format content for OpenAI Codex (AGENTS.md)
 */
export function formatForCodex(item: ContentItem): string {
  const sections: string[] = [];

  sections.push(`# ${item.title}\n`);
  if (item.description) {
    sections.push(`${item.description}\n`);
  }

  if (item.content) {
    sections.push(item.content);
  }

  if (item.metadata.features && item.metadata.features.length > 0) {
    sections.push('\n## Features\n');
    item.metadata.features.forEach((feature) => {
      sections.push(`- ${feature}`);
    });
    sections.push('');
  }

  if (item.metadata.use_cases && item.metadata.use_cases.length > 0) {
    sections.push('\n## Use Cases\n');
    item.metadata.use_cases.forEach((useCase) => {
      sections.push(`- ${useCase}`);
    });
    sections.push('');
  }

  if (item.metadata.examples && item.metadata.examples.length > 0) {
    sections.push('\n## Examples\n');
    item.metadata.examples.forEach((example, index) => {
      if (example.title) {
        sections.push(`### ${example.title}\n`);
      } else {
        sections.push(`### Example ${index + 1}\n`);
      }
      if (example.description) {
        sections.push(`${example.description}\n`);
      }
      if (example.code) {
        const language = example.language || 'typescript';
        sections.push(`\`\`\`${language}\n${example.code}\n\`\`\`\n`);
      }
    });
  }

  if (item.metadata.requirements && item.metadata.requirements.length > 0) {
    sections.push('\n## Requirements\n');
    item.metadata.requirements.forEach((requirement) => {
      sections.push(`- ${requirement}`);
    });
    sections.push('');
  }

  if (item.metadata.configuration && Object.keys(item.metadata.configuration).length > 0) {
    sections.push('\n## Configuration\n');
    sections.push('```json');
    sections.push(JSON.stringify(item.metadata.configuration, null, 2));
    sections.push('```\n');
  }

  if (item.metadata.troubleshooting && item.metadata.troubleshooting.length > 0) {
    sections.push('\n## Troubleshooting\n');
    item.metadata.troubleshooting.forEach((item) => {
      if (item.issue && item.solution) {
        sections.push(`### ${item.issue}\n`);
        sections.push(`${item.solution}\n`);
      } else if (item.question && item.answer) {
        sections.push(`### ${item.question}\n`);
        sections.push(`${item.answer}\n`);
      }
    });
  }

  sections.push('\n---\n');
  sections.push(`**Source:** ${item.author}`);
  if (item.authorProfileUrl) {
    sections.push(` | [Profile](${item.authorProfileUrl})`);
  }
  sections.push(`\n**Category:** ${item.category}`);
  if (item.dateAdded) {
    sections.push(` | **Added:** ${new Date(item.dateAdded).toLocaleDateString()}`);
  }

  return sections.join('\n');
}

/**
 * Format content as generic markdown
 */
export function formatGeneric(item: ContentItem): string {
  const sections: string[] = [];

  sections.push(`# ${item.title}\n`);
  if (item.description) {
    sections.push(`${item.description}\n`);
  }
  if (item.content) {
    sections.push(item.content);
  }

  if (item.metadata.features && item.metadata.features.length > 0) {
    sections.push('\n## Features\n');
    item.metadata.features.forEach((feature) => {
      sections.push(`- ${feature}`);
    });
  }

  if (item.metadata.use_cases && item.metadata.use_cases.length > 0) {
    sections.push('\n## Use Cases\n');
    item.metadata.use_cases.forEach((useCase) => {
      sections.push(`- ${useCase}`);
    });
  }

  if (item.metadata.examples && item.metadata.examples.length > 0) {
    sections.push('\n## Examples\n');
    item.metadata.examples.forEach((example, index) => {
      if (example.title) {
        sections.push(`### ${example.title}\n`);
      } else {
        sections.push(`### Example ${index + 1}\n`);
      }
      if (example.description) {
        sections.push(`${example.description}\n`);
      }
      if (example.code) {
        const language = example.language || 'plaintext';
        sections.push(`\`\`\`${language}\n${example.code}\n\`\`\`\n`);
      }
    });
  }

  return sections.join('\n');
}

/**
 * Get platform-specific filename
 */
export function getPlatformFilename(platform: string): string {
  switch (platform) {
    case 'claude-code':
      return 'CLAUDE.md';
    case 'cursor':
      return 'cursor-rules.mdc';
    case 'chatgpt-codex':
      return 'AGENTS.md';
    default:
      return 'content.md';
  }
}

/**
 * Get platform-specific target directory
 */
export function getTargetDirectory(platform: string): string {
  switch (platform) {
    case 'claude-code':
      return '.claude';
    case 'cursor':
      return '.cursor/rules';
    case 'chatgpt-codex':
      return '.';
    default:
      return '.';
  }
}

/**
 * Get installation instructions for platform
 */
export function getInstallationInstructions(
  platform: string,
  filename: string,
  targetDir: string,
  formattedContent?: string
): string {
  const instructions: string[] = [];

  switch (platform) {
    case 'claude-code': {
      instructions.push('## Installation Instructions\n');
      instructions.push('1. **Create `.claude` directory** in your project root:');
      instructions.push('   ```bash');
      instructions.push('   mkdir -p .claude');
      instructions.push('   ```\n');
      instructions.push('2. **Save the formatted content above** as `.claude/CLAUDE.md`.\n');
      instructions.push('   You can either:');
      instructions.push('   - **Copy and paste** the content above into `.claude/CLAUDE.md`');
      instructions.push('   - **Or use this command** (replace with actual content):');
      instructions.push('   ```bash');
      instructions.push("   cat > .claude/CLAUDE.md << 'EOF'");
      if (formattedContent) {
        const escapedContent = formattedContent.replace(/'/g, "'\\''");
        instructions.push(escapedContent);
      }
      instructions.push('   EOF');
      instructions.push('   ```\n');
      instructions.push('3. **Restart Claude Code** to load the new rules.\n');
      instructions.push(
        '**Note:** The content above is already formatted for Claude Code. Simply copy it into `.claude/CLAUDE.md` in your project.'
      );
      break;
    }
    case 'cursor': {
      instructions.push('## Installation Instructions\n');
      instructions.push('### Option 1: Native Cursor Format (`.cursor/rules/`)\n');
      instructions.push(
        "1. **Create `.cursor/rules` directory** in your project root (if it doesn't exist):"
      );
      instructions.push('   ```bash');
      instructions.push('   mkdir -p .cursor/rules');
      instructions.push('   ```\n');
      instructions.push(
        '2. **Save the formatted content above** as a file in `.cursor/rules/` directory.\n'
      );
      instructions.push('   You can either:');
      instructions.push(
        '   - **Copy and paste** the content above into `.cursor/rules/cursor-rules.mdc`'
      );
      instructions.push('   - **Or use this command** (replace with actual content):');
      instructions.push('   ```bash');
      instructions.push("   cat > .cursor/rules/cursor-rules.mdc << 'EOF'");
      if (formattedContent) {
        const escapedContent = formattedContent.replace(/'/g, "'\\''");
        instructions.push(escapedContent);
      }
      instructions.push('   EOF');
      instructions.push('   ```\n');
      instructions.push('3. **Restart Cursor IDE** to load the new rules.\n');
      instructions.push('\n### Option 2: Claude Code Compatibility (`.claude/CLAUDE.md`)\n');
      instructions.push(
        '**Cursor IDE also supports Claude Code format!** You can use the same `CLAUDE.md` file for both platforms:\n'
      );
      instructions.push(
        "1. **Create `.claude` directory** in your project root (if it doesn't exist):"
      );
      instructions.push('   ```bash');
      instructions.push('   mkdir -p .claude');
      instructions.push('   ```\n');
      instructions.push(
        '2. **Save the content** as `.claude/CLAUDE.md` (same format as Claude Code).\n'
      );
      instructions.push(
        '3. **Both Claude Code and Cursor IDE** will automatically load this file.\n'
      );
      instructions.push(
        '\n**Note:** The content above is already formatted for Cursor IDE. Cursor now uses `.cursor/rules/` directory instead of the deprecated `.cursorrules` file in project root.'
      );
      instructions.push('\n**Important:**');
      instructions.push('- Files in `.cursor/rules/` must use the `.mdc` extension (not `.md`)');
      instructions.push(
        '- Cursor IDE also supports `CLAUDE.md` from `.claude/` directory (Claude Code compatibility)'
      );
      instructions.push(
        '- Using `.claude/CLAUDE.md` allows sharing rules between Claude Code and Cursor IDE'
      );
      break;
    }
    case 'chatgpt-codex': {
      instructions.push('## Installation Instructions\n');
      instructions.push(
        '1. **Save the formatted content above** as `AGENTS.md` in your project root.\n'
      );
      instructions.push('   You can either:');
      instructions.push('   - **Copy and paste** the content above into `AGENTS.md`');
      instructions.push('   - **Or use this command** (replace with actual content):');
      instructions.push('   ```bash');
      instructions.push("   cat > AGENTS.md << 'EOF'");
      if (formattedContent) {
        const escapedContent = formattedContent.replace(/'/g, "'\\''");
        instructions.push(escapedContent);
      }
      instructions.push('   EOF');
      instructions.push('   ```\n');
      instructions.push('2. **Codex will automatically load** `AGENTS.md` at session start.\n');
      instructions.push(
        '**Note:** The content above is already formatted for OpenAI Codex. Simply copy it into `AGENTS.md` in your project root.'
      );
      instructions.push(
        '\n**Alternative:** Codex supports fallback to `CLAUDE.md` if you prefer that filename. Configure in `~/.codex/config.toml` with `project_doc_fallback_filenames = ["CLAUDE.md"]`.'
      );
      instructions.push(
        '\n**Hierarchical Support:** Codex supports hierarchical merging - you can place `AGENTS.md` files in subdirectories, and they will be merged with the root `AGENTS.md`.'
      );
      break;
    }
    default: {
      instructions.push('## Installation Instructions\n');
      instructions.push(
        `1. **Save the formatted content above** as \`${filename}\` in your project.\n`
      );
      instructions.push('   You can either:');
      instructions.push(
        `   - **Copy and paste** the content above into \`${targetDir}/${filename}\``
      );
      instructions.push('   - **Or use this command** (replace with actual content):');
      instructions.push('   ```bash');
      if (targetDir !== '.') {
        instructions.push(`   mkdir -p ${targetDir}`);
      }
      instructions.push(`   cat > ${targetDir}/${filename} << 'EOF'`);
      if (formattedContent) {
        const escapedContent = formattedContent.replace(/'/g, "'\\''");
        instructions.push(escapedContent);
      }
      instructions.push('   EOF');
      instructions.push('   ```\n');
      instructions.push(`2. **Follow your platform's instructions** to load the configuration.\n`);
      instructions.push(
        `**Note:** The content above is already formatted. Simply copy it into \`${targetDir}/${filename}\` in your project.`
      );
    }
  }

  return instructions.join('\n');
}
