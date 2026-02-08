
import { Skeleton } from '@/components/ui/Skeleton';

export function WorkspaceSkeleton() {
    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in">
            <div className="flex items-end justify-between mb-8">
                <div className="space-y-4">
                    <Skeleton className="h-12 w-64 rounded-xl" />
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-32 rounded-md" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                </div>
                <Skeleton className="h-10 w-40 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="card p-6 h-32 flex items-start gap-4 hover:shadow-lg transition-shadow">
                        <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-3 pt-1">
                            <Skeleton className="h-5 w-3/4 rounded-md" />
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-full rounded-md opacity-60" />
                                <Skeleton className="h-3 w-2/3 rounded-md opacity-60" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
