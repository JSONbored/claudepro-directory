# Security Policy

## 🔒 Reporting Security Vulnerabilities

The ClaudePro Directory team takes security seriously. We appreciate your efforts to responsibly disclose your findings and will make every effort to acknowledge your contributions.

## 📮 How to Report a Vulnerability

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

### Option 1: GitHub Security Advisories (Preferred)

1. Go to our [Security Advisories](https://github.com/JSONbored/claudepro-directory/security/advisories) page
2. Click "Report a vulnerability"
3. Fill out the form with details about the vulnerability

### Option 2: Email

Send an email to **security@claudepro.directory** with:

- Type of issue (XSS, CSRF, SQL Injection, etc.)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue and how an attacker might exploit it

## ⏱️ Response Timeline

- **Initial Response**: Within 48 hours
- **Assessment**: Within 7 days
- **Resolution Timeline**: Depends on severity (see below)

## 🎯 Severity Levels & Response Times

| Severity     | Description                                 | Resolution Target |
| ------------ | ------------------------------------------- | ----------------- |
| **Critical** | Data exposure, authentication bypass, RCE   | 24-48 hours       |
| **High**     | Privilege escalation, significant data leak | 3-5 days          |
| **Medium**   | Limited data exposure, XSS, CSRF            | 7-14 days         |
| **Low**      | Minor issues with minimal impact            | 30 days           |

## ✅ Supported Versions

We support security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| 0.x.x   | :x:                |

## 🛡️ Security Measures

### Automated Security

- **GitHub Code Scanning**: Automated vulnerability detection on every push to `main` and `dev`
- **CodeQL Analysis**: Deep semantic code analysis for security issues
- **Dependabot**: Automated dependency vulnerability alerts and updates
- **Secret Scanning**: Prevents accidental credential commits
- **npm audit**: Regular security audits of dependencies

### Security Practices

- Code review for all Pull Requests
- Input validation and sanitization
- Content Security Policy (CSP) headers
- Regular security updates
- TypeScript strict mode for type safety

### What We Don't Store

- User passwords (OAuth only when implemented)
- Payment information
- Personal identification information (PII)
- API keys or secrets in code
- Sensitive configuration data

## 📋 Disclosure Policy

When we receive a security report, we will:

1. Confirm the issue and determine affected versions
2. Audit code to find similar problems
3. Prepare fixes for all supported versions
4. Release patches as soon as possible
5. Credit the reporter (unless they prefer to remain anonymous)

## 🏆 Recognition

We maintain a [Hall of Fame](https://github.com/JSONbored/claudepro-directory/security/hall-of-fame) for security researchers who have responsibly disclosed vulnerabilities.

## 🚫 Out of Scope

The following are **not** considered security vulnerabilities:

- Denial of Service (DoS) attacks
- Social engineering
- Physical attacks
- Attacks requiring physical access to a user's device
- UI/UX issues that don't demonstrate a security impact
- Missing best practices without demonstrable security impact
- Issues in dependencies without a demonstrated exploit path

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

## 💬 Comments on This Policy

If you have suggestions on how this policy could be improved, please submit a Pull Request or open an issue.

---

**Last Updated**: September 2025  
**Contact**: security@claudepro.directory
