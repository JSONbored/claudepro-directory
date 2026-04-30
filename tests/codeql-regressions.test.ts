import { describe, expect, it } from "vitest";

import {
  extractSectionSubitems,
  getEmbeddedSectionType,
  htmlBeforeFirstH3,
  stripSectionTypeComments,
} from "@/lib/content-section-parsing";
import {
  listingLeadBodySchema,
  newsletterSubscribeBodySchema,
} from "@/lib/api/contracts";

describe("CodeQL regression coverage", () => {
  it("parses content section markers and h3 subitems without regex sanitizers", () => {
    const html = [
      "<p>Intro</p>",
      "<!-- Section type: warning -->",
      '<h3 id="first">First issue</h3>',
      "<p>First body</p>",
      '<h3 id="second">Second issue</h3>',
      "<p>Second body</p>",
    ].join("");

    expect(getEmbeddedSectionType(html)).toBe("warning");

    const cleanHtml = stripSectionTypeComments(html);
    expect(cleanHtml).not.toContain("Section type");
    expect(htmlBeforeFirstH3(cleanHtml)).toBe("<p>Intro</p>");

    expect(extractSectionSubitems(cleanHtml, "troubleshooting")).toEqual([
      { id: "first", title: "First issue", html: "<p>First body</p>" },
      { id: "second", title: "Second issue", html: "<p>Second body</p>" },
    ]);
  });

  it("validates email input with bounded linear parsing", () => {
    expect(
      newsletterSubscribeBodySchema.parse({
        email: "Reader@Example.com",
        source: "footer",
      }),
    ).toEqual({ email: "reader@example.com", source: "footer" });

    expect(() =>
      newsletterSubscribeBodySchema.parse({
        email: `!@!.${"!. ".repeat(2048)}`,
      }),
    ).toThrow();

    expect(() =>
      listingLeadBodySchema.parse({
        kind: "job",
        contactName: "Jane",
        contactEmail: "not an email",
        companyName: "Example",
        listingTitle: "AI Engineer",
        applyUrl: "https://example.com/jobs/ai-engineer",
      }),
    ).toThrow();
  });
});
