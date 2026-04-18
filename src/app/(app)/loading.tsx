export default function AppLoading() {
  return (
    <div className="container-shell grid min-h-screen gap-6 py-6 lg:grid-cols-[286px_minmax(0,1fr)]">
      <div className="glass-panel hidden rounded-[32px] lg:block" />
      <div className="space-y-6">
        <div className="glass-panel h-24 rounded-[28px]" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="surface-panel h-40" />
          <div className="surface-panel h-40" />
          <div className="surface-panel h-40" />
        </div>
        <div className="surface-panel h-96" />
      </div>
    </div>
  );
}
