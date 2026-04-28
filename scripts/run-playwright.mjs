import { spawn } from "node:child_process";

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function run(args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      ...options,
    });
    child.on("close", (code) => resolve(code ?? 1));
  });
}

const env = { ...process.env };
delete env.NO_COLOR;

const testStatus = await run(
  ["exec", "playwright", "test", ...process.argv.slice(2)],
  { env },
);
await run(["exec", "node", "scripts/normalize-next-env.mjs"]);

process.exit(testStatus);
