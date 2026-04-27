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
- `pnpm test:mcp`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm type-check`
- `pnpm build`
- Raycast `npm ci && npm run lint && npm run build`
- Preview artifact validation with `pnpm validate:deployment-artifacts -- --base-url <preview-url>`
- `trunk check --show-existing --all --no-progress`

Development deploys may target the OpenNext Cloudflare dev Worker only:

```bash
pnpm --filter web run deploy:dev
```

Do not run production deploy commands from feature branches. Production updates
must flow through the protected `main` branch.
