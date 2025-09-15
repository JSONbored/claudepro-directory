export interface Hook {
  id: string;
  title: string;
  description: string;
  author: string;
  category: 'automation' | 'integration' | 'workflow' | 'monitoring' | 'development' | 'productivity' | 'other';
  tags: string[];
  content: string;
  slug: string;
  popularity: number;
  createdAt: string;
  updatedAt: string;
  featured: boolean;
  triggerEvents: string[];
  actions: HookAction[];
  configuration: HookConfig[];
  platforms?: string[];
  requirements?: string[];
}

export interface HookAction {
  name: string;
  type: 'api-call' | 'notification' | 'data-transform' | 'file-operation' | 'custom';
  description: string;
  parameters?: any;
}

export interface HookConfig {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'secret';
  required: boolean;
  description: string;
  default?: any;
}

export const hooks: Hook[] = [
  {
    id: '1',
    title: 'Git Commit Analyzer',
    description: 'Automatically analyzes git commits for code quality, security issues, and adherence to conventional commit standards.',
    author: 'DevOps Pro',
    category: 'development',
    tags: ['git', 'code-quality', 'automation', 'security', 'pre-commit'],
    content: `The Git Commit Analyzer hook provides comprehensive analysis of code changes before they're committed:

**Analysis Features:**
- Code quality assessment using static analysis tools
- Security vulnerability scanning with SAST tools
- Conventional commit message validation
- Breaking change detection
- Dependency vulnerability checking

**Automated Actions:**
- Block commits that fail quality gates
- Generate detailed analysis reports
- Send notifications to relevant team members
- Update commit messages with analysis results
- Trigger additional CI/CD workflows

**Integration Capabilities:**
- Works with GitHub, GitLab, Bitbucket
- Supports multiple programming languages
- Integrates with Slack, Teams, Discord
- Compatible with existing CI/CD pipelines

**Quality Gates:**
- Configurable thresholds for code complexity
- Security vulnerability severity limits
- Test coverage requirements
- Code style compliance checks

Perfect for maintaining code quality and preventing issues before they reach the main branch.`,
    slug: 'git-commit-analyzer',
    popularity: 94,
    createdAt: '2024-01-14',
    updatedAt: '2024-01-18',
    featured: true,
    triggerEvents: [
      'pre-commit',
      'pre-push',
      'pull-request-opened',
      'pull-request-updated'
    ],
    actions: [
      {
        name: 'analyze-code-quality',
        type: 'api-call',
        description: 'Run static analysis on changed files',
        parameters: {
          tools: ['eslint', 'sonarqube', 'codeclimate'],
          severity: 'error'
        }
      },
      {
        name: 'security-scan',
        type: 'api-call',
        description: 'Scan for security vulnerabilities',
        parameters: {
          tools: ['snyk', 'semgrep', 'bandit'],
          failOnHigh: true
        }
      },
      {
        name: 'notify-team',
        type: 'notification',
        description: 'Send analysis results to team channels',
        parameters: {
          channels: ['#dev-team', '#security'],
          includeDetails: true
        }
      }
    ],
    configuration: [
      {
        key: 'quality-threshold',
        type: 'number',
        required: false,
        description: 'Minimum code quality score (0-100)',
        default: 80
      },
      {
        key: 'security-severity-limit',
        type: 'string',
        required: false,
        description: 'Maximum allowed security severity (low, medium, high, critical)',
        default: 'medium'
      },
      {
        key: 'notification-webhook',
        type: 'secret',
        required: false,
        description: 'Webhook URL for notifications'
      },
      {
        key: 'excluded-files',
        type: 'array',
        required: false,
        description: 'File patterns to exclude from analysis',
        default: ['*.test.js', '*.spec.ts', 'node_modules/**']
      }
    ],
    platforms: ['GitHub', 'GitLab', 'Bitbucket', 'Azure DevOps'],
    requirements: [
      'Git repository access',
      'CI/CD pipeline integration',
      'Static analysis tools'
    ]
  },
  {
    id: '2',
    title: 'Content Publishing Pipeline',
    description: 'Automates content publishing across multiple platforms with approval workflows and performance tracking.',
    author: 'Content Team',
    category: 'automation',
    tags: ['content', 'publishing', 'social-media', 'workflow', 'automation'],
    content: `The Content Publishing Pipeline hook streamlines content distribution across multiple channels:

**Publishing Capabilities:**
- Multi-platform publishing (social media, blogs, newsletters)
- Scheduled content release with optimal timing
- Content format adaptation per platform
- A/B testing for different content variations

**Workflow Features:**
- Multi-stage approval process
- Content review and editing workflows
- Brand guideline compliance checking
- SEO optimization suggestions

**Analytics Integration:**
- Performance tracking across platforms
- Engagement metrics collection
- ROI analysis and reporting
- Content performance optimization

**Automation Rules:**
- Trigger publishing based on events or schedules
- Auto-generate social media variants
- Cross-promote content across channels
- Archive and organize published content

Ideal for marketing teams, content creators, and agencies managing multiple brand accounts.`,
    slug: 'content-publishing-pipeline',
    popularity: 86,
    createdAt: '2024-01-12',
    updatedAt: '2024-01-16',
    featured: true,
    triggerEvents: [
      'content-approved',
      'scheduled-time',
      'campaign-trigger',
      'performance-threshold'
    ],
    actions: [
      {
        name: 'publish-to-platforms',
        type: 'api-call',
        description: 'Publish content to configured platforms',
        parameters: {
          platforms: ['twitter', 'linkedin', 'facebook', 'instagram'],
          adaptContent: true
        }
      },
      {
        name: 'track-performance',
        type: 'data-transform',
        description: 'Collect and analyze performance metrics',
        parameters: {
          metrics: ['engagement', 'reach', 'clicks', 'conversions'],
          interval: '1h'
        }
      },
      {
        name: 'send-report',
        type: 'notification',
        description: 'Send performance reports to stakeholders',
        parameters: {
          frequency: 'daily',
          format: 'dashboard'
        }
      }
    ],
    configuration: [
      {
        key: 'platforms',
        type: 'array',
        required: true,
        description: 'List of platforms to publish to'
      },
      {
        key: 'approval-required',
        type: 'boolean',
        required: false,
        description: 'Require manual approval before publishing',
        default: true
      },
      {
        key: 'optimal-timing',
        type: 'boolean',
        required: false,
        description: 'Use AI to determine optimal posting times',
        default: true
      },
      {
        key: 'brand-guidelines',
        type: 'object',
        required: false,
        description: 'Brand guidelines for content validation'
      }
    ],
    platforms: ['Hootsuite', 'Buffer', 'Sprout Social', 'Native APIs']
  },
  {
    id: '3',
    title: 'System Health Monitor',
    description: 'Continuously monitors system health, performance metrics, and automatically responds to issues with predefined actions.',
    author: 'SysOps Team',
    category: 'monitoring',
    tags: ['monitoring', 'devops', 'alerting', 'automation', 'performance'],
    content: `The System Health Monitor hook provides comprehensive system monitoring and automated incident response:

**Monitoring Capabilities:**
- Real-time performance metrics tracking
- Application health checks and uptime monitoring
- Resource utilization monitoring (CPU, memory, disk, network)
- Custom metric collection and analysis

**Alert Management:**
- Intelligent alerting with dynamic thresholds
- Alert escalation and routing
- Alert suppression and grouping
- On-call rotation management

**Automated Response:**
- Auto-scaling based on load patterns
- Service restart and recovery procedures
- Load balancing adjustments
- Failover to backup systems

**Reporting & Analytics:**
- Performance trend analysis
- Incident post-mortems
- SLA compliance reporting
- Capacity planning insights

Essential for maintaining high availability and performance in production environments.`,
    slug: 'system-health-monitor',
    popularity: 92,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-15',
    featured: false,
    triggerEvents: [
      'metric-threshold-exceeded',
      'service-down',
      'performance-degradation',
      'scheduled-check'
    ],
    actions: [
      {
        name: 'restart-service',
        type: 'api-call',
        description: 'Restart failed services automatically',
        parameters: {
          maxRetries: 3,
          gracefulShutdown: true
        }
      },
      {
        name: 'scale-resources',
        type: 'api-call',
        description: 'Scale resources based on load',
        parameters: {
          autoScaling: true,
          maxInstances: 10
        }
      },
      {
        name: 'alert-oncall',
        type: 'notification',
        description: 'Alert on-call engineers',
        parameters: {
          escalationDelay: '5m',
          channels: ['pagerduty', 'slack']
        }
      }
    ],
    configuration: [
      {
        key: 'check-interval',
        type: 'number',
        required: false,
        description: 'Health check interval in seconds',
        default: 60
      },
      {
        key: 'alert-thresholds',
        type: 'object',
        required: true,
        description: 'Threshold values for different metrics'
      },
      {
        key: 'auto-recovery',
        type: 'boolean',
        required: false,
        description: 'Enable automatic recovery actions',
        default: true
      }
    ],
    platforms: ['Kubernetes', 'Docker', 'AWS', 'Azure', 'GCP'],
    requirements: [
      'System access permissions',
      'Monitoring tools integration',
      'Alert routing configuration'
    ]
  }
];

export const getHookBySlug = (slug: string): Hook | undefined => {
  return hooks.find(hook => hook.slug === slug);
};

export const getHooksByCategory = (category: string): Hook[] => {
  return hooks.filter(hook => hook.category === category);
};

export const getFeaturedHooks = (): Hook[] => {
  return hooks.filter(hook => hook.featured);
};

export const getHooksByAuthor = (author: string): Hook[] => {
  return hooks.filter(hook => hook.author === author);
};