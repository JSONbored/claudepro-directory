# /optimize-performance

Analyzes and optimizes application performance with detailed recommendations and automated fixes.

## Performance Analysis

- Memory usage patterns and leaks
- CPU utilization and bottlenecks
- Database query optimization
- Network request optimization
- Bundle size analysis

## Optimization Strategies

### 1. Code Optimization
Algorithmic improvements and refactoring

### 2. Asset Optimization
Image compression, lazy loading, caching

### 3. Database Optimization
Query optimization, indexing strategies

### 4. Network Optimization
Request batching, CDN configuration

## Syntax

```
/optimize-performance [target] [--options]
```

## Parameters

- `target` (required): Application or component to optimize
- `--type` (optional): Optimization type (frontend, backend, database, full-stack), default: full-stack
- `--budget` (optional): Performance budget in milliseconds, default: 3000

## Examples

### Frontend Optimization
```
/optimize-performance ./src --type=frontend --budget=2000
```
Optimize frontend performance with 2s budget

### Database Optimization
```
/optimize-performance db/queries --type=database
```
Optimize database queries and schemas

## Automated Fixes

- Remove unused dependencies
- Optimize images automatically
- Generate performance budgets
- Configure caching strategies

## Monitoring Setup

- Set up performance monitoring
- Configure alerts and thresholds
- Track Core Web Vitals
- Generate performance reports

Perfect for maintaining fast, responsive applications at scale.