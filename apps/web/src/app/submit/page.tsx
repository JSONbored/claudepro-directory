import Link from "next/link";

import { siteConfig } from "@/lib/site";

export default function SubmitPage() {
  return (
    <div className="container space-y-10 py-12">
      <div className="space-y-4">
        <span className="eyebrow">Submit</span>
        <h1 className="section-title">Submit something the community will use.</h1>
        <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
          The directory is maintained in GitHub, so new entries and updates can
          be reviewed in public and improved over time.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="panel rounded-[1.75rem] p-6">
          <p className="text-2xl font-semibold tracking-[-0.04em]">
            Submit a new entry
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Open an issue or pull request with the MDX file, category, summary,
            and any relevant links.
          </p>
          <div className="mt-6">
            <a
              href={`${siteConfig.githubUrl}/issues/new/choose`}
              target="_blank"
              rel="noreferrer"
              className="link-button link-button-primary"
            >
              Open GitHub issue
            </a>
          </div>
        </div>
        <div className="panel rounded-[1.75rem] p-6">
          <p className="text-2xl font-semibold tracking-[-0.04em]">
            Improve existing content
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Fix metadata, improve copy, add missing links, or expand the guide
            so the directory stays accurate.
          </p>
          <div className="mt-6">
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="link-button link-button-secondary"
            >
              Browse repository
            </a>
          </div>
        </div>
      </div>

      <div className="panel rounded-[1.75rem] p-6">
        <p className="text-sm uppercase tracking-[0.15em] text-[var(--muted)]">
          Editorial policy
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
          Quality matters more than volume. Clear descriptions, solid metadata,
          working links, and genuinely useful content matter most.
        </p>
        <div className="mt-6">
          <Link href="/browse" className="link-button link-button-primary">
            Review current content
          </Link>
        </div>
      </div>
    </div>
  );
}
