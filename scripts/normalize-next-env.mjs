import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const nextEnvPath = path.join(repoRoot, "apps", "web", "next-env.d.ts");

const stableNextEnv = `/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/types/routes.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
`;

const current = fs.existsSync(nextEnvPath)
  ? fs.readFileSync(nextEnvPath, "utf8")
  : "";

if (current !== stableNextEnv) {
  fs.writeFileSync(nextEnvPath, stableNextEnv);
}
