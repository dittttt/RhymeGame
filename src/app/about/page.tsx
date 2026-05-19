import Link from "next/link";

export const metadata = { title: "About — RhymeGame" };

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-12 sm:px-8 sm:pt-16">
      <p className="chip chip-accent inline-flex">About</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
        Freestyle to the beat.
      </h1>
      <div className="prose prose-invert mt-6 max-w-none text-white/75">
        <p>
          <strong>RhymeGame</strong> is a real-time freestyle rap trainer. Drop a YouTube beat,
          hit play, and watch a rhyme target morph in sync with the music. Land your bars on
          the bar — literally. The faster and tighter your flow, the higher you score.
        </p>
        <h2 className="font-display text-2xl">How it works</h2>
        <ol>
          <li>
            <strong>Pick a beat.</strong> Any YouTube track. We grab its tempo & metadata
            and lock the on-screen timing to it.
          </li>
          <li>
            <strong>The target slides.</strong> Each bar a new rhyme cue appears. Hit words
            that rhyme with the target — perfect rhymes score most, near-rhymes still count.
          </li>
          <li>
            <strong>Multiplayer.</strong> Casual or ranked rooms put you head-to-head with
            others on the same beat. Spectators can vote rounds.
          </li>
          <li>
            <strong>Custom rooms.</strong> Make a private lobby, share a 6-char code, and
            run the cypher however you want.
          </li>
        </ol>
        <h2 className="font-display text-2xl">Beta</h2>
        <p>
          This is the public beta — multiplayer, profiles, and lobbies are rolling out in
          phases. Expect rough edges. Found a bug or have an idea? Find the project on
          GitHub.
        </p>
        <p>
          See the open-source bits we lean on over on the{" "}
          <Link href="/credits" className="text-fuchsia-300 underline">
            credits page
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
