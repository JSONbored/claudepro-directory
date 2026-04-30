# Branch Protection

`main` is the production promotion branch. Production deploys should remain
gated by the Cloudflare Worker and GitHub integration attached to `main`.

Required checks before merging:

- `pnpm validate:clean`
- `pnpm validate:tasks`
- `pnpm validate:content:strict`
- `pnpm validate:category-spec`
- `pnpm validate:packages`
- `pnpm validate:raycast-feed`
- `pnpm validate:emails`
- `pnpm resend:sync-templates -- --dry-run`
- `pnpm test:mcp`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm type-check`
- `pnpm build`
- Raycast `npm ci && npm run lint && npm run build`
- `validate-pr-preview`, which deploys or resolves the PR preview URL and then
  runs `pnpm validate:deployment-artifacts -- --base-url <preview-url>`
- `trunk check --show-existing --all --no-progress`

Development deploys may target the OpenNext Cloudflare dev Worker only:

```bash
pnpm --filter web run deploy:dev
```

The current PR artifact check uses that shared `heyclaude-dev` Worker when the
workflow has Cloudflare credentials. This is branch validation, not a permanent
per-PR environment. If Cloudflare Git previews publish a GitHub Deployment
environment URL, CI resolves and validates that URL instead.

Do not run production deploy commands from feature branches. Production updates
must flow through the protected `main` branch.
