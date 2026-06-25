import { PageShell, HeaderSkeleton, StatsSkeleton, RowsSkeleton } from "@/components/shared/PageShell";

export default function Loading() {
  return (
    <PageShell>
      <div className="space-y-8">
        <HeaderSkeleton />
        <StatsSkeleton count={3} />
        <RowsSkeleton rows={7} />
      </div>
    </PageShell>
  );
}
