'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAllWorkspaces, archiveWorkspace, unarchiveWorkspace, deleteWorkspace, toggleWorkspacePublicAccess } from '@/actions/admin/workspaces';
import { MagnifyingGlassIcon, BuildingOffice2Icon, UsersIcon, EllipsisVerticalIcon, ArchiveBoxIcon, TrashIcon, GlobeAltIcon, LockClosedIcon } from '@heroicons/react/24/outline';
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
        className="p-2 rounded-lg hover:bg-[var(--background-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <EllipsisVerticalIcon className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl shadow-lg py-1 z-50">
          <button
            onClick={() => handleAction(
              () => toggleWorkspacePublicAccess(workspaceId, !isPublic),
              `Workspace is now ${isPublic ? 'private' : 'public'}`
            )}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--background-subtle)]"
          >
            {isPublic ? <LockClosedIcon className="w-4 h-4" /> : <GlobeAltIcon className="w-4 h-4" />}
            {isPublic ? 'Make Private' : 'Make Public'}
          </button>
          <button
            onClick={() => handleAction(
              () => archiveWorkspace(workspaceId),
              'Workspace archived'
            )}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--background-subtle)]"
          >
            <ArchiveBoxIcon className="w-4 h-4" />
            Archive
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => {
                const confirmed = confirm('Are you sure you want to permanently delete this workspace?');
                if (!confirmed) return;
                handleAction(
                  () => deleteWorkspace(workspaceId),
                  'Workspace deleted'
                );
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
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
        setCanManage(true); // Client-side check would need different approach
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Workspaces</h1>
          <p className="text-[var(--text-secondary)]">Manage platform workspaces</p>
        </div>
        <div className="text-sm text-[var(--text-tertiary)]">
          {total.toLocaleString()} total workspaces
        </div>
      </div>

      {/* Search */}
      <form action={handleSearch} className="mb-6">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search workspaces..."
            className="w-full pl-12 pr-4 py-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all"
          />
        </div>
      </form>

      {/* Workspaces Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-[var(--text-secondary)]">Loading...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: workspace.accentColor || '#3b82f6' }}
                    >
                      <BuildingOffice2Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">{workspace.name}</h3>
                      <p className="text-sm text-[var(--text-tertiary)]">/{workspace.slug}</p>
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

                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-4">
                  <div className="flex items-center gap-1">
                    <UsersIcon className="w-4 h-4" />
                    <span>{workspace.memberCount} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {workspace.publicAccess ? (
                      <>
                        <GlobeAltIcon className="w-4 h-4 text-green-500" />
                        <span className="text-green-600 dark:text-green-400">Public</span>
                      </>
                    ) : (
                      <>
                        <LockClosedIcon className="w-4 h-4" />
                        <span>Private</span>
                      </>
                    )}
                  </div>
                </div>

                {workspace.owner && (
                  <div className="flex items-center gap-2 pt-4 border-t border-[var(--border-subtle)]">
                    <div className="w-6 h-6 rounded-full bg-[var(--background-subtle)] overflow-hidden">
                      {workspace.owner.image ? (
                        <img src={workspace.owner.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[var(--text-secondary)]">
                          {workspace.owner.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--text-tertiary)]">Owner</p>
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{workspace.owner.name}</p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-[var(--text-tertiary)] mt-4">
                  Created {workspace.createdAt ? new Date(workspace.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            ))}
          </div>

          {workspaces.length === 0 && (
            <div className="text-center py-12">
              <BuildingOffice2Icon className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)]">No workspaces found</p>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    const params = new URLSearchParams();
                    params.set('page', p.toString());
                    if (search) params.set('search', search);
                    router.push(`/admin/workspaces?${params.toString()}`);
                  }}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--background-subtle)]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
