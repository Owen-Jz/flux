import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getWorkspaceBySlug } from '@/actions/workspace';
import { getCalendarTasks } from '@/actions/task';
import { getUserRole } from '@/actions/access-control';
import { CalendarClient } from '@/components/calendar/CalendarClient';
import { getBoards } from '@/actions/board';

export default async function CalendarPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const session = await auth();
    const { slug } = await params;
    const workspace = await getWorkspaceBySlug(slug);
    if (!workspace) {
        redirect('/dashboard');
    }

    // Allow logged-out visitors only on public workspaces; otherwise → login.
    // Logged-in non-members of a public workspace fall through to the read-only
    // guest view (getUserRole returns null → CalendarClient renders read-only).
    if (!session?.user && !workspace.publicAccess) {
        redirect('/login');
    }

    const [tasks, userRole, boards] = await Promise.all([
        getCalendarTasks(slug),
        getUserRole(slug),
        getBoards(slug),
    ]);

    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">Calendar</h1>
                <p className="text-[var(--text-secondary)]">Tasks scheduled by due date</p>
            </div>
            <CalendarClient
                initialTasks={tasks}
                workspaceSlug={slug}
                userRole={userRole}
                boards={boards}
                members={workspace.members.map((m) => ({
                    id: m.userId,
                    name: m.user?.name || 'Unknown User',
                    email: m.user?.email || '',
                    image: m.user?.image,
                }))}
            />
        </div>
    );
}
