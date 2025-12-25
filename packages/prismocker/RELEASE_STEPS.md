# Release Steps for Prismocker v0.1.0

This document provides the steps needed to prepare and release Prismocker v0.1.0 to GitHub and npm.

## Prerequisites

* ✅ All files have been created/updated (GitHub Actions, templates, CHANGELOG, etc.)
* ✅ Package is built and tested locally
* ✅ All tests pass (`pnpm test`)
* ✅ Type checking passes (`pnpm type-check`)
* ✅ Build succeeds (`pnpm build`)

## Pre-Release Checklist

Before creating the release, verify:

* \[ ] `package.json` version is `0.1.0`
* \[ ] `CHANGELOG.md` has `[0.1.0]` entry with today's date
* \[ ] All files are committed to git
* \[ ] Repository is set up on GitHub (https://github.com/JSONbored/prismocker)
* \[ ] GitHub Actions secrets are configured:
  * `NPM_TOKEN` - npm authentication token for publishing

## Release Steps

### 1. Final Verification

```bash
cd packages/prismocker

# Verify version
node -p "require('./package.json').version"
# Should output: 0.1.0

# Run final checks
pnpm type-check
pnpm build
pnpm test

# Verify all files are present
ls -la .github/workflows/
ls -la .github/ISSUE_TEMPLATE/
ls -la CHANGELOG.md CONTRIBUTING.md renovate.json .npmrc
```

### 2. Update CHANGELOG Date (if needed)

If the date in `CHANGELOG.md` needs to be updated to today's date:

```bash
# Update the date in CHANGELOG.md
# Change: ## [0.1.0] - 2025-12-23
# To: ## [0.1.0] - YYYY-MM-DD (today's date)
```

### 3. Commit All Changes

```bash
cd packages/prismocker

# Stage all new files
git add .github/
git add CHANGELOG.md
git add CONTRIBUTING.md
git add renovate.json
git add .npmrc
git add .gitignore
git add .npmignore

# Commit
git commit -m "chore: add GitHub Actions, templates, and release infrastructure

- Add CI workflow for automated testing
- Add release workflow for npm publishing and GitHub releases
- Add issue and PR templates
- Add CHANGELOG.md following Keep a Changelog format
- Add CONTRIBUTING.md with development guidelines
- Add renovate.json for automated dependency updates
- Add .npmrc for build script configuration
- Update .gitignore and .npmignore for comprehensive coverage"
```

### 4. Push to GitHub

```bash
# Push to your branch (if not on main)
git push origin <your-branch>

# Or if on main:
git push origin main
```

### 5. Create GitHub Release Tag

```bash
# Create and push the version tag
git tag -a v0.1.0 -m "Release v0.1.0 - Initial release of Prismocker

- Type-safe, in-memory Prisma Client mock
- Full Prisma API support
- Complete relation support
- Transaction rollback
- Middleware and event listeners
- Performance optimizations
- Prisma ecosystem compatibility
- Comprehensive test suite (202 tests)
- Auto-setup CLI tools"

# Push the tag (this will trigger the release workflow)
git push origin v0.1.0
```

### 6. Verify Release Workflow

After pushing the tag:

1. Go to GitHub Actions: https://github.com/JSONbored/prismocker/actions
2. Verify the "Release" workflow is running
3. Wait for it to complete (should take ~5-10 minutes)
4. Verify:
   * ✅ Tests pass
   * ✅ Build succeeds
   * ✅ Package is published to npm
   * ✅ GitHub release is created with changelog

### 7. Verify npm Publication

```bash
# Check npm package
npm view prismocker

# Should show:
# - name: prismocker
# - version: 0.1.0
# - description: A type-safe, in-memory Prisma Client mock...
```

### 8. Verify GitHub Release

1. Go to: https://github.com/JSONbored/prismocker/releases
2. Verify v0.1.0 release exists
3. Verify release notes match CHANGELOG.md content

## Post-Release

After successful release:

* \[ ] Update README.md badges (if needed) with actual npm package name
* \[ ] Verify npm package is installable: `npm install prismocker --save-dev`
* \[ ] Test installation in a fresh project
* \[ ] Share release announcement (if desired)

## Troubleshooting

### Release Workflow Fails

If the release workflow fails:

1. Check GitHub Actions logs for errors
2. Common issues:
   * `NPM_TOKEN` secret not configured → Add it in GitHub repo settings
   * Version mismatch → Verify `package.json` version matches tag
   * Build failures → Check build logs
   * Test failures → Check test logs

### Version Mismatch

If you see "Version mismatch" error:

```bash
# Verify package.json version
node -p "require('./package.json').version"

# Verify tag version
git describe --tags

# They must match exactly (e.g., both 0.1.0)
```

### npm Publish Fails

If npm publish fails:

1. Check `NPM_TOKEN` secret is valid
2. Verify you're authenticated: `npm whoami`
3. Check package name is available: `npm view prismocker`
4. Verify `package.json` has correct `name` field

## Notes

* The release workflow automatically:
  * Extracts version from tag
  * Verifies package.json version matches
  * Builds and tests
  * Publishes to npm
  * Creates GitHub release with changelog

* The CI workflow runs on every PR and push to main

* Renovate will automatically create PRs for dependency updates

* All files are standalone - the package can be copied to a separate repo
