import { SnippetCard } from "@/components/snippet-card";

type ContentSection = {
  title: string;
  id: string;
  html: string;
  proseHtml: string;
  codeBlocks: Array<{
    language: string;
    code: string;
  }>;
};

type ContentSectionsProps = {
  sections: ContentSection[];
  omitCode?: string[];
};

export function ContentSections({ sections, omitCode = [] }: ContentSectionsProps) {
  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const renderedCode = section.codeBlocks.filter(
          (block) => !omitCode.includes(block.code.trim())
        );
        const hasProse = section.proseHtml.replace(/<[^>]+>/g, "").trim().length > 0;

        return (
          <section key={section.id} id={section.id} className="space-y-4 scroll-mt-28">
            {hasProse ? (
              <div className="surface-panel p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Section
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                  {section.title}
                </h2>
                <div
                  className="prose-entry mt-4"
                  dangerouslySetInnerHTML={{ __html: section.proseHtml }}
                />
              </div>
            ) : null}

            {renderedCode.map((block, index) => (
              <SnippetCard
                key={`${section.id}-${index}`}
                eyebrow={section.title}
                title={block.language || "text"}
                code={block.code}
                language={block.language || "text"}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}
