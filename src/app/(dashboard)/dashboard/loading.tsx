import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-4 ring-1 ring-foreground/10"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-7 w-20" />
            <Skeleton className="mt-1 h-3 w-16" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <div className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-4 h-[280px] w-full" />
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-4 h-[280px] w-full" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-4 h-[260px] w-full" />
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10"
            >
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mt-4 h-[110px] w-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-5 ring-1 ring-foreground/10"
          >
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-4 h-[200px] w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
