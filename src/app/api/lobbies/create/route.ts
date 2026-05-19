import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

const VALID_MODES = ["custom_offline", "custom_online", "casual", "ranked", "spectate"] as const;
type Mode = (typeof VALID_MODES)[number];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth required" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    mode?: string;
    name?: string;
    visibility?: "public" | "private";
    max_players?: number;
    current_beat_id?: string | null;
  };

  const mode: Mode =
    VALID_MODES.includes(body.mode as Mode) ? (body.mode as Mode) : "casual";
  const visibility = body.visibility === "private" ? "private" : "public";
  const max_players = Math.max(2, Math.min(8, body.max_players ?? 6));

  // generate a unique code (collision-retry up to 5x)
  let code = "";
  for (let i = 0; i < 5; i++) {
    const candidate = genCode();
    const { data: existing } = await supabase
      .from("lobbies")
      .select("id")
      .eq("code", candidate)
      .maybeSingle();
    if (!existing) {
      code = candidate;
      break;
    }
  }
  if (!code) return NextResponse.json({ error: "code gen failed" }, { status: 500 });

  const { data: lobby, error } = await supabase
    .from("lobbies")
    .insert({
      code,
      name: body.name ?? null,
      host_id: user.id,
      mode,
      visibility,
      max_players,
      current_beat_id: body.current_beat_id ?? null,
      status: "waiting",
    })
    .select("id, code")
    .single();

  if (error || !lobby) {
    return NextResponse.json({ error: error?.message ?? "insert failed" }, { status: 500 });
  }

  // Host becomes member with role=host
  const role = mode === "spectate" ? "spectator" : "host";
  await supabase
    .from("lobby_members")
    .insert({ lobby_id: lobby.id, user_id: user.id, role, score: 0 });

  return NextResponse.json({ code: lobby.code });
}
