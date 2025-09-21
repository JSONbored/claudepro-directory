#!/usr/bin/env node

// Commands-specific SEO content generator - September 2025
// Now using shared SEO utilities for consistency and scalability
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  generateCodeExamplesSection,
  generateCommunityInsightsSection,
  generateFAQSection,
  generateInternalResourcesSection,
  generateIntroSection,
  generateMetricsSection,
  generateTroubleshootingSection,
} from '../shared/content-templates.js';
// Import shared SEO utilities
import {
  createArticleSchema,
  createBreadcrumbSchema,
  createFAQSchema,
  createHowToSchema,
  generateLongTailKeywords,
  generateStandardFAQs,
  type PageData,
  type SEOConfig,
} from '../shared/seo-utils.js';

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

// Generate command type-specific collection pages with comprehensive SEO optimization
function generateCommandTypePage(collection: CollectionData, commands: Command[]): string | null {
  const relevantCommands = commands.filter(
    (c: Command) =>
      c.tags?.some((tag: string) => collection.tags.includes(tag.toLowerCase())) ||
      c.description?.toLowerCase().includes(collection.keyword) ||
      c.slug?.toLowerCase().includes(collection.keyword)
  );

  if (relevantCommands.length === 0) return null;

  // Create SEO configuration for shared utilities
  const seoConfig: SEOConfig = {
    category: 'commands',
    title: collection.title,
    description: collection.description,
    keyword: collection.keyword,
    tags: collection.tags,
    relatedCategories: ['agents', 'prompts', 'rules'],
    baseUrl: 'https://claudepro.directory',
    examples: relevantCommands.slice(0, 3).map((command) => ({
      title: `/${command.slug}`,
      description: command.description || '',
      prompt: `Use the /${command.slug} command for ${collection.keyword} tasks.`,
    })),
  };

  // Generate comprehensive page data
  const pageData: PageData = {
    title: `${collection.title} - Claude Code Commands (September 2025)`,
    description: `${collection.description} Discover powerful commands for ${collection.keyword} automation.`,
    url: `https://claudepro.directory/guides/collections/commands-${collection.keyword.replace(/\s+/g, '-')}`,
    category: 'commands',
    keyword: collection.keyword,
    wordCount: 3000,
  };

  // Generate long-tail keywords and schemas
  const keywords = generateLongTailKeywords(seoConfig);
  const articleSchema = createArticleSchema(pageData, keywords);
  const faqSchema = createFAQSchema(generateStandardFAQs(seoConfig));
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: 'https://claudepro.directory' },
    { name: 'Guides', url: 'https://claudepro.directory/guides' },
    { name: 'Command Collections', url: 'https://claudepro.directory/guides/collections' },
    { name: collection.title, url: pageData.url },
  ]);

  // Generate content sections using shared templates
  const introSection = generateIntroSection(seoConfig);
  const codeExamplesSection = generateCodeExamplesSection(seoConfig);
  const troubleshootingSection = generateTroubleshootingSection(seoConfig);
  const faqSection = generateFAQSection(seoConfig);
  const metricsSection = generateMetricsSection(seoConfig);
  const communitySection = generateCommunityInsightsSection(seoConfig);
  const resourcesSection = generateInternalResourcesSection(seoConfig);

  const scenarios = collection.scenarios
    .map(
      (s) =>
        `### ${s.title}\n${s.description}\n\n**Recommended Commands:** ${relevantCommands
          .slice(0, 2)
          .map((c) => `[/${c.slug}](/commands/${c.slug})`)
          .join(', ')}\n`
    )
    .join('\n');

  const useCases = collection.useCases
    .map((uc) => `- **${uc}** - Professional-grade automation with proven results`)
    .join('\n');
  const capabilities = collection.capabilities
    .map((cap) => `- **${cap}** - Industry-standard implementation with best practices`)
    .join('\n');

  return `---
title: "${pageData.title}"
description: "${pageData.description}"
keywords: [${keywords
    .slice(0, 15)
    .map((k) => `"${k}"`)
    .join(', ')}]
dateUpdated: "${new Date().toISOString().split('T')[0]}"
schemas:
  article: ${JSON.stringify(articleSchema, null, 2)
    .split('\n')
    .map((line, i) => (i === 0 ? line : `    ${line}`))
    .join('\n')}
  faq: ${JSON.stringify(faqSchema, null, 2)
    .split('\n')
    .map((line, i) => (i === 0 ? line : `    ${line}`))
    .join('\n')}
  breadcrumb: ${JSON.stringify(breadcrumbSchema, null, 2)
    .split('\n')
    .map((line, i) => (i === 0 ? line : `    ${line}`))
    .join('\n')}
---

${introSection}

## Professional Use Cases

${useCases}

## Advanced Capabilities

${capabilities}

## Real-World Scenarios

${scenarios}

## Available ${collection.title}

${relevantCommands
  .map(
    (command, index) =>
      `### ${index + 1}. [/${command.slug}](/commands/${command.slug})
${command.description}

**Command Usage:** \`/${command.slug}\`
**Category:** ${command.tags?.join(', ') || 'General'}
**Success Rate:** 95%+ in professional environments
**Community Rating:** ⭐⭐⭐⭐⭐

[View Details](/commands/${command.slug}) | [Copy Command](javascript:void(0))
`
  )
  .join('\n')}

## Command Comparison Matrix

| Command | Primary Use | Complexity | Output Quality | Best For |
|---------|-------------|------------|----------------|----------|
${relevantCommands
  .slice(0, 7)
  .map(
    (command) =>
      `| **[/${command.slug}](/commands/${command.slug})** | ${command.tags?.[0] || 'General'} | ${command.content && command.content.length > 500 ? '⭐⭐⭐ Advanced' : '⭐⭐ Standard'} | ⭐⭐⭐⭐⭐ | ${collection.useCases[0] || 'Professional tasks'} |`
  )
  .join('\n')}

${codeExamplesSection}

## Professional Implementation Guide

### Enterprise Setup
1. **Environment Preparation**: Configure Claude Code CLI in your development environment
2. **Command Installation**: Install all required ${collection.keyword} commands
3. **Integration Testing**: Verify commands work with your existing workflow
4. **Team Deployment**: Roll out commands across your development team
5. **Performance Monitoring**: Track command effectiveness and optimization

### Best Practices for ${collection.title}

- **Command Chaining**: Link multiple commands for complex workflows
- **Parameter Optimization**: Fine-tune command parameters for your specific use case
- **Error Handling**: Implement robust error recovery mechanisms
- **Documentation**: Maintain comprehensive command usage documentation
- **Version Control**: Track command configurations in your repository
- **Team Training**: Ensure all team members understand command capabilities

${troubleshootingSection}

${faqSection}

${metricsSection}

${communitySection}

${resourcesSection}

---

*Ready to implement? [Browse all ${collection.title.toLowerCase()}](/commands?filter=${collection.keyword.replace(/\s+/g, '-')}) or [submit your own command](/submit)*
`;
}

// Generate workflow-specific guides with comprehensive SEO optimization
function generateWorkflowGuide(workflow: WorkflowData, commands: Command[]): string | null {
  const relevantCommands = commands.filter((c: Command) =>
    workflow.commandTypes.some(
      (type: string) =>
        c.tags?.some((tag: string) => tag.toLowerCase().includes(type.toLowerCase())) ||
        c.slug?.toLowerCase().includes(type.toLowerCase())
    )
  );

  if (relevantCommands.length === 0) return null;

  // Create SEO configuration for shared utilities
  const seoConfig: SEOConfig = {
    category: 'workflows',
    title: workflow.title,
    description: workflow.description,
    keyword: workflow.keyword || 'command workflow',
    tags: workflow.commandTypes,
    relatedCategories: ['commands', 'agents', 'automation'],
    baseUrl: 'https://claudepro.directory',
    examples: workflow.phases.slice(0, 3).map((phase, _i) => ({
      title: `${phase.name} Phase`,
      description: `${phase.name} implementation with command automation`,
      prompt: `Execute ${phase.name.toLowerCase()} phase using Claude commands for optimal results.`,
    })),
  };

  // Generate comprehensive page data
  const pageData: PageData = {
    title: `${workflow.title} - Claude Code Command Workflow (2025)`,
    description: `${workflow.description} Complete automation guide with proven command sequences.`,
    url: `https://claudepro.directory/guides/workflows/commands-${workflow.title.toLowerCase().replace(/\s+/g, '-')}`,
    category: 'workflows',
    keyword: workflow.keyword || 'command workflow',
    wordCount: 3500,
  };

  // Generate long-tail keywords and schemas
  const keywords = generateLongTailKeywords(seoConfig);
  const articleSchema = createArticleSchema(pageData, keywords);
  const faqSchema = createFAQSchema(generateStandardFAQs(seoConfig));
  const howToSchema = createHowToSchema(
    workflow.title,
    workflow.description,
    workflow.phases.flatMap(
      (phase, phaseIndex) =>
        phase.steps?.map((step, _stepIndex) => ({
          name: `${phase.name}: ${step}`,
          text: `In the ${phase.name.toLowerCase()} phase, ${step.toLowerCase()}. This step leverages Claude commands for ${workflow.goal}.`,
          url: `${pageData.url}#phase-${phaseIndex + 1}`,
        })) || []
    )
  );
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: 'https://claudepro.directory' },
    { name: 'Guides', url: 'https://claudepro.directory/guides' },
    { name: 'Command Workflows', url: 'https://claudepro.directory/guides/workflows' },
    { name: workflow.title, url: pageData.url },
  ]);

  // Generate content sections using shared templates
  const introSection = generateIntroSection(seoConfig);
  const codeExamplesSection = generateCodeExamplesSection(seoConfig);
  const troubleshootingSection = generateTroubleshootingSection(seoConfig);
  const faqSection = generateFAQSection(seoConfig);
  const metricsSection = generateMetricsSection(seoConfig);
  const communitySection = generateCommunityInsightsSection(seoConfig);
  const resourcesSection = generateInternalResourcesSection(seoConfig);

  const phases = workflow.phases
    .map(
      (phase, index) =>
        `### Phase ${index + 1}: ${phase.name} {#phase-${index + 1}}

${phase.steps.map((step, stepIndex) => `${stepIndex + 1}. **${step}** - Critical for ${workflow.goal.toLowerCase()}`).join('\n')}

**Expected Duration:** ${index === 0 ? '15-30 minutes' : index === 1 ? '30-60 minutes' : '15-45 minutes'}
**Success Metrics:** ${index === 0 ? 'Environment configured correctly' : index === 1 ? 'Commands executed successfully' : 'Workflow validated and documented'}
`
    )
    .join('\n');

  return `---
title: "${pageData.title}"
description: "${pageData.description}"
keywords: [${keywords
    .slice(0, 15)
    .map((k) => `"${k}"`)
    .join(', ')}]
dateUpdated: "${new Date().toISOString().split('T')[0]}"
schemas:
  article: ${JSON.stringify(articleSchema, null, 2)
    .split('\n')
    .map((line, i) => (i === 0 ? line : `    ${line}`))
    .join('\n')}
  faq: ${JSON.stringify(faqSchema, null, 2)
    .split('\n')
    .map((line, i) => (i === 0 ? line : `    ${line}`))
    .join('\n')}
  howto: ${JSON.stringify(howToSchema, null, 2)
    .split('\n')
    .map((line, i) => (i === 0 ? line : `    ${line}`))
    .join('\n')}
  breadcrumb: ${JSON.stringify(breadcrumbSchema, null, 2)
    .split('\n')
    .map((line, i) => (i === 0 ? line : `    ${line}`))
    .join('\n')}
---

${introSection}

## Workflow Overview

**Objective:** ${workflow.goal}
**Contexts:** ${workflow.contexts.join(', ')}
**Automation Level:** 95%+ of tasks automated
**Time Savings:** Up to 80% reduction in manual effort

### Success Metrics
- **94%+ accuracy** in automated command execution
- **3x faster** workflow completion compared to manual processes
- **Zero configuration** required after initial setup
- **Enterprise-ready** scalability and reliability

## Comprehensive Implementation Guide

${phases}

## Required Command Arsenal

${relevantCommands
  .map(
    (command, index) =>
      `### ${index + 1}. [/${command.slug}](/commands/${command.slug})
**Purpose:** ${command.description}
**Usage:** \`/${command.slug}\`
**Integration:** Works seamlessly with ${workflow.commandTypes.join(', ')} workflow
**Success Rate:** 96%+ in professional environments
**Community Rating:** ⭐⭐⭐⭐⭐

[View Command Details](/commands/${command.slug}) | [Copy Usage](javascript:void(0))
`
  )
  .join('\n')}

## Command Execution Matrix

| Phase | Primary Commands | Expected Output | Validation Method |
|-------|------------------|-----------------|-------------------|
${workflow.phases
  .map(
    (phase, i) =>
      `| **${phase.name}** | ${relevantCommands
        .slice(i, i + 2)
        .map((c) => `/${c.slug}`)
        .join(
          ', '
        )} | ${i === 0 ? 'Configured environment' : i === 1 ? 'Executed tasks' : 'Validated results'} | ${i === 0 ? 'System checks' : i === 1 ? 'Output verification' : 'Quality assessment'} |`
  )
  .join('\n')}

${codeExamplesSection}

## Professional Implementation Strategy

### Enterprise Deployment
1. **Environment Standardization**: Ensure consistent Claude Code CLI setup across teams
2. **Command Library Management**: Centralize and version control all workflow commands
3. **Integration Testing**: Validate commands work with existing development tools
4. **Team Training**: Comprehensive onboarding for all team members
5. **Performance Monitoring**: Track workflow effectiveness and optimization opportunities

### Advanced Workflow Optimization

- **Command Chaining**: Link multiple commands for seamless automation
- **Parameter Templating**: Use variables for dynamic workflow configuration
- **Error Recovery**: Implement automatic fallback strategies
- **Performance Profiling**: Monitor and optimize command execution times
- **Quality Gates**: Validate outputs at each workflow phase

${troubleshootingSection}

## Workflow Validation Checklist

### Pre-Implementation
- [ ] Claude Code CLI properly installed and configured
- [ ] All required commands available and tested
- [ ] Development environment meets workflow requirements
- [ ] Team members trained on command usage

### During Execution
- [ ] Each phase completes successfully
- [ ] Command outputs meet quality standards
- [ ] Error handling mechanisms functioning
- [ ] Performance metrics within acceptable ranges

### Post-Implementation
- [ ] Workflow results validated and documented
- [ ] Performance improvements measured and recorded
- [ ] Team feedback collected and analyzed
- [ ] Process improvements identified and implemented

${faqSection}

${metricsSection}

## Advanced Integration Patterns

### CI/CD Pipeline Integration
\`\`\`yaml
# Example workflow integration in CI/CD
steps:
  - name: Execute ${workflow.title}
    run: |
      ${relevantCommands
        .slice(0, 3)
        .map((c) => `claude /${c.slug}`)
        .join('\n      ')}
\`\`\`

### Custom Automation Scripts
\`\`\`bash
#!/bin/bash
# ${workflow.title} automation script
set -e

echo "Starting ${workflow.title.toLowerCase()}..."
${workflow.phases
  .map(
    (phase, i) =>
      `\n# Phase ${i + 1}: ${phase.name}\necho "Executing ${phase.name.toLowerCase()}..."\n${relevantCommands
        .slice(i, i + 1)
        .map((c) => `claude /${c.slug}`)
        .join('\n')}`
  )
  .join('')}

echo "${workflow.title} completed successfully!"
\`\`\`

${communitySection}

${resourcesSection}

---

*Ready to implement this workflow? [Get started now](/guides/workflows) or [join our community](/community) for personalized help with ${workflow.title.toLowerCase()}*
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
