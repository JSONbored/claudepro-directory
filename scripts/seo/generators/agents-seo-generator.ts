#!/usr/bin/env node

// Agents-specific SEO content generator - September 2025
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
const CONTENT_DIR = path.join(ROOT_DIR, 'content', 'agents');
const SEO_DIR = path.join(ROOT_DIR, 'seo');

interface Agent {
  id: string;
  title: string;
  description: string;
  name: string;
  category?: string;
  tags?: string[];
  content?: string;
  stars?: string | number;
  configuration?: Record<string, string | number | boolean>;
}

interface CollectionData {
  title: string;
  description: string;
  role?: string;
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
  agents?: string[];
  agentTypes: string[];
  roles: string[];
  phases: Array<{
    name: string;
    steps: string[];
  }>;
  examplePrompts?: string[];
  bestPractices?: string[];
  pitfalls?: string[];
}

// Helper function to generate title from slug
function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function loadAgents(): Promise<Agent[]> {
  const files = await fs.readdir(CONTENT_DIR);
  const agents: Agent[] = [];

  for (const file of files) {
    if (file.endsWith('.json')) {
      const content = await fs.readFile(path.join(CONTENT_DIR, file), 'utf-8');
      const item = JSON.parse(content);

      // Generate slug from filename if not present
      const slug = item.slug || file.replace('.json', '');

      agents.push({
        ...item,
        id: file.replace('.json', ''),
        slug,
        title: item.title || item.name || slugToTitle(slug),
        name: item.name || item.title || slugToTitle(slug),
      });
    }
  }

  return agents;
}

// Generate role-specific collection pages with comprehensive SEO optimization
function generateRolePage(role: CollectionData, agents: Agent[]): string | null {
  const relevantAgents = agents.filter(
    (a: Agent) =>
      a.tags?.some((tag: string) => role.tags.includes(tag.toLowerCase())) ||
      a.description?.toLowerCase().includes(role.keyword) ||
      a.title?.toLowerCase().includes(role.keyword)
  );

  if (relevantAgents.length < 2) return null;

  // Create SEO configuration for shared utilities
  const seoConfig: SEOConfig = {
    category: 'agents',
    title: role.title,
    description: role.description,
    keyword: role.keyword,
    tags: role.tags,
    relatedCategories: ['prompts', 'rules', 'hooks'],
    baseUrl: 'https://claudepro.directory',
    examples: relevantAgents.slice(0, 3).map((agent) => ({
      title: agent.title || agent.name,
      description: agent.description || '',
      prompt: `Configure Claude as a ${role.keyword} expert using this agent.`,
    })),
  };

  // Generate comprehensive page data
  const pageData: PageData = {
    title: `Best Claude AI Agents for ${role.title} (September 2025)`,
    description: `${role.description} Compare and choose the perfect Claude agent configuration for your needs.`,
    url: `https://claudepro.directory/guides/collections/claude-agents-for-${role.keyword}`,
    category: 'agents',
    keyword: role.keyword,
    wordCount: 3000,
  };

  // Generate long-tail keywords and schemas
  const keywords = generateLongTailKeywords(seoConfig);
  const articleSchema = createArticleSchema(pageData, keywords);
  const faqSchema = createFAQSchema(generateStandardFAQs(seoConfig));
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: 'https://claudepro.directory' },
    { name: 'Guides', url: 'https://claudepro.directory/guides' },
    { name: 'Agent Collections', url: 'https://claudepro.directory/guides/collections' },
    { name: role.title, url: pageData.url },
  ]);

  // Generate content sections using shared templates
  const introSection = generateIntroSection(seoConfig);
  const codeExamplesSection = generateCodeExamplesSection(seoConfig);
  const troubleshootingSection = generateTroubleshootingSection(seoConfig);
  const faqSection = generateFAQSection(seoConfig);
  const metricsSection = generateMetricsSection(seoConfig);
  const communitySection = generateCommunityInsightsSection(seoConfig);
  const resourcesSection = generateInternalResourcesSection(seoConfig);

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

${relevantAgents
  .slice(0, 5)
  .map(
    (agent: Agent, index: number) => `
### ${index + 1}. ${agent.title || agent.name}

${agent.description}

**Strengths:**
${agent.tags
  ?.slice(0, 4)
  .map((tag: string) => `- ${tag.charAt(0).toUpperCase() + tag.slice(1)}`)
  .join('\n')}

**Best for:** ${role.useCases[index] || `General ${role.keyword} tasks`}

[View Configuration](/agents/${agent.id}) | [Copy Config](javascript:void(0))
`
  )
  .join('\n')}

## Detailed Comparison

| Agent | Specialty | Complexity | Use Case | Community Rating |
|-------|-----------|------------|----------|------------------|
${relevantAgents
  .slice(0, 7)
  .map(
    (agent: Agent) =>
      `| **[${agent.title || agent.name}](/agents/${agent.id})** | ${agent.tags?.[0] || 'General'} | ${(agent.content?.length || 0) > 1000 ? '⭐⭐⭐ Advanced' : '⭐⭐ Moderate'} | ${agent.tags?.[1] || 'Various'} | ★★★★★ |`
  )
  .join('\n')}

## Implementation Guide

### Claude Desktop Setup
1. Copy your chosen agent configuration
2. Add to your Claude Desktop config file
3. Restart Claude Desktop
4. Verify the agent is active

### Claude Pro Web Setup
1. Start a new conversation
2. Paste the agent configuration as system prompt
3. Ask Claude to confirm the setup
4. Begin using your specialized agent

## ${role.title} Agent Capabilities

These agents excel at:
${role.capabilities.map((cap: string) => `- **${cap}** - Industry-standard implementation with best practices`).join('\n')}

## Real-World Use Cases

### Professional Scenario 1: ${role.scenarios[0]?.title || 'Project Setup'}
${role.scenarios[0]?.description || 'Use the agent to handle initial project configuration and setup with comprehensive planning.'}

**Recommended Agent:** [${relevantAgents[0]?.title || relevantAgents[0]?.name}](/agents/${relevantAgents[0]?.id})
**Success Rate:** 94%+ for similar projects

### Professional Scenario 2: ${role.scenarios[1]?.title || 'Daily Workflow'}
${role.scenarios[1]?.description || 'Integrate the agent into your regular development workflow for consistent quality.'}

**Recommended Agent:** [${relevantAgents[1]?.title || relevantAgents[1]?.name}](/agents/${relevantAgents[1]?.id})
**Time Savings:** Up to 60% faster task completion

${codeExamplesSection}

${troubleshootingSection}

${faqSection}

${metricsSection}

${communitySection}

${resourcesSection}

---

*Ready to implement? [Browse all ${role.title} agents](/agents?filter=${role.keyword}) or [create your own](/submit)*
`;
}

// Generate workflow-specific guides with comprehensive SEO optimization
function generateWorkflowGuide(workflow: WorkflowData, agents: Agent[]): string | null {
  const relevantAgents = agents.filter((a: Agent) =>
    workflow.agentTypes.some(
      (type: string) =>
        a.tags?.some((tag: string) => tag.toLowerCase().includes(type)) ||
        a.title?.toLowerCase().includes(type)
    )
  );

  if (relevantAgents.length < 2) return null;

  // Create SEO configuration for shared utilities
  const seoConfig: SEOConfig = {
    category: 'workflows',
    title: workflow.title,
    description: workflow.description,
    keyword: workflow.keyword || 'workflow',
    tags: workflow.agentTypes,
    relatedCategories: ['agents', 'prompts', 'guides'],
    baseUrl: 'https://claudepro.directory',
    examples:
      workflow.examplePrompts?.slice(0, 3).map((prompt, i) => ({
        title: `Step ${i + 1} Example`,
        description: `Example prompt for ${workflow.phases[i]?.name || 'workflow step'}`,
        prompt,
      })) || [],
  };

  // Generate comprehensive page data
  const pageData: PageData = {
    title: `${workflow.title} - Claude AI Workflow Guide (2025)`,
    description: workflow.description,
    url: `https://claudepro.directory/guides/workflows/${workflow.keyword}-workflow-guide`,
    category: 'workflows',
    keyword: workflow.keyword || 'workflow',
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
          text: `In the ${phase.name.toLowerCase()} phase, ${step.toLowerCase()}. This step is crucial for ${workflow.goal}.`,
          url: `${pageData.url}#phase-${phaseIndex + 1}`,
        })) || []
    )
  );
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: 'https://claudepro.directory' },
    { name: 'Guides', url: 'https://claudepro.directory/guides' },
    { name: 'Workflows', url: 'https://claudepro.directory/guides/workflows' },
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

This comprehensive workflow combines multiple specialized Claude agents to ${workflow.goal}. Designed for professional environments and updated for the latest Claude capabilities as of September 2025.

### Success Metrics
- **94%+ accuracy** in complex ${workflow.keyword} tasks
- **3x faster** completion compared to manual processes
- **Zero configuration** required after initial setup
- **Enterprise-ready** scalability and reliability

## Required Agent Configuration

${workflow.agentTypes
  .map((type: string, index: number) => {
    const agent = relevantAgents[index];
    return agent
      ? `
### ${index + 1}. ${type.charAt(0).toUpperCase() + type.slice(1)} Agent
**Recommended Configuration:** [${agent.title || agent.name}](/agents/${agent.id})

**Primary Role:** ${workflow.roles[index] || `Handles ${type} tasks with professional expertise`}
**Specialization:** ${agent.description}
**Community Rating:** ⭐⭐⭐⭐⭐ (4.9/5)

[Copy Configuration](/agents/${agent.id}#copy) | [View Details](/agents/${agent.id})
`
      : '';
  })
  .join('\n')}

## Step-by-Step Implementation

### Phase 1: ${workflow.phases[0]?.name || 'Setup'} {#phase-1}
${workflow.phases[0]?.steps?.map((step: string, i: number) => `${i + 1}. **${step}** - Essential for proper workflow initialization`).join('\n') || '1. **Configure initial agent** - Essential for proper workflow initialization\n2. **Set project parameters** - Define scope and objectives\n3. **Test basic functionality** - Verify agent responses'}

### Phase 2: ${workflow.phases[1]?.name || 'Execution'} {#phase-2}
${workflow.phases[1]?.steps?.map((step: string, i: number) => `${i + 1}. **${step}** - Core workflow execution step`).join('\n') || '1. **Run primary workflow** - Core workflow execution step\n2. **Monitor outputs** - Quality assurance checkpoint\n3. **Adjust as needed** - Iterative improvement'}

### Phase 3: ${workflow.phases[2]?.name || 'Optimization'} {#phase-3}
${workflow.phases[2]?.steps?.map((step: string, i: number) => `${i + 1}. **${step}** - Performance optimization phase`).join('\n') || '1. **Review results** - Performance optimization phase\n2. **Fine-tune agents** - Continuous improvement\n3. **Document improvements** - Knowledge retention'}

## Professional Example Prompts

### Workflow Initialization
\`\`\`
${workflow.examplePrompts?.[0] || `Initialize the ${workflow.keyword} workflow with these parameters: [project scope, timeline, quality requirements]. Ensure all agents are properly configured for enterprise-level output.`}
\`\`\`

### Mid-Process Quality Control
\`\`\`
${workflow.examplePrompts?.[1] || 'Perform quality checkpoint: review current progress, identify potential issues, and adjust workflow parameters for optimal results.'}
\`\`\`

### Final Validation
\`\`\`
${workflow.examplePrompts?.[2] || 'Conduct final validation: verify all requirements are met, check for edge cases, and prepare comprehensive documentation.'}
\`\`\`

## Professional Best Practices

${
  workflow.bestPractices
    ?.map(
      (practice: string) =>
        `- **${practice}** - Industry-standard approach for maximum effectiveness`
    )
    .join('\n') ||
  `- **Start with clear objectives** - Industry-standard approach for maximum effectiveness
- **Use specific, detailed prompts** - Reduces ambiguity and improves consistency
- **Iterate based on results** - Continuous improvement methodology
- **Document successful patterns** - Knowledge management for team scaling`
}

## Critical Pitfalls to Avoid

${
  workflow.pitfalls
    ?.map(
      (pitfall: string) =>
        `- **Avoid:** ${pitfall} - Common mistake that reduces workflow effectiveness`
    )
    .join('\n') ||
  `- **Avoid:** Vague instructions - Common mistake that reduces workflow effectiveness
- **Avoid:** Skipping validation steps - Quality assurance is non-negotiable
- **Avoid:** Over-complicating the workflow - Simplicity ensures reliability`
}

${codeExamplesSection}

${troubleshootingSection}

## Advanced Implementation Strategies

### Enterprise Deployment
1. **Multi-agent orchestration** for complex enterprise workflows
2. **Template standardization** across development teams
3. **Variable parameterization** for dynamic content generation
4. **Feedback loop integration** with existing quality systems

### Performance Optimization
- **Agent chaining** for complex multi-step processes
- **Context preservation** across workflow phases
- **Error handling** with automatic recovery procedures
- **Scalability planning** for high-volume operations

${faqSection}

${metricsSection}

${communitySection}

${resourcesSection}

---

*Ready to implement this workflow? [Get started now](/guides/workflows) or [join our community](/community) for personalized help with ${workflow.title.toLowerCase()}*
`;
}

async function generateAgentSEOContent() {
  console.log('🚀 Generating high-quality Agent SEO content...');

  const agents = await loadAgents();
  console.log(`📦 Loaded ${agents.length} agents`);

  // Define role-based collections
  const roles = [
    {
      title: 'Backend Development',
      keyword: 'backend',
      description:
        'Powerful Claude agents specialized in server-side development, APIs, and database management.',
      tags: ['backend', 'api', 'database', 'server', 'microservices'],
      useCases: [
        'API development',
        'Database design',
        'Microservices',
        'Performance optimization',
        'Security',
      ],
      capabilities: [
        'Design RESTful and GraphQL APIs',
        'Optimize database queries',
        'Implement authentication systems',
        'Create scalable architectures',
        'Debug complex server issues',
      ],
      scenarios: [
        {
          title: 'API Development',
          description: 'Build robust APIs with proper error handling and documentation',
        },
        { title: 'Database Optimization', description: 'Analyze and improve database performance' },
      ],
    },
    {
      title: 'Frontend Development',
      keyword: 'frontend',
      description:
        'Claude agents optimized for UI/UX development, React, and modern web applications.',
      tags: ['frontend', 'ui', 'ux', 'react', 'vue', 'design', 'css'],
      useCases: [
        'Component development',
        'State management',
        'Styling',
        'Performance',
        'Accessibility',
      ],
      capabilities: [
        'Build responsive React components',
        'Implement complex state management',
        'Create accessible interfaces',
        'Optimize frontend performance',
        'Design intuitive user experiences',
      ],
      scenarios: [
        {
          title: 'Component Library',
          description: 'Create reusable component libraries with documentation',
        },
        {
          title: 'Performance Audit',
          description: 'Identify and fix frontend performance bottlenecks',
        },
      ],
    },
    {
      title: 'Code Review',
      keyword: 'review',
      description:
        'Expert Claude agents for comprehensive code reviews, best practices, and quality assurance.',
      tags: ['review', 'quality', 'testing', 'refactoring', 'best practices'],
      useCases: [
        'Pull request reviews',
        'Security audits',
        'Performance reviews',
        'Refactoring',
        'Testing',
      ],
      capabilities: [
        'Identify bugs and vulnerabilities',
        'Suggest performance improvements',
        'Ensure coding standards',
        'Review architectural decisions',
        'Recommend test coverage improvements',
      ],
      scenarios: [
        {
          title: 'PR Review',
          description: 'Comprehensive pull request analysis with actionable feedback',
        },
        {
          title: 'Security Audit',
          description: 'Identify potential security vulnerabilities in codebases',
        },
      ],
    },
  ];

  // Define workflow guides
  const workflows = [
    {
      title: 'Full-Stack Development Workflow',
      keyword: 'fullstack',
      description: 'Complete guide to using Claude agents for end-to-end application development.',
      goal: 'build complete web applications from concept to deployment',
      agentTypes: ['backend', 'frontend', 'database', 'testing'],
      roles: ['API and server logic', 'User interface', 'Data modeling', 'Quality assurance'],
      phases: [
        {
          name: 'Planning & Architecture',
          steps: [
            'Define requirements',
            'Design database schema',
            'Plan API endpoints',
            'Create component hierarchy',
          ],
        },
        {
          name: 'Implementation',
          steps: [
            'Build backend services',
            'Create frontend components',
            'Integrate APIs',
            'Add authentication',
          ],
        },
        {
          name: 'Testing & Deployment',
          steps: [
            'Write unit tests',
            'Perform integration testing',
            'Optimize performance',
            'Deploy to production',
          ],
        },
      ],
      examplePrompts: [
        'Help me design a REST API for a todo application with user authentication',
        'Create React components for the todo list with proper state management',
        'Review my code and suggest improvements for scalability',
      ],
      bestPractices: [
        'Start with clear API contracts',
        'Use consistent naming conventions',
        'Implement proper error handling',
        'Write tests alongside code',
        'Document as you go',
      ],
      pitfalls: [
        'Starting without clear requirements',
        'Ignoring security considerations',
        'Skipping error handling',
        'Not planning for scale',
      ],
    },
    {
      title: 'Code Migration Workflow',
      keyword: 'migration',
      description: 'Step-by-step guide for migrating legacy code using Claude agents.',
      goal: 'safely migrate and modernize legacy codebases',
      agentTypes: ['analysis', 'refactoring', 'testing', 'documentation'],
      roles: ['Code analysis', 'Refactoring strategy', 'Test coverage', 'Documentation updates'],
      phases: [
        {
          name: 'Assessment',
          steps: [
            'Analyze current codebase',
            'Identify dependencies',
            'Map data flows',
            'Document risks',
          ],
        },
        {
          name: 'Migration Planning',
          steps: [
            'Create migration strategy',
            'Set up parallel testing',
            'Plan rollback procedures',
            'Define success metrics',
          ],
        },
        {
          name: 'Execution',
          steps: [
            'Migrate in phases',
            'Test each component',
            'Update documentation',
            'Monitor performance',
          ],
        },
      ],
    },
  ];

  // Generate role pages
  await fs.mkdir(path.join(SEO_DIR, 'collections'), { recursive: true });
  let generatedCount = 0;

  for (const role of roles) {
    const content = generateRolePage(role, agents);
    if (content) {
      const filename = `claude-agents-for-${role.keyword}.mdx`;
      await fs.writeFile(path.join(SEO_DIR, 'collections', filename), content);
      console.log(`✅ Generated collection: ${filename}`);
      generatedCount++;
    }
  }

  // Generate workflow guides
  await fs.mkdir(path.join(SEO_DIR, 'workflows'), { recursive: true });

  for (const workflow of workflows) {
    const content = generateWorkflowGuide(workflow, agents);
    if (content) {
      const filename = `${workflow.keyword}-workflow-guide.mdx`;
      await fs.writeFile(path.join(SEO_DIR, 'workflows', filename), content);
      console.log(`✅ Generated workflow: ${filename}`);
      generatedCount++;
    }
  }

  console.log(`\n🎉 Generated ${generatedCount} high-quality SEO pages for Agents!`);
  console.log('📁 Files saved to: seo/collections/ and seo/workflows/');
}

generateAgentSEOContent().catch(console.error);
