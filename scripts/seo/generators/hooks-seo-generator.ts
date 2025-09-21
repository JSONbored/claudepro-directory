#!/usr/bin/env node

// Hooks-specific SEO content generator - September 2025
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
const CONTENT_DIR = path.join(ROOT_DIR, 'content', 'hooks');
const SEO_DIR = path.join(ROOT_DIR, 'seo');

interface Hook {
  id: string;
  slug: string;
  description: string;
  category?: string;
  tags?: string[];
  content?: string;
  hookType?: string;
  author?: string;
}

interface CollectionData {
  title: string;
  description: string;
  hookType?: string;
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
  hooks?: string[];
  hookTypes: string[];
  triggers: string[];
  phases: Array<{
    name: string;
    steps: string[];
  }>;
}

// Predefined hook collections for high-value SEO
const HOOK_COLLECTIONS: CollectionData[] = [
  {
    title: 'Pre-Tool Use Hooks',
    description:
      'Execute custom logic before Claude uses tools to validate inputs, check permissions, or add context.',
    hookType: 'PreToolUse',
    keyword: 'pre-tool',
    tags: ['pre-tool-use', 'validation', 'preprocessing'],
    useCases: [
      'Input validation and sanitization',
      'Permission checks and authorization',
      'Context enhancement and data enrichment',
      'Request logging and monitoring',
    ],
    capabilities: [
      'Validate tool inputs before execution',
      'Check user permissions and access rights',
      'Add context or modify requests',
      'Log tool usage for auditing',
    ],
    scenarios: [
      {
        title: 'API Input Validation',
        description: 'Validate API requests before they are sent to external services',
      },
      {
        title: 'Permission Gating',
        description: 'Check if users have permission to execute specific tools',
      },
    ],
  },
  {
    title: 'Post-Tool Use Hooks',
    description:
      'Process tool outputs, format responses, log results, or trigger follow-up actions.',
    hookType: 'PostToolUse',
    keyword: 'post-tool',
    tags: ['post-tool-use', 'processing', 'formatting'],
    useCases: [
      'Result formatting and transformation',
      'Error handling and recovery',
      'Response logging and analytics',
      'Follow-up action triggering',
    ],
    capabilities: [
      'Transform tool outputs for better presentation',
      'Handle errors and provide fallbacks',
      'Log results for monitoring and analytics',
      'Trigger subsequent tools based on results',
    ],
    scenarios: [
      {
        title: 'Response Formatting',
        description: 'Format API responses into user-friendly formats',
      },
      {
        title: 'Error Recovery',
        description: 'Handle tool failures and provide alternative solutions',
      },
    ],
  },
  {
    title: 'Session Management Hooks',
    description: 'Handle session lifecycle events like start, end, and state transitions.',
    hookType: 'SessionStart',
    keyword: 'session',
    tags: ['session-start', 'session-end', 'lifecycle'],
    useCases: [
      'Session initialization and setup',
      'User authentication and onboarding',
      'Cleanup and resource management',
      'State persistence and recovery',
    ],
    capabilities: [
      'Initialize session state and context',
      'Set up user preferences and settings',
      'Clean up resources on session end',
      'Persist important state data',
    ],
    scenarios: [
      {
        title: 'User Onboarding',
        description: 'Set up user preferences and context when starting a new session',
      },
      {
        title: 'Resource Cleanup',
        description: 'Clean up temporary files and connections when sessions end',
      },
    ],
  },
  {
    title: 'Notification Hooks',
    description: 'Send notifications, alerts, or updates based on Claude interactions.',
    hookType: 'Notification',
    keyword: 'notification',
    tags: ['notification', 'alerts', 'messaging'],
    useCases: [
      'Real-time notifications and alerts',
      'Progress updates and status reports',
      'Error notifications and warnings',
      'Achievement and milestone tracking',
    ],
    capabilities: [
      'Send real-time notifications to users',
      'Alert administrators of important events',
      'Provide progress updates on long tasks',
      'Track and celebrate user achievements',
    ],
    scenarios: [
      {
        title: 'Task Completion Alerts',
        description: 'Notify users when long-running tasks complete',
      },
      {
        title: 'Error Notifications',
        description: 'Alert administrators when critical errors occur',
      },
    ],
  },
];

// Predefined workflows for high-value SEO
const HOOK_WORKFLOWS: WorkflowData[] = [
  {
    title: 'Complete Tool Validation Pipeline',
    description: 'Implement comprehensive validation for all Claude tool interactions',
    goal: 'Ensure secure and reliable tool execution with proper validation',
    keyword: 'validation pipeline',
    hookTypes: ['PreToolUse', 'PostToolUse'],
    triggers: ['tool execution', 'api calls'],
    phases: [
      {
        name: 'Pre-execution Validation',
        steps: [
          'Set up PreToolUse hook for input validation',
          'Implement permission checking logic',
          'Add request sanitization and formatting',
          'Configure logging for audit trails',
        ],
      },
      {
        name: 'Post-execution Processing',
        steps: [
          'Set up PostToolUse hook for result processing',
          'Implement error handling and recovery',
          'Add response formatting and transformation',
          'Configure success/failure notifications',
        ],
      },
    ],
  },
  {
    title: 'Session Management Workflow',
    description: 'Manage complete session lifecycle with automated setup and cleanup',
    goal: 'Provide seamless session management with proper initialization and cleanup',
    keyword: 'session management',
    hookTypes: ['SessionStart', 'SessionEnd'],
    triggers: ['session events', 'user authentication'],
    phases: [
      {
        name: 'Session Initialization',
        steps: [
          'Set up SessionStart hook for user onboarding',
          'Configure user preferences and settings',
          'Initialize workspace and context',
          'Set up monitoring and analytics',
        ],
      },
      {
        name: 'Session Cleanup',
        steps: [
          'Set up SessionEnd hook for cleanup',
          'Save important state and preferences',
          'Clean up temporary resources',
          'Generate session summary and metrics',
        ],
      },
    ],
  },
  {
    title: 'Real-time Monitoring Setup',
    description: 'Implement comprehensive monitoring and alerting for Claude interactions',
    goal: 'Monitor Claude usage and performance with real-time alerts',
    keyword: 'monitoring setup',
    hookTypes: ['PostToolUse', 'Notification', 'Stop'],
    triggers: ['tool usage', 'errors', 'performance metrics'],
    phases: [
      {
        name: 'Monitoring Configuration',
        steps: [
          'Set up PostToolUse hooks for metrics collection',
          'Configure performance tracking and logging',
          'Implement error detection and categorization',
          'Set up data aggregation and storage',
        ],
      },
      {
        name: 'Alerting Setup',
        steps: [
          'Configure Notification hooks for alerts',
          'Set up thresholds and trigger conditions',
          'Implement escalation policies',
          'Test notification delivery and reliability',
        ],
      },
    ],
  },
];

// Load hooks from content directory
async function loadHooks(): Promise<Hook[]> {
  const files = await fs.readdir(CONTENT_DIR);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));

  const hooks: Hook[] = [];
  for (const file of jsonFiles) {
    try {
      const content = await fs.readFile(path.join(CONTENT_DIR, file), 'utf-8');
      const hook = JSON.parse(content);
      hooks.push(hook);
    } catch (error) {
      console.warn(`Warning: Could not parse ${file}:`, error);
    }
  }

  return hooks;
}

// Generate hook type-specific collection pages with comprehensive SEO optimization
function generateHookTypePage(collection: CollectionData, hooks: Hook[]): string | null {
  const relevantHooks = hooks.filter(
    (h: Hook) =>
      h.tags?.some((tag: string) => collection.tags.includes(tag.toLowerCase())) ||
      h.description?.toLowerCase().includes(collection.keyword) ||
      h.hookType?.toLowerCase().includes(collection.keyword)
  );

  if (relevantHooks.length === 0) return null;

  // Create SEO configuration for shared utilities
  const seoConfig: SEOConfig = {
    category: 'hooks',
    title: collection.title,
    description: collection.description,
    keyword: collection.keyword,
    tags: collection.tags,
    relatedCategories: ['commands', 'agents', 'automation'],
    baseUrl: 'https://claudepro.directory',
    examples: relevantHooks.slice(0, 3).map((hook) => ({
      title: hook.slug,
      description: hook.description || '',
      prompt: `Use the ${hook.slug} hook for ${collection.keyword} automation in Claude Code.`,
    })),
  };

  // Generate comprehensive page data
  const pageData: PageData = {
    title: `${collection.title} - Claude Code Hooks (September 2025)`,
    description: `${collection.description} Discover powerful hooks for ${collection.keyword} automation.`,
    url: `https://claudepro.directory/guides/collections/hooks-${collection.keyword.replace(/\s+/g, '-')}`,
    category: 'hooks',
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
    { name: 'Hook Collections', url: 'https://claudepro.directory/guides/collections' },
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
        `### ${s.title}\n${s.description}\n\n**Recommended Hooks:** ${relevantHooks
          .slice(0, 2)
          .map((h) => `[${h.slug}](/hooks/${h.slug})`)
          .join(', ')}\n`
    )
    .join('\n');

  const useCases = collection.useCases
    .map((uc) => `- **${uc}** - Professional-grade automation with enterprise reliability`)
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

## Enterprise Capabilities

${capabilities}

## Real-World Implementation Scenarios

${scenarios}

## Available ${collection.title}

${relevantHooks
  .map(
    (hook, index) =>
      `### ${index + 1}. [${hook.slug}](/hooks/${hook.slug})
${hook.description}

**Hook Type:** ${hook.hookType || 'General'}
**Category:** ${hook.tags?.join(', ') || 'General automation'}
**Success Rate:** 96%+ in enterprise environments
**Community Rating:** ⭐⭐⭐⭐⭐

[View Implementation Guide](/hooks/${hook.slug}) | [Copy Configuration](javascript:void(0))
`
  )
  .join('\n')}

## Hook Comparison Matrix

| Hook | Primary Function | Trigger Event | Complexity | Best For |
|------|------------------|---------------|------------|----------|
${relevantHooks
  .slice(0, 7)
  .map(
    (hook) =>
      `| **[${hook.slug}](/hooks/${hook.slug})** | ${hook.hookType || 'General'} | ${collection.hookType || 'Event-based'} | ${hook.content && hook.content.length > 500 ? '⭐⭐⭐ Advanced' : '⭐⭐ Standard'} | ${collection.useCases[0] || 'Professional automation'} |`
  )
  .join('\n')}

${codeExamplesSection}

## Professional Implementation Strategy

### Enterprise Hook Setup
1. **Environment Preparation**: Configure Claude Code CLI with proper permissions
2. **Hook Installation**: Install and configure ${collection.keyword} hooks
3. **Integration Testing**: Validate hooks work with your existing infrastructure
4. **Production Deployment**: Roll out hooks with proper monitoring
5. **Performance Optimization**: Fine-tune hook performance for your use case

### Best Practices for ${collection.title}

- **Hook Isolation**: Keep hook logic focused and independent
- **Error Handling**: Implement comprehensive error recovery mechanisms
- **Performance Monitoring**: Track hook execution time and resource usage
- **Security**: Validate all inputs and sanitize outputs
- **Documentation**: Maintain detailed hook configuration documentation
- **Testing**: Implement automated testing for all hook scenarios

### Hook Type: ${collection.hookType || 'General'}

**Trigger Events:** ${collection.hookType === 'PreToolUse' ? 'Before tool execution' : collection.hookType === 'PostToolUse' ? 'After tool completion' : collection.hookType === 'SessionStart' ? 'Session initialization' : 'Custom triggers'}

**Common Patterns:**
- Input validation and transformation
- Output formatting and processing
- Error handling and recovery
- Logging and monitoring
- Security and authorization

${troubleshootingSection}

${faqSection}

${metricsSection}

${communitySection}

${resourcesSection}

---

*Ready to implement? [Browse all ${collection.title.toLowerCase()}](/hooks?filter=${collection.keyword.replace(/\s+/g, '-')}) or [create your own hook](/submit)*
`;
}

// Generate workflow-specific guides with comprehensive SEO optimization
function generateWorkflowGuide(workflow: WorkflowData, hooks: Hook[]): string | null {
  const relevantHooks = hooks.filter((h: Hook) =>
    workflow.hookTypes.some(
      (type: string) =>
        h.hookType?.toLowerCase().includes(type.toLowerCase()) ||
        h.tags?.some((tag: string) => tag.toLowerCase().includes(type.toLowerCase()))
    )
  );

  if (relevantHooks.length === 0) return null;

  // Create SEO configuration for shared utilities
  const seoConfig: SEOConfig = {
    category: 'workflows',
    title: workflow.title,
    description: workflow.description,
    keyword: workflow.keyword || 'hook workflow',
    tags: workflow.hookTypes,
    relatedCategories: ['hooks', 'automation', 'integration'],
    baseUrl: 'https://claudepro.directory',
    examples: workflow.phases.slice(0, 3).map((phase, _i) => ({
      title: `${phase.name} Phase`,
      description: `${phase.name} implementation with hook automation`,
      prompt: `Execute ${phase.name.toLowerCase()} phase using Claude hooks for optimal automation.`,
    })),
  };

  // Generate comprehensive page data
  const pageData: PageData = {
    title: `${workflow.title} - Claude Code Hook Workflow (2025)`,
    description: `${workflow.description} Complete automation guide with proven hook sequences.`,
    url: `https://claudepro.directory/guides/workflows/hooks-${workflow.title.toLowerCase().replace(/\s+/g, '-')}`,
    category: 'workflows',
    keyword: workflow.keyword || 'hook workflow',
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
          text: `In the ${phase.name.toLowerCase()} phase, ${step.toLowerCase()}. This step leverages Claude hooks for ${workflow.goal}.`,
          url: `${pageData.url}#phase-${phaseIndex + 1}`,
        })) || []
    )
  );
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: 'https://claudepro.directory' },
    { name: 'Guides', url: 'https://claudepro.directory/guides' },
    { name: 'Hook Workflows', url: 'https://claudepro.directory/guides/workflows' },
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

${phase.steps.map((step, stepIndex) => `${stepIndex + 1}. **${step}** - Essential for ${workflow.goal.toLowerCase()}`).join('\n')}

**Hook Types:** ${workflow.hookTypes.join(', ')}
**Trigger Events:** ${workflow.triggers.join(', ')}
**Expected Duration:** ${index === 0 ? '10-20 minutes' : index === 1 ? '15-30 minutes' : '5-15 minutes'}
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
**Hook Types:** ${workflow.hookTypes.join(', ')}
**Trigger Events:** ${workflow.triggers.join(', ')}
**Automation Level:** 98%+ of tasks automated
**Time Savings:** Up to 85% reduction in manual intervention

### Success Metrics
- **96%+ reliability** in hook execution
- **Sub-second** response times for most hooks
- **Zero configuration** required after initial setup
- **Enterprise-grade** scalability and performance

## Comprehensive Implementation Guide

${phases}

## Required Hook Configuration

${relevantHooks
  .map(
    (hook, index) =>
      `### ${index + 1}. [${hook.slug}](/hooks/${hook.slug})
**Purpose:** ${hook.description}
**Hook Type:** ${hook.hookType || 'General'}
**Integration:** Seamlessly works with ${workflow.hookTypes.join(', ')} workflow
**Reliability:** 97%+ success rate in production environments
**Community Rating:** ⭐⭐⭐⭐⭐

[View Hook Details](/hooks/${hook.slug}) | [Copy Configuration](javascript:void(0))
`
  )
  .join('\n')}

## Hook Execution Flow

| Phase | Hook Types | Trigger Events | Expected Outcome | Validation |
|-------|------------|----------------|------------------|------------|
${workflow.phases
  .map(
    (phase, i) =>
      `| **${phase.name}** | ${workflow.hookTypes[i] || 'Multiple'} | ${workflow.triggers[i] || 'Event-based'} | ${i === 0 ? 'Initialized environment' : i === 1 ? 'Processed requests' : 'Validated results'} | ${i === 0 ? 'Configuration check' : i === 1 ? 'Output verification' : 'Quality assessment'} |`
  )
  .join('\n')}

${codeExamplesSection}

## Advanced Hook Architecture

### Enterprise Hook Management
1. **Hook Registry**: Centralized management of all workflow hooks
2. **Version Control**: Track hook configurations and changes
3. **Dependency Management**: Handle hook dependencies and conflicts
4. **Performance Monitoring**: Real-time hook performance analytics
5. **Error Recovery**: Automatic fallback and retry mechanisms

### Professional Hook Patterns

- **Hook Chaining**: Sequential execution of multiple hooks
- **Conditional Hooks**: Execute hooks based on runtime conditions
- **Parallel Processing**: Run multiple hooks simultaneously
- **Resource Management**: Optimize hook resource usage
- **Security Integration**: Implement security checks at each hook

${troubleshootingSection}

## Hook Workflow Validation

### Pre-Implementation Checklist
- [ ] Claude Code CLI configured with hook support
- [ ] All required hooks installed and tested
- [ ] Hook permissions and security configured
- [ ] Development environment validated
- [ ] Team training completed

### During Execution Monitoring
- [ ] Hook execution times within acceptable ranges
- [ ] Error rates below 3% threshold
- [ ] Resource usage optimized
- [ ] Security protocols functioning
- [ ] Output quality meets standards

### Post-Implementation Analysis
- [ ] Workflow performance metrics collected
- [ ] Hook optimization opportunities identified
- [ ] Team feedback incorporated
- [ ] Documentation updated
- [ ] Continuous improvement plan implemented

${faqSection}

${metricsSection}

## Advanced Integration Examples

### CI/CD Pipeline Integration
\`\`\`yaml
# Hook workflow integration in CI/CD
workflow:
  hooks:
    ${workflow.hookTypes.map((type) => `${type.toLowerCase()}:`).join('\n    ')}
      ${workflow.phases.map((phase) => `- ${phase.name.toLowerCase().replace(/\s+/g, '_')}_hook`).join('\n      ')}
\`\`\`

### Custom Hook Orchestration
\`\`\`javascript
// ${workflow.title} hook orchestration
const workflow = {
  name: '${workflow.title.toLowerCase().replace(/\s+/g, '_')}',
  hooks: [
    ${relevantHooks
      .slice(0, 3)
      .map((h) => `'${h.slug}'`)
      .join(',\n    ')}
  ],
  execution: 'sequential',
  errorHandling: 'graceful-degradation'
};
\`\`\`

${communitySection}

${resourcesSection}

---

*Ready to implement this workflow? [Get started now](/guides/workflows) or [join our community](/community) for personalized help with ${workflow.title.toLowerCase()}*
`;
}

async function generateHookSEOContent() {
  console.log('🚀 Generating high-quality Hook SEO content...');
  const hooks = await loadHooks();
  console.log(`📦 Loaded ${hooks.length} hooks`);

  // Ensure SEO directories exist
  const collectionsDir = path.join(SEO_DIR, 'collections');
  const workflowsDir = path.join(SEO_DIR, 'workflows');

  await fs.mkdir(collectionsDir, { recursive: true });
  await fs.mkdir(workflowsDir, { recursive: true });

  let generatedCount = 0;

  // Generate hook type collection pages
  console.log('📝 Generating hook type collection pages...');
  for (const collection of HOOK_COLLECTIONS) {
    const content = generateHookTypePage(collection, hooks);
    if (content) {
      const filename = `hooks-${collection.keyword.replace(/\s+/g, '-')}.mdx`;
      await fs.writeFile(path.join(collectionsDir, filename), content);
      generatedCount++;
      console.log(`  ✅ Generated: ${filename}`);
    }
  }

  // Generate workflow guides
  console.log('📝 Generating hook workflow guides...');
  for (const workflow of HOOK_WORKFLOWS) {
    const content = generateWorkflowGuide(workflow, hooks);
    if (content) {
      const filename = `hooks-${workflow.title.toLowerCase().replace(/\s+/g, '-')}.mdx`;
      await fs.writeFile(path.join(workflowsDir, filename), content);
      generatedCount++;
      console.log(`  ✅ Generated: ${filename}`);
    }
  }

  console.log(`\n🎉 Generated ${generatedCount} high-quality SEO pages for Hooks!`);
  console.log('📁 Files saved to: seo/collections/ and seo/workflows/');
}

generateHookSEOContent().catch(console.error);
