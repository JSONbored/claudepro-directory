import { describe, expect, it } from "vitest";

import { validateSkillPackageFiles } from "@/lib/skill-package-validator";

describe("skill package validator", () => {
  it("accepts a review-ready Agent Skill package shape", () => {
    const result = validateSkillPackageFiles({
      githubUrl: "https://github.com/JSONbored/claudepro-directory",
      files: [
        {
          path: "sample-skill/SKILL.md",
          size: 220,
          text: `---
name: Sample Skill
description: Validate packages before submitting them to the HeyClaude registry.
---

# Sample Skill

Use the helper in \`scripts/check.sh\` before submitting.
`,
        },
        {
          path: "sample-skill/scripts/check.sh",
          size: 20,
          text: "#!/usr/bin/env bash\n",
        },
      ],
    });

    expect(result.ok).toBe(true);
    expect(result.entrypoint).toBe("sample-skill/SKILL.md");
    expect(result.slug).toBe("sample-skill");
    expect(result.issueUrl).toContain("template=submit-skill.yml");
    expect(result.issueUrl).toContain("verification_status=validated");
  });

  it("rejects missing frontmatter and missing referenced resources", () => {
    const result = validateSkillPackageFiles({
      githubUrl: "https://github.com/JSONbored/claudepro-directory",
      files: [
        {
          path: "SKILL.md",
          size: 80,
          text: "# Missing Metadata\n\nRun [setup](scripts/setup.sh).",
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "SKILL.md must start with frontmatter.",
        "SKILL.md frontmatter must include name.",
        "Referenced resource is missing: scripts/setup.sh",
      ]),
    );
  });
});
