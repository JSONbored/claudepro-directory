# Changelog

All notable changes to Claude Pro Directory will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
