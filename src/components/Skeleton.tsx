export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="pt-4 space-y-4 animate-pulse">
      <div className="h-7 bg-zinc-800 rounded-lg w-40" />
      <div className="h-3 bg-zinc-800/80 rounded w-56" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="h-5 bg-zinc-800 rounded w-1/3" />
          <div className="h-16 bg-zinc-800/50 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ rows = 1 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-4">
          <div className="h-10 w-10 rounded-full bg-zinc-800 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-zinc-800 rounded w-2/3" />
            <div className="h-3 bg-zinc-800/80 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
