import { Link } from 'react-router-dom';

const trustStats = [
  { value: '5000+', label: 'Clinics onboarded' },
  { value: '1.2L+', label: 'Appointments managed' },
  { value: '4.9/5', label: 'Patient trust rating' },
];

const valueCards = [
  {
    title: 'Trusted doctors',
    body: 'Discover verified specialists, clinics and available slots in one place.',
    icon: 'heart',
    accent: 'from-sky-400 to-cyan-300',
  },
  {
    title: 'Live queue tracking',
    body: 'Know your expected wait time before you leave home for the clinic.',
    icon: 'pulse',
    accent: 'from-emerald-400 to-cyan-300',
  },
  {
    title: 'Digital care journey',
    body: 'Keep appointments, prescriptions and visit details organized digitally.',
    icon: 'document',
    accent: 'from-violet-400 to-fuchsia-300',
  },
];

const reassuranceItems = [
  { title: 'Verified care providers', body: 'Doctors and clinics are reviewed before they go live.', icon: 'shield' },
  { title: 'Appointment clarity', body: 'Track timings, tokens and visit updates without phone follow-ups.', icon: 'clock' },
  { title: 'Mobile-first access', body: 'Fast OTP login built for patients on the go.', icon: 'phone' },
];

const portalFeatures = [
  { title: 'Clinic staff portal', body: 'Owners, doctors and reception teams get a separate internal workspace.' },
  { title: 'Queue operations', body: 'Handle live queue, bookings and clinic flow without mixing patient screens.' },
];

const iconPaths = {
  heart: 'M31.8 53.5 11.2 33.3a11 11 0 0 1 15.6-15.5l5 4.8 5-4.8a11 11 0 0 1 15.6 15.5L31.8 53.5Z M17 31h10l4-8 5 16 3-8h8',
  shield: 'M32 8 49 14v13.5c0 10.6-6.5 17.4-17 21.5C21.5 44.9 15 38.1 15 27.5V14L32 8Z',
  pulse: 'M10 34h12l4-9 6 18 4-9h18',
  document: 'M22 10h14l10 10v30H22a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4Zm14 0v10h10M26 30h14m-14 8h14',
  clock: 'M32 12a20 20 0 1 0 20 20 20 20 0 0 0-20-20Zm0 11v10l7 4',
  phone: 'M23 12h18a5 5 0 0 1 5 5v30a5 5 0 0 1-5 5H23a5 5 0 0 1-5-5V17a5 5 0 0 1 5-5Zm8 31h2',
  location: 'M32 54s14-12.8 14-24a14 14 0 1 0-28 0c0 11.2 14 24 14 24Zm0-18a6 6 0 1 0-6-6 6 6 0 0 0 6 6Z',
  check: 'M17 32 27 42 47 22',
};

const MarkIcon = ({ name, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {iconPaths[name]
      .split(' M')
      .map((segment, index) => (
        <path key={`${name}-${index}`} d={`${index === 0 ? 'M' : 'M'}${segment.replace(/^M/, '')}`} />
      ))}
  </svg>
);

const PulseMateLogo = () => (
  <div className="flex items-center gap-3">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-400 to-blue-600 text-white shadow-[0_16px_40px_rgba(56,189,248,0.28)]">
      <MarkIcon name="heart" className="h-7 w-7" />
    </div>
    <div>
      <p className="text-xl font-bold tracking-tight text-slate-950">PulseMate</p>
      <p className="text-xs uppercase tracking-[0.24em] text-sky-600">Digital Care</p>
    </div>
  </div>
);

const PublicHomePage = () => {
  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f3fbff_0%,#ffffff_48%,#f6f9ff_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-[-7rem] h-80 w-80 rounded-full bg-cyan-200/70 blur-3xl" />
        <div className="absolute right-[-8rem] top-10 h-96 w-96 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute left-[20%] top-[32%] h-40 w-40 rounded-full bg-emerald-100/70 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-sky-100/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/">
            <PulseMateLogo />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 lg:flex">
            <a href="#home" className="transition hover:text-sky-700">Home</a>
            <a href="#find-doctors" className="transition hover:text-sky-700">Find Doctors</a>
            <a href="#clinics" className="transition hover:text-sky-700">Clinics</a>
            <a href="#about" className="transition hover:text-sky-700">About</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/portal"
              className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:inline-flex"
            >
              Clinic Portal
            </Link>
            <Link
              to="/login"
              className="inline-flex rounded-full bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(37,99,235,0.22)] transition hover:brightness-105"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <main id="home" className="relative z-10">
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/85 px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Healthcare made simpler for patients
              </div>

              <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-[1.02] tracking-tight text-slate-950 sm:text-6xl">
                Book appointments
                <br />
                without waiting
              </h1>
              <p className="mt-6 max-w-2xl text-xl leading-9 text-slate-600">
                Find trusted doctors, track live queue and manage your healthcare digitally.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] px-6 py-4 text-base font-semibold text-white shadow-[0_18px_45px_rgba(37,99,235,0.25)] transition hover:brightness-105"
                >
                  Login with Mobile
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-[1.2rem] border border-sky-200 bg-white px-6 py-4 text-base font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
                >
                  Create Patient Account
                </Link>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {trustStats.map((item) => (
                  <div key={item.label} className="rounded-[1.4rem] border border-white/80 bg-white/90 p-4 shadow-[0_14px_40px_rgba(125,162,196,0.12)]">
                    <p className="text-2xl font-bold text-slate-950">{item.value}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {valueCards.map((card) => (
                  <div key={card.title} className="rounded-[1.6rem] border border-white/80 bg-white/90 p-5 shadow-[0_16px_45px_rgba(125,162,196,0.12)]">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-white shadow-sm`}>
                      <MarkIcon name={card.icon} className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">{card.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{card.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-4 top-8 hidden h-24 w-24 rounded-full bg-cyan-200/50 blur-2xl sm:block" />
              <div className="absolute -left-2 bottom-10 hidden h-24 w-24 rounded-full bg-emerald-200/50 blur-2xl sm:block" />

              <div className="rounded-[2.2rem] border border-white/80 bg-white/90 p-4 shadow-[0_24px_80px_rgba(148,181,215,0.22)]">
                <div className="rounded-[1.9rem] bg-[linear-gradient(160deg,#eff8ff_0%,#fbfeff_48%,#eef6ff_100%)] p-5">
                  <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="space-y-4">
                      <div className="rounded-[1.6rem] bg-white p-5 shadow-[0_12px_30px_rgba(125,162,196,0.12)]">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-500">Live queue</p>
                            <p className="mt-3 text-4xl font-bold text-slate-950">12 min</p>
                            <p className="mt-1 text-sm text-emerald-600">Updated just now</p>
                          </div>
                          <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                            Queue moving
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[1.6rem] bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] p-5 text-white shadow-[0_16px_45px_rgba(37,99,235,0.25)]">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-100">Appointments today</p>
                        <p className="mt-3 text-5xl font-bold">24</p>
                        <p className="mt-2 text-sm leading-7 text-sky-100">Managed seamlessly in one place for patients and clinics.</p>
                      </div>

                      <div className="rounded-[1.6rem] bg-white p-5 shadow-[0_12px_30px_rgba(125,162,196,0.12)]">
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-semibold text-slate-900">Trusted clinic nearby</p>
                          <div className="flex items-center gap-1 text-amber-500">
                            <span>★</span>
                            <span className="text-sm font-semibold">4.9</span>
                          </div>
                        </div>
                        <p className="mt-3 text-sm font-medium text-slate-500">PulseCare Cardiology</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">Next slot today at 4:20 PM with Dr. Arjun Mehta.</p>
                      </div>
                    </div>

                    <div className="rounded-[1.8rem] bg-white p-5 shadow-[0_12px_30px_rgba(125,162,196,0.12)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-500">Your care journey</p>
                          <p className="mt-2 text-2xl font-semibold text-slate-950">Appointments, prescriptions and queue</p>
                        </div>
                        <div className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                          Mobile-first
                        </div>
                      </div>

                      <div className="mt-6 rounded-[1.4rem] bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-500">Upcoming appointment</p>
                            <p className="mt-1 text-xl font-semibold text-slate-900">Dr. Neha Kapoor</p>
                            <p className="mt-1 text-sm text-slate-500">Dermatology consultation</p>
                          </div>
                          <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Token</p>
                            <p className="mt-1 text-3xl font-bold text-blue-600">14</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {[
                          ['Appointment booked', 'Confirmed with clinic', 'check'],
                          ['Queue updated', 'Expected wait time reduced', 'pulse'],
                          ['Prescription ready', 'View post-visit instructions digitally', 'document'],
                        ].map(([title, body, icon]) => (
                          <div key={title} className="flex items-start gap-3 rounded-[1.3rem] border border-slate-100 bg-white p-4 shadow-sm">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                              <MarkIcon name={icon} className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{title}</p>
                              <p className="mt-1 text-sm leading-6 text-slate-500">{body}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 h-3 rounded-full bg-slate-100">
                        <div className="h-3 w-[74%] rounded-full bg-[linear-gradient(90deg,#0ea5e9_0%,#10b981_100%)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-3">
            {reassuranceItems.map((item) => (
              <div key={item.title} className="rounded-[1.8rem] border border-sky-100 bg-white/90 p-6 shadow-[0_14px_40px_rgba(125,162,196,0.1)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                  <MarkIcon name={item.icon} className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2.4rem] border border-slate-200 bg-[linear-gradient(135deg,#03153f_0%,#112e78_55%,#2758da_100%)] px-6 py-8 text-white shadow-[0_24px_80px_rgba(13,27,74,0.25)] sm:px-8 lg:px-10">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">For doctors and clinics</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Manage appointments, queue and clinic operations.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-200">
                  PulseMate also includes a dedicated internal portal for clinic owners, doctors and reception teams, separate from the patient website.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {portalFeatures.map((feature) => (
                    <div key={feature.title} className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                      <p className="font-semibold text-white">{feature.title}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-200">{feature.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <div className="rounded-[1.7rem] bg-white p-6 text-slate-900 shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                      <MarkIcon name="location" className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">Clinic staff portal</p>
                      <p className="text-sm text-slate-500">Internal access for verified staff only</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {['Clinic Owner workspace', 'Doctor dashboard', 'Reception queue operations'].map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-[1.2rem] bg-slate-50 px-4 py-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                          <MarkIcon name="check" className="h-4 w-4" />
                        </div>
                        <p className="font-medium text-slate-700">{item}</p>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/portal"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-[1.2rem] bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] px-5 py-4 text-base font-semibold text-white shadow-[0_16px_40px_rgba(37,99,235,0.24)] transition hover:brightness-105"
                  >
                    Open Clinic Portal
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PublicHomePage;
