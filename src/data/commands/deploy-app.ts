import { Command } from './index';

export const deployAppCommand: Command = {
  id: 'deploy-app',
  title: '/deploy-app',
  description: 'Streamlined application deployment with multi-platform support and automated CI/CD pipeline setup',
  author: 'Claude Pro Community',
  category: 'development',
  tags: ['deployment', 'devops', 'ci-cd', 'automation', 'infrastructure'],
  content: `# /deploy-app Command

Automated deployment solution that handles application deployment across multiple platforms with intelligent configuration and CI/CD pipeline setup.

## Supported Platforms:

### Cloud Platforms
- Vercel, Netlify, GitHub Pages
- AWS (S3, CloudFront, EC2, Lambda)
- Google Cloud Platform (App Engine, Cloud Run, GKE)
- Microsoft Azure (App Service, Static Web Apps)
- Digital Ocean App Platform
- Heroku and Railway

### Container Platforms
- Docker containerization
- Kubernetes deployment
- Docker Compose orchestration
- Container registry management
- Microservices architecture

### Traditional Hosting
- VPS and dedicated server deployment
- FTP/SFTP deployment
- SSH-based deployment
- Self-hosted solutions

## Deployment Features:

### Automated Setup
- Environment detection and configuration
- Build optimization and bundling
- Dependency management
- Security configuration
- SSL certificate setup

### CI/CD Pipeline
- GitHub Actions integration
- GitLab CI/CD setup
- Jenkins pipeline configuration
- Automated testing integration
- Rollback mechanisms

### Monitoring & Analytics
- Health check configuration
- Performance monitoring setup
- Error tracking integration
- Usage analytics configuration
- Alerting and notifications

### Security & Compliance
- Environment variable management
- Secret management integration
- Security header configuration
- GDPR compliance setup
- Backup and disaster recovery

## Application Types:
- Static sites (React, Vue, Angular)
- Server-side applications (Node.js, Python, PHP)
- Full-stack applications
- JAMstack architectures
- Progressive Web Apps (PWAs)
- API services and microservices

Perfect for developers and teams looking to streamline their deployment process with best practices and automation.`,
  slug: 'deploy-app',
  popularity: 91,
  createdAt: '2024-01-15',
  updatedAt: '2024-01-15',
  featured: false,
  syntax: '/deploy-app [platform] [--env=production|staging|development] [--auto-ci] [--monitoring]',
  parameters: [
    {
      name: 'platform',
      type: 'string',
      required: true,
      description: 'Deployment platform (vercel, netlify, aws, docker, etc.)'
    },
    {
      name: 'env',
      type: 'string',
      required: false,
      description: 'Environment type: production, staging, or development',
      default: 'production'
    },
    {
      name: 'auto-ci',
      type: 'boolean',
      required: false,
      description: 'Setup automated CI/CD pipeline',
      default: 'true'
    },
    {
      name: 'monitoring',
      type: 'boolean',
      required: false,
      description: 'Enable monitoring and analytics',
      default: 'false'
    }
  ],
  examples: [
    {
      title: 'Deploy to Vercel',
      command: '/deploy-app vercel --env=production --auto-ci --monitoring',
      description: 'Deploy React app to Vercel with CI/CD and monitoring'
    },
    {
      title: 'Docker deployment',
      command: '/deploy-app docker --env=staging',
      description: 'Containerize and deploy to staging environment'
    },
    {
      title: 'AWS deployment',
      command: '/deploy-app aws --env=production --monitoring',
      description: 'Deploy to AWS with production configuration and monitoring'
    }
  ],
  platforms: ['CLI', 'CI/CD', 'IDE'],
  repository: 'https://github.com/JSONbored/claudepro-directory/blob/main/src/data/commands/deploy-app.ts'
};