import { View, Text, StyleSheet } from 'react-native';
import { STATUS_COLORS, radius } from '../theme';

const LABELS = {
  BOOKED:          'Booked',
  CHECKED_IN:      'Checked In',
  IN_QUEUE:        'In Queue',
  IN_CONSULTATION: 'Consulting',
  COMPLETED:       'Completed',
  CANCELLED:       'Cancelled',
  NO_SHOW:         'No Show',
  PENDING_PAYMENT: 'Pending',
  CALLED:          'Called',
};

export default function StatusBadge({ status, size = 'sm' }) {
  const style = STATUS_COLORS[status] || { bg: '#F1F5F9', text: '#64748B' };
  const label = LABELS[status] || status?.replace(/_/g, ' ') || '—';
  return (
    <View style={[s.badge, { backgroundColor: style.bg }, size === 'md' && s.badgeMd]}>
      <Text style={[s.text, { color: style.text }, size === 'md' && s.textMd]}>
        {label}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge:   { paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.full },
  badgeMd: { paddingHorizontal: 12, paddingVertical: 6 },
  text:    { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  textMd:  { fontSize: 13 },
});
