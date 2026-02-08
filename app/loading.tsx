
import Image from 'next/image';

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
            <div className="flex flex-col items-center gap-4">
                <Image
                    src="/icon.svg"
                    alt="Loading..."
                    width={48}
                    height={48}
                    className="animate-pulse"
                />
            </div>
        </div>
    );
}
