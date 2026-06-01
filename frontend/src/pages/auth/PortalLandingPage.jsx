import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StaffPortalLayout from '../../layouts/StaffPortalLayout';

const portalCards = [
  {
    title: 'Login to Portal',
    description: 'For active clinic staff who already have portal access.',
    href: '/staff/login',
    icon: 'login',
    tint: 'from-blue-600 to-blue-700',
    primary: true,
  },
  {
    title: 'Apply as Clinic',
    description: 'Start onboarding your clinic, staff and operational workflows.',
    href: '/portal/apply-clinic',
    icon: 'building',
    tint: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Apply as Doctor',
    description: 'Join the platform and manage your digital practice professionally.',
    href: '/portal/apply-doctor',
    icon: 'doctor',
    tint: 'from-violet-600 to-fuchsia-600',
  },
];

const highlightPills = ['Appointments', 'Queues', 'Patients', 'Analytics'];
const heroProof = ['Built for OPD workflow', 'Role-based access', 'Cloud-first operations'];

const statCards = [
  { value: '5000+', label: 'Clinics Trust Us', icon: 'team' },
  { value: '10M+', label: 'Appointments Managed', icon: 'calendar' },
  { value: '50K+', label: 'Users Across India', icon: 'doctor' },
  { value: '99.9%', label: 'Uptime & Secure', icon: 'shield' },
];

const featureBlocks = [
  {
    title: 'Smart Appointments',
    body: 'Schedule, reschedule and manage appointments with ease.',
    icon: 'calendar',
    tone: 'blue',
  },
  {
    title: 'Live Queue Management',
    body: 'Monitor real-time queue and reduce patient waiting time.',
    icon: 'queue',
    tone: 'emerald',
  },
  {
    title: 'Digital Prescriptions',
    body: 'Create, share and manage prescriptions securely.',
    icon: 'document',
    tone: 'violet',
  },
  {
    title: 'Clinic Analytics',
    body: 'Track performance and make data-driven decisions.',
    icon: 'chart',
    tone: 'amber',
  },
  {
    title: 'Secure & Compliant',
    body: 'Enterprise-grade security with HIPAA compliant standards.',
    icon: 'shield',
    tone: 'rose',
  },
];

const roleCards = [
  {
    title: 'Clinic Owner',
    body: 'Oversee staff, bookings, queue health and clinic operations from one secure workspace.',
    icon: 'building',
  },
  {
    title: 'Doctor',
    body: 'Track schedules, patient flow, consultation readiness and follow-up activity with clarity.',
    icon: 'doctor',
  },
  {
    title: 'Receptionist',
    body: 'Manage front-desk bookings, check-ins and live queue movement without switching systems.',
    icon: 'queue',
  },
];

const resourceLinks = [
  { title: 'Implementation Guide', body: 'Plan rollout for owners, doctors and reception teams with role-specific setup guidance.' },
  { title: 'Security Overview', body: 'Review access control, backups, encryption and operational safeguards before launch.' },
  { title: 'Help Center', body: 'Learn portal workflows for bookings, queue, prescriptions and staff operations.' },
];

const trustStrip = [
  { title: 'Trusted by 5000+ Clinics', body: 'Across India', icon: 'shieldSolid' },
  { title: '256-bit Encryption', body: 'Bank-level security', icon: 'lockSolid' },
  { title: 'Cloud Based', body: 'Access anytime, anywhere', icon: 'cloud' },
  { title: '24/7 Support', body: "We're here to help whenever you need", icon: 'headset' },
  { title: 'Regular Updates', body: 'New features, always improving', icon: 'team' },
];

const clinicProof = ['Used across multispeciality clinics', 'Designed for high-volume OPD teams', 'Built to reduce front-desk bottlenecks'];
const iconToneClasses = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-500',
  rose: 'bg-rose-50 text-rose-500',
};

const iconPaths = {
  login: 'M5 12h10m0 0-3.5-3.5M15 12l-3.5 3.5M19 5.5v13A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-13A1.5 1.5 0 0 1 6.5 4h11A1.5 1.5 0 0 1 19 5.5Z',
  building: 'M8 21h8M10 21V7.5A1.5 1.5 0 0 1 11.5 6h5A1.5 1.5 0 0 1 18 7.5V21M6 21V10.5A1.5 1.5 0 0 1 7.5 9H10M13 10h2m-2 3h2m-2 3h2',
  doctor: 'M9 4v5a3 3 0 0 0 6 0V4m-6 3H7m8 0h2m-5 8a4 4 0 1 0 8 0v-1a2 2 0 1 0-2-2',
  queue: 'M8.5 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm7 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM3.5 19a5 5 0 0 1 10 0m1 0a5 5 0 0 1 6 0',
  calendar: 'M7 3v3m10-3v3M5.5 6h13A1.5 1.5 0 0 1 20 7.5v11A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6Zm0 4h13',
  document: 'M8 3.5h6l4 4V20H8A1.5 1.5 0 0 1 6.5 18.5v-13A1.5 1.5 0 0 1 8 3.5Zm6 0v4h4M9.5 12h5m-5 3h5',
  chart: 'M6 18.5h12M8.5 17V11m4 6V7m4 10v-4',
  shield: 'M12 3.5 19 6v5.5c0 4.3-2.7 7.2-7 9-4.3-1.8-7-4.7-7-9V6l7-2.5Z',
  shieldSolid: 'M12 3.5 19 6v5.5c0 4.3-2.7 7.2-7 9-4.3-1.8-7-4.7-7-9V6l7-2.5Z',
  lockSolid: 'M7.5 11V8a4.5 4.5 0 1 1 9 0v3M6.5 11h11A1.5 1.5 0 0 1 19 12.5v6A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-6A1.5 1.5 0 0 1 6.5 11Z',
  cloud: 'M8.5 18.5h8a4 4 0 0 0 .8-7.9A5.5 5.5 0 0 0 6.5 9a4.5 4.5 0 0 0 2 9.5Z',
  headset: 'M6 10a6 6 0 1 1 12 0v3a2 2 0 0 1-2 2h-1.5m-5 0H8a2 2 0 0 1-2-2Zm7.5 3.5a1.5 1.5 0 0 1-1.5 1.5H11',
  team: 'M8 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM2.5 19a5 5 0 0 1 10 0m-1 0a5 5 0 0 1 10 0',
  arrow: 'M15 6.5 9.5 12 15 17.5M10.5 12H21',
  caret: 'm8 10 4 4 4-4',
  info: 'M12 17v-5m0-3h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  feather: 'M5 16c3.5-4.5 7.7-7 14-9-1.8 6-4.5 10.2-9 14-.3-2.2-1.4-3.3-5-5Z',
};

const Icon = ({ name, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={iconPaths[name]} />
  </svg>
);

const PortalLandingPage = () => {
  const [activeSection, setActiveSection] = useState('features');

  useEffect(() => {
    const sectionIds = ['features', 'roles', 'resources', 'support'];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveSection(visible.target.id);
        }
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0.2, 0.45, 0.7],
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <StaffPortalLayout activeSection={activeSection}>
            <div className="grid gap-10 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] xl:items-start 2xl:gap-14 2xl:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
              <div className="min-w-0 animate-fade-up">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/90 px-4 py-2 text-sm font-semibold text-emerald-600 shadow-sm">
                  <Icon name="shield" className="h-4 w-4" />
                  Trusted by 5000+ Clinics Across India
                </div>

                <h1 className="mt-7 max-w-2xl text-4xl font-bold leading-[1.01] tracking-[-0.05em] text-slate-950 sm:text-5xl xl:max-w-[820px] xl:text-[4.55rem] 2xl:max-w-[920px] 2xl:text-[5rem]">
                  Smarter Clinic
                  <br />
                  Management.
                  <br />
                  Better <span className="bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_100%)] bg-clip-text text-transparent">Patient Care.</span>
                </h1>

                <p className="mt-6 max-w-lg text-lg leading-9 text-slate-600 sm:text-xl 2xl:max-w-[720px]">
                  PulseMate helps clinic owners, doctors and reception teams manage appointments, queue flow and daily operations from one focused workspace.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {highlightPills.map((pill) => (
                    <span
                      key={pill}
                      className="rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_rgba(148,181,215,0.08)]"
                    >
                      {pill}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {heroProof.map((item) => (
                    <span key={item} className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/staff/login"
                    className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb_0%,#4f46e5_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(79,70,229,0.2)] transition hover:brightness-105"
                  >
                    Open Staff Portal
                  </Link>
                  <Link
                    to="/portal/apply-clinic"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Apply as Clinic
                  </Link>
                </div>

                <div className="mt-5 rounded-2xl border border-blue-100 bg-[linear-gradient(180deg,#f5f8ff_0%,#eef4ff_100%)] px-4 py-4 text-blue-700 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                      <Icon name="info" className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium sm:text-base">
                      Receptionist accounts are created and managed by clinic owners.
                    </p>
                  </div>
                </div>
              </div>

              <div className="min-w-0 animate-fade-up" style={{ animationDelay: '0.08s' }}>
                <div className="grid gap-5">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:gap-5">
                    {portalCards.map((card) => (
                      <Link
                        key={card.title}
                        to={card.href}
                        className={`group min-w-0 overflow-hidden rounded-[1.55rem] ${
                          card.primary
                            ? `ring-2 ring-blue-200 bg-gradient-to-br ${card.tint} p-6 text-white shadow-[0_22px_56px_rgba(59,130,246,0.24)]`
                            : card.title === 'Apply as Clinic'
                              ? `bg-gradient-to-br ${card.tint} p-5 text-white shadow-[0_16px_38px_rgba(16,185,129,0.18)]`
                              : `bg-gradient-to-br ${card.tint} p-5 text-white shadow-[0_16px_38px_rgba(124,58,237,0.16)] opacity-95`
                        } transition hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(59,130,246,0.24)]`}
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/16 shadow-inner backdrop-blur">
                          <Icon name={card.icon} className="h-6 w-6" />
                        </div>
                        <p className="mt-5 text-[1.72rem] font-semibold tracking-tight">{card.title}</p>
                        <p className="mt-3 text-[15px] leading-7 text-white/92">{card.description}</p>
                        {card.primary ? (
                          <p className="mt-4 inline-flex rounded-full bg-white/16 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
                            Most used by existing staff
                          </p>
                        ) : null}
                        <div className="mt-5 flex justify-end">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 transition group-hover:translate-x-0.5">
                            <Icon name="arrow" className="h-4 w-4 rotate-180" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="rounded-[2.2rem] border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,249,255,0.9))] p-6 shadow-[0_28px_80px_rgba(125,162,196,0.16)] backdrop-blur xl:p-8 2xl:p-10">
                    <div className="grid gap-8 xl:grid-cols-[minmax(0,0.46fr)_minmax(0,0.54fr)] xl:items-start 2xl:gap-10">
                      <div className="min-w-0">
                        <div className="animate-soft-float flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1d4ed8_0%,#3b82f6_100%)] text-white shadow-[0_18px_45px_rgba(37,99,235,0.28)]">
                          <Icon name="shieldSolid" className="h-8 w-8" />
                        </div>
                        <h2 className="mt-6 text-3xl font-bold leading-tight tracking-[-0.035em] text-slate-950 xl:text-[3.1rem] 2xl:text-[3.45rem]">
                          Built for Clinics.
                          <br />
                          Designed for <span className="bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_100%)] bg-clip-text text-transparent">Care.</span>
                        </h2>
                        <p className="mt-4 text-lg font-medium text-slate-600">
                          Secure. Reliable. Always with you.
                        </p>
                        <div className="mt-5 h-3 w-56 rounded-full bg-[linear-gradient(90deg,#2563eb_0%,#8b5cf6_100%)] opacity-80 shadow-[0_10px_24px_rgba(99,102,241,0.22)]" />

                        <div className="mt-6 rounded-[1.6rem] border border-blue-100 bg-white/75 p-4 shadow-[0_12px_32px_rgba(125,162,196,0.1)]">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-500">Live Queue</p>
                              <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">12</p>
                              <p className="mt-1 text-sm text-slate-500">Current consultation token</p>
                            </div>
                            <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-600">
                              Queue Healthy
                            </div>
                          </div>
                          <div className="mt-5 space-y-3">
                            {[
                              ['13', 'Rahul Singh'],
                              ['14', 'Sneha Joshi'],
                              ['15', 'Arjun Mehta'],
                            ].map(([token, name]) => (
                              <div key={token} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                                <span className="font-bold text-slate-900">{token}</span>
                                <span className="text-sm text-slate-500">{name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 rounded-[1.4rem] border border-slate-100 bg-white/78 p-4 shadow-[0_10px_24px_rgba(125,162,196,0.08)]">
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">What teams improve first</p>
                          <div className="mt-4 space-y-3">
                            {clinicProof.map((item) => (
                              <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                  <Icon name="shield" className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-medium text-slate-700">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="rounded-[1.8rem] border border-slate-100 bg-white/88 p-4 shadow-[0_18px_45px_rgba(125,162,196,0.14)]">
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-semibold text-slate-900">Operations Snapshot</p>
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                              This Week
                            </span>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {statCards.map((item) => (
                              <div key={item.label} className="rounded-[1.35rem] border border-slate-100 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-4 shadow-[0_10px_24px_rgba(125,162,196,0.08)]">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                  <Icon name={item.icon} className="h-5 w-5" />
                                </div>
                                <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{item.value}</p>
                                <p className="mt-1 text-sm font-medium leading-6 text-slate-600">{item.label}</p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 rounded-[1.5rem] bg-[linear-gradient(135deg,#0f2a75_0%,#143e9a_55%,#2456d8_100%)] p-4 text-white shadow-[0_16px_40px_rgba(37,99,235,0.22)]">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">Appointments Overview</p>
                            <div className="mt-4 flex h-28 items-end justify-between gap-2">
                              {[24, 46, 34, 56, 49, 68, 74].map((height, index) => (
                                <div key={index} className="flex h-full flex-1 flex-col justify-end gap-2">
                                  <div className="w-full rounded-full bg-white/90" style={{ height: `${height}%` }} />
                                  <span className="text-center text-[10px] font-medium uppercase tracking-[0.14em] text-blue-100">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <section id="features" className="mt-10 rounded-[2rem] border border-white/80 bg-white/88 px-5 py-7 shadow-[0_18px_50px_rgba(125,162,196,0.1)] backdrop-blur sm:px-7 2xl:px-10 2xl:py-9">
              <div className="flex items-center justify-center gap-3 text-center">
                <Icon name="feather" className="h-5 w-5 text-blue-500" />
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  Everything you need to <span className="bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_100%)] bg-clip-text text-transparent">run your clinic smoothly</span>
                </h2>
                <Icon name="feather" className="h-5 w-5 scale-x-[-1] text-blue-500" />
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5 2xl:gap-5">
                {featureBlocks.map((feature) => (
                  <div key={feature.title} className="min-w-0 rounded-[1.5rem] px-4 py-4 transition hover:bg-white/70 xl:border-r xl:border-slate-100 xl:last:border-r-0">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconToneClasses[feature.tone]} shadow-[0_10px_24px_rgba(125,162,196,0.08)]`}>
                      <Icon name={feature.icon} className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-slate-900">{feature.title}</h3>
                    <p className="mt-3 text-[15px] leading-7 text-slate-600">{feature.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="roles" className="mt-8 rounded-[2rem] border border-white/80 bg-white/86 px-5 py-7 shadow-[0_18px_50px_rgba(125,162,196,0.1)] backdrop-blur sm:px-7 2xl:px-10 2xl:py-9">
              <div className="flex flex-col gap-3 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">Who It&apos;s For</p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  Built for every role inside a modern clinic
                </h2>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-3 2xl:gap-5">
                {roleCards.map((role) => (
                  <div key={role.title} className="rounded-[1.6rem] border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-5 shadow-[0_12px_34px_rgba(125,162,196,0.08)]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm">
                      <Icon name={role.icon} className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-slate-900">{role.title}</h3>
                    <p className="mt-3 text-[15px] leading-7 text-slate-600">{role.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="resources" className="mt-8 rounded-[2rem] border border-white/80 bg-white/86 px-5 py-7 shadow-[0_18px_50px_rgba(125,162,196,0.1)] backdrop-blur sm:px-7 2xl:px-10 2xl:py-9">
              <div className="flex flex-col gap-3 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">Resources</p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  Roll out the portal with confidence
                </h2>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-3 2xl:gap-5">
                {resourceLinks.map((item) => (
                  <div key={item.title} className="rounded-[1.6rem] border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-5 shadow-[0_12px_34px_rgba(125,162,196,0.08)]">
                    <p className="text-xl font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-3 text-[15px] leading-7 text-slate-600">{item.body}</p>
                    <span className="mt-5 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                      Coming Soon
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-8 rounded-[1.9rem] bg-[linear-gradient(135deg,#0d1e6c_0%,#122f89_50%,#184bb4_100%)] px-5 py-6 text-white shadow-[0_26px_64px_rgba(26,66,159,0.34)] sm:px-6 2xl:px-8 2xl:py-7">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 2xl:gap-5">
                {trustStrip.map((item, index) => (
                  <div key={item.title} className={`flex items-center gap-4 ${index < trustStrip.length - 1 ? 'xl:border-r xl:border-white/15' : ''} xl:pr-5`}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                      <Icon name={item.icon} className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-blue-100">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

    </StaffPortalLayout>
  );
};

export default PortalLandingPage;
