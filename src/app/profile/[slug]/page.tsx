import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type MatchRow = {
  match_id: string;
  final_score: number;
  placement: number | null;
  matches: {
    id: string;
    started_at: string;
    beat_id: string | null;
    genre: string | null;
  } | null;
};

export default async function PublicProfile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("share_slug", slug)
    .maybeSingle();

  if (!profile) notFound();

  const { data: matchRows } = await supabase
    .from("match_players")
    .select("match_id, final_score, placement, matches(id, started_at, beat_id, genre)")
    .eq("user_id", profile.id)
    .order("match_id", { ascending: false })
    .limit(20);

  const initial = ((profile.display_name as string | null) ?? "U")[0].toUpperCase();

  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-col gap-8 px-4 pb-16 pt-10 sm:px-8">
      <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
        <div className="grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-orange-400 to-fuchsia-500 font-display text-3xl font-bold text-black">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="size-full rounded-3xl object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold">{profile.display_name}</h1>
          <p className="text-sm text-white/55">@{profile.username ?? "—"}</p>
          <p className="mt-2 inline-block rounded-full bg-orange-400/15 px-2.5 py-0.5 text-xs font-semibold text-orange-200">
            ELO {profile.elo}
          </p>
          {profile.fav_genres?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.fav_genres.map((g: string) => (
                <span key={g} className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold">Recent matches</h2>
        {(!matchRows || matchRows.length === 0) ? (
          <p className="mt-3 text-sm text-white/55">No matches yet.</p>
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
                </tr>
              </thead>
              <tbody>
                {(matchRows as unknown as MatchRow[]).map((row) => (
                  <tr key={row.match_id} className="border-t border-white/5">
                    <td className="py-2 text-white/60">
                      {row.matches?.started_at
                        ? new Date(row.matches.started_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>{row.matches?.genre ?? "—"}</td>
                    <td className="max-w-[140px] truncate">{row.matches?.beat_id ?? "—"}</td>
                    <td>{row.placement ?? "—"}</td>
                    <td>{row.final_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
