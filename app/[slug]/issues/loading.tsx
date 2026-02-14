import { Skeleton } from "@/components/ui/Skeleton";

export default function IssuesLoading() {
    return (
        <div className="flex-1 h-full bg-[var(--background)] flex flex-col p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-4 border border-[var(--border-subtle)] rounded-lg bg-[var(--surface)]">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <Skeleton className="h-4 w-20" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-96" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-24" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
