import { renderAllEmailTemplates } from "../emails/src/render";
import { syncRenderedEmailTemplates } from "./lib/resend-templates";

const apply = process.argv.includes("--apply");
const dryRun = process.argv.includes("--dry-run") || !apply;

if (apply && process.argv.includes("--dry-run")) {
  console.error("Use either --apply or --dry-run, not both.");
  process.exit(1);
}

async function main() {
  const templates = await renderAllEmailTemplates();
  const summary = await syncRenderedEmailTemplates({
    templates,
    dryRun,
  });

  for (const result of summary.results) {
    const prefix = summary.dryRun ? "Would" : "Synced";
    const idNote = result.resendId ? ` (${result.resendId})` : "";
    console.log(
      `${prefix} ${result.action} ${result.templateName} via ${result.endpoint}${idNote}`,
    );
  }

  if (summary.dryRun) {
    console.log(
      "Dry run only. Re-run with --apply and RESEND_API_KEY to update Resend Templates.",
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
