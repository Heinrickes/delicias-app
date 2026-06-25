import { PageShell, HeaderSkeleton, RowsSkeleton } from "@/components/shared/PageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageShell>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <HeaderSkeleton />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <RowsSkeleton rows={6} />
      </div>
    </PageShell>
  );
}
