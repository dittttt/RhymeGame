"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LeaveButton({ lobbyId, userId }: { lobbyId: string; userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function leave() {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("lobby_members").delete().match({ lobby_id: lobbyId, user_id: userId });
    router.push("/");
    router.refresh();
  }
  return (
    <button
      onClick={leave}
      disabled={busy}
      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
    >
      {busy ? "…" : "Leave"}
    </button>
  );
}
