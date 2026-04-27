# Deployment Artifact Validation

The new registry artifacts are branch release work. Missing production files are
not a production incident until the branch is deployed, but every preview or
release candidate must prove the artifact contract.

## Required Preview Check

```bash
pnpm validate:deployment-artifacts -- --base-url https://preview.example.com
```

The check verifies:

- `/data/directory-index.json`
- `/data/search-index.json`
- `/data/raycast-index.json`
- `/data/feeds/index.json`
- the `/data/feeds/categories/skills.json` and `/data/feeds/platforms/claude.json` shards referenced by the feed index
- `/48486ebc7ddc47af875118345161ae70.txt` for IndexNow verification
- the first `/data/raycast/...` detail payload referenced by the Raycast index

Pull request CI requires `DEPLOYMENT_ARTIFACT_BASE_URL` to be configured for a
preview environment and fails before merge when it is missing. Scheduled and
manual validation jobs still run local generated-file checks even when a preview
URL is not available. Local generated files remain covered by
`pnpm test:registry-artifacts` and `pnpm validate:raycast-feed`.
