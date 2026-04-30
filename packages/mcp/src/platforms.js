export const SITE_URL = "https://heyclau.de";

function slugPart(value, options = {}) {
  const text = String(value || "")
    .trim()
    .toLowerCase();
  let output = "";
  let lastWasSeparator = false;

  for (const char of text) {
    const isAlphaNumeric =
      (char >= "a" && char <= "z") || (char >= "0" && char <= "9");
    if (isAlphaNumeric) {
      output += char;
      lastWasSeparator = false;
      continue;
    }
    if (char === "&" && options.expandAmpersand) {
      if (output && !lastWasSeparator) output += "-";
      output += "and";
      lastWasSeparator = false;
      continue;
    }
    if (output && !lastWasSeparator) {
      output += "-";
      lastWasSeparator = true;
    }
  }

  return lastWasSeparator ? output.slice(0, -1) : output;
}

export function platformFeedSlug(platform) {
  return slugPart(platform, { expandAmpersand: true });
}

export function buildSkillPlatformCompatibility(entry) {
  if (entry?.category !== "skills") return [];
  if (Array.isArray(entry.platformCompatibility)) {
    return entry.platformCompatibility;
  }

  const slug = String(entry?.slug || "").trim();
  return [
    {
      platform: "Claude",
      support: "native-skill",
      artifact: "SKILL.md package",
      installHint: "Install the skill package into your Claude skills folder.",
    },
    {
      platform: "Codex",
      support: "native-skill",
      artifact: "SKILL.md package",
      installHint: "Install the skill package into your Codex skills folder.",
    },
    {
      platform: "Windsurf",
      support: "native-skill",
      artifact: "SKILL.md package",
      installHint: "Install the skill under .windsurf/skills/<skill-name>/.",
    },
    {
      platform: "Gemini",
      support: "native-skill",
      artifact: "SKILL.md package",
      installHint:
        "Use the skill package with Gemini CLI extension skill support.",
    },
    {
      platform: "Cursor",
      support: "adapter",
      artifact: `.cursor/rules/${slug}.mdc`,
      adapterUrl: `/data/skill-adapters/cursor/${slug}.mdc`,
      installHint:
        "Use the generated Cursor rule adapter because Cursor rules are the supported reusable instruction surface.",
    },
    {
      platform: "Generic AGENTS",
      support: "manual-context",
      artifact: "SKILL.md package",
      installHint:
        "Use SKILL.md as reusable agent context or convert it into the target tool's instruction file.",
    },
  ];
}
