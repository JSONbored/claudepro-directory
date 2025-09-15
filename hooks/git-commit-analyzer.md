# Git Commit Analyzer

Automatically analyzes git commits for code quality, security issues, and adherence to conventional commit standards.

## Analysis Features

- Code quality assessment using static analysis tools
- Security vulnerability scanning with SAST tools
- Conventional commit message validation
- Breaking change detection
- Dependency vulnerability checking

## Automated Actions

- Block commits that fail quality gates
- Generate detailed analysis reports
- Send notifications to relevant team members
- Update commit messages with analysis results
- Trigger additional CI/CD workflows

## Integration Capabilities

- Works with GitHub, GitLab, Bitbucket
- Supports multiple programming languages
- Integrates with Slack, Teams, Discord
- Compatible with existing CI/CD pipelines

## Quality Gates

- Configurable thresholds for code complexity
- Security vulnerability severity limits
- Test coverage requirements
- Code style compliance checks

## Trigger Events

- `pre-commit`: Before commit is created
- `pre-push`: Before push to remote repository
- `pull-request-opened`: When PR is created
- `pull-request-updated`: When PR is updated

## Configuration

```json
{
  "quality-threshold": 80,
  "security-severity-limit": "medium",
  "notification-webhook": "https://hooks.slack.com/...",
  "excluded-files": ["*.test.js", "*.spec.ts", "node_modules/**"]
}
```

## Actions

### analyze-code-quality
Run static analysis on changed files using tools like ESLint, SonarQube, and CodeClimate.

### security-scan
Scan for security vulnerabilities using Snyk, Semgrep, and Bandit.

### notify-team
Send analysis results to team channels with detailed reports.

Perfect for maintaining code quality and preventing issues before they reach the main branch.