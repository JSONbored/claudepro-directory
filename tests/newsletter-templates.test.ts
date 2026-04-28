import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import { repoRoot } from "./helpers/registry-fixtures";

const templateDir = path.join(repoRoot, "emails/templates");
const sourceDir = path.join(repoRoot, "emails/src");
const templateNames = [
  "curated-drop-digest",
  "release-notes",
  "relaunch-brief",
  "maintainer-call",
];

describe("Resend newsletter templates", () => {
  it("keeps React Email source templates rendered into static Resend artifacts", () => {
    execFileSync("pnpm", ["validate:emails"], {
      cwd: repoRoot,
      stdio: "pipe",
    });
  });

  it("keeps HTML and text templates paired with unsubscribe placeholders", () => {
    for (const name of templateNames) {
      const html = fs.readFileSync(
        path.join(templateDir, `${name}.html`),
        "utf8",
      );
      const text = fs.readFileSync(
        path.join(templateDir, `${name}.txt`),
        "utf8",
      );

      expect(html).toContain("{{RESEND_UNSUBSCRIBE}}");
      expect(text).toContain("{{RESEND_UNSUBSCRIBE}}");
      expect(html).toContain("HeyClaude");
      expect(html).toMatch(/border-radius:\s*20px/);
      expect(html).not.toContain("<script");
      expect(text).not.toContain("<html");
    }
  });

  it("uses current React Email source imports instead of deprecated packages", () => {
    const source = fs.readFileSync(
      path.join(sourceDir, "templates.tsx"),
      "utf8",
    );
    expect(source).toContain('from "react-email"');
    expect(source).not.toContain("@react-email/components");
    expect(source).not.toContain("@react-email/render");
  });
});
