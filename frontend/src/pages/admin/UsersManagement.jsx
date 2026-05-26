import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getAdminUsers, updateUserStatus } from '../../api/admin.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const ROLES = ['All', 'PATIENT', 'DOCTOR', 'RECEPTIONIST', 'CLINIC_OWNER', 'SUPER_ADMIN'];

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1 });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = { page: pagination.page, limit: 20 };
      if (roleFilter !== 'All') params.role = roleFilter;
      if (search) params.search = search;
      const res = await getAdminUsers(params);
      setUsers(res.data.data || []);
      setPagination((prev) => ({ ...prev, total: res.data.pagination?.total || 0 }));
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [roleFilter, pagination.page]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    setActionLoading(userId);
    try {
      await updateUserStatus(userId, !currentStatus);
      toast.success(`User ${!currentStatus ? 'enabled' : 'disabled'}`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const ROLE_COLORS = {
    SUPER_ADMIN: 'bg-red-100 text-red-700',
    CLINIC_OWNER: 'bg-purple-100 text-purple-700',
    DOCTOR: 'bg-blue-100 text-blue-700',
    RECEPTIONIST: 'bg-green-100 text-green-700',
    PATIENT: 'bg-gray-100 text-gray-700',
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <h1 className="text-2xl font-bold text-text-primary mb-6">User Management</h1>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <input
            type="text"
            className="input flex-1"
            placeholder="Search by name, mobile, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-primary px-6">Search</button>
        </form>

        {/* Role filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                roleFilter === role ? 'bg-primary-600 text-white' : 'bg-white border border-border text-text-muted'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <p className="text-sm text-text-muted mb-4">{pagination.total} users found</p>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : users.length === 0 ? (
          <EmptyState icon="👥" title="No users found" description="Try adjusting your search filters" />
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="card">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-semibold text-sm">
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-text-primary">{user.name || 'Unknown'}</p>
                        <span className={`badge text-xs ${ROLE_COLORS[user.role] || 'badge-gray'}`}>
                          {user.role}
                        </span>
                      </div>
                      <p className="text-sm text-text-muted">{user.mobile}</p>
                      {user.email && <p className="text-xs text-text-muted">{user.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(user.id, user.isActive)}
                      disabled={actionLoading === user.id}
                      className={`text-sm font-medium ${user.isActive ? 'text-error hover:text-red-700' : 'text-secondary-600 hover:text-secondary-700'}`}
                    >
                      {actionLoading === user.id ? <LoadingSpinner size="sm" /> : (user.isActive ? 'Disable' : 'Enable')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UsersManagement;
