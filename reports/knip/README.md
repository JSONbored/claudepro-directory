## Knip Unused Code Reports

This folder captures reproducible evidence for each Knip sweep so anyone can re-run the audit and compare results.

### How to Run

1. Ensure dependencies are installed (`pnpm install`) and you are on the correct git branch.
2. From the repo root, run the standard analysis to get the console summary:

   ```bash
   pnpm analyze:unused
   ```

3. Capture machine-readable output with environment metadata (run from repo root and keep `set -o pipefail` so failures stop the pipeline):

   ```bash
   set -o pipefail
   pnpm analyze:unused -- --reporter=json > reports/knip/<date>-raw.json
   ```

   Replace `<date>` with `YYYY-MM-DD` (e.g., `2025-11-24-raw.json`).

4. Record the following for every run (include it either in the summary or at the top of the raw JSON file):
   - Git SHA and branch
   - Timestamp + timezone
   - Node.js, pnpm, and Knip versions (`node -v`, `pnpm -v`, `pnpm knip --version`)
   - Host OS information (`uname -a`)

### Artifacts

Each run should emit two files in this directory:

| File | Purpose |
| --- | --- |
| `YYYY-MM-DD-raw.json` | Direct JSON output from `knip --reporter=json` for tooling or diffing. |
| `YYYY-MM-DD-summary.md` | Human-readable digest covering command/env metadata, key findings (unused files/exports/deps/etc.), recommended cleanup actions, and follow-up owners. |

Reference the `pnpm analyze:unused` script in `package.json` to ensure future runs stay aligned with the repo’s canonical configuration (`config/tools/knip.json`).

### Ignore Rationale

Documented below for quick reference when adjusting `config/tools/knip.json`:

- `content/skills/**/*.zip` – Binary skill archives checked into git but not executable code; Knip cannot analyze zip assets.
- `reports/knip/**/*.json` – Historical Knip outputs stored for auditing; scanning them would feed prior findings back into new runs.
- `**/.next/**`, `**/build/**`, `**/dist/**` – Framework/toolchain build artifacts that mirror compiled output and create duplicate false positives.
- `**/node_modules/**` – Some workspaces vendor dependencies locally; skipping ensures we only analyze first-party code.
- `**/*.generated.ts[x]` – Code-generated files (e.g., database types, service bindings) intentionally have no explicit importers but must remain in the repo.
