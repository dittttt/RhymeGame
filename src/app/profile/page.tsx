import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "./ProfileEditor";
import { SignOutButton } from "./SignOutButton";

type MatchRow = {
  match_id: string;
  final_score: number;
  placement: number | null;
  matches: {
    id: string;
    started_at: string;
    beat_id: string | null;
    genre: string | null;
    winner_id: string | null;
  } | null;
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Match history
  const { data: matchRows } = await supabase
    .from("match_players")
    .select("match_id, final_score, placement, matches(id, started_at, beat_id, genre, winner_id)")
    .eq("user_id", user.id)
    .order("match_id", { ascending: false })
    .limit(20);

  const { data: eloRows } = await supabase
    .from("elo_history")
    .select("match_id, delta")
    .eq("user_id", user.id)
    .limit(50);
  const eloByMatch = new Map<string, number>();
  (eloRows ?? []).forEach((r) => {
    if (r.match_id) eloByMatch.set(r.match_id, r.delta);
  });

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Player";
  const username = profile?.username ?? user.email?.split("@")[0] ?? "—";
  const shareSlug =
    profile?.share_slug ?? (profile?.username || user.id.replace(/-/g, "").slice(0, 10));
  const initial = (displayName || "U")[0].toUpperCase();

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-8 px-4 pb-16 pt-10 sm:px-8">
      <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
        <div className="grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-orange-400 to-fuchsia-500 font-display text-3xl font-bold text-black">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="size-full rounded-3xl object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-3xl font-bold">{displayName}</h1>
          <p className="text-sm text-white/55">@{username}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60">
            <span className="rounded-full bg-orange-400/15 px-2.5 py-0.5 font-semibold text-orange-200">
              ELO {profile?.elo ?? 1000}
            </span>
            <Link href={`/profile/${shareSlug}`} className="underline hover:text-white">
              Share link: /profile/{shareSlug}
            </Link>
          </div>
        </div>
        <SignOutButton />
      </section>

      <ProfileEditor
        userId={user.id}
        displayName={profile?.display_name ?? ""}
        favGenres={profile?.fav_genres ?? []}
      />

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold">Match history</h2>
        {(!matchRows || matchRows.length === 0) ? (
          <p className="mt-3 text-sm text-white/55">No matches yet — go play one.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] uppercase tracking-widest text-white/40">
                <tr>
                  <th className="py-2">Date</th>
                  <th>Genre</th>
                  <th>Beat</th>
                  <th>Placement</th>
                  <th>Score</th>
                  <th>Δ ELO</th>
                </tr>
              </thead>
              <tbody>
                {(matchRows as unknown as MatchRow[]).map((row) => {
                  const m = row.matches;
                  const delta = m ? eloByMatch.get(m.id) ?? 0 : 0;
                  return (
                    <tr key={row.match_id} className="border-t border-white/5">
                      <td className="py-2 text-white/60">
                        {m?.started_at ? new Date(m.started_at).toLocaleDateString() : "—"}
                      </td>
                      <td>{m?.genre ?? "—"}</td>
                      <td className="max-w-[140px] truncate">{m?.beat_id ?? "—"}</td>
                      <td>{row.placement ?? "—"}</td>
                      <td>{row.final_score}</td>
                      <td className={delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-white/40"}>
                        {delta > 0 ? `+${delta}` : delta}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
