
import { Skeleton } from '@/components/ui/Skeleton';

export function TeamSkeleton() {
    return (
        <div className="p-8 max-w-4xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-32 rounded-lg" />
                    <Skeleton className="h-4 w-64 rounded-md" />
                </div>
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>

            {/* Stats/Pending Requests Area */}
            <div className="mb-8 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-48 rounded-md" />
                        <Skeleton className="h-4 w-full max-w-md rounded-md opacity-60" />
                    </div>
                </div>
            </div>

            {/* Team Table */}
            <div className="card overflow-hidden">
                <div className="bg-[var(--surface)] border-b border-[var(--border-subtle)] px-6 py-4 flex gap-4">
                    <Skeleton className="h-4 w-24 opacity-60" />
                    <Skeleton className="h-4 w-24 opacity-60 ml-auto mr-32" />
                    <Skeleton className="h-4 w-16 opacity-60 ml-auto" />
                </div>
                <div className="divide-y divide-[var(--border-subtle)]">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Skeleton className="w-10 h-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32 rounded-md" />
                                    <Skeleton className="h-3 w-48 rounded-md opacity-60" />
                                </div>
                            </div>
                            <div className="flex items-center gap-12">
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-8 w-16 rounded-md opacity-30" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
