export default function LobbyLoading() {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-8 sm:px-8">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-white/10" />
      <div className="mt-6 grid gap-5 lg:grid-cols-[260px,_minmax(0,1fr),_320px]">
        <div className="h-[420px] animate-pulse rounded-3xl bg-white/5" />
        <div className="h-[420px] animate-pulse rounded-3xl bg-white/5" />
        <div className="h-[420px] animate-pulse rounded-3xl bg-white/5" />
      </div>
    </main>
  );
}
