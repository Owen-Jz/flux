
import { Skeleton } from '@/components/ui/Skeleton';

export function WorkspaceSkeleton() {
    return (
        <div className="mx-auto max-w-6xl animate-fade-in px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-10 w-64 rounded-xl" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-10 w-40 rounded-lg" />
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-[72px] rounded-2xl" />
                ))}
            </div>

            {/* Board grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="card p-4 md:p-5">
                        <div className="flex items-start gap-3 md:gap-4">
                            <Skeleton className="h-10 w-10 flex-shrink-0 rounded-lg" />
                            <div className="flex-1 space-y-2 pt-1">
                                <Skeleton className="h-4 w-3/4 rounded-md" />
                                <Skeleton className="h-3 w-full rounded-md opacity-60" />
                            </div>
                        </div>
                        <div className="mt-4 space-y-2 border-t border-[var(--border-subtle)] pt-3">
                            <Skeleton className="h-3 w-24 rounded-md" />
                            <Skeleton className="h-1.5 w-full rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
