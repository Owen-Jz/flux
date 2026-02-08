import { auth } from '@/lib/auth';
import { getArchivedTasks } from '@/actions/task';
import { redirect } from 'next/navigation';
import { ArchiveList } from './archive-list';
import { Archive as ArchiveIcon } from 'lucide-react';

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
        <div className="flex flex-col h-full bg-[var(--background)] p-8">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                        <ArchiveIcon className="w-5 h-5" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
                        Archive
                    </h1>
                </div>
                <p className="text-[var(--text-secondary)] text-lg max-w-2xl font-normal ml-14">
                    View and restore tasks that have been archived from your boards.
                </p>
            </div>

            <ArchiveList initialTasks={tasks as any} workspaceSlug={slug} />
        </div>
    );
}
