export default function AppLoading() {
  return (
    <div className="container-shell grid min-h-screen gap-6 py-6 lg:grid-cols-[286px_minmax(0,1fr)]">
      <div className="glass-panel hidden rounded-[32px] lg:block">
        <div className="space-y-4 p-5">
          <div className="h-14 rounded-2xl bg-muted/80" />
          <div className="h-11 rounded-2xl bg-muted/70" />
          <div className="h-11 rounded-2xl bg-muted/70" />
          <div className="h-11 rounded-2xl bg-muted/70" />
        </div>
      </div>
      <div className="space-y-6">
        <div className="glass-panel h-24 rounded-[28px]" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="surface-panel h-40 animate-pulse" />
          <div className="surface-panel h-40 animate-pulse" />
          <div className="surface-panel h-40 animate-pulse" />
        </div>
        <div className="surface-panel h-28 animate-pulse" />
        <div className="surface-panel h-96 animate-pulse" />
      </div>
    </div>
  );
}
