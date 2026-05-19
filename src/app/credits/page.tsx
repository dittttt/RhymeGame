export const metadata = { title: "Credits — RhymeGame" };

const stack = [
  { name: "Next.js", url: "https://nextjs.org", desc: "App framework + routing" },
  { name: "Vercel", url: "https://vercel.com", desc: "Hosting & preview deploys" },
  { name: "Supabase", url: "https://supabase.com", desc: "Auth, Postgres, realtime" },
  { name: "Radix UI", url: "https://www.radix-ui.com", desc: "Accessible primitives" },
  { name: "framer-motion", url: "https://www.framer.com/motion", desc: "Animations" },
  { name: "lucide-react", url: "https://lucide.dev", desc: "Icons" },
  { name: "YouTube IFrame API", url: "https://developers.google.com/youtube/iframe_api_reference", desc: "Beat playback" },
  { name: "Tailwind CSS", url: "https://tailwindcss.com", desc: "Styling" },
];

export default function CreditsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-12 sm:px-8 sm:pt-16">
      <p className="chip chip-accent inline-flex">Credits</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Built on shoulders.</h1>
      <p className="mt-3 text-white/65">
        RhymeGame is made by <strong className="text-white">Tiu</strong>, with help from these
        excellent open-source and free-tier tools.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {stack.map((s) => (
          <li key={s.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="font-display text-lg font-bold text-white hover:text-orange-300"
            >
              {s.name} ↗
            </a>
            <p className="mt-1 text-xs text-white/55">{s.desc}</p>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-center text-xs text-white/40">
        Made with bars in mind. © {new Date().getFullYear()} Tiu.
      </p>
    </main>
  );
}
