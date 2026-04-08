import { NextResponse } from "next/server";

import { getVotesDb, isValidEntryKey, toggleVote } from "@/lib/votes";

type TogglePayload = {
  key?: string;
  clientId?: string;
  vote?: boolean;
};

export async function POST(request: Request) {
  let payload: TogglePayload = {};
  try {
    payload = (await request.json()) as TogglePayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const key = String(payload.key ?? "").trim();
  const clientId = String(payload.clientId ?? "").trim();
  const vote = Boolean(payload.vote);

  if (!isValidEntryKey(key) || !clientId) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (clientId.length < 8 || clientId.length > 128) {
    return NextResponse.json({ error: "invalid_client_id" }, { status: 400 });
  }

  const db = getVotesDb();
  if (!db) {
    return NextResponse.json({ error: "votes_db_not_configured" }, { status: 503 });
  }

  const result = await toggleVote({
    db,
    entryKey: key,
    clientId,
    vote
  });

  return NextResponse.json({
    key,
    count: result.count,
    voted: result.voted
  });
}
