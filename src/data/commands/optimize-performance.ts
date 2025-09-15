import { Command } from './index';

export const optimizePerformanceCommand: Command = {
  id: 'optimize-performance',
  title: '/optimize-performance',
  description: 'Analyze and optimize application performance with automated bottleneck detection and improvement suggestions',
  author: 'Claude Pro Community',
  category: 'development',
  tags: ['performance', 'optimization', 'profiling', 'efficiency', 'speed'],
  content: `# /optimize-performance Command

Comprehensive performance analysis and optimization tool that identifies bottlenecks and provides actionable improvement recommendations.

## Analysis Areas:

### Code Performance
- Algorithm efficiency analysis
- Big O complexity evaluation
- Memory usage optimization
- CPU intensive operation identification
- Garbage collection impact assessment

### Frontend Optimization
- Bundle size analysis and reduction
- Lazy loading implementation
- Image and asset optimization
- Critical rendering path optimization
- JavaScript execution profiling

### Backend Performance
- Database query optimization
- API response time analysis
- Caching strategy implementation
- Connection pooling optimization
- Resource utilization analysis

### Infrastructure Analysis
- Load balancing configuration
- CDN optimization recommendations
- Server resource utilization
- Network latency analysis
- Scalability bottlenecks

## Optimization Strategies:

### Code Level
- Function memoization
- Loop optimization
- Data structure improvements
- Async/await optimization
- Dead code elimination

### Database
- Index optimization
- Query plan analysis
- Connection pooling
- Caching layers
- Denormalization strategies

### Frontend
- Code splitting
- Tree shaking
- Asset compression
- Service worker implementation
- Progressive web app features

### System Level
- Horizontal and vertical scaling
- Load balancing strategies
- Caching implementations
- CDN configurations
- Monitoring and alerting

## Metrics Tracked:
- Response times and latency
- Memory usage and leaks
- CPU utilization patterns
- Database performance metrics
- User experience indicators (Core Web Vitals)

Perfect for optimizing application performance, reducing costs, and improving user experience.`,
  slug: 'optimize-performance',
  popularity: 87,
  createdAt: '2024-01-15',
  updatedAt: '2024-01-15',
  featured: false,
  syntax: '/optimize-performance [target] [--area=code|frontend|backend|database|all] [--depth=quick|thorough] [--output=report|fixes]',
  parameters: [
    {
      name: 'target',
      type: 'string',
      required: true,
      description: 'File, directory, or application to optimize'
    },
    {
      name: 'area',
      type: 'string',
      required: false,
      description: 'Optimization focus: code, frontend, backend, database, or all',
      default: 'all'
    },
    {
      name: 'depth',
      type: 'string',
      required: false,
      description: 'Analysis depth: quick or thorough',
      default: 'quick'
    },
    {
      name: 'output',
      type: 'string',
      required: false,
      description: 'Output type: report (analysis only) or fixes (with code changes)',
      default: 'report'
    }
  ],
  examples: [
    {
      title: 'Frontend optimization',
      command: '/optimize-performance src/components/ --area=frontend --depth=thorough',
      description: 'Thorough frontend performance analysis and optimization'
    },
    {
      title: 'Database query optimization',
      command: '/optimize-performance queries/ --area=database --output=fixes',
      description: 'Analyze and fix database query performance issues'
    },
    {
      title: 'Full application analysis',
      command: '/optimize-performance . --area=all --depth=thorough --output=report',
      description: 'Comprehensive performance analysis report'
    }
  ],
  platforms: ['CLI', 'Web', 'IDE'],
  repository: 'https://github.com/JSONbored/claudepro-directory/blob/main/src/data/commands/optimize-performance.ts'
};