/**
 * Auto-generated metadata file
 * Category: Hooks
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { HookContent } from '@/src/lib/schemas/content/hook.schema';

export type HookMetadata = Pick<HookContent, 'slug' | 'title' | 'seoTitle' | 'description' | 'author' | 'tags' | 'category' | 'dateAdded' | 'source'>;

export const hooksMetadata: HookMetadata[] = [
  {
    "slug": "accessibility-checker",
    "title": "Accessibility Checker",
    "description": "Automated accessibility testing and compliance checking for web applications following WCAG guidelines",
    "author": "JSONbored",
    "tags": [
      "accessibility",
      "a11y",
      "wcag",
      "testing",
      "compliance"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "api-endpoint-documentation-generator",
    "title": "API Endpoint Documentation Generator",
    "seoTitle": "API Doc Generator",
    "description": "Automatically generates or updates API documentation when endpoint files are modified",
    "author": "JSONbored",
    "tags": [
      "api",
      "documentation",
      "openapi",
      "swagger",
      "automation"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "auto-code-formatter-hook",
    "title": "Auto Code Formatter Hook",
    "description": "Automatically formats code files after Claude writes or edits them using Prettier, Black, or other formatters",
    "author": "JSONbored",
    "tags": [
      "formatting",
      "prettier",
      "black",
      "code-quality",
      "automation"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "auto-save-backup",
    "title": "Auto Save Backup",
    "description": "Automatically creates timestamped backups of files before modification to prevent data loss",
    "author": "JSONbored",
    "tags": [
      "backup",
      "safety",
      "file-management",
      "data-protection"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "aws-cloudformation-validator",
    "title": "AWS CloudFormation Validator",
    "description": "Validates AWS CloudFormation templates for syntax errors and best practices",
    "author": "JSONbored",
    "tags": [
      "aws",
      "cloudformation",
      "infrastructure",
      "validation",
      "cloud"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "cloud-backup-on-session-stop",
    "title": "Cloud Backup On Session Stop",
    "description": "Automatically backs up changed files to cloud storage when session ends",
    "author": "JSONbored",
    "tags": [
      "backup",
      "cloud",
      "stop-hook",
      "aws",
      "safety"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "code-complexity-alert-monitor",
    "title": "Code Complexity Alert Monitor",
    "description": "Alerts when code complexity exceeds thresholds in real-time",
    "author": "JSONbored",
    "tags": [
      "complexity",
      "code-quality",
      "notification",
      "monitoring",
      "maintainability"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "css-unused-selector-detector",
    "title": "CSS Unused Selector Detector",
    "description": "Detects unused CSS selectors when stylesheets are modified to keep CSS lean",
    "author": "JSONbored",
    "tags": [
      "css",
      "optimization",
      "cleanup",
      "performance",
      "purge"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "database-connection-cleanup",
    "title": "Database Connection Cleanup",
    "description": "Closes all database connections and cleans up resources when session ends",
    "author": "JSONbored",
    "tags": [
      "database",
      "cleanup",
      "stop-hook",
      "connections",
      "resources"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "database-migration-runner",
    "title": "Database Migration Runner",
    "description": "Automated database migration management with rollback capabilities, validation, and multi-environment support",
    "author": "JSONbored",
    "tags": [
      "database",
      "migration",
      "automation",
      "deployment",
      "sql"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-16",
    "source": "community"
  },
  {
    "slug": "database-query-performance-logger",
    "title": "Database Query Performance Logger",
    "description": "Monitors and logs database query performance metrics with slow query detection, N+1 analysis, and optimization suggestions",
    "author": "JSONbored",
    "tags": [
      "database",
      "performance",
      "monitoring",
      "optimization",
      "logging"
    ],
    "category": "hooks",
    "dateAdded": "2025-10-19",
    "source": "community"
  },
  {
    "slug": "dead-code-eliminator",
    "title": "Dead Code Eliminator",
    "description": "Automatically detects and removes unused code, imports, and dependencies with safe deletion verification and rollback support",
    "author": "JSONbored",
    "tags": [
      "code-quality",
      "cleanup",
      "optimization",
      "refactoring",
      "automation"
    ],
    "category": "hooks",
    "dateAdded": "2025-10-19",
    "source": "community"
  },
  {
    "slug": "dependency-security-audit-on-stop",
    "title": "Dependency Security Audit On Stop",
    "seoTitle": "Dependency Security Audit",
    "description": "Performs a comprehensive security audit of all dependencies when session ends",
    "author": "JSONbored",
    "tags": [
      "security",
      "dependencies",
      "audit",
      "stop-hook",
      "vulnerabilities"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "dependency-security-scanner",
    "title": "Dependency Security Scanner",
    "description": "Real-time vulnerability scanning for dependencies with automated CVE detection, severity assessment, and patch recommendations",
    "author": "JSONbored",
    "tags": [
      "security",
      "dependencies",
      "vulnerability",
      "cve",
      "automation"
    ],
    "category": "hooks",
    "dateAdded": "2025-10-19",
    "source": "community"
  },
  {
    "slug": "dependency-update-checker",
    "title": "Dependency Update Checker",
    "description": "Automatically checks for outdated dependencies and suggests updates with security analysis",
    "author": "JSONbored",
    "tags": [
      "dependencies",
      "security",
      "automation",
      "npm",
      "package-management"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-16",
    "source": "community"
  },
  {
    "slug": "discord-activity-notifier",
    "title": "Discord Activity Notifier",
    "description": "Sends development activity updates to Discord channel for team collaboration",
    "author": "JSONbored",
    "tags": [
      "discord",
      "notification",
      "collaboration",
      "webhooks",
      "team"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "docker-container-auto-rebuild",
    "title": "Docker Container Auto Rebuild",
    "description": "Automatically rebuilds Docker containers when Dockerfile or docker-compose.yml files are modified",
    "author": "JSONbored",
    "tags": [
      "docker",
      "containers",
      "devops",
      "automation"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "docker-image-security-scanner",
    "title": "Docker Image Security Scanner",
    "description": "Comprehensive Docker image vulnerability scanning with layer analysis, base image recommendations, and security best practices enforcement",
    "author": "JSONbored",
    "tags": [
      "docker",
      "security",
      "containers",
      "vulnerability",
      "devops"
    ],
    "category": "hooks",
    "dateAdded": "2025-10-19",
    "source": "community"
  },
  {
    "slug": "documentation-auto-generator-on-stop",
    "title": "Documentation Auto Generator On Stop",
    "seoTitle": "Doc Auto Generator",
    "description": "Automatically generates or updates project documentation when session ends",
    "author": "JSONbored",
    "tags": [
      "documentation",
      "stop-hook",
      "automation",
      "markdown",
      "jsdoc"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "documentation-coverage-checker",
    "title": "Documentation Coverage Checker",
    "description": "Automated documentation coverage analysis with missing docstring detection, API documentation validation, and completeness scoring",
    "author": "JSONbored",
    "tags": [
      "documentation",
      "code-quality",
      "analysis",
      "automation",
      "best-practices"
    ],
    "category": "hooks",
    "dateAdded": "2025-10-19",
    "source": "community"
  },
  {
    "slug": "documentation-generator",
    "title": "Documentation Generator",
    "description": "Automatically generates and updates project documentation from code comments, README files, and API definitions",
    "author": "JSONbored",
    "tags": [
      "documentation",
      "automation",
      "api",
      "markdown",
      "jsdoc"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-16",
    "source": "community"
  },
  {
    "slug": "environment-cleanup-handler",
    "title": "Environment Cleanup Handler",
    "description": "Cleans up temporary files, caches, and resources when Claude session ends",
    "author": "JSONbored",
    "tags": [
      "cleanup",
      "stop-hook",
      "maintenance",
      "resources",
      "optimization"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "environment-variable-validator",
    "title": "Environment Variable Validator",
    "seoTitle": "Environment Validator",
    "description": "Validates environment variables, checks for required vars, and ensures proper configuration across environments",
    "author": "JSONbored",
    "tags": [
      "environment",
      "configuration",
      "validation",
      "deployment",
      "security"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-16",
    "source": "community"
  },
  {
    "slug": "error-rate-monitor",
    "title": "Error Rate Monitor",
    "description": "Tracks error patterns and alerts when error rates spike",
    "author": "JSONbored",
    "tags": [
      "errors",
      "monitoring",
      "notification",
      "debugging",
      "alerts"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "file-size-warning-monitor",
    "title": "File Size Warning Monitor",
    "description": "Alerts when files exceed size thresholds that could impact performance",
    "author": "JSONbored",
    "tags": [
      "file-size",
      "performance",
      "notification",
      "monitoring",
      "optimization"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "final-bundle-size-reporter",
    "title": "Final Bundle Size Reporter",
    "description": "Analyzes and reports final bundle sizes when the development session ends",
    "author": "JSONbored",
    "tags": [
      "bundle-size",
      "performance",
      "stop-hook",
      "optimization",
      "reporting"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "git-auto-commit-on-stop",
    "title": "Git Auto Commit On Stop",
    "description": "Automatically commits all changes with a summary when Claude Code session ends",
    "author": "JSONbored",
    "tags": [
      "git",
      "version-control",
      "stop-hook",
      "automation",
      "commit"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "git-branch-protection",
    "title": "Git Branch Protection",
    "description": "Prevents direct edits to protected branches like main or master, enforcing PR-based workflows",
    "author": "JSONbored",
    "tags": [
      "git",
      "branch-protection",
      "workflow",
      "safety"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "git-pre-commit-validator",
    "title": "Git Pre Commit Validator",
    "description": "Comprehensive pre-commit hook that validates code quality, runs tests, and enforces standards",
    "author": "JSONbored",
    "tags": [
      "git",
      "validation",
      "code-quality",
      "testing",
      "automation"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-16",
    "source": "community"
  },
  {
    "slug": "github-actions-workflow-validator",
    "title": "Github Actions Workflow Validator",
    "seoTitle": "GitHub Actions Validator",
    "description": "Validates GitHub Actions workflow files for syntax errors and best practices",
    "author": "JSONbored",
    "tags": [
      "github-actions",
      "ci-cd",
      "workflows",
      "validation",
      "yaml"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "go-module-tidy",
    "title": "Go Module Tidy",
    "description": "Automatically runs go mod tidy when Go files or go.mod are modified to keep dependencies clean",
    "author": "JSONbored",
    "tags": [
      "go",
      "golang",
      "modules",
      "dependencies",
      "cleanup"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "graphql-schema-validator",
    "title": "GraphQL Schema Validator",
    "description": "Validates GraphQL schema files and checks for breaking changes when modified",
    "author": "JSONbored",
    "tags": [
      "graphql",
      "api",
      "schema",
      "validation",
      "breaking-changes"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "i18n-translation-validator",
    "title": "I18n Translation Validator",
    "description": "Validates translation files for missing keys and ensures consistency across different language files",
    "author": "JSONbored",
    "tags": [
      "i18n",
      "internationalization",
      "translation",
      "localization",
      "validation"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "jest-snapshot-auto-updater",
    "title": "Jest Snapshot Auto Updater",
    "description": "Automatically updates Jest snapshots when component files are modified significantly",
    "author": "JSONbored",
    "tags": [
      "jest",
      "testing",
      "snapshots",
      "react",
      "automation"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "json-schema-validator",
    "title": "JSON Schema Validator",
    "description": "Validates JSON files against their schemas when modified to ensure data integrity",
    "author": "JSONbored",
    "tags": [
      "json",
      "schema",
      "validation",
      "data-integrity",
      "api"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "kubernetes-manifest-validator",
    "title": "Kubernetes Manifest Validator",
    "description": "Validates Kubernetes YAML manifests for syntax and best practices when modified",
    "author": "JSONbored",
    "tags": [
      "kubernetes",
      "k8s",
      "yaml",
      "validation",
      "devops"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "markdown-link-checker",
    "title": "Markdown Link Checker",
    "description": "Validates all links in markdown files to detect broken links and references",
    "author": "JSONbored",
    "tags": [
      "markdown",
      "documentation",
      "links",
      "validation",
      "broken-links"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "memory-usage-monitor",
    "title": "Memory Usage Monitor",
    "description": "Monitors memory usage and alerts when thresholds are exceeded",
    "author": "JSONbored",
    "tags": [
      "memory",
      "performance",
      "monitoring",
      "notification",
      "resources"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "nextjs-route-analyzer",
    "title": "Nextjs Route Analyzer",
    "description": "Analyzes Next.js page routes and generates a route map when pages are added or modified",
    "author": "JSONbored",
    "tags": [
      "nextjs",
      "routing",
      "pages",
      "analysis",
      "documentation"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "package-vulnerability-scanner",
    "title": "Package Vulnerability Scanner",
    "description": "Scans for security vulnerabilities when package.json or requirements.txt files are modified",
    "author": "JSONbored",
    "tags": [
      "security",
      "vulnerabilities",
      "dependencies",
      "npm",
      "pip"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "performance-benchmark-report",
    "title": "Performance Benchmark Report",
    "description": "Runs performance benchmarks and generates comparison report when session ends",
    "author": "JSONbored",
    "tags": [
      "performance",
      "benchmarking",
      "stop-hook",
      "testing",
      "metrics"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "performance-impact-monitor",
    "title": "Performance Impact Monitor",
    "description": "Monitors and alerts on performance-impacting changes in real-time",
    "author": "JSONbored",
    "tags": [
      "performance",
      "monitoring",
      "notification",
      "profiling",
      "alerts"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "performance-monitor",
    "title": "Performance Monitor",
    "description": "Monitors application performance metrics, identifies bottlenecks, and provides optimization recommendations",
    "author": "JSONbored",
    "tags": [
      "performance",
      "monitoring",
      "optimization",
      "metrics",
      "automation"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-16",
    "source": "community"
  },
  {
    "slug": "playwright-test-runner",
    "title": "Playwright Test Runner",
    "description": "Automatically runs Playwright E2E tests when test files or page components are modified",
    "author": "JSONbored",
    "tags": [
      "playwright",
      "e2e",
      "testing",
      "automation",
      "browser-testing"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "prisma-schema-sync",
    "title": "Prisma Schema Sync",
    "description": "Automatically generates Prisma client and creates migrations when schema.prisma is modified",
    "author": "JSONbored",
    "tags": [
      "prisma",
      "database",
      "orm",
      "schema",
      "migrations"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "python-import-optimizer",
    "title": "Python Import Optimizer",
    "description": "Automatically sorts and optimizes Python imports using isort when Python files are modified",
    "author": "JSONbored",
    "tags": [
      "python",
      "imports",
      "formatting",
      "optimization",
      "isort"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "python-linter-integration",
    "title": "Python Linter Integration",
    "description": "Automatically runs pylint on Python files after editing to enforce code quality standards",
    "author": "JSONbored",
    "tags": [
      "python",
      "linting",
      "code-quality",
      "pylint"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "react-component-test-generator",
    "title": "React Component Test Generator",
    "seoTitle": "React Test Generator",
    "description": "Automatically creates or updates test files when React components are modified",
    "author": "JSONbored",
    "tags": [
      "react",
      "testing",
      "jest",
      "components",
      "automation"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "real-time-activity-tracker",
    "title": "Real Time Activity Tracker",
    "description": "Tracks all Claude Code activities in real-time and logs them for monitoring and debugging",
    "author": "JSONbored",
    "tags": [
      "monitoring",
      "logging",
      "notification",
      "real-time",
      "debugging"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "redis-cache-invalidator",
    "title": "Redis Cache Invalidator",
    "description": "Automatically clears relevant Redis cache keys when data model files are modified",
    "author": "JSONbored",
    "tags": [
      "redis",
      "cache",
      "performance",
      "data-models",
      "invalidation"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "rust-cargo-check",
    "title": "Rust Cargo Check",
    "description": "Automatically runs cargo check and clippy when Rust files are modified",
    "author": "JSONbored",
    "tags": [
      "rust",
      "cargo",
      "clippy",
      "linting",
      "compilation"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "scss-auto-compiler",
    "title": "SCSS Auto Compiler",
    "description": "Automatically compiles SCSS/Sass files to CSS when they are modified",
    "author": "JSONbored",
    "tags": [
      "scss",
      "sass",
      "css",
      "styling",
      "compilation"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "security-scanner-hook",
    "title": "Security Scanner Hook",
    "description": "Automated security vulnerability scanning that integrates with development workflow to detect and prevent security issues before deployment",
    "author": "JSONbored",
    "tags": [
      "security",
      "vulnerability",
      "scanning",
      "automation",
      "compliance"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-16",
    "source": "community"
  },
  {
    "slug": "sensitive-data-alert-scanner",
    "title": "Sensitive Data Alert Scanner",
    "description": "Scans for potential sensitive data exposure and alerts immediately",
    "author": "JSONbored",
    "tags": [
      "security",
      "sensitive-data",
      "notification",
      "scanning",
      "privacy"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "session-metrics-collector",
    "title": "Session Metrics Collector",
    "description": "Collects and reports detailed metrics about the coding session when Claude stops",
    "author": "JSONbored",
    "tags": [
      "metrics",
      "analytics",
      "stop-hook",
      "performance",
      "statistics"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "slack-progress-notifier",
    "title": "Slack Progress Notifier",
    "description": "Sends progress updates to Slack channel for team visibility on Claude's activities",
    "author": "JSONbored",
    "tags": [
      "slack",
      "notifications",
      "team",
      "collaboration",
      "monitoring"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "svelte-component-compiler",
    "title": "Svelte Component Compiler",
    "description": "Automatically compiles and validates Svelte components when they are modified",
    "author": "JSONbored",
    "tags": [
      "svelte",
      "components",
      "compilation",
      "validation",
      "frontend"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "team-summary-email-generator",
    "title": "Team Summary Email Generator",
    "description": "Generates and sends a comprehensive summary email to the team when session ends",
    "author": "JSONbored",
    "tags": [
      "email",
      "team",
      "stop-hook",
      "summary",
      "communication"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "terraform-plan-executor",
    "title": "Terraform Plan Executor",
    "description": "Automatically runs terraform plan when .tf files are modified to preview infrastructure changes",
    "author": "JSONbored",
    "tags": [
      "terraform",
      "infrastructure",
      "iac",
      "devops",
      "cloud"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "test-coverage-final-report",
    "title": "Test Coverage Final Report",
    "description": "Generates a comprehensive test coverage report when the coding session ends",
    "author": "JSONbored",
    "tags": [
      "testing",
      "coverage",
      "stop-hook",
      "reporting",
      "quality"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "code-test-runner-hook",
    "title": "Code Test Runner Hook",
    "description": "Automatically run relevant tests when code changes are detected, with intelligent test selection and parallel execution",
    "author": "JSONbored",
    "tags": [
      "testing",
      "automation",
      "ci-cd",
      "watch",
      "parallel"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-16",
    "source": "community"
  },
  {
    "slug": "typescript-compilation-checker",
    "title": "Typescript Compilation Checker",
    "seoTitle": "TypeScript Checker",
    "description": "Automatically runs TypeScript compiler checks after editing .ts or .tsx files to catch type errors early",
    "author": "JSONbored",
    "tags": [
      "typescript",
      "validation",
      "type-safety",
      "compilation"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "vue-composition-api-linter",
    "title": "Vue Composition API Linter",
    "description": "Lints Vue 3 components for Composition API best practices and common issues",
    "author": "JSONbored",
    "tags": [
      "vue",
      "vue3",
      "composition-api",
      "linting",
      "best-practices"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "webpack-bundle-analyzer",
    "title": "Webpack Bundle Analyzer",
    "description": "Analyzes webpack bundle size when webpack config or entry files are modified",
    "author": "JSONbored",
    "tags": [
      "webpack",
      "bundle",
      "performance",
      "optimization",
      "analysis"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  },
  {
    "slug": "workflow-completion-report",
    "title": "Workflow Completion Report",
    "description": "Generates a comprehensive report when Claude Code workflow stops, including files modified, tests run, and git status",
    "author": "JSONbored",
    "tags": [
      "reporting",
      "workflow",
      "analytics",
      "summary",
      "stop-hook"
    ],
    "category": "hooks",
    "dateAdded": "2025-09-19",
    "source": "community"
  }
];

export const hooksMetadataBySlug = new Map(hooksMetadata.map(item => [item.slug, item]));

export function getHookMetadataBySlug(slug: string): HookMetadata | null {
  return hooksMetadataBySlug.get(slug) || null;
}
