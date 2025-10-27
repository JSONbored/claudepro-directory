/**
 * Auto-generated metadata file
 * Category: Commands
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { CommandContent } from '@/src/lib/schemas/content/command.schema';

export type CommandMetadata = Pick<CommandContent, 'slug' | 'title' | 'seoTitle' | 'description' | 'author' | 'tags' | 'category' | 'dateAdded' | 'source'>;

export const commandsMetadata: CommandMetadata[] = [
  {
    "slug": "autogen-workflow",
    "title": "Autogen Workflow",
    "seoTitle": "AutoGen Multi-Agent Workflow for Claude",
    "description": "Orchestrate multi-agent workflows using Microsoft AutoGen v0.4 with role-based task delegation, conversation patterns, and collaborative problem solving",
    "author": "JSONbored",
    "tags": [
      "autogen",
      "multi-agent",
      "workflow",
      "orchestration",
      "ai"
    ],
    "category": "commands",
    "dateAdded": "2025-10-16",
    "source": "community"
  },
  {
    "slug": "checkpoint-manager",
    "title": "Checkpoint Manager",
    "seoTitle": "Checkpoint Manager for Claude Code",
    "description": "Manage Claude Code checkpoints to safely rewind code changes, restore conversation states, and explore alternatives without fear using ESC+ESC or /rewind commands",
    "author": "JSONbored",
    "tags": [
      "checkpoints",
      "rewind",
      "undo",
      "version-control",
      "session-recovery",
      "safety"
    ],
    "category": "commands",
    "dateAdded": "2025-10-25",
    "source": "community"
  },
  {
    "slug": "claudemd-builder",
    "title": "Claudemd Builder",
    "seoTitle": "CLAUDE.md Builder for Claude Code",
    "description": "Generate project-specific CLAUDE.md files with coding standards, architecture notes, and context preservation for team-wide AI consistency and efficient onboarding",
    "author": "JSONbored",
    "tags": [
      "claude-md",
      "project-context",
      "coding-standards",
      "documentation",
      "onboarding",
      "team-collaboration"
    ],
    "category": "commands",
    "dateAdded": "2025-10-25",
    "source": "community"
  },
  {
    "slug": "context-analyzer",
    "title": "Context Analyzer",
    "seoTitle": "Context Analyzer for Claude Code",
    "description": "Analyze codebase context with agentic search to understand architecture, patterns, and dependencies before major refactors or feature implementations",
    "author": "JSONbored",
    "tags": [
      "context-analysis",
      "codebase-understanding",
      "architecture",
      "agentic-search",
      "refactoring",
      "planning"
    ],
    "category": "commands",
    "dateAdded": "2025-10-25",
    "source": "community"
  },
  {
    "slug": "cursor-rules",
    "title": "Cursor Rules",
    "seoTitle": "Cursor Rules Generator for Claude",
    "description": "Generate .cursorrules files for AI-native development with project-specific patterns, coding standards, and intelligent context awareness",
    "author": "JSONbored",
    "tags": [
      "cursor",
      "ai-rules",
      "code-standards",
      "context",
      "ai-ide"
    ],
    "category": "commands",
    "dateAdded": "2025-10-16",
    "source": "community"
  },
  {
    "slug": "debug",
    "title": "Debug",
    "seoTitle": "Debug for Claude",
    "description": "Advanced debugging assistant with root cause analysis, step-by-step troubleshooting, and automated fix suggestions",
    "author": "claudepro",
    "tags": [
      "debugging",
      "troubleshooting",
      "error-analysis",
      "diagnostics",
      "fixes"
    ],
    "category": "commands",
    "dateAdded": "2025-09-16",
    "source": "community"
  },
  {
    "slug": "docs",
    "title": "Docs",
    "seoTitle": "Docs for Claude",
    "description": "Intelligent documentation generator with API specs, code examples, tutorials, and interactive guides",
    "author": "claudepro",
    "tags": [
      "documentation",
      "api-docs",
      "tutorials",
      "guides",
      "markdown"
    ],
    "category": "commands",
    "dateAdded": "2025-09-16",
    "source": "community"
  },
  {
    "slug": "explain",
    "title": "Explain",
    "seoTitle": "Explain for Claude",
    "description": "Intelligent code explanation with visual diagrams, step-by-step breakdowns, and interactive examples",
    "author": "claudepro",
    "tags": [
      "explanation",
      "documentation",
      "learning",
      "analysis",
      "visualization"
    ],
    "category": "commands",
    "dateAdded": "2025-09-16",
    "source": "community"
  },
  {
    "slug": "generate-tests",
    "title": "Generate Tests",
    "seoTitle": "Generate Tests for Claude",
    "description": "Automatically generate comprehensive test suites including unit tests, integration tests, and edge cases with multiple testing framework support",
    "author": "JSONbored",
    "tags": [
      "testing",
      "automation",
      "unit-tests",
      "integration-tests",
      "tdd"
    ],
    "category": "commands",
    "dateAdded": "2025-09-16",
    "source": "community"
  },
  {
    "slug": "git-smart-commit",
    "title": "Git Smart Commit",
    "description": "Intelligently analyzes changes and creates well-formatted git commits with conventional commit messages",
    "author": "JSONbored",
    "tags": [
      "git",
      "commit",
      "version-control",
      "conventional-commits"
    ],
    "category": "commands",
    "dateAdded": "2025-09-15",
    "source": "community"
  },
  {
    "slug": "hooks-generator",
    "title": "Hooks Generator",
    "seoTitle": "Hooks Generator for Claude Code",
    "description": "Create automated Claude Code hooks that execute shell commands at specific lifecycle points for deterministic control over formatting, testing, linting, and notifications",
    "author": "JSONbored",
    "tags": [
      "hooks",
      "automation",
      "lifecycle",
      "workflow",
      "deterministic",
      "triggers"
    ],
    "category": "commands",
    "dateAdded": "2025-10-25",
    "source": "community"
  },
  {
    "slug": "mcp-setup",
    "title": "MCP Setup",
    "seoTitle": "MCP Server Setup for Claude Code",
    "description": "Configure and connect MCP servers to Claude Code with OAuth authentication, tool access, and remote server support for seamless external integrations",
    "author": "JSONbored",
    "tags": [
      "mcp",
      "integration",
      "oauth",
      "remote-server",
      "tools",
      "setup"
    ],
    "category": "commands",
    "dateAdded": "2025-10-25",
    "source": "claudepro"
  },
  {
    "slug": "mintlify-docs",
    "title": "Mintlify Docs",
    "seoTitle": "Mintlify Documentation Generator for Claude",
    "description": "Generate beautiful, searchable documentation using Mintlify with AI-powered content generation, API reference automation, and MDX components",
    "author": "JSONbored",
    "tags": [
      "mintlify",
      "documentation",
      "mdx",
      "api-docs",
      "ai"
    ],
    "category": "commands",
    "dateAdded": "2025-10-16",
    "source": "community"
  },
  {
    "slug": "optimize",
    "title": "Optimize",
    "seoTitle": "Optimize for Claude",
    "description": "Advanced performance optimization with bottleneck analysis, memory profiling, and automated improvements",
    "author": "claudepro",
    "tags": [
      "performance",
      "optimization",
      "profiling",
      "bottleneck",
      "efficiency"
    ],
    "category": "commands",
    "dateAdded": "2025-09-16",
    "source": "community"
  },
  {
    "slug": "plan-mode",
    "title": "Plan Mode",
    "seoTitle": "Plan Mode & Extended Thinking for Claude Code",
    "description": "Activate Claude's extended thinking mode with multi-level planning depth from 'think' to 'ultrathink' for comprehensive strategy creation before implementation",
    "author": "JSONbored",
    "tags": [
      "plan-mode",
      "extended-thinking",
      "strategy",
      "architecture",
      "deep-reasoning",
      "ultrathink"
    ],
    "category": "commands",
    "dateAdded": "2025-10-25",
    "source": "community"
  },
  {
    "slug": "refactor",
    "title": "Refactor",
    "description": "Intelligent code refactoring command that analyzes code structure and applies best practices for improved maintainability and performance",
    "author": "JSONbored",
    "tags": [
      "refactoring",
      "code-quality",
      "cleanup",
      "optimization",
      "patterns"
    ],
    "category": "commands",
    "dateAdded": "2025-09-16",
    "source": "community"
  },
  {
    "slug": "review",
    "title": "Review",
    "description": "Comprehensive code review with security analysis, performance optimization, and best practices validation",
    "author": "claudepro",
    "tags": [
      "code-review",
      "security",
      "performance",
      "quality",
      "analysis"
    ],
    "category": "commands",
    "dateAdded": "2025-09-16",
    "source": "community"
  },
  {
    "slug": "security-audit",
    "title": "Security Audit",
    "description": "Deploy 100 specialized sub-agents for comprehensive enterprise-grade security, performance, and optimization audit of production codebase",
    "author": "claudepro",
    "tags": [
      "security-audit",
      "enterprise",
      "performance",
      "optimization",
      "production",
      "comprehensive-analysis",
      "sub-agents",
      "architecture",
      "scalability",
      "code-quality"
    ],
    "category": "commands",
    "dateAdded": "2025-01-25",
    "source": "claudepro"
  },
  {
    "slug": "security",
    "title": "Security",
    "description": "Comprehensive security audit with vulnerability detection, threat analysis, and automated remediation recommendations",
    "author": "claudepro",
    "tags": [
      "security",
      "audit",
      "vulnerability",
      "threat-analysis",
      "penetration-testing"
    ],
    "category": "commands",
    "dateAdded": "2025-09-16",
    "source": "community"
  },
  {
    "slug": "skills-installer",
    "title": "Skills Installer",
    "seoTitle": "Agent Skills Installer for Claude Code",
    "description": "Install and manage Claude Code Agent Skills - specialized knowledge packages that extend Claude's capabilities with domain expertise and progressive disclosure",
    "author": "JSONbored",
    "tags": [
      "skills",
      "agent-skills",
      "capabilities",
      "domain-expertise",
      "plugins",
      "extensions"
    ],
    "category": "commands",
    "dateAdded": "2025-10-25",
    "source": "community"
  },
  {
    "slug": "slash-command-gen",
    "title": "Slash Command Gen",
    "seoTitle": "Slash Command Generator for Claude Code",
    "description": "Create custom slash commands for Claude Code with templates, arguments, frontmatter metadata, and team-shared workflows stored in .claude/commands directory",
    "author": "JSONbored",
    "tags": [
      "slash-commands",
      "custom-commands",
      "workflow-automation",
      "templates",
      "team-collaboration",
      "productivity"
    ],
    "category": "commands",
    "dateAdded": "2025-10-25",
    "source": "community"
  },
  {
    "slug": "subagent-create",
    "title": "Subagent Create",
    "seoTitle": "Subagent Creator for Claude Code",
    "description": "Create specialized Claude Code subagents with custom system prompts, scoped tool access, and independent context for parallel task execution and workflow orchestration",
    "author": "JSONbored",
    "tags": [
      "subagents",
      "orchestration",
      "parallel-execution",
      "specialization",
      "workflows",
      "automation"
    ],
    "category": "commands",
    "dateAdded": "2025-10-25",
    "source": "claudepro"
  },
  {
    "slug": "tdd-workflow",
    "title": "TDD Workflow",
    "seoTitle": "TDD Workflow for Claude Code",
    "description": "Implement test-driven development workflows with Claude Code using red-green-refactor cycles, automatic test generation, and AI-guided iteration until all tests pass",
    "author": "JSONbored",
    "tags": [
      "tdd",
      "testing",
      "red-green-refactor",
      "test-automation",
      "quality",
      "ai-testing"
    ],
    "category": "commands",
    "dateAdded": "2025-10-25",
    "source": "claudepro"
  },
  {
    "slug": "test-advanced",
    "title": "Test Advanced",
    "description": "Advanced test suite generator with property-based testing, mutation testing, and intelligent test case discovery",
    "author": "claudepro",
    "tags": [
      "testing",
      "unit-tests",
      "integration-tests",
      "property-based",
      "mutation-testing"
    ],
    "category": "commands",
    "dateAdded": "2025-09-16",
    "source": "community"
  },
  {
    "slug": "v0-generate",
    "title": "V0 Generate",
    "seoTitle": "V0 Component Generator for Claude",
    "description": "Generate production-ready React components from natural language using V0.dev patterns with shadcn/ui, TailwindCSS, and TypeScript",
    "author": "JSONbored",
    "tags": [
      "v0",
      "ui-generation",
      "shadcn",
      "react",
      "tailwind"
    ],
    "category": "commands",
    "dateAdded": "2025-10-16",
    "source": "community"
  },
  {
    "slug": "zod-audit",
    "title": "Zod Audit",
    "description": "Production codebase auditor specialized in Zod schema validation coverage, security vulnerability detection, and dead code elimination",
    "author": "JSONbored",
    "tags": [
      "zod",
      "validation",
      "security-audit",
      "typescript",
      "dead-code",
      "duplication",
      "schema-validation",
      "open-source",
      "production",
      "technical-debt"
    ],
    "category": "commands",
    "dateAdded": "2025-09-26",
    "source": "community"
  }
];

export const commandsMetadataBySlug = new Map(commandsMetadata.map(item => [item.slug, item]));

export function getCommandMetadataBySlug(slug: string): CommandMetadata | null {
  return commandsMetadataBySlug.get(slug) || null;
}
