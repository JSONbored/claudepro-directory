#!/usr/bin/env node

// Hooks-specific SEO content generator - September 2025
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Generate hook type-specific collection pages
function generateHookTypePage(collection: CollectionData, hooks: Hook[]): string | null {
  const relevantHooks = hooks.filter(
    (h: Hook) =>
      h.tags?.some((tag: string) => collection.tags.includes(tag.toLowerCase())) ||
      h.description?.toLowerCase().includes(collection.keyword) ||
      h.hookType?.toLowerCase().includes(collection.keyword)
  );

  if (relevantHooks.length === 0) return null;

  const scenarios = collection.scenarios
    .map((s) => `### ${s.title}\n${s.description}\n`)
    .join('\n');

  const useCases = collection.useCases.map((uc) => `- ${uc}`).join('\n');
  const capabilities = collection.capabilities.map((cap) => `- ${cap}`).join('\n');

  return `---
title: "${collection.title} - Claude Code Hooks"
description: "${collection.description}"
keywords: "claude hooks, ${collection.keyword}, ${collection.tags.join(', ')}"
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

${relevantHooks
  .map(
    (hook) =>
      `### [${hook.slug}](/hooks/${hook.slug})
${hook.description}

**Hook Type:** ${hook.hookType || 'General'}
**Tags:** ${hook.tags?.join(', ') || 'None'}
`
  )
  .join('\n')}

## Getting Started

1. **Choose Your Hook Type**: ${collection.hookType || 'Select the appropriate hook type for your needs'}
2. **Install Hook**: Follow the installation guide for your chosen hook
3. **Configure Settings**: Customize the hook configuration for your specific use case
4. **Test Integration**: Verify the hook works correctly in your environment

## Best Practices

- Always test hooks in a development environment first
- Use clear, descriptive hook names and configurations
- Implement proper error handling and logging
- Monitor hook performance and resource usage
- Keep hook logic focused and efficient

*Have a better ${collection.title.toLowerCase()} hook? [Submit it here](/submit)*
`;
}

// Generate workflow-specific guides
function generateWorkflowGuide(workflow: WorkflowData, hooks: Hook[]): string | null {
  const relevantHooks = hooks.filter((h: Hook) =>
    workflow.hookTypes.some(
      (type: string) =>
        h.hookType?.toLowerCase().includes(type.toLowerCase()) ||
        h.tags?.some((tag: string) => tag.toLowerCase().includes(type.toLowerCase()))
    )
  );

  if (relevantHooks.length === 0) return null;

  const phases = workflow.phases
    .map(
      (phase) =>
        `### ${phase.name}

${phase.steps.map((step) => `- ${step}`).join('\n')}
`
    )
    .join('\n');

  return `---
title: "${workflow.title} - Claude Code Hook Workflow"
description: "${workflow.description}"
keywords: "claude hooks workflow, ${workflow.keyword}, ${workflow.hookTypes.join(', ')}"
---

# ${workflow.title}

${workflow.description}

**Goal:** ${workflow.goal}

## Workflow Steps

${phases}

## Required Hooks

${relevantHooks
  .map(
    (hook) =>
      `### [${hook.slug}](/hooks/${hook.slug})
${hook.description}

**Hook Type:** ${hook.hookType || 'General'}
`
  )
  .join('\n')}

## Implementation Guide

1. **Plan Your Workflow**: Review the phases and understand the complete flow
2. **Install Required Hooks**: Set up all hooks needed for this workflow
3. **Configure Integration**: Connect hooks to work together seamlessly
4. **Test Each Phase**: Verify each phase works correctly before proceeding
5. **Monitor Performance**: Track workflow execution and optimize as needed

## Troubleshooting

- **Hook Conflicts**: Ensure hooks don't interfere with each other
- **Performance Issues**: Monitor resource usage and optimize hook logic
- **Error Handling**: Implement proper error recovery mechanisms
- **Logging**: Set up comprehensive logging for debugging

*Questions? [Join our community](/community) for help with ${workflow.title.toLowerCase()}*
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
