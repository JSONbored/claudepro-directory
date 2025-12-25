# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## \[Unreleased]

### Added

* Roots support for file downloads (downloadSkillPackage, downloadMcpServerPackage, downloadStorageFile tools)
* Elicitations support for interactive user input (submitContent, downloadContentForPlatform, createAccount tools)
* Enhanced OpenAPI documentation with full Zod schema evaluation and examples
* KV-based resource caching for improved performance
* Performance metrics in tool responses

### Changed

* Enhanced all tool input/output schemas with `.meta()` for OpenAPI documentation
* Converted all prompt schemas from raw objects to proper Zod schemas
* Improved error messages and guidance in tools

## \[1.0.0-beta.1] - 2025-12-21

### Added

* Initial beta release
* 23 MCP tools for directory access (20 original + 3 new file download tools)
* 3 resource templates for content export
* 8 prompts for user guidance
* OAuth 2.1 authentication
* Rate limiting
* Request deduplication
* Enhanced metrics and observability
* Axiom OpenTelemetry integration
* Cloudflare Workers deployment support
* Self-hosted NPM package support

### Changed

* Migrated from Supabase Edge Functions to Cloudflare Workers
* Enhanced OpenAPI generator with runtime Zod schema evaluation
* Improved error handling and logging

## \[1.0.0] - TBD

### Added

* First stable release

### Changed

* \[Breaking changes if any]

### Fixed

* \[Bug fixes]
