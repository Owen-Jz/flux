
import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[var(--brand-primary)] opacity-80" />
                <p className="text-[var(--text-secondary)] text-sm animate-pulse">Loading...</p>
            </div>
        </div>
    );
}
