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
- the first `/data/raycast/...` detail payload referenced by the Raycast index

CI runs this check only when `DEPLOYMENT_ARTIFACT_BASE_URL` is configured for a
preview environment. Local generated files remain covered by
`pnpm test:registry-artifacts` and `pnpm validate:raycast-feed`.
