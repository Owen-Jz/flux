import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getCurrentAdmin } from '@/lib/admin-auth';
import { Squares2X2Icon, UsersIcon, BuildingOffice2Icon, ChartBarIcon } from '@heroicons/react/24/outline';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const admin = await getCurrentAdmin();

    if (!admin) {
        redirect('/dashboard');
    }

    const navItems = [
        { href: '/admin', label: 'Dashboard', icon: Squares2X2Icon, exact: true },
        { href: '/admin/users', label: 'Users', icon: UsersIcon },
        { href: '/admin/workspaces', label: 'Workspaces', icon: BuildingOffice2Icon },
        { href: '/admin/analytics', label: 'Analytics', icon: ChartBarIcon },
    ];

    return (
        <div className="flex h-screen bg-[var(--background)]">
            {/* Sidebar */}
            <aside className="w-64 bg-[var(--surface)] border-r border-[var(--border-subtle)] flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-[var(--border-subtle)]">
                    <Link href="/admin" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <span className="text-white font-bold text-lg">F</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-[var(--text-primary)]">Flux Admin</h1>
                            <p className="text-xs text-[var(--text-tertiary)]">Platform Management</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                item.exact
                                    ? 'bg-[var(--brand-primary)] text-white shadow-lg shadow-[var(--brand-primary)]/20'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--background-subtle)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Admin Info */}
                <div className="p-4 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--background-subtle)] overflow-hidden">
                            {admin.user?.image ? (
                                <img src={admin.user.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[var(--text-secondary)]">
                                    {admin.user?.name?.charAt(0) || 'A'}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                {admin.user?.name || 'Admin'}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)] truncate">
                                {admin.role.replace('_', ' ')}
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
