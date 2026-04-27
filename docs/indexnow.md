# IndexNow

HeyClaude serves the public IndexNow key file at:

```text
https://heyclau.de/48486ebc7ddc47af875118345161ae70.txt
```

The key is intentionally public. It proves site ownership for IndexNow
submissions and is not treated as a secret.

## Local Dry Run

```bash
pnpm indexnow:submit -- --dry-run --url https://heyclau.de/skills
```

Without explicit `--url` or `--urls-file`, the script reads
`https://heyclau.de/sitemap.xml`, filters to same-host HTTPS URLs, and submits
valid URLs in batches.

## Production Submission

Production submission is guarded by environment:

```bash
INDEXNOW_SUBMIT=1 pnpm indexnow:submit
```

Optional overrides:

- `INDEXNOW_BASE_URL`: defaults to `https://heyclau.de`
- `INDEXNOW_KEY`: defaults to the committed public key
- `INDEXNOW_KEY_LOCATION`: defaults to the root key file URL
- `INDEXNOW_ALLOW_NON_PRODUCTION=1`: only for deliberate non-production testing

CI should run this only after the production deployment is live. Preview and
development URLs should not be submitted.
