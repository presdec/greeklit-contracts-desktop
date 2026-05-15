# Security Policy

## Supported Versions

Security fixes are applied to the latest released version of Doc Gen Studio.

| Version | Supported |
| ------- | --------- |
| Latest release | ✅ |
| Older releases | ❌ |

Please update to the latest release before reporting an issue where possible.

## Reporting a Vulnerability

Please do **not** open a public GitHub issue for security vulnerabilities.

Report security issues by email:

**presdec+docgen@gmail.com**

Include as much detail as possible:

- A clear description of the issue
- Steps to reproduce
- Affected version or commit
- Operating system
- Any relevant sample files, if safe to share
- Expected impact

I will acknowledge valid reports on a best-effort basis, usually within a few days.

## Scope

Security reports are welcome for issues affecting Doc Gen Studio itself, including:

- Unsafe handling of local files
- Path traversal or unintended file overwrite/read behavior
- Unsafe document, template, workbook, email, PDF, or project-file processing
- Electron main/preload/renderer boundary issues
- Dependency vulnerabilities with a realistic impact on this app
- Packaging or installer security concerns

Doc Gen Studio is a local-first desktop app. Excel files, Word templates, generated documents, PDFs, and email drafts are intended to stay on the user's machine.

## Out of Scope

The following are generally out of scope:

- Vulnerabilities requiring full local machine compromise
- Issues only affecting old, unsupported releases
- Reports based only on automated scanner output without exploitability or impact
- Social engineering
- Denial-of-service issues with no security impact
- Vulnerabilities in third-party tools unless they directly affect Doc Gen Studio usage

## Security Automation

This repository uses GitHub security tooling including:

- Dependabot for dependency update pull requests
- CodeQL for static analysis / code scanning
- GitHub Actions checks for build and test workflows

These tools help catch common issues, but they do not replace manual review or responsible disclosure.

## Handling Sensitive Files

When reporting a bug, avoid sending real contracts, personal data, production spreadsheets, invoices, or confidential templates unless strictly necessary.

If sample files are needed, please prefer:

- Mock data
- Redacted documents
- Minimal reproduction files

## Disclosure

Please allow time for the issue to be investigated and fixed before public disclosure.

If a vulnerability is confirmed, the fix will normally be released through the standard GitHub release process.
