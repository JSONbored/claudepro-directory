import { ImageResponse } from "next/og";
import { ogQuerySchema } from "@/lib/api/contracts";
import { createApiHandler, type InferApiQuery } from "@/lib/api/router";

function clean(value: string | null, fallback: string, maxLength: number) {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  const text = normalized || fallback;
  return text.length <= maxLength
    ? text
    : `${text.slice(0, maxLength - 3).trimEnd()}...`;
}

export const GET = createApiHandler("og.render", async ({ query }) => {
  const payload = query as InferApiQuery<typeof ogQuerySchema>;
  const title = clean(payload.title, "HeyClaude", 96);
  const description = clean(payload.description, "", 180);
  const label = clean(payload.label, "Registry", 42);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0b0f14",
        color: "#f8fafc",
        padding: 72,
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div
          style={{
            fontSize: 28,
            letterSpacing: 0,
            color: "#93c5fd",
            fontWeight: 700,
          }}
        >
          HeyClaude
        </div>
        <div
          style={{
            border: "1px solid #334155",
            borderRadius: 999,
            padding: "10px 18px",
            fontSize: 22,
            color: "#cbd5e1",
          }}
        >
          {label}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            maxWidth: 980,
            fontSize: 72,
            lineHeight: 1.02,
            fontWeight: 800,
            letterSpacing: 0,
          }}
        >
          {title}
        </div>
        <div
          style={{
            maxWidth: 930,
            fontSize: 32,
            lineHeight: 1.35,
            color: "#cbd5e1",
          }}
        >
          {description}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 24,
          color: "#94a3b8",
        }}
      >
        <span>heyclau.de</span>
        <span>Registry, API, Raycast, and LLM exports</span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    },
  );
});
