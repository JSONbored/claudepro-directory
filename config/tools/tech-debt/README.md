# Technical Debt Tracking (Categorized & Scored)

This directory contains your personal technical debt baseline with categorization and severity scoring.

## Files (gitignored)

- `.baseline.json` - Current baseline snapshot with categorized debt scores
- `.history.json` - Historical trend data (future enhancement)

## How It Works

The lefthook pre-commit hook automatically:
1. Scans all staged files for linting/TypeScript issues
2. **Categorizes** issues by type (security, performance, style, etc.)
3. **Scores** issues based on severity weights
4. Compares against baseline
5. Blocks commits that add NEW debt or have src/ issues

## Severity Scoring System

Each issue is weighted based on its impact:

### 🔴 CRITICAL (15 points)
- **Security**: XSS vulnerabilities, dangerouslySetInnerHTML
- **Suspicious**: `any` types, debugger statements, async promise executor
- **TypeScript Errors**: Type safety violations

### 🟠 HIGH (8-12 points)
- **Correctness** (12pts): Unused variables, unreachable code, invalid declarations
- **Performance** (9pts): Barrel files, accumulating spreads, delete operator
- **Complexity** (8pts): Useless constructors, banned types, excessive complexity
- **Accessibility** (8pts): Missing ARIA labels, keyboard navigation issues

### 🟡 MEDIUM (4-5 points)
- **Style** (5pts): Missing const, template literals, inferrable types
- **Nursery** (4pts): Experimental rules (may have false positives)

### 🟢 LOW (1-2 points)
- **Formatting** (2pts): Formatting inconsistencies
- **Other** (1pt): Uncategorized minor issues

## Commands

```bash
# Create/update baseline (run this initially, or after cleaning up debt)
npm run tech-debt:baseline

# View detailed report with category breakdown
npm run tech-debt:report

# Manual check (auto-runs on commit)
npm run tech-debt:check
```

## Example Report Output

```
═══════════════════════════════════════════════════════════════════════
📊 TECHNICAL DEBT REPORT (Categorized & Scored)
═══════════════════════════════════════════════════════════════════════

Baseline Created: 2025-10-13T10:30:00Z

┌─────────────┬──────────┬──────────┬──────────┐
│ Directory   │ Baseline │ Current  │ Delta    │
├─────────────┼──────────┼──────────┼──────────┤
│ src/        │        0 │        0 │       +0 │
│ tests/      │     3720 │     3650 │      -70 │
├─────────────┼──────────┼──────────┼──────────┤
│ TOTAL SCORE │     3720 │     3650 │      -70 │
└─────────────┴──────────┴──────────┴──────────┘

📋 Debt Breakdown by Category (tests/):
┌────────────────────┬───────┬────────┬──────────────────────┐
│ Category           │ Count │ Weight │ Score                │
├────────────────────┼───────┼────────┼──────────────────────┤
│ correctness        │    45 │     12 │                  540 │
│ style              │   120 │      5 │                  600 │
│ complexity         │    12 │      8 │                   96 │
│ TypeScript Errors  │   165 │     15 │                 2475 │
└────────────────────┴───────┴────────┴──────────────────────┘

✅ STATUS: EXCELLENT - No debt in src/, overall debt decreasing
```

## Strategy

- **src/ directory**: Must have 0 issues (always enforced)
- **tests/ directory**: Tracks debt by category, blocks NEW debt only
- **Score-based tracking**: Prioritize fixing high-severity issues first
- **Baseline comparison**: Prevents regression, celebrates improvements

## Prioritization Guide

Focus cleanup efforts on high-impact categories:

1. **Start with CRITICAL** (15pts each): Security, suspicious code, type errors
2. **Then HIGH** (8-12pts each): Correctness, performance, complexity
3. **Then MEDIUM** (4-5pts each): Style consistency
4. **Finally LOW** (1-2pts each): Formatting, minor issues

This scoring helps you maximize impact - fixing 10 correctness issues (120pts) is more valuable than fixing 100 formatting issues (200pts).
