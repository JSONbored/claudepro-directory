import { Hook } from './index';

export const apiRateLimitGuardian: Hook = {
  id: 'api-rate-limit-guardian',
  title: 'API Rate Limit Guardian',
  description: 'Intelligent API rate limiting and quota management with dynamic throttling and usage analytics',
  author: 'Claude Pro Community',
  category: 'automation',
  tags: ['rate-limiting', 'api-management', 'throttling', 'usage-analytics', 'protection'],
  content: `# API Rate Limit Guardian Hook

Advanced API rate limiting system that provides intelligent quota management, dynamic throttling, and comprehensive usage analytics to protect your APIs from abuse while ensuring optimal performance.

## Core Features:

### Intelligent Rate Limiting
- Dynamic rate limit adjustment based on usage patterns
- User-tier based quota management
- Geographic and IP-based limiting
- API endpoint specific rate controls
- Burst capacity handling with token bucket algorithm

### Advanced Throttling
- Adaptive throttling based on system load
- Priority-based request queuing
- Graceful degradation mechanisms
- Custom throttling rules per client
- Smart retry-after header management

### Usage Analytics & Monitoring
- Real-time usage tracking and visualization
- Historical consumption pattern analysis
- Quota utilization forecasting
- Abuse pattern detection
- Performance impact analysis

### Protection Mechanisms
- DDoS attack mitigation
- Bot and scraper detection
- Suspicious activity identification
- Automatic blacklist management
- Fair usage policy enforcement

## Rate Limiting Strategies:

### Fixed Window
- Simple time-based quotas
- Hourly, daily, monthly limits
- Predictable reset cycles
- Easy to understand and implement

### Sliding Window
- More accurate usage tracking
- Smoother request distribution
- Prevents burst at window boundaries
- Better user experience

### Token Bucket
- Burst capacity allowance
- Flexible rate control
- Handles irregular traffic patterns
- Optimal for API gateways

### Leaky Bucket
- Consistent output rate
- Traffic shaping capabilities
- Smooths out request spikes
- Ideal for downstream protection

## Advanced Capabilities:

### Machine Learning Integration
- Anomaly detection for unusual usage patterns
- Predictive scaling for rate limits
- Automated abuse pattern recognition
- Intelligent whitelist/blacklist management

### Custom Business Logic
- Multi-tenant rate limiting
- Feature-based quota management
- Usage-based billing integration
- SLA compliance monitoring

### Integration & APIs
- RESTful management API
- Webhook notifications for events
- Third-party service integration
- Custom analytics exports

Perfect for API providers, SaaS platforms, and any service requiring robust protection against abuse while maintaining excellent user experience.`,
  slug: 'api-rate-limit-guardian',
  popularity: 90,
  createdAt: '2024-01-15',
  updatedAt: '2024-01-15',
  featured: false,
  triggerEvents: ['api-request-received', 'rate-limit-exceeded', 'quota-warning', 'suspicious-activity'],
  actions: [
    {
      name: 'check-rate-limit',
      type: 'custom',
      description: 'Validate request against rate limit rules',
      parameters: ['client-id', 'endpoint', 'request-type']
    },
    {
      name: 'apply-throttling',
      type: 'custom',
      description: 'Apply throttling based on current system load',
      parameters: ['throttle-level', 'duration', 'retry-after']
    },
    {
      name: 'update-analytics',
      type: 'custom',
      description: 'Record usage data and update analytics',
      parameters: ['usage-data', 'client-metrics', 'performance-impact']
    }
  ],
  configuration: [
    {
      key: 'rate_limit_rules',
      type: 'array',
      required: true,
      description: 'Rate limiting rules configuration'
    },
    {
      key: 'throttling_strategy',
      type: 'string',
      required: true,
      description: 'Throttling strategy: fixed-window, sliding-window, token-bucket, leaky-bucket'
    },
    {
      key: 'analytics_retention',
      type: 'number',
      required: false,
      description: 'Analytics data retention period in days',
      default: '90'
    },
    {
      key: 'notification_webhooks',
      type: 'array',
      required: false,
      description: 'Webhook URLs for rate limit events'
    }
  ],
  platforms: ['API Gateway', 'Express.js', 'Nginx', 'CloudFlare'],
  requirements: ['Redis/Memory store', 'Request interception capability', 'Analytics storage'],
  repository: 'https://github.com/JSONbored/claudepro-directory/blob/main/src/data/hooks/api-rate-limit-guardian.ts'
};