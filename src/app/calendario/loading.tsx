import { PageShell, HeaderSkeleton } from "@/components/shared/PageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageShell>
      <div className="space-y-8">
        <HeaderSkeleton />
        {/* Calendar grid */}
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
