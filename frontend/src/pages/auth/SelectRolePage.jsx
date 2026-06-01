import { useNavigate } from 'react-router-dom';

const ROLES = [
  {
    key: 'patient',
    label: 'Patient',
    desc: 'Book appointments, track queue, view prescriptions',
    color: 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:bg-blue-100',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    key: 'doctor',
    label: 'Doctor',
    desc: 'Manage consultations, queue and prescriptions',
    color: 'bg-green-50 border-green-200 hover:border-green-400 hover:bg-green-100',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    key: 'receptionist',
    label: 'Receptionist',
    desc: 'Handle walk-ins, manage daily queue flow',
    color: 'bg-purple-50 border-purple-200 hover:border-purple-400 hover:bg-purple-100',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'clinic',
    label: 'Clinic Owner',
    desc: 'Manage clinic, staff, appointments and analytics',
    color: 'bg-orange-50 border-orange-200 hover:border-orange-400 hover:bg-orange-100',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    key: 'admin',
    label: 'Super Admin',
    desc: 'Platform oversight, clinic approvals, user management',
    color: 'bg-red-50 border-red-200 hover:border-red-400 hover:bg-red-100',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

const SelectRolePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="border-b border-gray-100 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-900">PulseMate</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome to PulseMate</h1>
          <p className="mt-2 text-base text-gray-500">Select your role to continue to your portal</p>
        </div>

        <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((role) => (
            <button
              key={role.key}
              onClick={() => navigate(role.key === 'patient' ? '/login' : '/staff/login')}
              className={`group flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-200 ${role.color}`}
            >
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${role.iconBg} ${role.iconColor}`}>
                {role.icon}
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">{role.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{role.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="rounded-2xl border border-blue-200 bg-white px-4 py-4 text-left transition hover:border-blue-400 hover:bg-blue-50"
          >
            <p className="text-sm font-semibold text-blue-700">Patient signup</p>
            <p className="mt-1 text-xs text-gray-500">Register with OTP and start booking appointments.</p>
          </button>
          <button
            type="button"
            onClick={() => navigate('/register/doctor')}
            className="rounded-2xl border border-green-200 bg-white px-4 py-4 text-left transition hover:border-green-400 hover:bg-green-50"
          >
            <p className="text-sm font-semibold text-green-700">Doctor apply</p>
            <p className="mt-1 text-xs text-gray-500">Create your profile for approval and clinic invites.</p>
          </button>
          <button
            type="button"
            onClick={() => navigate('/register/clinic-owner')}
            className="rounded-2xl border border-orange-200 bg-white px-4 py-4 text-left transition hover:border-orange-400 hover:bg-orange-50"
          >
            <p className="text-sm font-semibold text-orange-700">Clinic apply</p>
            <p className="mt-1 text-xs text-gray-500">Register a clinic and submit it for admin verification.</p>
          </button>
        </div>

        <p className="mt-10 text-xs text-gray-400">Copyright {new Date().getFullYear()} PulseMate Health Technologies</p>
      </main>
    </div>
  );
};

export default SelectRolePage;
