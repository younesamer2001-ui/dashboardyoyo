export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/[0.04] rounded-lg ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl bg-[#13131f] border border-white/[0.06] space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}
