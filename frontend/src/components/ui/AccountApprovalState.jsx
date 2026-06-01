import { Link } from 'react-router-dom';

const STATUS_STYLES = {
  PENDING: {
    badge: 'bg-amber-100 text-amber-800 border border-amber-200',
    panel: 'border-amber-200 bg-amber-50',
    title: 'Verification in progress',
    message: 'Your account is under review. You can sign in, but operational modules stay locked until verification is complete.',
    accent: 'text-amber-700',
  },
  REJECTED: {
    badge: 'bg-red-100 text-red-800 border border-red-200',
    panel: 'border-red-200 bg-red-50',
    title: 'Application needs attention',
    message: 'Your application was reviewed and is not approved yet. Check the reason below, update your details if needed, and coordinate with the platform team.',
    accent: 'text-red-700',
  },
};

const AccountApprovalState = ({
  status,
  roleLabel,
  reason,
  primaryAction,
  secondaryAction,
}) => {
  const config = STATUS_STYLES[status] || STATUS_STYLES.PENDING;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className={`rounded-3xl border p-8 shadow-sm ${config.panel}`}>
        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${config.badge}`}>
          {status}
        </div>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">{config.title}</h1>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          {roleLabel} portal access is currently limited.
          {' '}
          {config.message}
        </p>

        {reason ? (
          <div className="mt-6 rounded-2xl bg-white/80 p-4">
            <p className="text-sm font-semibold text-gray-800">Review note</p>
            <p className={`mt-1 text-sm leading-relaxed ${config.accent}`}>{reason}</p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-sm font-semibold text-gray-800">What you can do now</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>Track your approval status from this dashboard.</li>
              <li>Keep your contact details available for admin follow-up.</li>
              <li>Sign out safely without affecting other active role sessions.</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white/80 p-4">
            <p className="text-sm font-semibold text-gray-800">What unlocks after approval</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>Full dashboard access for operations and workflow tools.</li>
              <li>Role-based actions, bookings, staff modules, and marketplace access.</li>
              <li>Operational routes in this portal without extra setup.</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {primaryAction ? (
            <Link
              to={primaryAction.to}
              className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              {primaryAction.label}
            </Link>
          ) : null}
          {secondaryAction ? (
            <Link
              to={secondaryAction.to}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
            >
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AccountApprovalState;
