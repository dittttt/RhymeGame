import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Trophy, Users, Eye } from "lucide-react";

export default async function MultiplayerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let elo: number | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("elo")
      .eq("id", user.id)
      .maybeSingle();
    elo = data?.elo ?? null;
  }

  const cards = [
    {
      mode: "casual",
      title: "Casual",
      desc: "Friendly battles. Win or lose, your elo's safe.",
      icon: <Users className="size-7" />,
      accent: "from-emerald-400/30 to-emerald-500/10",
    },
    {
      mode: "ranked",
      title: "Ranked",
      desc: "Stakes are real. Climb the ladder.",
      icon: <Trophy className="size-7" />,
      accent: "from-fuchsia-500/30 to-fuchsia-600/10",
    },
    {
      mode: "spectate",
      title: "Spectate",
      desc: "Drop into a live cypher. Watch + vote.",
      icon: <Eye className="size-7" />,
      accent: "from-sky-400/30 to-sky-500/10",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col px-4 pb-12 pt-12 sm:px-8 sm:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="chip chip-accent inline-flex">Multiplayer</p>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-5xl">
            Pick your <span className="bg-gradient-to-r from-orange-400 to-fuchsia-500 bg-clip-text text-transparent">arena</span>
          </h1>
        </div>
        {elo !== null && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/45">Your ELO</p>
            <p className="font-display text-2xl font-bold text-orange-300">{elo}</p>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.mode}
            href={`/lobby/new?mode=${c.mode}`}
            className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${c.accent} p-6 transition hover:border-white/20`}
          >
            <div className="grid size-14 place-items-center rounded-2xl bg-white/10">{c.icon}</div>
            <h2 className="mt-5 font-display text-2xl font-bold">{c.title}</h2>
            <p className="mt-2 text-sm text-white/65">{c.desc}</p>
            <span className="mt-4 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-white/55">
              Coming Phase 4
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
