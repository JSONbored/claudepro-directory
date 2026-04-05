import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container space-y-12 py-12">
      <div className="space-y-5 border-b border-[var(--line)] pb-8">
        <span className="eyebrow">About</span>
        <h1 className="section-title max-w-3xl">Why HeyClaude exists.</h1>
        <p className="max-w-3xl text-sm leading-8 text-[var(--muted)]">
          HeyClaude is a community directory for Claude-native assets: agents, MCP
          servers, skills, rules, commands, hooks, guides, collections, and jobs.
          The point is not to build a bloated platform. The point is to make the
          ecosystem easier to browse, compare, and actually use.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="panel rounded-[1.75rem] p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.04em]">
              What the site is trying to do
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-8 text-[var(--muted)]">
              <p>
                The Claude tooling ecosystem is fragmented across repos, docs,
                tweet threads, blog posts, and half-finished experiments. Useful
                things exist, but they are hard to discover and even harder to
                evaluate quickly.
              </p>
              <p>
                HeyClaude is being rebuilt as a lightweight directory with GitHub as
                the content layer, Cloudflare as the runtime, and structured content
                pages that make each asset easier to understand.
              </p>
            </div>
          </div>

          <div className="panel rounded-[1.75rem] p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.04em]">
              How contributions work
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-8 text-[var(--muted)]">
              <p>
                Content lives in the repository. That keeps the system cheap,
                portable, auditable, and easier to automate over time.
              </p>
              <p>
                Community submissions point back to GitHub so new entries, fixes, and
                content improvements can happen through pull requests instead of a
                heavy backend.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/submit" className="link-button link-button-primary">
                Submit something
              </Link>
              <a
                href="https://github.com/JSONbored/claudepro-directory"
                target="_blank"
                rel="noreferrer"
                className="link-button link-button-secondary"
              >
                View GitHub
              </a>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="panel rounded-[1.75rem] p-6">
            <p className="text-sm uppercase tracking-[0.15em] text-[var(--muted)]">
              Builder
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
              JSONBored
            </p>
            <p className="mt-3 text-sm leading-8 text-[var(--muted)]">
              The directory is being rebuilt as a sharper, lighter, more durable
              version of the original project.
            </p>
          </div>

          <div className="panel rounded-[1.75rem] p-6">
            <p className="text-sm uppercase tracking-[0.15em] text-[var(--muted)]">
              Links
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <a
                href="https://github.com/JSONbored/claudepro-directory"
                target="_blank"
                rel="noreferrer"
                className="block rounded-[1rem] border border-[var(--line)] px-4 py-3"
              >
                GitHub repository
              </a>
              <a
                href="https://claudepro.directory"
                target="_blank"
                rel="noreferrer"
                className="block rounded-[1rem] border border-[var(--line)] px-4 py-3"
              >
                Legacy domain
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
