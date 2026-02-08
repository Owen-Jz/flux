
import { Skeleton } from '@/components/ui/Skeleton';

export function BoardSkeleton() {
    return (
        <div className="h-full flex flex-col animate-fade-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface)] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-6 h-6 rounded-md" />
                    <Skeleton className="h-6 w-48 rounded-md" />
                    <Skeleton className="h-4 w-64 rounded-md hidden md:block opacity-60" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 mr-2">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="w-8 h-8 rounded-full border-2 border-white" />
                        ))}
                    </div>
                    <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
            </div>

            {/* Columns */}
            <div className="flex-1 overflow-hidden p-6">
                <div className="flex gap-6 h-full overflow-x-auto pb-4">
                    {[1, 2, 3, 4].map((col) => (
                        <div key={col} className="w-80 flex-shrink-0 flex flex-col h-full">
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-4 px-1">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="w-3 h-3 rounded-full" />
                                    <Skeleton className="h-5 w-24 rounded-md" />
                                    <Skeleton className="h-5 w-6 rounded-full opacity-50" />
                                </div>
                                <Skeleton className="w-6 h-6 rounded-md opacity-50" />
                            </div>

                            {/* Task Cards */}
                            <div className="space-y-3 overflow-y-auto pr-2 pb-2">
                                {[1, 2, 3].map((task) => (
                                    <div key={task} className="card p-4 space-y-3 bg-white">
                                        <div className="flex justify-between items-start">
                                            <Skeleton className="h-4 w-3/4 rounded-md" />
                                            <Skeleton className="w-6 h-6 rounded-md opacity-30" />
                                        </div>
                                        <Skeleton className="h-3 w-full rounded-md opacity-50" />
                                        <div className="flex items-center justify-between pt-2">
                                            <Skeleton className="h-5 w-16 rounded-full" />
                                            <Skeleton className="w-6 h-6 rounded-full" />
                                        </div>
                                    </div>
                                ))}
                                {/* Add Task Button Placeholder */}
                                <Skeleton className="h-10 w-full rounded-lg opacity-30" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
