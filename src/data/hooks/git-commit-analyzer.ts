import { Hook } from './index';

export const gitCommitAnalyzer: Hook = {
  id: 'git-commit-analyzer',
  title: 'Git Commit Analyzer',
  description: 'Analyzes git commits for patterns, quality, and team collaboration insights with automated reporting',
  author: '@JSONbored',
  category: 'development',
  tags: ['git', 'version-control', 'analytics', 'team-collaboration', 'code-quality'],
  content: `# Git Commit Analyzer Hook

Comprehensive analysis of git commit patterns, code quality trends, and team collaboration metrics with automated insights and reporting.

## Analysis Features:

### Commit Quality Assessment
- Commit message quality and conventions
- Code change complexity analysis
- File modification patterns
- Commit size and frequency analysis
- Breaking change detection

### Team Collaboration Insights
- Contributor activity patterns
- Code ownership and responsibility
- Collaboration frequency between team members
- Knowledge sharing indicators
- Onboarding progress tracking

### Code Health Metrics
- Technical debt accumulation
- Refactoring vs feature development ratio
- Bug fix frequency and patterns
- Code churn and stability metrics
- Test coverage impact analysis

### Trend Analysis
- Development velocity trends
- Sprint and milestone progress
- Seasonal development patterns
- Productivity benchmarks
- Quality improvement over time

## Automated Reports:

### Daily Summaries
- Recent commit activity
- Quality score updates
- Team contribution highlights
- Urgent issues requiring attention

### Weekly Analytics
- Sprint progress assessment
- Team performance metrics
- Code quality trends
- Collaboration insights

### Monthly Reviews
- Long-term trend analysis
- Team growth and development
- Technical debt assessment
- Process improvement recommendations

## Integration Capabilities:
- GitHub, GitLab, Bitbucket support
- Slack/Teams notifications
- JIRA ticket correlation
- CI/CD pipeline integration
- Custom webhook support

Perfect for engineering managers, tech leads, and development teams focused on continuous improvement and data-driven development processes.`,
  slug: 'git-commit-analyzer',
  popularity: 88,
  createdAt: '2025-08-14',
  updatedAt: '2024-01-15',
  featured: true,
  triggerEvents: ['git-push', 'commit-created', 'branch-merged', 'pull-request-closed'],
  actions: [
    {
      name: 'analyze-commits',
      type: 'data-transform',
      description: 'Analyze recent commits for quality and patterns',
      parameters: ['repository', 'timeframe', 'branch']
    },
    {
      name: 'generate-report',
      type: 'file-operation',
      description: 'Generate team collaboration and quality reports',
      parameters: ['report-type', 'recipients', 'format']
    },
    {
      name: 'send-alerts',
      type: 'notification',
      description: 'Send alerts for quality issues or anomalies',
      parameters: ['threshold', 'channels', 'severity']
    }
  ],
  configuration: [
    {
      key: 'repository_url',
      type: 'string',
      required: true,
      description: 'Git repository URL to monitor'
    },
    {
      key: 'analysis_frequency',
      type: 'string',
      required: true,
      description: 'How often to run analysis',
      default: 'daily'
    },
    {
      key: 'quality_threshold',
      type: 'number',
      required: false,
      description: 'Minimum quality score threshold (0-100)',
      default: '70'
    }
  ],
  platforms: ['GitHub', 'GitLab', 'Bitbucket'],
  requirements: ['Git access', 'Repository webhooks', 'Analysis storage'],
  repository: 'https://github.com/JSONbored/claudepro-directory/blob/main/src/data/hooks/git-commit-analyzer.ts'
};