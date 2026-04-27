import { beforeEach, describe, expect, it, vi } from "vitest";

const getSiteDbMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  getSiteDb: getSiteDbMock,
}));

function jsonRequest(path: string, body: Record<string, unknown>) {
  return new Request(`https://heyclau.de${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://heyclau.de",
    },
    body: JSON.stringify(body),
  });
}

describe("dynamic API route fallback behavior", () => {
  beforeEach(() => {
    getSiteDbMock.mockReset();
    getSiteDbMock.mockReturnValue(undefined);
  });

  it("returns the documented intent-event fallback when SITE_DB is unavailable", async () => {
    const { POST } = await import("@/app/api/intent-events/route");

    const response = await POST(
      jsonRequest("/api/intent-events", {
        type: "copy",
        entryKey: "skills:example-skill",
        sessionId: "dynamic-api-regression",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      stored: false,
      reason: "site_db_not_configured",
    });
  });

  it("returns zero community-signal counts when SITE_DB is unavailable", async () => {
    const { GET } = await import("@/app/api/community-signals/route");

    const response = await GET(
      new Request(
        "https://heyclau.de/api/community-signals?targetKind=tool&targetKey=tool:cursor",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      available: false,
      counts: { used: 0, works: 0, broken: 0 },
    });
  });

  it("accepts community-signal writes without storing when SITE_DB is unavailable", async () => {
    const { POST } = await import("@/app/api/community-signals/route");

    const response = await POST(
      jsonRequest("/api/community-signals", {
        targetKind: "tool",
        targetKey: "tool:cursor",
        signalType: "used",
        clientId: "dynamic-route-client-0001",
        active: true,
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      stored: false,
      available: false,
      counts: { used: 0, works: 0, broken: 0 },
    });
  });
});
