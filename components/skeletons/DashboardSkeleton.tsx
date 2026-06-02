
import { Skeleton } from '@/components/ui/Skeleton';

export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <Skeleton className="mb-2 h-4 w-20 rounded-md" />
                        <Skeleton className="mb-2 h-9 w-56 rounded-lg" />
                        <Skeleton className="h-4 w-72 rounded-md" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-36 rounded-lg" />
                        <Skeleton className="h-11 w-11 rounded-xl sm:h-10 sm:w-10" />
                    </div>
                </div>

                {/* Stats */}
                <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-[72px] rounded-2xl" />
                    ))}
                </div>

                {/* Card grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="card p-5">
                            <div className="flex items-start gap-4">
                                <Skeleton className="h-14 w-14 rounded-2xl" />
                                <div className="flex-1 space-y-3">
                                    <Skeleton className="h-5 w-3/4 rounded-md" />
                                    <Skeleton className="h-3 w-20 rounded-md" />
                                    <div className="flex gap-4">
                                        <Skeleton className="h-4 w-24 rounded-md" />
                                        <Skeleton className="h-4 w-20 rounded-md" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
                                <Skeleton className="h-2 w-2 rounded-full" />
                                <Skeleton className="h-3 w-28 rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
