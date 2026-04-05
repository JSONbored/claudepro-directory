export default function AboutPage() {
  return (
    <div className="container-shell space-y-8 py-12">
      <div className="space-y-4 border-b border-border/80 pb-8">
        <span className="eyebrow">About</span>
        <h1 className="section-title">Why HeyClaude exists.</h1>
        <p className="max-w-3xl text-sm leading-8 text-muted-foreground">
          HeyClaude is a GitHub-native directory for Claude assets. The goal is to
          make the ecosystem easier to discover, compare, and actually use.
        </p>
      </div>
    </div>
  );
}
