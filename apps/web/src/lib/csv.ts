export function csvEscape(value: unknown) {
  const raw = String(value ?? "");
  const trimmedStart = raw.trimStart();
  const normalized =
    trimmedStart.startsWith("=") ||
    trimmedStart.startsWith("+") ||
    trimmedStart.startsWith("-") ||
    trimmedStart.startsWith("@")
      ? `'${raw}`
      : raw;
  return /[",\n\r]/.test(normalized)
    ? `"${normalized.replaceAll('"', '""')}"`
    : normalized;
}
