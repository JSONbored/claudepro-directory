# GitHub Actions Workflows

This directory contains all GitHub Actions workflows for the Claude Pro Directory project.

## 📋 Workflow Overview

### Active Workflows

1. **`ci.yml`** - Continuous Integration
   - Runs on PRs and pushes to main
   - Parallel execution: type-check, lint, build
   - Turbo remote cache support
   - Path-based filtering to skip unnecessary jobs

2. **`generate-packages.yml`** - Unified Package Generation ⭐ NEW
   - Generates Skills and MCPB packages
   - Supports multiple trigger types (webhook, manual, scheduled, push)
   - Intelligent routing based on trigger type
   - Replaces `generate-skills.yml` and `generate-mcpb.yml`

3. **`auto-release.yml`** - Automated Release Pipeline
   - Triggers on PR merge to main
   - Auto-bumps version, generates changelog, creates tag and release
   - Optimized git operations

4. **`release.yml`** - Manual Release Creation
   - Triggers on version tag push (v*.*.*)
   - Creates GitHub release with changelog

5. **`security.yml`** - Security Scanning
   - Secret scanning (TruffleHog) on PRs
   - CodeQL analysis (scheduled)
   - Dependency review on PRs

6. **`pr-content-extraction.yml`** - PR Content Processing
   - Extracts plaintext submissions from PR descriptions
   - Validates and inserts into Supabase database

7. **`cache-maintenance.yml`** - Cache Cleanup
   - Weekly scheduled cleanup of old caches
   - Manual trigger available

### Deprecated Workflows (To be removed after testing)

- `generate-skills.yml` - Replaced by `generate-packages.yml`
- `generate-mcpb.yml` - Replaced by `generate-packages.yml`

**Note:** These will be removed after confirming the new unified workflow works correctly (1-2 weeks monitoring period).

## 🔧 Reusable Workflows

### `.github/workflows/reusable/setup-node-pnpm.yml`
Reusable workflow for Node.js and pnpm setup with caching.

## 🎯 Composite Actions

### `.github/actions/setup/action.yml`
Composite action for repository setup (checkout, pnpm, node, install).

### `.github/actions/setup-node-deps/action.yml`
Composite action for Node.js setup with optimized dependency installation.

## 📊 Optimization Summary

All workflows have been optimized with:
- ✅ Latest action versions (checkout@v4, setup-node@v6, pnpm/action-setup@v4)
- ✅ Consistent pnpm version (10.24.0)
- ✅ Parallel job execution where possible
- ✅ Turbo remote cache support
- ✅ Optimized git operations
- ✅ Reduced code duplication (90% reduction)
- ✅ Better error handling and timeouts

See `.github/workflows/OPTIMIZATION_SUMMARY.md` for detailed improvements.

## 🔐 Required Secrets

### All Workflows
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL

### CI & Build Workflows
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `TURBO_TOKEN` - Turbo remote cache token (optional)
- `TURBO_TEAM` - Turbo team name (optional)

### Release Workflows
- `CHANGELOG_SYNC_TOKEN` - Token for changelog sync API
- `NEXT_PUBLIC_APP_URL` - Application URL

### Package Generation
- `GITHUB_TOKEN` - GitHub token for repository_dispatch (auto-provided)

## 🚀 Usage Examples

### Manual Package Generation
```bash
# Via GitHub UI: Actions → Generate Packages → Run workflow
# Or via GitHub CLI:
gh workflow run generate-packages.yml -f package-type=skills
gh workflow run generate-packages.yml -f package-type=mcpb
gh workflow run generate-packages.yml -f package-type=both
```

### Trigger via Repository Dispatch (from Inngest)
The workflow automatically handles `repository_dispatch` events:
- `skill-package-needed` - Triggers skills generation
- `mcpb-package-needed` - Triggers MCPB generation

## 📈 Performance Metrics

### Expected Improvements
- **30-40% reduction** in workflow execution time
- **30-40% reduction** in GitHub Actions minutes
- **90% reduction** in duplicate code
- Faster CI runs through parallelization
- Better cache hit rates with Turbo

## 🔍 Monitoring

Monitor workflow performance:
1. Check execution times in GitHub Actions tab
2. Review cache hit rates (Turbo dashboard)
3. Monitor error rates and retry counts
4. Track GitHub Actions minutes usage

## 📝 Maintenance

### Updating Versions
All versions are centralized:
- Action versions: Update in individual workflows
- pnpm version: Update `PNPM_VERSION` env var or action inputs
- Node version: Update `node-version` in setup-node actions

### Adding New Workflows
1. Use latest action versions (checkout@v4, setup-node@v6, pnpm/action-setup@v4, etc.)
2. Use pnpm 10.24.0
3. Add Turbo cache support if building/testing
4. Include appropriate timeouts
5. Add to this README

## 🐛 Troubleshooting

### Workflow Failures
1. Check workflow logs in GitHub Actions
2. Verify secrets are set correctly
3. Check Turbo cache connectivity (if using)
4. Review error messages in step summaries

### Cache Issues
- Clear caches via `cache-maintenance.yml` workflow
- Check Turbo token/team configuration
- Verify cache keys are correct

### Package Generation Issues
- Verify Supabase credentials
- Check database connectivity
- Review build script logs
- Ensure content exists in database

## 📚 Related Documentation

- `.github/workflows/OPTIMIZATION_SUMMARY.md` - Detailed optimization notes
- `.github/workflows/MIGRATION_NOTES.md` - Migration from old workflows
- `turbo.json` - Turbo configuration and cache settings
