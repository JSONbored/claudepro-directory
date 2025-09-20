#!/usr/bin/env node

// Commands-specific SEO content generator - September 2025
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '../../..');
const CONTENT_DIR = path.join(ROOT_DIR, 'content', 'commands');
const SEO_DIR = path.join(ROOT_DIR, 'seo');

interface Command {
  id: string;
  slug: string;
  description: string;
  category?: string;
  tags?: string[];
  content?: string;
  author?: string;
}

interface CollectionData {
  title: string;
  description: string;
  commandType?: string;
  keyword: string;
  tags: string[];
  useCases: string[];
  capabilities: string[];
  scenarios: Array<{
    title: string;
    description: string;
  }>;
}

interface WorkflowData {
  title: string;
  description: string;
  goal: string;
  keyword?: string;
  steps?: string[];
  commands?: string[];
  commandTypes: string[];
  contexts: string[];
  phases: Array<{
    name: string;
    steps: string[];
  }>;
}

// Predefined command collections for high-value SEO
const COMMAND_COLLECTIONS: CollectionData[] = [
  {
    title: 'Code Review Commands',
    description:
      'Powerful commands for automated code review, quality analysis, and improvement suggestions.',
    commandType: 'review',
    keyword: 'code review',
    tags: ['review', 'code-quality', 'analysis'],
    useCases: [
      'Automated code review and feedback',
      'Code quality assessment and scoring',
      'Security vulnerability detection',
      'Performance optimization suggestions',
    ],
    capabilities: [
      'Analyze code structure and patterns',
      'Detect potential bugs and issues',
      'Suggest improvements and best practices',
      'Generate comprehensive review reports',
    ],
    scenarios: [
      {
        title: 'Pull Request Reviews',
        description: 'Automatically review pull requests for code quality and potential issues',
      },
      {
        title: 'Legacy Code Analysis',
        description: 'Analyze and improve existing codebases with detailed recommendations',
      },
    ],
  },
  {
    title: 'Documentation Commands',
    description:
      'Generate comprehensive documentation, API specs, and developer guides automatically.',
    commandType: 'documentation',
    keyword: 'documentation',
    tags: ['docs', 'api-docs', 'documentation'],
    useCases: [
      'API documentation generation',
      'Code comment and docstring creation',
      'README and guide generation',
      'Interactive tutorial creation',
    ],
    capabilities: [
      'Generate API documentation from code',
      'Create comprehensive README files',
      'Build interactive tutorials and guides',
      'Generate code examples and snippets',
    ],
    scenarios: [
      {
        title: 'API Documentation',
        description: 'Generate complete API documentation with examples and usage guides',
      },
      {
        title: 'Project Documentation',
        description: 'Create comprehensive project documentation including setup and usage',
      },
    ],
  },
  {
    title: 'Testing Commands',
    description: 'Automated test generation, coverage analysis, and test quality improvement.',
    commandType: 'testing',
    keyword: 'testing',
    tags: ['testing', 'test-generation', 'quality-assurance'],
    useCases: [
      'Unit test generation and scaffolding',
      'Integration test creation',
      'Test coverage analysis and improvement',
      'Test data generation and mocking',
    ],
    capabilities: [
      'Generate comprehensive unit tests',
      'Create integration and end-to-end tests',
      'Analyze test coverage and gaps',
      'Generate realistic test data and mocks',
    ],
    scenarios: [
      {
        title: 'Test Suite Creation',
        description: 'Generate complete test suites for new and existing code',
      },
      {
        title: 'Coverage Analysis',
        description: 'Analyze test coverage and generate tests for uncovered code paths',
      },
    ],
  },
  {
    title: 'Debugging Commands',
    description: 'Advanced debugging assistance with root cause analysis and fix suggestions.',
    commandType: 'debugging',
    keyword: 'debugging',
    tags: ['debugging', 'troubleshooting', 'error-analysis'],
    useCases: [
      'Error diagnosis and root cause analysis',
      'Performance bottleneck identification',
      'Memory leak detection and fixing',
      'Debugging workflow automation',
    ],
    capabilities: [
      'Analyze error logs and stack traces',
      'Identify performance bottlenecks',
      'Suggest fixes for common issues',
      'Generate debugging workflows',
    ],
    scenarios: [
      {
        title: 'Error Investigation',
        description: 'Analyze error logs and provide detailed root cause analysis',
      },
      {
        title: 'Performance Debugging',
        description: 'Identify and resolve performance issues in applications',
      },
    ],
  },
  {
    title: 'Refactoring Commands',
    description: 'Intelligent code refactoring and modernization with best practice enforcement.',
    commandType: 'refactoring',
    keyword: 'refactoring',
    tags: ['refactoring', 'code-improvement', 'modernization'],
    useCases: [
      'Code structure improvement and cleanup',
      'Legacy code modernization',
      'Design pattern implementation',
      'Performance optimization refactoring',
    ],
    capabilities: [
      'Refactor code for better structure',
      'Apply modern programming patterns',
      'Improve code readability and maintainability',
      'Optimize performance through refactoring',
    ],
    scenarios: [
      {
        title: 'Legacy Modernization',
        description: 'Modernize legacy codebases with current best practices',
      },
      {
        title: 'Structure Improvement',
        description: 'Refactor code for better organization and maintainability',
      },
    ],
  },
];

// Predefined workflows for high-value SEO
const COMMAND_WORKFLOWS: WorkflowData[] = [
  {
    title: 'Complete Code Quality Pipeline',
    description: 'Implement comprehensive code quality checks using multiple Claude commands',
    goal: 'Ensure high-quality code through automated review, testing, and documentation',
    keyword: 'code quality pipeline',
    commandTypes: ['review', 'testing', 'documentation'],
    contexts: ['development workflow', 'ci/cd pipeline'],
    phases: [
      {
        name: 'Code Analysis',
        steps: [
          'Run /review command for comprehensive code analysis',
          'Use /security command to check for vulnerabilities',
          'Apply /optimize command for performance improvements',
          'Generate quality metrics and reports',
        ],
      },
      {
        name: 'Testing and Validation',
        steps: [
          'Execute /generate-tests for automated test creation',
          'Run /test-advanced for comprehensive testing',
          'Validate test coverage and quality',
          'Generate testing reports and documentation',
        ],
      },
      {
        name: 'Documentation and Delivery',
        steps: [
          'Use /docs command for documentation generation',
          'Create API specifications and guides',
          'Generate deployment and usage documentation',
          'Finalize and publish code quality report',
        ],
      },
    ],
  },
  {
    title: 'Debugging and Problem Resolution Workflow',
    description: 'Systematic approach to debugging and resolving code issues',
    goal: 'Efficiently identify, analyze, and resolve code problems',
    keyword: 'debugging workflow',
    commandTypes: ['debugging', 'analysis', 'explanation'],
    contexts: ['troubleshooting', 'issue resolution'],
    phases: [
      {
        name: 'Problem Identification',
        steps: [
          'Use /debug command for initial problem analysis',
          'Apply /explain command to understand code behavior',
          'Gather relevant logs and error information',
          'Identify potential root causes',
        ],
      },
      {
        name: 'Solution Development',
        steps: [
          'Develop targeted fixes for identified issues',
          'Use /refactor-code for structural improvements',
          'Implement proper error handling and logging',
          'Create tests to prevent regression',
        ],
      },
      {
        name: 'Validation and Documentation',
        steps: [
          'Test fixes thoroughly in multiple scenarios',
          'Document the issue and resolution process',
          'Update relevant documentation and guides',
          'Share learnings with the development team',
        ],
      },
    ],
  },
  {
    title: 'Development Workflow Automation',
    description: 'Automate common development tasks using Claude commands',
    goal: 'Streamline development workflow with automated task execution',
    keyword: 'development automation',
    commandTypes: ['git', 'optimization', 'refactoring'],
    contexts: ['development process', 'automation pipeline'],
    phases: [
      {
        name: 'Code Preparation',
        steps: [
          'Use /optimize command for performance improvements',
          'Apply /refactor-code for structure enhancement',
          'Run code quality checks and validations',
          'Ensure coding standards compliance',
        ],
      },
      {
        name: 'Git Integration',
        steps: [
          'Use /git-smart-commit for intelligent commit messages',
          'Create meaningful branch and tag names',
          'Generate comprehensive commit descriptions',
          'Maintain clean git history and documentation',
        ],
      },
      {
        name: 'Quality Assurance',
        steps: [
          'Run comprehensive test suites',
          'Perform security and vulnerability checks',
          'Validate performance and optimization',
          'Generate deployment-ready artifacts',
        ],
      },
    ],
  },
];

// Load commands from content directory
async function loadCommands(): Promise<Command[]> {
  const files = await fs.readdir(CONTENT_DIR);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));

  const commands: Command[] = [];
  for (const file of jsonFiles) {
    try {
      const content = await fs.readFile(path.join(CONTENT_DIR, file), 'utf-8');
      const command = JSON.parse(content);
      commands.push(command);
    } catch (error) {
      console.warn(`Warning: Could not parse ${file}:`, error);
    }
  }

  return commands;
}

// Generate command type-specific collection pages
function generateCommandTypePage(collection: CollectionData, commands: Command[]): string | null {
  const relevantCommands = commands.filter(
    (c: Command) =>
      c.tags?.some((tag: string) => collection.tags.includes(tag.toLowerCase())) ||
      c.description?.toLowerCase().includes(collection.keyword) ||
      c.slug?.toLowerCase().includes(collection.keyword)
  );

  if (relevantCommands.length === 0) return null;

  const scenarios = collection.scenarios
    .map((s) => `### ${s.title}\n${s.description}\n`)
    .join('\n');

  const useCases = collection.useCases.map((uc) => `- ${uc}`).join('\n');
  const capabilities = collection.capabilities.map((cap) => `- ${cap}`).join('\n');

  return `---
title: "${collection.title} - Claude Code Commands"
description: "${collection.description}"
keywords: "claude commands, ${collection.keyword}, ${collection.tags.join(', ')}"
---

# ${collection.title}

${collection.description}

## Key Use Cases

${useCases}

## Capabilities

${capabilities}

## Common Scenarios

${scenarios}

## Available ${collection.title}

${relevantCommands
  .map(
    (command) =>
      `### [/${command.slug}](/commands/${command.slug})
${command.description}

**Command:** \`/${command.slug}\`
**Tags:** ${command.tags?.join(', ') || 'None'}
`
  )
  .join('\n')}

## Getting Started

1. **Choose Your Command**: Select the command that best fits your needs
2. **Install Claude Code**: Ensure you have Claude Code CLI installed
3. **Configure Command**: Set up the command configuration in your \`.claude/commands/\` directory
4. **Test Integration**: Verify the command works correctly in your environment

## Best Practices

- Use descriptive command arguments and parameters
- Test commands in a development environment first
- Keep command configurations organized and documented
- Monitor command performance and resource usage
- Share useful commands with your team

*Have a better ${collection.title.toLowerCase()} command? [Submit it here](/submit)*
`;
}

// Generate workflow-specific guides
function generateWorkflowGuide(workflow: WorkflowData, commands: Command[]): string | null {
  const relevantCommands = commands.filter((c: Command) =>
    workflow.commandTypes.some(
      (type: string) =>
        c.tags?.some((tag: string) => tag.toLowerCase().includes(type.toLowerCase())) ||
        c.slug?.toLowerCase().includes(type.toLowerCase())
    )
  );

  if (relevantCommands.length === 0) return null;

  const phases = workflow.phases
    .map(
      (phase) =>
        `### ${phase.name}

${phase.steps.map((step) => `- ${step}`).join('\n')}
`
    )
    .join('\n');

  return `---
title: "${workflow.title} - Claude Code Command Workflow"
description: "${workflow.description}"
keywords: "claude commands workflow, ${workflow.keyword}, ${workflow.commandTypes.join(', ')}"
---

# ${workflow.title}

${workflow.description}

**Goal:** ${workflow.goal}

## Workflow Steps

${phases}

## Required Commands

${relevantCommands
  .map(
    (command) =>
      `### [/${command.slug}](/commands/${command.slug})
${command.description}

**Usage:** \`/${command.slug}\`
`
  )
  .join('\n')}

## Implementation Guide

1. **Setup Environment**: Ensure Claude Code is properly configured
2. **Install Commands**: Set up all required commands in your workspace
3. **Configure Integration**: Connect commands to work together seamlessly
4. **Test Each Phase**: Verify each phase works correctly before proceeding
5. **Automate Workflow**: Set up automation for repetitive tasks

## Best Practices

- **Command Chaining**: Link commands together for automated workflows
- **Error Handling**: Implement proper error recovery mechanisms
- **Performance Monitoring**: Track workflow execution and optimize
- **Documentation**: Keep workflow documentation up to date

## Troubleshooting

- **Command Conflicts**: Ensure commands work well together
- **Performance Issues**: Monitor resource usage and optimize
- **Integration Problems**: Check command configurations and dependencies
- **Error Recovery**: Implement fallback strategies for failures

*Questions? [Join our community](/community) for help with ${workflow.title.toLowerCase()}*
`;
}

async function generateCommandSEOContent() {
  console.log('🚀 Generating high-quality Command SEO content...');
  const commands = await loadCommands();
  console.log(`📦 Loaded ${commands.length} commands`);

  // Ensure SEO directories exist
  const collectionsDir = path.join(SEO_DIR, 'collections');
  const workflowsDir = path.join(SEO_DIR, 'workflows');

  await fs.mkdir(collectionsDir, { recursive: true });
  await fs.mkdir(workflowsDir, { recursive: true });

  let generatedCount = 0;

  // Generate command type collection pages
  console.log('📝 Generating command type collection pages...');
  for (const collection of COMMAND_COLLECTIONS) {
    const content = generateCommandTypePage(collection, commands);
    if (content) {
      const filename = `commands-${collection.keyword.replace(/\s+/g, '-')}.mdx`;
      await fs.writeFile(path.join(collectionsDir, filename), content);
      generatedCount++;
      console.log(`  ✅ Generated: ${filename}`);
    }
  }

  // Generate workflow guides
  console.log('📝 Generating command workflow guides...');
  for (const workflow of COMMAND_WORKFLOWS) {
    const content = generateWorkflowGuide(workflow, commands);
    if (content) {
      const filename = `commands-${workflow.title.toLowerCase().replace(/\s+/g, '-')}.mdx`;
      await fs.writeFile(path.join(workflowsDir, filename), content);
      generatedCount++;
      console.log(`  ✅ Generated: ${filename}`);
    }
  }

  console.log(`\n🎉 Generated ${generatedCount} high-quality SEO pages for Commands!`);
  console.log('📁 Files saved to: seo/collections/ and seo/workflows/');
}

generateCommandSEOContent().catch(console.error);
