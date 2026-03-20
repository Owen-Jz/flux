
import { Skeleton } from '@/components/ui/Skeleton';

export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="max-w-6xl mx-auto px-6 py-10">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <Skeleton className="h-9 w-48 rounded-lg mb-2" />
                    <Skeleton className="h-4 w-64 rounded-md" />
                </div>

                {/* Card Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="card overflow-hidden">
                            {/* Gradient Header */}
                            <Skeleton className="h-20 w-full" />
                            {/* Card Body */}
                            <div className="p-5 space-y-3">
                                <Skeleton className="h-5 w-3/4 rounded-md" />
                                <div className="flex gap-4">
                                    <Skeleton className="h-4 w-16 rounded-md" />
                                    <Skeleton className="h-4 w-16 rounded-md" />
                                </div>
                                <Skeleton className="h-3 w-24 rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
