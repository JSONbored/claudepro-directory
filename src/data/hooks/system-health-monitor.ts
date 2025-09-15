import { Hook } from './index';

export const systemHealthMonitor: Hook = {
  id: 'system-health-monitor',
  title: 'System Health Monitor',
  description: 'Comprehensive system monitoring with predictive analytics, automated alerting, and intelligent issue resolution',
  author: 'Claude Pro Community',
  category: 'monitoring',
  tags: ['monitoring', 'health-check', 'alerting', 'analytics', 'automation'],
  content: `# System Health Monitor Hook

Advanced system monitoring solution that combines real-time health checks with predictive analytics and automated issue resolution capabilities.

## Monitoring Capabilities:

### Infrastructure Health
- Server resource utilization (CPU, memory, disk, network)
- Database performance and connection health
- Load balancer and proxy status
- CDN and static asset delivery monitoring
- SSL certificate expiration tracking

### Application Performance
- Response time and latency monitoring
- Error rate and exception tracking
- API endpoint health and availability
- User session and transaction monitoring
- Third-party service dependency tracking

### Security Monitoring
- Failed authentication attempts
- Suspicious traffic patterns
- DDoS attack detection
- Vulnerability scan results
- Compliance monitoring and reporting

### Business Metrics
- User engagement and activity levels
- Revenue and conversion tracking
- Feature usage analytics
- Customer satisfaction metrics
- SLA compliance monitoring

## Predictive Analytics:

### Trend Analysis
- Resource usage pattern recognition
- Capacity planning recommendations
- Performance degradation prediction
- Seasonal load forecasting
- Anomaly detection algorithms

### Intelligent Alerting
- Smart threshold adjustment based on patterns
- Context-aware alert prioritization
- Escalation path optimization
- Alert fatigue reduction
- Root cause analysis suggestions

### Automated Remediation
- Self-healing system capabilities
- Automated scaling triggers
- Recovery procedure execution
- Failover and backup activation
- Performance optimization adjustments

## Notification & Reporting:

### Multi-Channel Alerting
- Email, SMS, Slack, PagerDuty integration
- Severity-based routing
- On-call schedule integration
- Escalation matrix support
- Alert acknowledgment tracking

### Comprehensive Dashboards
- Real-time system status overview
- Historical trend visualization
- Custom metric displays
- Team-specific views
- Mobile-responsive interface

### Detailed Reports
- SLA compliance reports
- Incident post-mortem analysis
- Performance trend summaries
- Cost optimization recommendations
- Security audit reports

Perfect for DevOps teams, site reliability engineers, and organizations requiring comprehensive system visibility and proactive issue management.`,
  slug: 'system-health-monitor',
  popularity: 95,
  createdAt: '2024-01-15',
  updatedAt: '2024-01-15',
  featured: true,
  triggerEvents: ['metric-threshold-exceeded', 'health-check-failed', 'anomaly-detected', 'scheduled-check'],
  actions: [
    {
      name: 'collect-metrics',
      type: 'api-call',
      description: 'Collect and analyze system health metrics',
      parameters: ['metric-types', 'collection-interval', 'retention-period']
    },
    {
      name: 'send-alerts',
      type: 'notification',
      description: 'Send health status alerts and notifications',
      parameters: ['alert-channels', 'severity-level', 'escalation-rules']
    },
    {
      name: 'auto-remediate',
      type: 'custom',
      description: 'Execute automated remediation procedures',
      parameters: ['issue-type', 'remediation-scripts', 'approval-required']
    }
  ],
  configuration: [
    {
      key: 'monitoring_endpoints',
      type: 'array',
      required: true,
      description: 'List of endpoints and services to monitor'
    },
    {
      key: 'alert_thresholds',
      type: 'object',
      required: true,
      description: 'Alert threshold configuration for various metrics'
    },
    {
      key: 'notification_channels',
      type: 'array',
      required: true,
      description: 'Configured notification channels and recipients'
    },
    {
      key: 'remediation_enabled',
      type: 'boolean',
      required: false,
      description: 'Enable automated remediation actions',
      default: 'false'
    }
  ],
  platforms: ['AWS', 'Google Cloud', 'Azure', 'On-premise'],
  requirements: ['Monitoring agent installation', 'Network access', 'Storage for metrics'],
  repository: 'https://github.com/JSONbored/claudepro-directory/blob/main/src/data/hooks/system-health-monitor.ts'
};