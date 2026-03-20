
import { Skeleton } from '@/components/ui/Skeleton';

export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="max-w-6xl mx-auto px-6 py-10">
                {/* Header Skeleton */}
                <div className="flex items-start justify-between mb-10">
                    <div>
                        <Skeleton className="h-4 w-20 rounded-md mb-2" />
                        <Skeleton className="h-9 w-56 rounded-lg mb-2" />
                        <Skeleton className="h-4 w-72 rounded-md" />
                    </div>
                    <Skeleton className="h-10 w-36 rounded-lg" />
                </div>

                {/* Stats Summary Skeleton */}
                <div className="grid grid-cols-3 gap-4 mb-8 max-w-md">
                    <Skeleton className="h-16 rounded-xl" />
                    <Skeleton className="h-16 rounded-xl" />
                    <Skeleton className="h-16 rounded-xl" />
                </div>

                {/* Card Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="card p-5">
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <Skeleton className="w-14 h-14 rounded-2xl" />
                                {/* Content */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <Skeleton className="h-5 w-3/4 rounded-md" />
                                        <Skeleton className="h-5 w-5 rounded-md" />
                                    </div>
                                    <Skeleton className="h-3 w-20 rounded-md" />
                                    <div className="flex gap-4">
                                        <Skeleton className="h-4 w-24 rounded-md" />
                                        <Skeleton className="h-4 w-20 rounded-md" />
                                    </div>
                                </div>
                            </div>
                            {/* Activity row */}
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--flux-border-subtle)]">
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
