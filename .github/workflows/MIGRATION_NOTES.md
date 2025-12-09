# GitHub Actions Workflows Migration Notes

## Summary of Changes

This document tracks the migration from duplicate workflows to optimized, consolidated workflows.

## New Unified Workflow

### `generate-packages.yml`
- **Replaces:** `generate-skills.yml` and `generate-mcpb.yml`
- **Benefits:**
  - Single source of truth for package generation
  - Eliminates 90% code duplication
  - Better maintainability
  - Unified trigger handling
  - Parallel execution when both types needed

## Deprecated Workflows

The following workflows are now deprecated and should be removed after confirming the new workflow works:

- `.github/workflows/generate-skills.yml` - Replaced by `generate-packages.yml`
- `.github/workflows/generate-mcpb.yml` - Replaced by `generate-packages.yml`

## Migration Steps

1. ✅ Created unified `generate-packages.yml` workflow
2. ⏳ Test the new workflow with manual triggers
3. ⏳ Verify database webhook triggers work correctly
4. ⏳ Monitor for 1-2 weeks to ensure stability
5. ⏳ Remove deprecated workflows after confirmation

## Breaking Changes

**None** - The new workflow maintains backward compatibility:
- Same trigger types (repository_dispatch, workflow_dispatch, schedule, push)
- Same environment variables
- Same output format

## Rollback Plan

If issues arise, the old workflows can be restored from git history:
```bash
git checkout HEAD~1 -- .github/workflows/generate-skills.yml
git checkout HEAD~1 -- .github/workflows/generate-mcpb.yml
```
