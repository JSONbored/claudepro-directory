import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagePath = path.join(root, "package.json");
const envTypesPath = path.join(root, "raycast-env.d.ts");

const devPreferences = [
  {
    name: "feedUrlOverride",
    title: "Developer Feed URL Override",
    description:
      "Maintainer-only override for testing preview feeds. Production builds always use the HeyClaude production feed.",
    type: "textfield",
    required: false,
    placeholder:
      "https://heyclaude-dev.zeronode.workers.dev/data/raycast-index.json",
  },
];

const originalPackage = await fs.readFile(packagePath, "utf8");
const originalEnvTypes = existsSync(envTypesPath)
  ? await fs.readFile(envTypesPath, "utf8")
  : null;
let restored = false;
let child;

async function restore() {
  if (restored) return;
  restored = true;
  await fs.writeFile(packagePath, originalPackage);
  if (originalEnvTypes === null) {
    await fs.rm(envTypesPath, { force: true });
  } else {
    await fs.writeFile(envTypesPath, originalEnvTypes);
  }
}

async function writeDevManifest() {
  const manifest = JSON.parse(originalPackage);
  manifest.preferences = devPreferences;
  await fs.writeFile(`${packagePath}.dev-backup`, originalPackage);
  await fs.writeFile(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (child && !child.killed) child.kill(signal);
  });
}

process.on("exit", () => {
  if (!restored) {
    console.error(
      "Raycast dev manifest restore did not complete before process exit.",
    );
  }
});

await writeDevManifest();

child = spawn("ray", ["develop"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", async (code, signal) => {
  await restore();
  await fs.rm(`${packagePath}.dev-backup`, { force: true });
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
