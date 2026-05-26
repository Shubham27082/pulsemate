const STATUS_CONFIG = {
  // Appointment statuses
  PENDING_PAYMENT: { label: 'Pending Payment', className: 'bg-yellow-100 text-yellow-700 badge' },
  BOOKED: { label: 'Booked', className: 'badge-info' },
  CHECKED_IN: { label: 'Checked In', className: 'badge-warning' },
  IN_QUEUE: { label: 'In Queue', className: 'badge-warning' },
  IN_CONSULTATION: { label: 'In Consultation', className: 'bg-purple-100 text-purple-700 badge' },
  COMPLETED: { label: 'Completed', className: 'badge-success' },
  CANCELLED: { label: 'Cancelled', className: 'badge-error' },
  NO_SHOW: { label: 'No Show', className: 'badge-gray' },

  // Queue statuses
  WAITING: { label: 'Waiting', className: 'badge-warning' },
  CALLED: { label: 'Called', className: 'bg-purple-100 text-purple-700 badge' },
  SKIPPED: { label: 'Skipped', className: 'badge-gray' },

  // Queue status
  ACTIVE: { label: 'Active', className: 'badge-success' },
  PAUSED: { label: 'Paused', className: 'badge-warning' },
  CLOSED: { label: 'Closed', className: 'badge-gray' },

  // Clinic
  VERIFIED: { label: 'Verified', className: 'badge-success' },
  PENDING: { label: 'Pending', className: 'badge-warning' },

  // User
  ENABLED: { label: 'Active', className: 'badge-success' },
  DISABLED: { label: 'Disabled', className: 'badge-error' },
};

const StatusBadge = ({ status, customLabel }) => {
  const config = STATUS_CONFIG[status] || { label: status, className: 'badge-gray' };

  return (
    <span className={config.className || 'badge badge-gray'}>
      {customLabel || config.label}
    </span>
  );
};

export default StatusBadge;
