export function compactCount(value) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return String(value);
}

export function firstUsefulLine(value) {
  if (!value) return "";

  const candidates = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("```"))
    .filter((line) => !line.startsWith("#"))
    .filter((line) => !line.startsWith("//"))
    .filter((line) => !line.startsWith("/*"))
    .filter((line) => !line.startsWith("*"))
    .filter((line) => !line.startsWith("<!--"))
    .filter((line) => line !== "{")
    .filter((line) => line !== "}")
    .filter((line) => line !== "[")
    .filter((line) => line !== "]");

  return candidates[0] ?? "";
}

export function extractConfigCommand(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";

  const commandMatch =
    normalized.match(/"command"\s*:\s*"([^"]+)"/) ||
    normalized.match(/['"]command['"]\s*:\s*['"]([^'"]+)['"]/);

  if (commandMatch?.[1]) return commandMatch[1];

  return firstUsefulLine(normalized);
}

export function buildCollectionSequence(entry) {
  if (!Array.isArray(entry.items) || entry.items.length === 0) return "";
  return entry.items
    .slice(0, 3)
    .map((item) => `\`${item.slug}\``)
    .join(" -> ");
}

export function getPreviewLine(entry) {
  const firstCodeBlock = entry.codeBlocks?.[0]?.code?.split("\n")?.[0]?.trim();

  switch (entry.category) {
    case "agents":
    case "rules": {
      const line =
        firstUsefulLine(entry.body) ||
        firstUsefulLine(entry.copySnippet) ||
        firstUsefulLine(entry.usageSnippet);
      return (line || "Copy the full prompt and use it in Claude Code").slice(0, 112);
    }
    case "hooks": {
      const command = extractConfigCommand(entry.configSnippet);
      if (entry.installCommand) return entry.installCommand.slice(0, 112);
      if (command) return command.slice(0, 112);
      if (entry.trigger) return `Claude Code hook: ${entry.trigger}`;
      break;
    }
    case "statuslines": {
      const command = extractConfigCommand(entry.configSnippet || entry.copySnippet);
      if (command) return command.slice(0, 112);
      if (entry.usageSnippet?.trim()) return entry.usageSnippet.trim().slice(0, 112);
      break;
    }
    case "collections": {
      const sequence = buildCollectionSequence(entry);
      if (sequence) return `Start with ${sequence}`.slice(0, 112);
      if (entry.usageSnippet?.trim()) return entry.usageSnippet.trim().slice(0, 112);
      break;
    }
    case "skills":
    case "mcp":
    case "commands": {
      if (entry.installCommand) return entry.installCommand.slice(0, 112);
      if (entry.commandSyntax) return entry.commandSyntax.slice(0, 112);
      const command = extractConfigCommand(entry.configSnippet);
      if (command) return command.slice(0, 112);
      break;
    }
    default:
      break;
  }

  if (entry.configSnippet) {
    const line = extractConfigCommand(entry.configSnippet);
    if (line) return line.slice(0, 112);
  }
  if (entry.scriptBody) {
    const line = firstUsefulLine(entry.scriptBody);
    if (line) return line.slice(0, 112);
  }
  if (entry.usageSnippet) {
    const line = firstUsefulLine(entry.usageSnippet) || entry.usageSnippet;
    return line.slice(0, 112);
  }
  if (entry.copySnippet) {
    const line = firstUsefulLine(entry.copySnippet);
    if (line) return line.slice(0, 112);
  }
  if (firstCodeBlock) return firstCodeBlock.slice(0, 112);
  if (entry.documentationUrl) return "See docs for setup";
  if (entry.downloadUrl) return "Download the package";
  if (entry.githubUrl) return "See GitHub for instructions";
  return "Open this entry on HeyClaude";
}

function appendLabeledBlock(lines, label, value) {
  const normalized = String(value || "").trim();
  if (!normalized) return;
  if (lines.length) lines.push("");
  lines.push(`${label}:`);
  lines.push(normalized);
}

export function getCopyText(entry) {
  const body = String(entry.body || "").trim();

  if (entry.category === "agents" || entry.category === "rules") {
    return body || entry.copySnippet || entry.usageSnippet || entry.description;
  }

  if (entry.category === "hooks") {
    const lines = [];
    appendLabeledBlock(lines, "Trigger", entry.trigger);
    appendLabeledBlock(lines, "Install", entry.installCommand);
    appendLabeledBlock(lines, "Claude config", entry.configSnippet);
    appendLabeledBlock(lines, "Hook script", entry.scriptBody || entry.copySnippet);
    if (body) appendLabeledBlock(lines, "Reference", body);
    return lines.join("\n");
  }

  if (entry.category === "mcp") {
    const lines = [];
    appendLabeledBlock(lines, "Install", entry.installCommand || entry.commandSyntax);
    appendLabeledBlock(lines, "Config", entry.configSnippet);
    appendLabeledBlock(lines, "Usage", entry.copySnippet || entry.usageSnippet || body);
    return lines.join("\n") || entry.documentationUrl || entry.repoUrl || entry.title;
  }

  if (entry.category === "skills" || entry.category === "statuslines") {
    const lines = [];
    appendLabeledBlock(lines, "Install", entry.installCommand);
    appendLabeledBlock(lines, "Claude config", entry.configSnippet);
    appendLabeledBlock(lines, "Usage", entry.usageSnippet);
    appendLabeledBlock(lines, "Asset", entry.scriptBody || entry.copySnippet || body);
    return lines.join("\n");
  }

  if (entry.category === "commands") {
    return entry.commandSyntax || entry.copySnippet || entry.usageSnippet || body;
  }

  if (entry.category === "collections") {
    const lines = [];
    appendLabeledBlock(lines, "Quick start", entry.usageSnippet);
    if (Array.isArray(entry.items) && entry.items.length) {
      appendLabeledBlock(
        lines,
        "Included items",
        entry.items.map((item) => `${item.category}/${item.slug}`).join("\n")
      );
    }
    if (body) appendLabeledBlock(lines, "Reference", body);
    return lines.join("\n") || entry.description;
  }

  if (entry.category === "guides") {
    return body || entry.copySnippet || entry.usageSnippet || entry.description;
  }

  if (entry.copySnippet) return entry.copySnippet;
  if (entry.installCommand) return entry.installCommand;
  if (entry.usageSnippet) return entry.usageSnippet;
  const firstCodeBlock = entry.codeBlocks?.[0]?.code?.trim();
  if (firstCodeBlock) return firstCodeBlock;
  if (body) return body;
  if (entry.documentationUrl) return entry.documentationUrl;
  if (entry.githubUrl) return entry.githubUrl;
  return `${entry.title}\nhttps://heyclau.de/${entry.category}/${entry.slug}`;
}

export function getDistributionBadges(entry) {
  const badges = [
    {
      label: "Raycast",
      title: "Available in the HeyClaude Raycast feed"
    }
  ];

  if (entry.downloadUrl) {
    badges.push({
      label: entry.category === "skills" ? "ZIP" : "MCPB",
      title:
        entry.downloadTrust === "first-party"
          ? "First-party downloadable package"
          : "External downloadable package"
    });
  }

  if (!entry.downloadUrl && !entry.installCommand && !entry.configSnippet) {
    badges.push({
      label: "copy-only",
      title: "Use this entry by copying the asset text"
    });
  }

  if (entry.documentationUrl) {
    badges.push({
      label: "docs",
      title: "Documentation link available"
    });
  }

  if (entry.repoUrl || entry.githubUrl) {
    badges.push({
      label: "source",
      title: "Source or repository link available"
    });
  }

  return badges;
}
