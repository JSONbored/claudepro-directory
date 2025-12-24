---
name: Feature Request
about: Suggest a new feature or enhancement
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## Description

A clear and concise description of the feature you'd like to see.

## Motivation

Why is this feature needed? What problem does it solve?

## Proposed Solution

How should this feature work? Describe the API or behavior you'd like to see.

## Example Usage

```typescript
// How you would use this feature
import { createPrismocker } from 'prismocker';
import type { PrismaClient } from '@prisma/client';

const prisma = createPrismocker<PrismaClient>();

// New feature usage
prisma.newFeature(/* ... */);

const users = await prisma.users.findMany();
```

## Alternatives Considered

Have you considered any alternative solutions or workarounds?

## Additional Context

Add any other context, examples, or screenshots about the feature request here.

