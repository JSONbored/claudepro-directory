export const generateTests = {
  tags: ["testing", "automation", "quality-assurance", "development", "tdd"],
  content: `# /generate-tests Command

Automatically generate comprehensive test suites for your codebase with intelligent test case creation and best practice implementation.

## Test Generation Capabilities:

### Unit Tests
- Function and method testing with edge cases
- Class and module testing with proper mocking
- Input validation and error handling tests
- Boundary condition and edge case coverage
- Property-based testing for complex logic

### Integration Tests
- API endpoint testing with various scenarios
- Database integration and transaction testing
- External service integration with proper mocking
- Component interaction and data flow testing
- End-to-end workflow validation

### Test Types by Framework
- Jest/Vitest for JavaScript/TypeScript applications
- PyTest for Python projects with fixtures
- JUnit for Java applications
- NUnit for .NET applications
- Go testing package for Go projects

## Features:
- Intelligent test case identification based on code analysis
- Automatic mock generation for external dependencies
- Test data factory creation for complex objects
- Coverage analysis and gap identification
- Performance and load testing scenario generation

## Best Practices:
- AAA (Arrange, Act, Assert) pattern implementation
- Descriptive test naming conventions
- Proper setup and teardown procedures
- Test isolation and independence
- Maintainable and readable test code

## Configuration Options:
- Test coverage targets and thresholds
- Framework-specific configurations
- Custom assertion libraries and matchers
- CI/CD integration and reporting
- Parallel test execution optimization

Perfect for development teams adopting TDD/BDD practices and maintaining high code quality through comprehensive testing.`,
  author: {
    name: "Claude Pro Community",
    url: "https://github.com/JSONbored/claude-pro-directory"
  }
}

export const optimizePerformance = {
  tags: ["performance", "optimization", "profiling", "efficiency", "speed"],
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
  author: {
    name: "Claude Pro Community",
    url: "https://github.com/JSONbored/claude-pro-directory"
  }
}

export const deployApp = {
  tags: ["deployment", "devops", "automation", "ci-cd", "infrastructure"],
  content: `# /deploy-app Command

Automated deployment solution that handles the entire application deployment lifecycle with best practices and security considerations.

## Deployment Platforms:

### Cloud Providers
- AWS (EC2, ECS, Lambda, Elastic Beanstalk)
- Google Cloud Platform (App Engine, Cloud Run, GKE)
- Microsoft Azure (App Service, Container Instances, AKS)
- DigitalOcean (Droplets, App Platform, Kubernetes)
- Vercel, Netlify for static and serverless deployments

### Container Orchestration
- Docker container deployment and management
- Kubernetes cluster deployment and scaling
- Docker Compose for multi-service applications
- Container registry management and security
- Service mesh configuration and monitoring

### CI/CD Integration
- GitHub Actions workflow automation
- GitLab CI/CD pipeline configuration
- Jenkins pipeline setup and management
- Azure DevOps and AWS CodePipeline integration
- Automated testing and quality gates

## Deployment Features:

### Infrastructure as Code
- Terraform configuration generation
- CloudFormation template creation
- Ansible playbook automation
- Kubernetes manifest generation
- Environment-specific configurations

### Security & Compliance
- SSL certificate management
- Environment variable and secrets handling
- Network security and firewall configuration
- Compliance scanning and reporting
- Backup and disaster recovery planning

### Monitoring & Observability
- Application performance monitoring setup
- Log aggregation and analysis configuration
- Health check and alerting implementation
- Metrics collection and dashboard creation
- Error tracking and notification systems

## Deployment Strategies:
- Blue-green deployments for zero-downtime
- Rolling updates with automatic rollback
- Canary deployments for risk mitigation
- Feature flag integration
- A/B testing infrastructure

Perfect for teams needing reliable, scalable, and secure deployment automation.`,
  author: {
    name: "Claude Pro Community", 
    url: "https://github.com/JSONbored/claude-pro-directory"
  }
}