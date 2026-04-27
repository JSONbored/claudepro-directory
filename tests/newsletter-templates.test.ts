import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { repoRoot } from "./helpers/registry-fixtures";

const templateDir = path.join(repoRoot, "emails/templates");
const templateNames = [
  "curated-drop-digest",
  "release-notes",
  "maintainer-call",
];

describe("Resend newsletter templates", () => {
  it("keeps HTML and text templates paired with unsubscribe placeholders", () => {
    for (const name of templateNames) {
      const html = fs.readFileSync(path.join(templateDir, `${name}.html`), "utf8");
      const text = fs.readFileSync(path.join(templateDir, `${name}.txt`), "utf8");

      expect(html).toContain("{{RESEND_UNSUBSCRIBE}}");
      expect(text).toContain("{{RESEND_UNSUBSCRIBE}}");
      expect(html).toContain("HeyClaude");
      expect(html).toContain("border-radius:20px");
      expect(html).not.toContain("<script");
      expect(text).not.toContain("<html");
    }
  });
});
