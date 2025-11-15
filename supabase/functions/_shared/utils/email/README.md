## Email Utilities Overview

This folder contains **all shared primitives** used by our edge-function email templates. Each template should only import from here (plus React Email’s components) to keep behavior consistent and make global improvements straightforward.

```
utils/email/
├── base-template.tsx        # BaseLayout + renderEmailTemplate helper
├── cta.ts                   # buildEmailCtaUrl (UTM-aware CTA URLs)
├── components/
│   ├── job.tsx              # JobDetailsSection helper
│   └── sections.tsx         # HeroBlock, BulletListSection, StepCardList, CardListSection
├── common-styles.ts         # Shared inline styles (moved here during D2)
├── email-utm.ts             # addUTMToURL + helpers (used by CTA builder)
├── formatters.ts            # formatEmailDate/formatCurrency/formatNumber/pluralize
├── theme.ts                 # Email-safe brand tokens
└── utm-templates.ts         # EMAIL_UTM_TEMPLATES constants
```

### Base Template & Rendering

- `BaseLayout` wraps every template with the header, card background, and footer.
- `renderEmailTemplate(ComponentOrElement, props?)` wraps `renderAsync`, so handlers never import React or call `React.createElement`.
- Every template should export `render<TemplateName>Email` that simply calls `renderEmailTemplate`. Handlers import that helper instead of `renderAsync`.

### CTA Builder (`cta.ts`)

- `buildEmailCtaUrl(href, utmTemplate, overrides?)` combines a base URL with our standard UTM template.
- Use overrides (e.g., `{ content: 'step_1_agents' }`) instead of spreading custom objects into every CTA.
- If you need query parameters on the base URL, add them before passing to the builder.

### Shared Sections (`components/sections.tsx`)

- `HeroBlock` – standard hero header + subtitle (optionally emoji).
- `BulletListSection` – renders a list of `{ title, description?, emoji? }` items with consistent spacing.
- `CardListSection` – generic card renderer that supports `meta` text and per-card CTA buttons.
- `StepCardList` – numbered workflow cards with optional CTA per step.
- `JobDetailsSection` (in `components/job.tsx`) – standard “Position/Company/Plan/…” layout for job lifecycle mails.

### Formatters (`formatters.ts`)

- `formatEmailDate`, `formatCurrency`, `formatNumber`, and `pluralize` replace the scattered `new Date(...).toLocaleDateString` and string concatenation logic.
- Always use these helpers for human-readable values; this keeps locale formatting consistent across templates.

### Templates: Required Pattern

Each template should follow the pattern already used in the refactored files:

```ts
import { BaseLayout, renderEmailTemplate } from '../utils/email/base-template.tsx';
import { buildEmailCtaUrl } from '../utils/email/cta.ts';
import { HeroBlock, BulletListSection } from '../utils/email/components/sections.tsx';
import { EMAIL_UTM_TEMPLATES } from '../utils/email/utm-templates.ts';

export interface FooEmailProps { /* ... */ }

export function FooEmail(props: FooEmailProps) {
  const baseUrl = 'https://claudepro.directory';
  const utm = EMAIL_UTM_TEMPLATES.SOME_TEMPLATE;

  return (
    <BaseLayout preview="..." utm={utm}>
      <HeroBlock title="..." subtitle="..." />
      {/* body content */}
      <Button href={buildEmailCtaUrl(`${baseUrl}/something`, utm, { content: 'cta_slug' })} />
    </BaseLayout>
  );
}

export function renderFooEmail(props: FooEmailProps) {
  return renderEmailTemplate(FooEmail, props);
}
```

### Handler Expectations

- All send paths should call `render<Template>Email` helpers.
- CTAs are now centrally built, so handlers never manipulate UTM strings directly.
- When adding a new template, ensure you export a render helper and update the handler to use it.

### Testing & Docs

- After editing templates, run `pnpm biome format --stdin-file-path <file>`.
- Snapshots/live previews: use `renderEmailTemplate` in a script to render sample props (or the Resend dashboard preview for production data).
- Documentation of each template’s props lives in `.cursor/scratchpad-edgefunctions.md` (Phase D1 table). Update that table plus this README if you add new shared primitives.

#### Manual QA Checklist

Render sample payloads for each category before shipping:

1. **Job lifecycle** – Render every status (`submitted`, `approved`, `posted`, `payment-confirmed`, `expiring`, `expired`, `rejected`) and verify job metadata, CTA URLs (`buildEmailCtaUrl`), and copy.
2. **Collection share** – Confirm collection/join CTAs include the correct sender slug.
3. **Newsletter + onboarding steps 2–5** – Ensure hero copy, bullet sections, and per-step CTAs link to the intended paths with distinct `utm_content`.
4. **Weekly digest** – Provide `personalized/new/trending` datasets, confirm each card button points to the right URL and includes its slug in `utm_content`.
5. **Email handler smoke test** – Use the local script (`scripts/email-preview.ts`) to render each template via `renderEmailTemplate` so the handler path stays in sync.

Record findings in the release checklist (or `supabase/functions/_shared/templates/README.md` if we add one later).
