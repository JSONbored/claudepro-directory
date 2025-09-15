# /deploy-app

Automated application deployment with best practices, monitoring, and rollback capabilities.

## Deployment Features

- Zero-downtime deployments
- Blue-green deployment strategies
- Canary releases with monitoring
- Automatic rollback on failures
- Health checks and validation

## Platform Support

- AWS, Google Cloud, Azure
- Kubernetes and Docker
- Vercel, Netlify, Heroku
- Traditional servers and VPS

## Syntax

```
/deploy-app [environment] [--options]
```

## Parameters

- `environment` (required): Target deployment environment (staging, production)
- `--strategy` (optional): Deployment strategy (blue-green, rolling, canary), default: rolling
- `--auto-rollback` (optional): Enable automatic rollback on failures, default: true

## Examples

### Production Deployment
```
/deploy-app production --strategy=blue-green
```
Deploy to production using blue-green strategy

### Canary Release
```
/deploy-app production --strategy=canary --auto-rollback=true
```
Deploy with canary release and auto-rollback

## Quality Gates

- Pre-deployment testing
- Security vulnerability scanning
- Performance regression testing
- Dependency audit checks

## Monitoring & Observability

- Real-time deployment tracking
- Error monitoring and alerting
- Performance metrics collection
- User experience monitoring

## Rollback Protection

- Automatic failure detection
- Instant rollback triggers
- Database migration handling
- Traffic switching mechanisms

Ensures reliable, safe deployments with minimal manual intervention.