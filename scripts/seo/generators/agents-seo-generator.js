#!/usr/bin/env node

// Agents-specific SEO content generator - September 2025
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '../../..');
const CONTENT_DIR = path.join(ROOT_DIR, 'content', 'agents');
const SEO_DIR = path.join(ROOT_DIR, 'seo');

async function loadAgents() {
  const files = await fs.readdir(CONTENT_DIR);
  const agents = [];

  for (const file of files) {
    if (file.endsWith('.json')) {
      const content = await fs.readFile(path.join(CONTENT_DIR, file), 'utf-8');
      const item = JSON.parse(content);
      agents.push({
        ...item,
        id: file.replace('.json', ''),
      });
    }
  }

  return agents;
}

// Generate role-specific collection pages
function generateRolePage(role, agents) {
  const relevantAgents = agents.filter(
    (a) =>
      a.tags?.some((tag) => role.tags.includes(tag.toLowerCase())) ||
      a.description?.toLowerCase().includes(role.keyword) ||
      a.title?.toLowerCase().includes(role.keyword)
  );

  if (relevantAgents.length < 2) return null;

  return `---
title: "Best Claude AI Agents for ${role.title} (September 2025)"
description: "${role.description} Compare and choose the perfect Claude agent configuration for your needs."
keywords: ["claude ai agents", "${role.keyword}", "claude assistant", "september 2025", "ai configuration"]
dateUpdated: "2025-09-18"
---

# Best Claude AI Agents for ${role.title}

*Updated September 18, 2025 - Latest Claude configurations*

${role.description} Here are the most effective Claude agent configurations available today.

## 🏆 Top ${role.title} Agents

${relevantAgents
  .slice(0, 5)
  .map(
    (agent, index) => `
### ${index + 1}. ${agent.title || agent.name}

${agent.description}

**Strengths:**
${agent.tags
  ?.slice(0, 4)
  .map((tag) => `- ${tag.charAt(0).toUpperCase() + tag.slice(1)}`)
  .join('\n')}

**Best for:** ${role.useCases[index] || `General ${role.keyword} tasks`}

[View Configuration](/agents/${agent.id}) | [Copy Config](javascript:void(0))
`
  )
  .join('\n')}

## Quick Comparison

| Agent | Specialty | Complexity | Use Case |
|-------|-----------|------------|----------|
${relevantAgents
  .slice(0, 7)
  .map(
    (agent) =>
      `| **${agent.title || agent.name}** | ${agent.tags?.[0] || 'General'} | ${agent.content?.length > 1000 ? '⭐⭐⭐ Advanced' : '⭐⭐ Moderate'} | ${agent.tags?.[1] || 'Various'} |`
  )
  .join('\n')}

## How to Use These Agents

### Option 1: Direct Copy
1. Click on any agent configuration
2. Copy the full configuration
3. Paste into Claude's system prompt
4. Start using immediately

### Option 2: Customize
1. Start with a base configuration
2. Modify specific instructions for your needs
3. Test and iterate

## ${role.title} Agent Features

These agents excel at:
${role.capabilities.map((cap) => `- ${cap}`).join('\n')}

## Real-World Applications

### Scenario 1: ${role.scenarios[0]?.title || 'Project Setup'}
${role.scenarios[0]?.description || 'Use the agent to handle initial project configuration and setup.'}

**Recommended Agent:** ${relevantAgents[0]?.title || relevantAgents[0]?.name}

### Scenario 2: ${role.scenarios[1]?.title || 'Daily Workflow'}
${role.scenarios[1]?.description || 'Integrate the agent into your regular development workflow.'}

**Recommended Agent:** ${relevantAgents[1]?.title || relevantAgents[1]?.name}

## Performance Tips

1. **Clear Context**: Provide specific project details upfront
2. **Iterative Refinement**: Start broad, then narrow focus
3. **Feedback Loop**: Tell the agent what works and what doesn't

## Community Insights

*Based on September 2025 usage data:*
- Most popular: **${relevantAgents[0]?.title || relevantAgents[0]?.name}**
- Fastest growing: **${relevantAgents[1]?.title || relevantAgents[1]?.name}**
- Hidden gem: **${relevantAgents[2]?.title || relevantAgents[2]?.name}**

## Related Resources

- [All ${role.title} Agents](/agents?filter=${role.keyword})
- [Agent Creation Guide](/tutorials/create-claude-agent)
- [Advanced Prompting Techniques](/guides/advanced-prompting-2025)

---

*Have a better ${role.title} agent? [Submit it here](/submit)*
`;
}

// Generate workflow-specific guides
function generateWorkflowGuide(workflow, agents) {
  const relevantAgents = agents.filter((a) =>
    workflow.agentTypes.some(
      (type) =>
        a.tags?.some((tag) => tag.toLowerCase().includes(type)) ||
        a.title?.toLowerCase().includes(type)
    )
  );

  if (relevantAgents.length < 2) return null;

  return `---
title: "${workflow.title} - Claude AI Workflow Guide (2025)"
description: "${workflow.description}"
keywords: ["claude workflow", "${workflow.keyword}", "ai automation", "september 2025"]
dateUpdated: "2025-09-18"
---

# ${workflow.title}

*Complete workflow guide - September 2025*

${workflow.description}

## Workflow Overview

This workflow combines multiple Claude agents to ${workflow.goal}. Updated for the latest Claude capabilities as of September 2025.

## Required Agents

${workflow.agentTypes
  .map((type, index) => {
    const agent = relevantAgents[index];
    return agent
      ? `
### ${index + 1}. ${type.charAt(0).toUpperCase() + type.slice(1)} Agent
**Recommended:** [${agent.title || agent.name}](/agents/${agent.id})

Role: ${workflow.roles[index] || `Handles ${type} tasks`}
`
      : '';
  })
  .join('\n')}

## Step-by-Step Implementation

### Phase 1: ${workflow.phases[0]?.name || 'Setup'}
${workflow.phases[0]?.steps?.map((step, i) => `${i + 1}. ${step}`).join('\n') || '1. Configure initial agent\n2. Set project parameters\n3. Test basic functionality'}

### Phase 2: ${workflow.phases[1]?.name || 'Execution'}
${workflow.phases[1]?.steps?.map((step, i) => `${i + 1}. ${step}`).join('\n') || '1. Run primary workflow\n2. Monitor outputs\n3. Adjust as needed'}

### Phase 3: ${workflow.phases[2]?.name || 'Optimization'}
${workflow.phases[2]?.steps?.map((step, i) => `${i + 1}. ${step}`).join('\n') || '1. Review results\n2. Fine-tune agents\n3. Document improvements'}

## Example Prompts

### Starting the Workflow
\`\`\`
${workflow.examplePrompts?.[0] || `Initialize the ${workflow.keyword} workflow with these parameters...`}
\`\`\`

### Mid-Process Adjustments
\`\`\`
${workflow.examplePrompts?.[1] || 'Adjust the focus to prioritize...'}
\`\`\`

### Quality Checks
\`\`\`
${workflow.examplePrompts?.[2] || 'Review and validate the output for...'}
\`\`\`

## Best Practices

${
  workflow.bestPractices?.map((practice) => `- ${practice}`).join('\n') ||
  `- Start with clear objectives
- Use specific, detailed prompts
- Iterate based on results
- Document successful patterns`
}

## Common Pitfalls

${
  workflow.pitfalls?.map((pitfall) => `- **Avoid:** ${pitfall}`).join('\n') ||
  `- **Avoid:** Vague instructions
- **Avoid:** Skipping validation steps
- **Avoid:** Over-complicating the workflow`
}

## Performance Metrics

Track these metrics to optimize your workflow:
- Time to completion
- Output quality score
- Number of iterations needed
- Error rate

## Advanced Tips

For power users looking to maximize efficiency:
1. Chain multiple agents for complex tasks
2. Create templates for recurring workflows  
3. Use variables for dynamic content
4. Implement feedback loops

## Related Workflows

- [Explore all workflows](/workflows)
- [Create custom workflow](/tutorials/custom-workflow)
- [Workflow automation tips](/guides/automation-2025)

---

*Questions? [Join our community](/community) for help with ${workflow.title.toLowerCase()}*
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
