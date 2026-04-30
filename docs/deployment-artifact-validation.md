# Deployment Artifact Validation

The new registry artifacts are branch release work. Missing production files are
not a production incident until the branch is deployed, but every preview or
release candidate must prove the artifact contract.

## Required PR Preview Check

```bash
pnpm validate:deployment-artifacts -- --base-url https://preview.example.com
```

The check verifies:

- `/data/directory-index.json`
- `/data/search-index.json`
- `/data/raycast-index.json`
- `/data/feeds/index.json`
- the `/data/feeds/categories/skills.json` and `/data/feeds/platforms/claude.json` shards referenced by the feed index
- `/api/mcp` tools/list and `search_registry` over Streamable HTTP
- `/48486ebc7ddc47af875118345161ae70.txt` for IndexNow verification
- the first `/data/raycast/...` detail payload referenced by the Raycast index

Pull request CI no longer accepts a manual `DEPLOYMENT_ARTIFACT_BASE_URL` merge
gate. The `validate-pr-preview` job resolves the preview URL in this order:

1. the same-repo PR deploy step output, when GitHub has Cloudflare credentials
   and can deploy the PR SHA to the shared `heyclaude-dev` Worker
2. an explicit preview URL produced by the deployment platform
3. successful GitHub Deployment status `environment_url` values for the PR head
   SHA or branch

The current fallback deploy path is a shared dev Worker, not an isolated
per-PR Worker. The workflow serializes preview deployment artifact checks so two
PRs do not validate against a concurrently overwritten dev Worker. If the repo
later enables Cloudflare branch or PR preview deployments that publish GitHub
Deployment statuses, the resolver will validate that resolved preview URL
instead.

Scheduled and manual validation jobs still run local generated-file checks even
when a preview URL is not available. Local generated files remain covered by
`pnpm test:registry-artifacts` and `pnpm validate:raycast-feed`.
