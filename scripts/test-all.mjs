import { spawnSync } from "node:child_process";

const commands = [
  ["pnpm", ["test:registry-artifacts"]],
  ["pnpm", ["test:submission-intake"]],
  ["pnpm", ["test:commercial-intake"]],
  ["pnpm", ["test:seo-jsonld"]],
];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("All Node test scripts passed.");
