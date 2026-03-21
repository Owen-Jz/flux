import { auth } from '@/lib/auth';
import { getArchivedTasks } from '@/actions/task';
import { redirect } from 'next/navigation';
import { ArchiveList } from './archive-list';
import { ArchiveBoxIcon } from '@heroicons/react/24/outline';

export default async function ArchivePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const session = await auth();
    if (!session?.user) {
        redirect('/login');
    }

    const { slug } = await params;
    const tasks = await getArchivedTasks(slug);

    return (
        <div className="flex flex-col h-full bg-[var(--background)] p-4 md:p-6 lg:p-8 overflow-x-hidden">
            <div className="mb-6 md:mb-8 max-w-4xl">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[var(--background-subtle)] flex items-center justify-center text-[var(--text-secondary)]">
                        <ArchiveBoxIcon className="w-5 h-5" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
                        Archive
                    </h1>
                </div>
                <p className="text-[var(--text-secondary)] text-base md:text-lg max-w-2xl font-normal ml-14">
                    View and restore tasks that have been archived from your boards.
                </p>
            </div>

            <div className="max-w-6xl">
                <ArchiveList initialTasks={tasks as any} workspaceSlug={slug} />
            </div>
        </div>
    );
}
