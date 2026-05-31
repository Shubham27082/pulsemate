import { Link } from 'react-router-dom';

const navItems = [
  { label: 'Features', href: '#features' },
  { label: "Who It's For", href: '#roles' },
  { label: 'Resources', href: '#resources' },
  { label: 'Support', href: '#support' },
];

const footerLinks = ['Privacy', 'Terms', 'Security', 'Docs'];

const iconPaths = {
  arrow: 'M15 6.5 9.5 12 15 17.5M10.5 12H21',
  caret: 'm8 10 4 4 4-4',
};

const cx = (...values) => values.filter(Boolean).join(' ');

const PortalChromeIcon = ({ name, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={iconPaths[name]} />
  </svg>
);

export const PortalBrandLogo = () => (
  <div className="flex items-center gap-3">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-300 to-blue-500 text-white shadow-[0_16px_40px_rgba(37,99,235,0.22)] sm:h-14 sm:w-14">
      <svg viewBox="0 0 64 64" fill="none" className="h-8 w-8">
        <path d="M31.8 53.5 11.2 33.3a11 11 0 0 1 15.6-15.5l5 4.8 5-4.8a11 11 0 0 1 15.6 15.5L31.8 53.5Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
        <path d="M17 31h10l4-8 5 16 3-8h8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <div className="min-w-0">
      <p className="truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">PulseMate</p>
      <p className="truncate text-lg text-cyan-300">Clinic Staff Portal</p>
    </div>
  </div>
);

export const StaffPortalHeader = ({ activeSection }) => (
  <header className="sticky top-0 z-30 bg-[linear-gradient(180deg,rgba(6,18,47,0.98)_0%,rgba(11,29,77,0.96)_100%)] text-white shadow-[0_18px_50px_rgba(5,15,40,0.28)] backdrop-blur">
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5 px-4 py-6 sm:px-6 xl:px-10 2xl:max-w-[1840px] 2xl:px-12 3xl:max-w-[2048px] lg:flex-row lg:items-center lg:justify-between">
      <Link to="/" className="min-w-0">
        <PortalBrandLogo />
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-10">
        <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold text-white/90 lg:gap-6">
          {navItems.map((item, index) => (
            <a
              key={item.label}
              href={`/portal${item.href}`}
              className={cx(
                'inline-flex items-center gap-1 rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-cyan-300',
                activeSection === item.href.slice(1) ? 'bg-white/12 text-cyan-300' : ''
              )}
            >
              {item.label}
              {index === 2 ? <PortalChromeIcon name="caret" className="h-4 w-4" /> : null}
            </a>
          ))}
        </nav>

        <Link
          to="/"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/35 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 lg:w-auto"
        >
          <PortalChromeIcon name="arrow" className="h-4 w-4" />
          Back to Main Website
        </Link>
      </div>
    </div>
  </header>
);

export const StaffPortalFooter = () => (
  <footer id="support" className="mt-8 rounded-[1.8rem] border border-white/80 bg-white/82 px-5 py-6 shadow-[0_16px_45px_rgba(125,162,196,0.08)] backdrop-blur sm:px-6 2xl:px-8 2xl:py-7">
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">Support</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Need help choosing the right portal path?
        </h3>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600">
          Clinic owners can onboard staff, doctors can manage schedules, and reception teams can run queue operations. If you need guidance, our support and implementation team can help.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to="/staff/login"
          className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb_0%,#4f46e5_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(79,70,229,0.2)] transition hover:brightness-105"
        >
          Open Portal
        </Link>
        <a
          href="mailto:support@pulsemate.com"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Contact Support
        </a>
      </div>
    </div>
    <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-4">
        {footerLinks.map((link) => (
          <span key={link} className="font-medium text-slate-600">
            {link}
          </span>
        ))}
      </div>
      <p>support@pulsemate.com</p>
    </div>
  </footer>
);

const StaffPortalLayout = ({ children, activeSection, containerClassName }) => (
  <main className="min-h-screen overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_top_right,#eef2ff_0%,#ffffff_44%,#eef4ff_100%)] text-slate-900">
    <div className="overflow-x-clip">
      <StaffPortalHeader activeSection={activeSection} />

      <section className="relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-7rem] top-24 h-80 w-80 rounded-full bg-cyan-100/80 blur-3xl" />
          <div className="absolute right-[-6rem] top-12 h-72 w-72 rounded-full bg-violet-100/80 blur-3xl" />
          <div className="absolute right-4 top-10 hidden grid-cols-6 gap-2 opacity-40 xl:grid">
            {Array.from({ length: 36 }).map((_, index) => (
              <span key={index} className="h-1.5 w-1.5 rounded-full bg-violet-300" />
            ))}
          </div>
          <div className="absolute left-0 bottom-6 hidden h-48 w-40 bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_60%)] xl:block" />
          <div className="absolute left-[44%] top-[18%] hidden h-52 w-52 rounded-full bg-blue-100/45 blur-3xl xl:block" />
        </div>

        <div
          className={cx(
            'relative mx-auto w-full max-w-[1680px] px-4 py-10 sm:px-6 lg:py-12 xl:px-10 2xl:max-w-[1840px] 2xl:px-12 2xl:py-14 3xl:max-w-[2048px]',
            containerClassName
          )}
        >
          {children}
          <StaffPortalFooter />
        </div>
      </section>
    </div>
  </main>
);

export default StaffPortalLayout;
