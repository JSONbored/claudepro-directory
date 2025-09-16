# Changelog

All notable changes to the claudepro-directory project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-09-16

### Added
- Initial release of claudepro-directory
- Community-driven directory of Claude configurations
- Support for 5 content categories: Agents, MCP Servers, Rules, Commands, and Hooks
- Jobs board for AI-related positions
- Dark theme with glassmorphism design
- Search and filter functionality across all content
- Code syntax highlighting with Prism
- Responsive mobile-first design
- Vercel Analytics integration
- Optimized bundle size with code splitting
- SEO-friendly kebab-case URL structure
- JSON-based content generation system

### Changed
- Converted all file names from PascalCase to kebab-case for better SEO
- Optimized bundle size from 1.7MB to under 500KB
- Split content into metadata and full content for lazy loading
- Implemented React.lazy() for route-based code splitting

### Fixed
- Homepage search behavior now properly hides featured sections
- Jobs page now uses JobCard component consistently
- Removed unused shadcn/ui and Radix UI dependencies

### Security
- All environment variables managed at Vercel platform level
- No sensitive data in repository