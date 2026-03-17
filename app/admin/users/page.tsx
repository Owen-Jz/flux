'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAllUsers } from '@/actions/admin/users';
import { MagnifyingGlassIcon, ShieldCheckIcon, TrashIcon, PauseCircleIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { UserActionButton } from '@/components/admin/user-actions';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  plan: string | null;
  subscriptionStatus: string | null;
  createdAt: string | null;
}

function UserActions({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [open, setOpen] = useState(false);

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
          <UserActionButton
            userId={userId}
            action="view"
            label="View Details"
            icon={ShieldCheckIcon}
          />
          <UserActionButton
            userId={userId}
            action="change-plan"
            label="Change Plan"
            icon={CreditCardIcon}
          />
          <UserActionButton
            userId={userId}
            action="suspend"
            label="Suspend User"
            icon={PauseCircleIcon}
          />
          <UserActionButton
            userId={userId}
            action="delete"
            label="Delete User"
            icon={TrashIcon}
            destructive
          />
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const plan = searchParams.get('plan') || '';

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const result = await getAllUsers({
          page,
          limit: 20,
          search,
          plan: plan || undefined,
        });
        setUsers(result.users as any);
        setTotal(result.total);
        setPages(result.pages);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [page, search, plan]);

  const handleSearch = (formData: FormData) => {
    const search = formData.get('search') as string;
    const plan = formData.get('plan') as string;
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (plan) params.set('plan', plan);
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Users</h1>
          <p className="text-[var(--text-secondary)]">Manage platform users</p>
        </div>
        <div className="text-sm text-[var(--text-tertiary)]">
          {total.toLocaleString()} total users
        </div>
      </div>

      {/* Filters */}
      <form action={handleSearch} className="flex items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search users..."
              className="w-full pl-12 pr-4 py-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all"
            />
          </div>
        </div>
        <select
          name="plan"
          defaultValue={plan}
          className="px-4 py-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)] transition-all"
        >
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <button type="submit" className="px-4 py-3 bg-[var(--brand-primary)] text-white rounded-xl hover:opacity-90 transition-opacity">
          Filter
        </button>
      </form>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-[var(--text-secondary)]">Loading...</div>
        </div>
      ) : (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--background-subtle)] border-b border-[var(--border-subtle)]">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Plan</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Joined</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[var(--background-subtle)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--background-subtle)] overflow-hidden">
                        {user.image ? (
                          <img src={user.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[var(--text-secondary)]">
                            {user.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{user.name || 'Unknown'}</p>
                        <p className="text-sm text-[var(--text-tertiary)]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--background-subtle)] text-[var(--text-secondary)] capitalize">
                      {user.plan || 'free'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.subscriptionStatus === 'active' ? (
                      <span className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-xs font-medium text-[var(--text-tertiary)]">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        {user.subscriptionStatus || 'N/A'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <UserActions userId={user.id} userEmail={user.email} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                if (plan) params.set('plan', plan);
                router.push(`/admin/users?${params.toString()}`);
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
    </div>
  );
}
