export default function FindLoading() {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-10 sm:px-8">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-white/10" />
      <div className="mt-6 grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    </main>
  );
}
