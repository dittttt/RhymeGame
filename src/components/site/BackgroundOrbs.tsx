export function BackgroundOrbs() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#0a0612]" />
      <div className="pointer-events-none fixed -left-32 top-[-10%] -z-10 size-[640px] rounded-full bg-orange-500/15 blur-[140px]" />
      <div className="pointer-events-none fixed -right-32 top-[20%] -z-10 size-[720px] rounded-full bg-fuchsia-500/20 blur-[160px]" />
      <div className="pointer-events-none fixed bottom-[-20%] left-1/3 -z-10 size-[600px] rounded-full bg-sky-500/10 blur-[150px]" />
    </>
  );
}
