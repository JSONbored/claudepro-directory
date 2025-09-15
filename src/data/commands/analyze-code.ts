import { Command } from './index';

export const analyzeCodeCommand: Command = {
  id: 'analyze-code',
  title: '/analyze-code',
  description: 'Comprehensive code analysis for quality, security, performance, and best practices',
  author: 'Claude Pro Community',
  category: 'development',
  tags: ['analysis', 'code-quality', 'security', 'performance', 'best-practices'],
  content: `# /analyze-code Command

Perform comprehensive analysis of code files or repositories to identify issues, suggest improvements, and ensure adherence to best practices.

## What it analyzes:

### Code Quality
- Syntax errors and potential bugs
- Code complexity and maintainability
- Adherence to coding standards
- Design patterns and architecture
- Code duplication and redundancy

### Security Assessment
- Common vulnerabilities (OWASP Top 10)
- Input validation and sanitization
- Authentication and authorization flaws
- Data exposure risks
- Dependency vulnerabilities

### Performance Analysis
- Algorithmic efficiency
- Memory usage patterns
- Database query optimization
- Resource utilization
- Bottleneck identification

### Best Practices
- Language-specific conventions
- Framework best practices
- Testing coverage and quality
- Documentation completeness
- Error handling patterns

## Supported Languages
JavaScript, TypeScript, Python, Java, C#, Go, Rust, PHP, Ruby, and more.

Perfect for code reviews, security audits, and continuous improvement processes.`,
  slug: 'analyze-code',
  popularity: 95,
  createdAt: '2024-01-15',
  updatedAt: '2024-01-15',
  featured: true,
  syntax: '/analyze-code [file_path|directory] [--scope=full|security|performance|quality] [--format=detailed|summary|json]',
  parameters: [
    {
      name: 'target',
      type: 'string',
      required: true,
      description: 'File path or directory to analyze'
    },
    {
      name: 'scope',
      type: 'string',
      required: false,
      description: 'Analysis scope: full, security, performance, or quality',
      default: 'full'
    },
    {
      name: 'format',
      type: 'string',
      required: false,
      description: 'Output format: detailed, summary, or json',
      default: 'detailed'
    }
  ],
  examples: [
    {
      title: 'Analyze entire project',
      command: '/analyze-code . --scope=full --format=detailed',
      description: 'Comprehensive analysis of all files in current directory'
    },
    {
      title: 'Security-focused analysis',
      command: '/analyze-code src/auth.js --scope=security',
      description: 'Security vulnerability scan of authentication module'
    },
    {
      title: 'Performance analysis',
      command: '/analyze-code api/ --scope=performance --format=summary',
      description: 'Performance bottleneck analysis with summary output'
    }
  ],
  platforms: ['CLI', 'IDE', 'CI/CD'],
  repository: 'https://github.com/JSONbored/claudepro-directory/blob/main/src/data/commands/analyze-code.ts'
};