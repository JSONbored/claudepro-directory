export default function AdvertisePage() {
  return (
    <div className="container space-y-10 py-12">
      <div className="space-y-4">
        <span className="eyebrow">Advertise</span>
        <h1 className="section-title">Reach people building with Claude.</h1>
        <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
          HeyClaude offers a small number of relevant placements for tools,
          launches, and products that fit the community.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {[
          "Homepage feature strip",
          "Category spotlight block",
          "Sponsored guide or launch post"
        ].map((item) => (
          <div key={item} className="panel rounded-[1.5rem] p-6">
            <p className="text-xl font-semibold tracking-[-0.03em]">{item}</p>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Limited inventory, reviewed manually, and kept relevant to the
              audience so the site stays useful.
            </p>
          </div>
        ))}
      </div>

      <div className="panel rounded-[1.75rem] p-6">
        <p className="text-sm uppercase tracking-[0.15em] text-[var(--muted)]">
          Next step
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
          To book a placement, get in touch with details about your launch,
          product, or company and the audience you want to reach.
        </p>
        <div className="mt-6">
          <a
            href={process.env.NEXT_PUBLIC_SPONSOR_FORM_URL ?? "mailto:hello@heyclau.de"}
            className="link-button link-button-primary"
          >
            Contact for sponsorship
          </a>
        </div>
      </div>
    </div>
  );
}
