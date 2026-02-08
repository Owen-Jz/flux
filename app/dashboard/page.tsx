import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaces } from '@/actions/workspace';

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const workspaces = await getWorkspaces();

    if (workspaces.length === 0) {
        redirect('/onboarding');
    }

    // Redirect to first workspace
    redirect(`/${workspaces[0].slug}`);
}
