import { SnippetCard } from "@/components/snippet-card";
import {
  extractSectionSubitems,
  findNextH3Start,
  getEmbeddedSectionType,
  htmlBeforeFirstH3,
  stripSectionTypeComments,
} from "@/lib/content-section-parsing";
import { htmlToPlainText } from "@/lib/detail-assembly";

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

function getSectionVariant(title: string) {
  const normalized = title.toLowerCase();
  if (
    normalized.includes("prerequisite") ||
    normalized.includes("requirement") ||
    normalized.includes("before you start")
  ) {
    return "prerequisites";
  }
  if (
    normalized.includes("warning") ||
    normalized.includes("critical") ||
    normalized.includes("security")
  ) {
    return "warning";
  }
  if (
    normalized.includes("troubleshooting") ||
    normalized.includes("common issues")
  ) {
    return "troubleshooting";
  }
  return "default";
}

export function ContentSections({
  sections,
  omitCode = [],
}: ContentSectionsProps) {
  return (
    <div className="space-y-6">
      {sections.map((section, index) => {
        const embeddedType = getEmbeddedSectionType(section.html);
        const cleanHtml = stripSectionTypeComments(section.html);
        const cleanProseHtml = stripSectionTypeComments(section.proseHtml);
        const hasProse = htmlToPlainText(cleanProseHtml).length > 0;
        const variant = embeddedType ?? getSectionVariant(section.title);
        const sectionSubitems =
          findNextH3Start(cleanHtml) >= 0
            ? extractSectionSubitems(cleanHtml, section.id)
            : [];
        const renderedCode =
          sectionSubitems.length > 0
            ? []
            : section.codeBlocks.filter(
                (block) => !omitCode.includes(block.code.trim()),
              );
        const proseHtml =
          sectionSubitems.length > 0
            ? htmlBeforeFirstH3(cleanProseHtml)
            : cleanProseHtml;
        const hasProseAfterSplit = htmlToPlainText(proseHtml).length > 0;

        if (
          !hasProse &&
          renderedCode.length === 0 &&
          sectionSubitems.length === 0
        ) {
          return null;
        }

        return (
          <section key={section.id} id={section.id} className="scroll-mt-28">
            <details
              className={`section-card section-card-${variant}`}
              open={
                index < 2 ||
                variant === "warning" ||
                variant === "quick_reference"
              }
            >
              <summary className="section-card-summary">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Section
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                    {section.title}
                  </h2>
                </div>
                <span className="section-card-toggle">Expand</span>
              </summary>

              <div className="space-y-4 border-t border-border/70 px-6 py-6">
                {hasProseAfterSplit ? (
                  <div
                    className={`prose-entry ${variant ? `prose-entry-${variant}` : ""}`}
                    dangerouslySetInnerHTML={{ __html: proseHtml }}
                  />
                ) : null}

                {sectionSubitems.length ? (
                  <div className="space-y-3">
                    {sectionSubitems.map((item) => (
                      <details key={item.id} className="section-subcard" open>
                        <summary className="section-subcard-summary">
                          <span className="text-sm font-medium text-foreground">
                            {item.title}
                          </span>
                          <span className="section-card-toggle">Details</span>
                        </summary>
                        <div
                          className="prose-entry border-t border-border/70 px-5 py-5"
                          dangerouslySetInnerHTML={{ __html: item.html }}
                        />
                      </details>
                    ))}
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
              </div>
            </details>
          </section>
        );
      })}
    </div>
  );
}
