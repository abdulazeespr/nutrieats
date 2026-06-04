import { ReactNode } from "react";

interface SkeletonProps {
  className?: string;
}

/** Single pulsing placeholder block */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-2xl ${className}`}
      aria-hidden="true"
    />
  );
}

/** Card-shaped skeleton row */
export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3"
      aria-hidden="true"
    >
      <Skeleton className="h-5 w-2/3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

/** A group of N skeleton cards — use on listing pages while loading */
export function SkeletonList({
  count = 3,
  cardLines = 2,
}: {
  count?: number;
  cardLines?: number;
}) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading…">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={cardLines} />
      ))}
    </div>
  );
}

/** Deal-card–shaped skeleton for grid layouts */
export function SkeletonDealCard() {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      aria-hidden="true"
    >
      <Skeleton className="h-40 rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

/** Inline children rendering wrapper — shows skeleton while loading */
export function SkeletonGuard({
  loading,
  children,
  skeleton,
}: {
  loading: boolean;
  children: ReactNode;
  skeleton: ReactNode;
}) {
  return loading ? <>{skeleton}</> : <>{children}</>;
}
