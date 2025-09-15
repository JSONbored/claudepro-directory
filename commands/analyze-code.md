# /analyze-code

Performs comprehensive code analysis including complexity, security, and performance assessment.

## Features

- Cyclomatic complexity analysis
- Security vulnerability scanning
- Performance bottleneck identification
- Code smell detection
- Dependency analysis
- Test coverage assessment

## Analysis Types

### 1. Structural Analysis
Code organization and architecture review

### 2. Quality Metrics
Maintainability and readability scores

### 3. Security Scan
Common vulnerability patterns detection

### 4. Performance Review
Optimization opportunities identification

## Syntax

```
/analyze-code [file-path] [--options]
```

## Parameters

- `file-path` (required): Path to the code file or directory to analyze
- `--depth` (optional): Analysis depth level (1-5), default: 3
- `--format` (optional): Output format (json, markdown, html), default: markdown
- `--include-security` (optional): Include security vulnerability scan, default: true

## Examples

### Basic Analysis
```
/analyze-code src/main.py
```
Analyze a single Python file with default settings

### Deep Directory Analysis
```
/analyze-code src/ --depth=5 --format=json
```
Perform deep analysis on entire src directory with JSON output

### Security-Focused Scan
```
/analyze-code app/ --include-security=true --depth=4
```
Focus on security vulnerabilities with detailed scanning

## Output Format

- Detailed report with scores and recommendations
- Visual complexity graphs
- Prioritized action items
- Best practice suggestions

Perfect for code reviews, technical debt assessment, and continuous improvement.