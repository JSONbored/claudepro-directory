---
name: Bug Report
about: Report a bug or issue with prismocker
title: '[BUG] '
labels: bug
assignees: ''
---

## Description

A clear and concise description of what the bug is.

## Reproduction Steps

1. Set up Prismocker with...
2. Create Prisma client mock with...
3. Execute operation (findMany, create, etc.) with...
4. Expected result: ...
5. Actual result: ...

## Code Example

```typescript
// Minimal reproduction code
import { createPrismocker } from 'prismocker';
import type { PrismaClient } from '@prisma/client';

const prisma = createPrismocker<PrismaClient>();

// Seed data
prisma.setData('users', [
  { id: 'user-1', name: 'Test User' },
]);

// Issue occurs here...
const users = await prisma.users.findMany();
// Error or unexpected behavior...
```

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened.

## Environment

- **prismocker version:** 
- **@prisma/client version:** 
- **Jest/Vitest version:** 
- **Node.js version:** 
- **OS:** 

## Additional Context

Add any other context, screenshots, or error messages about the problem here.

