import { PageShell, CardGridSkeleton } from "@/components/shared/PageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
        <CardGridSkeleton cards={9} />
      </div>
    </PageShell>
  );
}
