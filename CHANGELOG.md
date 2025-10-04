# Changelog

All notable changes to Claude Pro Directory will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## 2025-10-04 - Submit Form Refactor & Code Cleanup

### Changed
- **Submit Form:** Completely refactored submission flow to use GitHub URL pre-filling instead of GitHub API
- **Architecture:** Eliminated all GitHub API authentication requirements (zero secrets, zero env vars, zero rate limits)
- **UX:** Users now fill form → redirect to GitHub with pre-filled issue → review/edit → submit
- **Schema:** Updated form content types to exclude 'guides', now only accepts: agents, mcp, rules, commands, hooks, statuslines

### Added
- **Utility:** New `/src/lib/utils/github-issue-url.ts` - Production-grade URL generator for GitHub issue creation
- **Security:** Hardcoded repository configuration to prevent tampering
- **Validation:** Client-side form validation with Zod schemas
- **Fallback:** Popup blocker detection with manual fallback link

### Removed
- **Dead Code:** Removed 416 lines of unused GitHub API integration code:
  - Deleted `/src/lib/services/github.service.ts` (275 lines)
  - Deleted `/src/app/actions/submit-config.ts` (66 lines)
  - Removed 5 unused GitHub API schemas from `form.schema.ts` (~60 lines)
  - Removed GitHub environment variables from `env.schema.ts` (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)
  - Removed `githubConfig` export and `hasGitHubConfig()` function

### Fixed
- **TypeScript:** Fixed unused import errors after schema cleanup
- **Build:** Verified production build compiles successfully (200 static pages)

---

## 2025-10-04 - GitHub Actions Automation & Optimization

### Added
- **Automation:** Bundle Analysis workflow with HashiCorp's nextjs-bundle-analysis for tracking bundle size regressions
- **Automation:** Lighthouse CI workflow for automated Core Web Vitals monitoring (homepage, /agents, /mcp routes)
- **Automation:** PR Labeler workflow with 19 intelligent labels including 7 community contribution types
- **Community:** Auto-labeling for community contributions (`community-mcp`, `community-hooks`, `community-agents`, `community-commands`, `community-rules`, `community-statuslines`, `community-collections`)
- **Config:** Lighthouse performance thresholds (90+ performance, 95+ accessibility/SEO)

### Changed
- **Optimization:** CI, Security, Lighthouse, and Bundle Analysis workflows now skip on community content PRs (`content/**/*.json`)
- **Performance:** Community contributors trigger only 2 workflows (labeler + validation) instead of 10 jobs, saving ~10-15 minutes per PR
- **Organization:** Moved `.lighthouserc.json` to `config/tools/lighthouserc.json` for cleaner root directory

### Fixed
- **CI:** Fixed "Can't find action.yml" errors by adding explicit `actions/checkout@v5` before composite action usage in 4 workflow jobs
- **Workflows:** CI and Security workflows now properly check out repository before using local composite actions

---

## 2025-10-04 - Umami Analytics Fix

### Fixed
- **Analytics:** Fixed Umami analytics script not loading due to missing CSP nonce with `strict-dynamic`
- UmamiScript component now extracts nonce from CSP header and applies it to the external script tag
- Changed script loading strategy from `lazyOnload` to `afterInteractive` for better nonce compatibility

---

## 2025-10-03 - Security & Performance Improvements

### Added
- Enhanced error boundary logging with error digest tracking for better production debugging
- Comprehensive error context in Vercel logs (user agent, URL, timestamp)

### Changed
- **Security:** Implemented Nosecone nonce-based CSP with `strict-dynamic` for improved security
- **Performance:** Migrated from manual CSP configuration to Nosecone defaults extension
- **UI:** Improved navigation menu centering on large screens (reduced excessive gap spacing)

### Fixed
- CSP violations blocking Next.js chunk loading (`unsafe-eval` errors)
- Font loading errors caused by CSP restrictions
- Navigation menu appearing off-center on xl/2xl screens

### Removed
- Dead code: Removed inactive ISR `revalidate` exports from 16 files (superseded by dynamic rendering)

---

## Earlier Updates

Previous changes were tracked in git commit history. This changelog starts from October 2025.
