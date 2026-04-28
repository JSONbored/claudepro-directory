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
  const title = clean(payload.title, "HeyClaude", 88);
  const description = clean(payload.description, "", 180);
  const label = clean(payload.label, "Registry", 42);
  const badge = clean(payload.badge, "heyclau.de", 42);
  const kind = payload.kind || "registry";
  const kindCaption: Record<string, string> = {
    registry: "Registry, API, Raycast, and LLM exports",
    category: "Curated AI content by category",
    entry: "Source-backed AI workflow content",
    job: "External-apply AI hiring roles",
    tool: "Verified AI product and tool signals",
    platform: "Agent Skill compatibility",
  };

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#151813",
        color: "#EDE9F0",
        fontFamily:
          "Plus Jakarta Sans, Inter, ui-sans-serif, system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1200,
          height: 630,
          backgroundImage:
            "radial-gradient(circle at 24px 24px, rgba(237,233,240,0.10) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.36,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 42,
          top: 42,
          width: 1116,
          height: 546,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          border: "1px solid rgba(61,66,55,0.88)",
          background: "rgba(36, 39, 31, 0.76)",
          borderRadius: 40,
          padding: 52,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <svg
              viewBox="0 0 100 100"
              width="58"
              height="58"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="100" height="100" rx="26" fill="#C855A0" />
              <circle cx="34" cy="46" r="7" fill="#F5F7F2" />
              <path
                d="M 56 40 Q 68 46 56 52"
                stroke="#F5F7F2"
                strokeWidth="5.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div
              style={{
                display: "flex",
                fontSize: 31,
                fontWeight: 800,
                letterSpacing: 0,
              }}
            >
              <span>Hey</span>
              <span style={{ color: "#D470B8" }}>Claude</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              border: "1px solid rgba(212,112,184,0.56)",
              borderRadius: 999,
              padding: "12px 20px",
              fontSize: 22,
              color: "#F4D2EC",
              background: "rgba(200,85,160,0.18)",
            }}
          >
            {label}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              maxWidth: 620,
              fontSize: title.length > 56 ? 54 : 64,
              lineHeight: 1.05,
              fontWeight: 850,
              letterSpacing: 0,
              textAlign: "center",
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 620,
              fontSize: 27,
              lineHeight: 1.35,
              color: "#B9ABB9",
              letterSpacing: 0,
              textAlign: "center",
            }}
          >
            {description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
            fontSize: 23,
            color: "#B9ABB9",
          }}
        >
          <span>{badge}</span>
          <span>{kindCaption[kind] ?? kindCaption.registry}</span>
        </div>
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
