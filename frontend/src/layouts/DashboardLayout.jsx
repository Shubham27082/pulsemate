import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getMyNotifications } from '../api/notification.api';
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
  Bell: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
};

const NAV_ITEMS = {
  SUPER_ADMIN: [
    { path: '/admin/dashboard',      label: 'Dashboard',     icon: Icon.Chart    },
    { path: '/admin/clinics/verify', label: 'Clinics',       icon: Icon.Hospital },
    { path: '/admin/users',          label: 'Users',         icon: Icon.Users    },
    { path: '/admin/notifications',  label: 'Notifications', icon: Icon.Bell     },
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
    { path: '/doctor/schedule',     label: 'Schedule',     icon: Icon.Calendar },
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
    { path: '/patient/profile',       label: 'Profile',      icon: Icon.User     },
  ],
};

const ROLE_LABEL = {
  SUPER_ADMIN: 'Super Admin', CLINIC_OWNER: 'Clinic Owner',
  DOCTOR: 'Doctor', RECEPTIONIST: 'Receptionist', PATIENT: 'Patient',
};

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate  = useNavigate();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const res = await getMyNotifications();
        if (!cancelled) setUnreadCount(res.data.data.unreadCount || 0);
      } catch {}
    };

    fetchUnread();

    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchUnread, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  // Refresh unread count whenever user navigates to a new page
  // (catching the case where they just came back from NotificationsPage)
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await getMyNotifications();
        setUnreadCount(res.data.data.unreadCount || 0);
      } catch {}
    };
    fetchUnread();
  }, [location.pathname, user]);

  const hasLimitedAccess = ['DOCTOR', 'CLINIC_OWNER'].includes(user?.role) && user?.status && user.status !== 'VERIFIED';
  let navItems = hasLimitedAccess
    ? (NAV_ITEMS[user?.role] || []).filter((item) => item.path === (user?.role === 'DOCTOR' ? '/doctor/dashboard' : '/clinic/dashboard'))
    : (NAV_ITEMS[user?.role] || []);

  if (user?.role === 'SUPER_ADMIN') {
    if (user?.adminLevel === 'FINANCE') {
      navItems = navItems.filter((item) => ['/admin/dashboard', '/admin/users'].includes(item.path));
    } else if (user?.adminLevel === 'SUPPORT') {
      navItems = navItems.filter((item) => ['/admin/dashboard', '/admin/clinics/verify', '/admin/users', '/admin/notifications'].includes(item.path));
    }
  }

  const handleLogout = async () => {
    const role = user?.role;
    await logout();
    toast.success('Signed out');
    if (role === 'SUPER_ADMIN') {
      navigate('/admin');
    } else if (role === 'PATIENT') {
      navigate('/login');
    } else {
      navigate('/portal');
    }
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
    <aside className="flex flex-col h-full" style={{ backgroundColor: '#1e293b' }}>
      {/* Logo */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h3l3-7 4 14 3-7h5" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight tracking-tight">PulseMate</p>
            <p className="text-[11px] text-blue-300 font-medium">{ROLE_LABEL[user?.role]}</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {user?.role === 'SUPER_ADMIN' && (
          <p className="px-3 mb-2.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.7)' }}>
            Admin Panel
          </p>
        )}
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className={`flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`}>
                    <item.icon />
                  </span>
                  <span className="flex-1">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + logout */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">{user?.name || 'User'}</p>
            <p className="text-[11px] text-slate-400 truncate">{ROLE_LABEL[user?.role]}</p>
          </div>
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-150"
        >
          <Icon.Logout />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop (fixed, 260px) */}
      <div className="hidden lg:flex lg:flex-col lg:w-[260px] lg:fixed lg:inset-y-0 z-10">
        <Sidebar />
      </div>

      {/* Sidebar — mobile drawer */}
      <div className={`fixed inset-y-0 left-0 w-[260px] z-30 transform transition-transform duration-300 ease-out lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar />
      </div>

      {/* Main */}
      <div className="flex-1 lg:pl-[260px] flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 lg:px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Icon.Menu />
          </button>

          {/* Breadcrumb / page label */}
          <div className="hidden sm:flex items-center gap-1.5 text-sm">
            <span className="text-gray-400 font-medium">PulseMate</span>
            <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            <span className="text-gray-400 font-medium">
              {navItems.find((n) => isActive(n.path))?.label || 'Dashboard'}
            </span>
            {/* Show sub-page if we're deeper */}
            {location.pathname !== (navItems.find((n) => isActive(n.path))?.path || '') && (
              <>
                <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                <span className="font-semibold text-gray-800">
                  {location.pathname.includes('verify') ? 'Clinic Verification' : ''}
                </span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Notification bell */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center px-1">
                  <span className="text-white text-[9px] font-bold leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              )}
            </button>

            {/* User avatar + name */}
            <div className="flex items-center gap-2.5 cursor-pointer group">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">{initials}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  {user?.name?.split(' ')[0] || 'Admin'}
                </p>
                <p className="text-[11px] text-gray-400 leading-tight">{ROLE_LABEL[user?.role]}</p>
              </div>
              <svg className="hidden sm:block w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
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
