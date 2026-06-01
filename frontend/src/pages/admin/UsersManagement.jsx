import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateUserStatus,
} from '../../api/admin.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import useAuthStore from '../../store/authStore';

const ROLES = ['All', 'PATIENT', 'DOCTOR', 'RECEPTIONIST', 'CLINIC_OWNER', 'SUPER_ADMIN'];
const ADMIN_LEVEL_OPTIONS = ['SUPER_ADMIN', 'SUPPORT', 'FINANCE'];

const ROLE_COLORS = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  CLINIC_OWNER: 'bg-purple-100 text-purple-700',
  DOCTOR: 'bg-blue-100 text-blue-700',
  RECEPTIONIST: 'bg-green-100 text-green-700',
  PATIENT: 'bg-gray-100 text-gray-700',
};

const UsersManagement = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1 });
  const [adminForm, setAdminForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    level: 'SUPPORT',
  });
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  const isRootAdmin = currentUser?.adminLevel === 'ROOT';
  const canToggleStandardUsers = ['ROOT', 'SUPER_ADMIN'].includes(currentUser?.adminLevel);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = { page: pagination.page, limit: 20 };
      if (roleFilter !== 'All') params.role = roleFilter;
      if (search) params.search = search;

      const res = await getAdminUsers(params);
      setUsers(res.data.data || []);
      setPagination((prev) => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch (_) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, pagination.page]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    setActionLoading(user.id);
    try {
      await updateUserStatus(user.id, !user.isActive);
      toast.success(`${user.name || 'User'} ${user.isActive ? 'disabled' : 'enabled'}`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();
    setIsCreatingAdmin(true);

    try {
      await createAdminUser(adminForm);
      toast.success('Admin account created');
      setAdminForm({
        fullName: '',
        phone: '',
        email: '',
        password: '',
        level: 'SUPPORT',
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create admin');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (user) => {
    const confirmed = window.confirm(`Delete admin account for ${user.email || user.name}?`);
    if (!confirmed) return;

    setActionLoading(`delete-${user.id}`);
    try {
      await deleteAdminUser(user.id);
      toast.success('Admin account deleted');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete admin');
    } finally {
      setActionLoading(null);
    }
  };

  const canToggleUser = (user) => {
    if (!canToggleStandardUsers || user.id === currentUser?.id) return false;
    if (user.role === 'SUPER_ADMIN') {
      return isRootAdmin && user.adminProfile?.level !== 'ROOT';
    }
    return true;
  };

  const canDeleteAdmin = (user) =>
    isRootAdmin &&
    user.role === 'SUPER_ADMIN' &&
    user.adminProfile?.level &&
    user.adminProfile.level !== 'ROOT' &&
    user.id !== currentUser?.id;

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-text-primary">User Management</h1>
          <p className="text-sm text-text-muted">
            Review users across the platform. Root admin can create, disable, and delete admin accounts.
          </p>
        </div>

        {isRootAdmin ? (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Root Controls</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Create Admin Account</h2>
              <p className="mt-2 text-sm text-slate-600">
                Create new admin users with only the level they need.
              </p>
            </div>

            <form onSubmit={handleCreateAdmin} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <input
                type="text"
                placeholder="Full name"
                className="input"
                value={adminForm.fullName}
                onChange={(event) => setAdminForm((current) => ({ ...current, fullName: event.target.value }))}
                required
              />
              <input
                type="text"
                placeholder="Phone (+91...)"
                className="input"
                value={adminForm.phone}
                onChange={(event) => setAdminForm((current) => ({ ...current, phone: event.target.value }))}
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="input"
                value={adminForm.email}
                onChange={(event) => setAdminForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
              <input
                type="password"
                placeholder="Strong password"
                className="input"
                value={adminForm.password}
                onChange={(event) => setAdminForm((current) => ({ ...current, password: event.target.value }))}
                required
              />
              <select
                className="input"
                value={adminForm.level}
                onChange={(event) => setAdminForm((current) => ({ ...current, level: event.target.value }))}
              >
                {ADMIN_LEVEL_OPTIONS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>

              <div className="md:col-span-2 xl:col-span-5 flex justify-end">
                <button type="submit" disabled={isCreatingAdmin} className="btn-primary px-6">
                  {isCreatingAdmin ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <form onSubmit={handleSearch} className="mb-4 flex gap-3">
          <input
            type="text"
            className="input flex-1"
            placeholder="Search by name, mobile, or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" className="btn-primary px-6">
            Search
          </button>
        </form>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                roleFilter === role ? 'bg-primary-600 text-white' : 'border border-border bg-white text-text-muted'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <p className="mb-4 text-sm text-text-muted">{pagination.total} users found</p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState icon="UM" title="No users found" description="Try adjusting your search filters." />
        ) : (
          <div className="space-y-3">
            {users.map((user) => {
              const toggleLoading = actionLoading === user.id;
              const deleteLoading = actionLoading === `delete-${user.id}`;

              return (
                <div key={user.id} className="card">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                        <span className="text-sm font-semibold text-primary-700">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-text-primary">{user.name || 'Unknown'}</p>
                          <span className={`badge text-xs ${ROLE_COLORS[user.role] || 'badge-gray'}`}>{user.role}</span>
                          {user.approvalStatus ? <StatusBadge status={user.approvalStatus} /> : null}
                          {user.adminProfile?.level ? <span className="badge badge-gray text-xs">{user.adminProfile.level}</span> : null}
                        </div>
                        <p className="text-sm text-text-muted">{user.mobile}</p>
                        {user.email ? <p className="text-xs text-text-muted">{user.email}</p> : null}
                        {user.rejectionReason ? <p className="mt-1 text-xs text-red-600">Reason: {user.rejectionReason}</p> : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>

                      {canToggleUser(user) ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          disabled={toggleLoading || deleteLoading}
                          className={`text-sm font-medium ${
                            user.isActive ? 'text-error hover:text-red-700' : 'text-secondary-600 hover:text-secondary-700'
                          }`}
                        >
                          {toggleLoading ? 'Saving...' : user.isActive ? 'Disable' : 'Enable'}
                        </button>
                      ) : null}

                      {canDeleteAdmin(user) ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteAdmin(user)}
                          disabled={toggleLoading || deleteLoading}
                          className="text-sm font-medium text-red-700 hover:text-red-800"
                        >
                          {deleteLoading ? 'Deleting...' : 'Delete Admin'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UsersManagement;
