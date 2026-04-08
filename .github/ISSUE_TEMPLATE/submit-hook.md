---
name: Submit hook
about: Submit a Claude hook entry for the directory.
title: "Submit Hook: "
labels: ["submission", "hooks"]
assignees: []
---

## Hook Submission

- Name: <!-- required -->
- Slug: <!-- required; kebab-case -->
- Category: hooks
- GitHub URL: <!-- optional -->
- Docs URL: <!-- optional -->
- Author: <!-- optional -->
- Contact email: <!-- required -->
- Tags (comma-separated): <!-- optional -->

## Required Fields

- Description (1-3 sentences): <!-- required -->
- Card description (short preview): <!-- required -->
- Trigger (e.g. PreToolUse, PostToolUse, Stop): <!-- required -->
- Usage snippet: <!-- required -->
- Full copyable hook script/config: <!-- required -->

## Strongly Recommended Fields

- Config snippet:
- Script language:
- Testing flow:

## Validation Notes

- Include trigger + config + script so the hook can be tested immediately.
- Keep examples runnable in Claude Code context.
