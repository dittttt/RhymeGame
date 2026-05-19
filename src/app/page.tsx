import Link from "next/link";
import { Music2, Users, User as UserIcon } from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative mx-auto flex w-full max-w-[1400px] flex-col px-4 pb-12 pt-12 sm:px-8 sm:pt-20">
      <div className="text-center">
        <p className="chip chip-accent mx-auto inline-flex">Beta · Multiplayer Preview</p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-6xl">
          Pick your <span className="bg-gradient-to-r from-orange-400 to-fuchsia-500 bg-clip-text text-transparent">flow</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/60 sm:text-base">
          Solo cypher, ranked battles, or just hang in a lobby. Three doors in — pick one.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-3">
        <HomeCard
          href="/custom"
          icon={<Music2 className="size-7" />}
          title="Custom"
          desc="Solo play, create a lobby, find rooms, or join with a code."
          accent="from-orange-400/30 to-orange-500/10"
        />
        <HomeCard
          href="/multiplayer"
          icon={<Users className="size-7" />}
          title="Multiplayer"
          desc="Casual, ranked battles, or spectate a live cypher."
          accent="from-fuchsia-500/30 to-fuchsia-600/10"
          badge="Login required"
        />
        <HomeCard
          href="/profile"
          icon={<UserIcon className="size-7" />}
          title="Profile"
          desc="Your stats, ELO, fav genres, and shareable card."
          accent="from-sky-400/30 to-sky-500/10"
          badge="Login required"
        />
      </div>
    </main>
  );
}

function HomeCard({
  href,
  icon,
  title,
  desc,
  accent,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${accent} p-6 transition hover:border-white/20 hover:shadow-lg hover:shadow-fuchsia-900/20 sm:p-8`}
    >
      <div className="grid size-14 place-items-center rounded-2xl bg-white/10 text-white">
        {icon}
      </div>
      <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">
        {title}
      </h2>
      <p className="mt-2 text-sm text-white/65">{desc}</p>
      {badge ? (
        <span className="mt-4 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-white/60">
          {badge}
        </span>
      ) : null}
      <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-white/5 blur-2xl transition group-hover:scale-125" />
    </Link>
  );
}
