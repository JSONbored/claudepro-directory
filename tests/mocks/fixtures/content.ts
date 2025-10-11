/**
 * Mock Content Fixtures
 *
 * Realistic test data for agents, MCP servers, commands, hooks, rules, and statuslines.
 * Provides consistent, type-safe fixtures for unit and integration tests.
 *
 * **Design Principles:**
 * - Type-safe (matches actual content schemas)
 * - Realistic data (based on production content)
 * - Minimal but comprehensive (covers edge cases)
 * - Easily extensible for new test scenarios
 *
 * **Usage:**
 * ```ts
 * import { mockAgents, mockMcp } from '@/tests/mocks/fixtures/content';
 *
 * test('should display agents', () => {
 *   render(<AgentList agents={mockAgents} />);
 *   expect(screen.getByText(mockAgents[0].name)).toBeInTheDocument();
 * });
 * ```
 */

/**
 * Mock Agents
 */
export const mockAgents = [
  {
    slug: 'code-review-agent',
    name: 'Code Review Agent',
    description: 'Performs comprehensive code reviews with best practices',
    author: 'test-user',
    githubUrl: 'https://github.com/test/code-review-agent',
    tags: ['code-review', 'quality', 'best-practices'],
    featured: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-02-20T15:30:00Z',
  },
  {
    slug: 'documentation-generator',
    name: 'Documentation Generator',
    description: 'Automatically generates comprehensive documentation from code',
    author: 'doc-team',
    githubUrl: 'https://github.com/test/doc-generator',
    tags: ['documentation', 'automation', 'markdown'],
    featured: false,
    createdAt: '2024-01-20T12:00:00Z',
    updatedAt: '2024-02-15T09:00:00Z',
  },
  {
    slug: 'test-generator-agent',
    name: 'Test Generator Agent',
    description: 'Generates unit tests and integration tests automatically',
    author: 'testing-tools',
    githubUrl: 'https://github.com/test/test-generator',
    tags: ['testing', 'automation', 'tdd'],
    featured: false,
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-02-25T14:00:00Z',
  },
];

/**
 * Mock MCP Servers
 */
export const mockMcp = [
  {
    slug: 'filesystem-mcp',
    name: 'Filesystem MCP',
    description: 'Access and manipulate files and directories',
    author: 'mcp-core',
    githubUrl: 'https://github.com/test/filesystem-mcp',
    tags: ['filesystem', 'file-operations', 'core'],
    featured: true,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-02-18T11:00:00Z',
  },
  {
    slug: 'database-mcp',
    name: 'Database MCP',
    description: 'Query and manage SQL databases',
    author: 'db-tools',
    githubUrl: 'https://github.com/test/database-mcp',
    tags: ['database', 'sql', 'postgres'],
    featured: true,
    createdAt: '2024-01-12T10:30:00Z',
    updatedAt: '2024-02-22T13:45:00Z',
  },
  {
    slug: 'web-scraper-mcp',
    name: 'Web Scraper MCP',
    description: 'Scrape and extract data from websites',
    author: 'scraping-team',
    githubUrl: 'https://github.com/test/web-scraper',
    tags: ['web-scraping', 'data-extraction', 'automation'],
    featured: false,
    createdAt: '2024-01-25T14:00:00Z',
    updatedAt: '2024-02-20T16:00:00Z',
  },
];

/**
 * Mock Commands
 */
export const mockCommands = [
  {
    slug: 'refactor-code',
    name: '/refactor',
    description: 'Refactor selected code for better readability and maintainability',
    author: 'refactor-tools',
    content: '# Refactor Code\n\nRefactor the selected code following best practices.',
    tags: ['refactoring', 'code-quality'],
    featured: false,
    createdAt: '2024-01-18T11:00:00Z',
    updatedAt: '2024-02-10T10:00:00Z',
  },
  {
    slug: 'explain-code',
    name: '/explain',
    description: 'Explain selected code in plain English',
    author: 'education-team',
    content: '# Explain Code\n\nExplain what this code does in simple terms.',
    tags: ['education', 'documentation'],
    featured: true,
    createdAt: '2024-01-22T09:30:00Z',
    updatedAt: '2024-02-14T12:00:00Z',
  },
];

/**
 * Mock Hooks
 */
export const mockHooks = [
  {
    slug: 'pre-commit-linter',
    name: 'Pre-commit Linter',
    description: 'Run linter before each commit',
    author: 'lint-team',
    content: 'npm run lint && npm run type-check',
    tags: ['git', 'pre-commit', 'linting'],
    featured: false,
    createdAt: '2024-01-14T13:00:00Z',
    updatedAt: '2024-02-08T15:00:00Z',
  },
  {
    slug: 'post-merge-install',
    name: 'Post-merge Install',
    description: 'Install dependencies after merging',
    author: 'automation-team',
    content: 'npm install',
    tags: ['git', 'post-merge', 'dependencies'],
    featured: false,
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-02-12T14:30:00Z',
  },
];

/**
 * Mock Rules
 */
export const mockRules = [
  {
    slug: 'typescript-best-practices',
    name: 'TypeScript Best Practices',
    description: 'Enforce TypeScript best practices and conventions',
    author: 'ts-team',
    content: '# TypeScript Best Practices\n\n- Use strict mode\n- Avoid `any` type',
    tags: ['typescript', 'best-practices'],
    featured: true,
    createdAt: '2024-01-11T08:00:00Z',
    updatedAt: '2024-02-19T10:00:00Z',
  },
  {
    slug: 'react-patterns',
    name: 'React Patterns',
    description: 'Follow modern React patterns and hooks',
    author: 'react-team',
    content: '# React Patterns\n\n- Use functional components\n- Prefer hooks over classes',
    tags: ['react', 'patterns', 'hooks'],
    featured: true,
    createdAt: '2024-01-13T12:00:00Z',
    updatedAt: '2024-02-21T16:00:00Z',
  },
];

/**
 * Mock Statuslines
 */
export const mockStatuslines = [
  {
    slug: 'git-branch-statusline',
    name: 'Git Branch Statusline',
    description: 'Display current git branch in status line',
    author: 'statusline-team',
    content: 'git rev-parse --abbrev-ref HEAD',
    tags: ['git', 'branch', 'statusline'],
    featured: false,
    createdAt: '2024-01-17T09:00:00Z',
    updatedAt: '2024-02-11T11:00:00Z',
  },
  {
    slug: 'npm-scripts-statusline',
    name: 'NPM Scripts Statusline',
    description: 'Show available npm scripts in status line',
    author: 'npm-team',
    content: 'npm run',
    tags: ['npm', 'scripts', 'statusline'],
    featured: false,
    createdAt: '2024-01-19T14:00:00Z',
    updatedAt: '2024-02-13T13:00:00Z',
  },
];

/**
 * Helper: Create custom mock content
 * Useful for test-specific scenarios
 */
export function createMockAgent(overrides: Partial<(typeof mockAgents)[0]>) {
  return {
    slug: 'test-agent',
    name: 'Test Agent',
    description: 'A test agent for testing purposes',
    author: 'test-author',
    githubUrl: 'https://github.com/test/test-agent',
    tags: ['test'],
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockMcp(overrides: Partial<(typeof mockMcp)[0]>) {
  return {
    slug: 'test-mcp',
    name: 'Test MCP',
    description: 'A test MCP server for testing purposes',
    author: 'test-author',
    githubUrl: 'https://github.com/test/test-mcp',
    tags: ['test'],
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockCommand(overrides: Partial<(typeof mockCommands)[0]>) {
  return {
    slug: 'test-command',
    name: '/test',
    description: 'A test command for testing purposes',
    author: 'test-author',
    content: '# Test Command',
    tags: ['test'],
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
