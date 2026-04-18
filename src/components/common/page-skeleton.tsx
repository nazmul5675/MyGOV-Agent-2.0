export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass-panel h-28 rounded-[28px] animate-pulse" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="surface-panel h-36 animate-pulse" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="surface-panel h-[420px] animate-pulse" />
        <div className="surface-panel h-[420px] animate-pulse" />
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass-panel h-28 rounded-[28px] animate-pulse" />
      <div className="surface-panel h-24 animate-pulse" />
      <div className="grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="surface-panel h-72 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass-panel h-28 rounded-[28px] animate-pulse" />
      <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <div className="space-y-6">
          <div className="surface-panel h-[300px] animate-pulse" />
          <div className="surface-panel h-[280px] animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="surface-panel h-40 animate-pulse" />
          <div className="surface-panel h-44 animate-pulse" />
          <div className="surface-panel h-36 animate-pulse" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="surface-panel h-[320px] animate-pulse" />
        <div className="surface-panel h-[420px] animate-pulse" />
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass-panel h-28 rounded-[28px] animate-pulse" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <div className="surface-panel h-[420px] animate-pulse" />
          <div className="surface-panel h-[360px] animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="surface-panel h-[520px] animate-pulse" />
          <div className="surface-panel h-44 animate-pulse" />
          <div className="surface-panel h-72 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
