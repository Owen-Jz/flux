import { auth } from '@/lib/auth';
import { getWorkspaceBySlug } from '@/actions/workspace';
import { getWorkspaceAnalytics } from '@/actions/analytics';
import { AnalyticsSection } from '@/components/analytics/analytics-section';

export default async function AnalyticsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const session = await auth();
    const { slug } = await params;

    const workspace = await getWorkspaceBySlug(slug);
    if (!workspace) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-[var(--text-secondary)]">Workspace not found</p>
            </div>
        );
    }

    // Fetch analytics data
    const analytics = await getWorkspaceAnalytics(workspace.id.toString());

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto overflow-y-auto">
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">Analytics</h1>
                <p className="text-[var(--text-secondary)]">
                    Track your workspace performance and team productivity
                </p>
            </div>

            {/* Analytics Section - show when there are tasks */}
            {analytics && analytics.totalTasks > 0 ? (
                <AnalyticsSection analytics={analytics} />
            ) : (
                <div className="text-center py-16">
                    <p className="text-[var(--text-secondary)]">
                        No analytics data available yet. Create tasks to see insights.
                    </p>
                </div>
            )}
        </div>
    );
}
