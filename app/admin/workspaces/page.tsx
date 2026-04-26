'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllWorkspaces, archiveWorkspace, unarchiveWorkspace, deleteWorkspace, toggleWorkspacePublicAccess } from '@/actions/admin/workspaces';
import { MagnifyingGlassIcon, BuildingOffice2Icon, UsersIcon, EllipsisVerticalIcon, ArchiveBoxIcon, TrashIcon, GlobeAltIcon, LockClosedIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface Workspace {
    id: string;
    name: string;
    slug: string;
    accentColor: string | null;
    publicAccess: boolean;
    memberCount: number;
    owner: {
        name: string | null;
        image: string | null;
    } | null;
    createdAt: string | null;
}

function WorkspaceActions({
    workspaceId,
    workspaceName,
    isPublic,
    isSuperAdmin,
}: {
    workspaceId: string;
    workspaceName: string;
    isPublic: boolean;
    isSuperAdmin: boolean;
}) {
    const [open, setOpen] = useState(false);

    const handleAction = async (action: () => Promise<void>, successMsg: string) => {
        try {
            await action();
            toast.success(successMsg);
            window.location.reload();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Action failed');
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
                <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl py-1 z-50"
                    >
                        <button
                            onClick={() => {
                                setOpen(false);
                                handleAction(
                                    () => toggleWorkspacePublicAccess(workspaceId, !isPublic),
                                    `Workspace is now ${isPublic ? 'private' : 'public'}`
                                );
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                        >
                            {isPublic ? <LockClosedIcon className="w-4 h-4" /> : <GlobeAltIcon className="w-4 h-4" />}
                            {isPublic ? 'Make Private' : 'Make Public'}
                        </button>
                        <button
                            onClick={() => {
                                setOpen(false);
                                handleAction(
                                    () => archiveWorkspace(workspaceId),
                                    'Workspace archived'
                                );
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
                        >
                            <ArchiveBoxIcon className="w-4 h-4" />
                            Archive
                        </button>
                        {isSuperAdmin && (
                            <button
                                onClick={() => {
                                    setOpen(false);
                                    const confirmed = confirm('Are you sure you want to permanently delete this workspace?');
                                    if (!confirmed) return;
                                    handleAction(
                                        () => deleteWorkspace(workspaceId),
                                        'Workspace deleted'
                                    );
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                            >
                                <TrashIcon className="w-4 h-4" />
                                Delete
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function AnimatedSkeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse bg-zinc-800 rounded ${className}`} />;
}

export default function AdminWorkspacesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [canManage, setCanManage] = useState(false);

    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const result = await getAllWorkspaces({
                    page,
                    limit: 20,
                    search,
                });
                setWorkspaces(result.workspaces as any);
                setTotal(result.total);
                setPages(result.pages);
                setCanManage(true);
            } catch (error) {
                console.error('Failed to fetch workspaces:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [page, search]);

    const handleSearch = (formData: FormData) => {
        const search = formData.get('search') as string;
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        router.push(`/admin/workspaces?${params.toString()}`);
    };

    const clearFilters = () => {
        router.push('/admin/workspaces');
    };

    return (
        <div className="p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
            >
                <div>
                    <h1 className="text-2xl font-bold text-zinc-50">Workspaces</h1>
                    <p className="text-zinc-500">Manage platform workspaces</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                    {total.toLocaleString()} total workspaces
                </div>
            </motion.div>

            {/* Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
            >
                <form action={handleSearch} className="flex items-center gap-4">
                    <div className="flex-1 max-w-md relative">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                            type="text"
                            name="search"
                            defaultValue={search}
                            placeholder="Search workspaces..."
                            className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        className="px-4 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-medium rounded-xl hover:from-violet-600 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/20"
                    >
                        Search
                    </button>

                    {search && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="flex items-center gap-2 px-4 py-3 text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                            Clear
                        </button>
                    )}
                </form>

                {/* Active filters */}
                <AnimatePresence>
                    {search && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 mt-3"
                        >
                            <span className="px-3 py-1 bg-zinc-800 text-zinc-300 text-sm rounded-full flex items-center gap-1">
                                Search: {search}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Workspaces Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <AnimatedSkeleton className="w-10 h-10 rounded-xl" />
                                    <div className="space-y-2">
                                        <AnimatedSkeleton className="h-4 w-24" />
                                        <AnimatedSkeleton className="h-3 w-16" />
                                    </div>
                                </div>
                            </div>
                            <AnimatedSkeleton className="h-4 w-full mb-4" />
                            <AnimatedSkeleton className="h-8 w-full" />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {workspaces.map((workspace, index) => (
                            <motion.div
                                key={workspace.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-all"
                            >
                                {/* Subtle glow on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                                                style={{
                                                    backgroundColor: workspace.accentColor || '#3b82f6',
                                                    boxShadow: `0 4px 12px ${workspace.accentColor || '#3b82f6'}40`
                                                }}
                                            >
                                                <BuildingOffice2Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-zinc-200 group-hover:text-zinc-50 transition-colors">{workspace.name}</h3>
                                                <p className="text-sm text-zinc-500">/{workspace.slug}</p>
                                            </div>
                                        </div>
                                        {canManage && (
                                            <WorkspaceActions
                                                workspaceId={workspace.id}
                                                workspaceName={workspace.name}
                                                isPublic={workspace.publicAccess}
                                                isSuperAdmin={true}
                                            />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4">
                                        <div className="flex items-center gap-1">
                                            <UsersIcon className="w-4 h-4" />
                                            <span>{workspace.memberCount} members</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {workspace.publicAccess ? (
                                                <>
                                                    <GlobeAltIcon className="w-4 h-4 text-green-400" />
                                                    <span className="text-green-400">Public</span>
                                                </>
                                            ) : (
                                                <>
                                                    <LockClosedIcon className="w-4 h-4 text-zinc-500" />
                                                    <span className="text-zinc-500">Private</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {workspace.owner && (
                                        <div className="flex items-center gap-2 pt-4 border-t border-zinc-800/50">
                                            <div className="w-6 h-6 rounded-full bg-zinc-800 overflow-hidden ring-2 ring-zinc-900">
                                                {workspace.owner.image ? (
                                                    <img src={workspace.owner.image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                                        {workspace.owner.name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-zinc-500">Owner</p>
                                                <p className="text-sm font-medium text-zinc-300 truncate">{workspace.owner.name}</p>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-xs text-zinc-600 mt-4">
                                        Created {workspace.createdAt ? new Date(workspace.createdAt).toLocaleDateString() : 'N/A'}
                                    </p>

                                    {/* Accent line at bottom */}
                                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {workspaces.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                        >
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center">
                                <BuildingOffice2Icon className="w-6 h-6 text-zinc-600" />
                            </div>
                            <p className="text-zinc-500">No workspaces found</p>
                        </motion.div>
                    )}

                    {/* Pagination */}
                    <AnimatePresence>
                        {pages > 1 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="flex items-center justify-center gap-2 mt-6"
                            >
                                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => {
                                            const params = new URLSearchParams();
                                            params.set('page', p.toString());
                                            if (search) params.set('search', search);
                                            router.push(`/admin/workspaces?${params.toString()}`);
                                        }}
                                        className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                                            p === page
                                                ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20'
                                                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
}