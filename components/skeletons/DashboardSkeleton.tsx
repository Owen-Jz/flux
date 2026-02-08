
import { Skeleton } from '@/components/ui/Skeleton';

export function DashboardSkeleton() {
    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-48 rounded-lg" />
                    <Skeleton className="h-4 w-64 rounded-md" />
                </div>
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="card p-6 h-48 flex flex-col justify-between border-[var(--border-subtle)]">
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="w-12 h-12 rounded-xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-32 rounded-md" />
                                        <Skeleton className="h-3 w-24 rounded-md" />
                                    </div>
                                </div>
                            </div>
                            <Skeleton className="h-16 w-full rounded-md opacity-50" />
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
                            <Skeleton className="h-4 w-20 rounded-md" />
                            <div className="flex -space-x-2">
                                <Skeleton className="w-8 h-8 rounded-full border-2 border-white" />
                                <Skeleton className="w-8 h-8 rounded-full border-2 border-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
