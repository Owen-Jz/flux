
import { Skeleton } from '@/components/ui/Skeleton';

export function SettingsSkeleton() {
    return (
        <div className="p-8 max-w-3xl mx-auto animate-fade-in">
            <div className="mb-8 space-y-3">
                <Skeleton className="h-8 w-40 rounded-lg" />
                <Skeleton className="h-4 w-64 rounded-md" />
            </div>

            <div className="space-y-6">
                {/* General Settings Section */}
                <div className="card p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Skeleton className="w-5 h-5 rounded-md" />
                        <Skeleton className="h-5 w-32 rounded-md" />
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32 rounded-md" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32 rounded-md" />
                            <Skeleton className="h-12 w-full rounded-lg opacity-60" />
                        </div>
                    </div>
                </div>

                {/* Visibility Section */}
                <div className="card p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-lg opacity-20" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-40 rounded-md" />
                            <Skeleton className="h-3 w-64 rounded-md opacity-60" />
                        </div>
                    </div>
                    <Skeleton className="h-7 w-12 rounded-full" />
                </div>

                {/* Integration/Security Section (Placeholder style) */}
                <div className="card p-6 opacity-60">
                    <div className="flex items-center gap-3 mb-4">
                        <Skeleton className="w-5 h-5 rounded-md" />
                        <Skeleton className="h-5 w-24 rounded-md" />
                    </div>
                    <Skeleton className="h-3 w-full rounded-md" />
                </div>

                {/* Danger Zone */}
                <div className="card p-6 border-red-100 bg-red-50/10 flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-4 h-4 rounded-full bg-red-200" />
                            <Skeleton className="h-5 w-32 rounded-md bg-red-100" />
                        </div>
                        <Skeleton className="h-3 w-64 rounded-md bg-red-50" />
                    </div>
                    <Skeleton className="h-9 w-24 rounded-lg bg-red-100" />
                </div>
            </div>
        </div>
    );
}
