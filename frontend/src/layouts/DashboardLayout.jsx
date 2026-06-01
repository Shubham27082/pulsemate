import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

// SVG icon components
const Icon = {
  Home: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Calendar: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Pill: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>,
  User: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Chart: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Hospital: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Queue: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  Walk: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Refresh: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Logout: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Menu: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>,
  Close: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
};

const NAV_ITEMS = {
  SUPER_ADMIN: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: Icon.Chart },
    { path: '/admin/clinics', label: 'Clinics',      icon: Icon.Hospital },
    { path: '/admin/users',   label: 'Users',        icon: Icon.Users    },
  ],
  CLINIC_OWNER: [
    { path: '/clinic/dashboard', label: 'Dashboard', icon: Icon.Chart },
    { path: '/clinic/profile', label: 'My Clinic', icon: Icon.Hospital },
    { path: '/clinic/doctors', label: 'Doctors', icon: Icon.User },
    { path: '/clinic/receptionists', label: 'Receptionists', icon: Icon.Users },
    { path: '/clinic/appointments', label: 'Appointments', icon: Icon.Calendar },
    { path: '/clinic/queue', label: 'Queue', icon: Icon.Queue },
  ],
  DOCTOR: [
    { path: '/doctor/dashboard',    label: 'Dashboard',    icon: Icon.Chart    },
    { path: '/doctor/appointments', label: 'Appointments', icon: Icon.Calendar },
    { path: '/doctor/queue',        label: 'My Queue',     icon: Icon.Queue    },
    { path: '/doctor/profile',      label: 'Profile',      icon: Icon.User     },
  ],
  RECEPTIONIST: [
    { path: '/receptionist/dashboard', label: 'Dashboard', icon: Icon.Chart },
    { path: '/receptionist/queue', label: "Today's Queue", icon: Icon.Queue },
    { path: '/receptionist/walk-in', label: 'Walk-in', icon: Icon.Walk },
    { path: '/receptionist/follow-up', label: 'Follow-up', icon: Icon.Refresh },
  ],
  PATIENT: [
    { path: '/patient/home',          label: 'Home',         icon: Icon.Home     },
    { path: '/patient/search',        label: 'Find Doctors', icon: Icon.Search   },
    { path: '/patient/appointments',  label: 'Appointments', icon: Icon.Calendar },
    { path: '/patient/prescriptions', label: 'Prescriptions',icon: Icon.Pill     },
    { path: '/patient/profile',       label: 'Profile',      icon: Icon.User     },
  ],
};

const ROLE_LABEL = {
  SUPER_ADMIN: 'Super Admin', CLINIC_OWNER: 'Clinic Owner',
  DOCTOR: 'Doctor', RECEPTIONIST: 'Receptionist', PATIENT: 'Patient',
};

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate  = useNavigate();

  const hasLimitedAccess = ['DOCTOR', 'CLINIC_OWNER'].includes(user?.role) && user?.status && user.status !== 'VERIFIED';
  let navItems = hasLimitedAccess
    ? (NAV_ITEMS[user?.role] || []).filter((item) => item.path === (user?.role === 'DOCTOR' ? '/doctor/dashboard' : '/clinic/dashboard'))
    : (NAV_ITEMS[user?.role] || []);

  if (user?.role === 'SUPER_ADMIN') {
    if (user?.adminLevel === 'FINANCE') {
      navItems = navItems.filter((item) => ['/admin/dashboard', '/admin/users'].includes(item.path));
    } else if (user?.adminLevel === 'SUPPORT') {
      navItems = navItems.filter((item) => ['/admin/dashboard', '/admin/clinics', '/admin/users'].includes(item.path));
    }
  }

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const isActive = (path) => {
    const roots = ['/patient/home', '/doctor/dashboard', '/clinic/dashboard', '/admin/dashboard', '/receptionist/dashboard'];
    if (roots.includes(path)) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-none">PulseMate</p>
            <p className="text-xs text-gray-400 mt-0.5">{ROLE_LABEL[user?.role]}</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className={active ? 'text-primary-600' : 'text-gray-400'}>
                    <item.icon />
                  </span>
                  {item.label}
                  {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-semibold text-xs">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.phone}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <Icon.Logout />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 z-10">
        <Sidebar />
      </div>

      {/* Sidebar — mobile drawer */}
      <div className={`fixed inset-y-0 left-0 w-64 z-30 transform transition-transform duration-300 lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar />
      </div>

      {/* Main */}
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 lg:px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Icon.Menu />
          </button>

          {/* Page title from nav */}
          <p className="text-sm font-semibold text-gray-900 hidden sm:block">
            {navItems.find((n) => isActive(n.path))?.label || 'PulseMate'}
          </p>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-semibold text-xs">{initials}</span>
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
