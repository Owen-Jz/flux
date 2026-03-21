import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaceBySlug } from '@/actions/workspace';
import { getUserRole, deleteWorkspace } from '@/actions/access-control';
import { Cog6ToothIcon, GlobeAltIcon, ShieldCheckIcon, TrashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { SettingsClient } from './settings-client';

export default async function SettingsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const session = await auth();
    const { slug } = await params;
    const workspace = await getWorkspaceBySlug(slug);
    const userRole = await getUserRole(slug);

    if (!workspace) {
        redirect('/dashboard');
    }

    // Only ADMIN can access settings
    if (userRole !== 'ADMIN') {
        return (
            <div className="p-4 md:p-8 max-w-3xl mx-auto">
                <div className="card p-6 md:p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-6">
                        <LockClosedIcon className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Access Denied</h1>
                    <p className="text-[var(--text-secondary)] max-w-md mx-auto">
                        Only the workspace admin can access settings. Contact the workspace admin if you need changes made.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <SettingsClient
            workspace={{
                name: workspace.name,
                slug: workspace.slug,
                publicAccess: workspace.publicAccess,
                accentColor: workspace.accentColor,
                icon: workspace.icon,
            }}
        />
    );
}
