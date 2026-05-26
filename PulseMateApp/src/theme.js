// PulseMate Design System
export const colors = {
  // Brand
  primary:       '#2563EB',   // Blue 600
  primaryDark:   '#1D4ED8',   // Blue 700
  primaryLight:  '#EFF6FF',   // Blue 50
  primaryMid:    '#BFDBFE',   // Blue 200

  // Accent
  secondary:     '#10B981',   // Emerald 500
  secondaryLight:'#D1FAE5',   // Emerald 100

  // Semantic
  danger:        '#EF4444',
  dangerLight:   '#FEE2E2',
  warning:       '#F59E0B',
  warningLight:  '#FEF3C7',
  purple:        '#7C3AED',
  purpleLight:   '#EDE9FE',
  orange:        '#EA580C',
  orangeLight:   '#FFF7ED',

  // Neutrals
  bg:            '#F1F5F9',   // Slate 100
  card:          '#FFFFFF',
  border:        '#E2E8F0',   // Slate 200
  borderLight:   '#F1F5F9',
  text:          '#0F172A',   // Slate 900
  textSecondary: '#475569',   // Slate 600
  textMuted:     '#94A3B8',   // Slate 400
  white:         '#FFFFFF',

  // Gradient stops
  gradStart:     '#2563EB',
  gradEnd:       '#7C3AED',
};

export const STATUS_COLORS = {
  BOOKED:          { bg: '#DBEAFE', text: '#1D4ED8' },
  CHECKED_IN:      { bg: '#D1FAE5', text: '#065F46' },
  IN_QUEUE:        { bg: '#FEF3C7', text: '#92400E' },
  IN_CONSULTATION: { bg: '#EDE9FE', text: '#5B21B6' },
  COMPLETED:       { bg: '#D1FAE5', text: '#065F46' },
  CANCELLED:       { bg: '#FEE2E2', text: '#991B1B' },
  NO_SHOW:         { bg: '#F1F5F9', text: '#64748B' },
  PENDING_PAYMENT: { bg: '#FEF3C7', text: '#92400E' },
  CALLED:          { bg: '#EDE9FE', text: '#5B21B6' },
};

export const shadow = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
  full: 999,
};
