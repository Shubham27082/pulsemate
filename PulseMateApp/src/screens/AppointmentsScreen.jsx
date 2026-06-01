import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMyAppointments, cancelAppointment, getLiveQueue } from '../api/patient';
import { colors, shadow, radius } from '../theme';

const FILTERS = [
  { key: 'All',       label: 'All',       icon: 'grid'             },
  { key: 'BOOKED',    label: 'Booked',    icon: 'calendar'         },
  { key: 'IN_QUEUE',  label: 'In Queue',  icon: 'time'             },
  { key: 'COMPLETED', label: 'Completed', icon: 'checkmark-circle' },
];

const SPEC_COLOR = {
  'General Physician': '#2563EB',
  'Cardiologist':      '#EF4444',
  'Dermatologist':     '#F59E0B',
  'Orthopedic':        '#10B981',
  'Pediatrician':      '#EC4899',
  'Neurologist':       '#8B5CF6',
  'ENT':               '#06B6D4',
};
const specColor = (spec) => SPEC_COLOR[spec] || colors.primary;

const fmtDate = (d) => {
  const date = new Date(d);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const str = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return isToday ? `Today, ${str}` : str;
};

const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

export default function AppointmentsScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter]       = useState('All');
  const [loading, setLoading]     = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [queueMap, setQueueMap]   = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'All' ? { status: filter } : {};
      const res = await getMyAppointments(params);
      const all = res.data.data || [];
      setAppointments(all);

      const active = all.filter((a) =>
        ['BOOKED','CHECKED_IN','IN_QUEUE','IN_CONSULTATION','CALLED'].includes(a.status)
      );
      const qMap = {};
      await Promise.all(active.map(async (a) => {
        try {
          const qr = await getLiveQueue(a.id);
          const { queueInfo: qi } = qr.data.data;
          // Normalize keys for the UI
          qMap[a.id] = qi ? {
            position:            qi.position,
            patientsAhead:       qi.patientsAhead,
            estimatedWaitMinutes: qi.estimatedWaitMinutes,
            status:              qi.status,
          } : null;
        } catch {}
      }));
      setQueueMap(qMap);
    } catch {}
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = (id) => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        setCancelling(id);
        try { await cancelAppointment(id); load(); }
        catch (err) { Alert.alert('Error', err.response?.data?.message || 'Failed to cancel'); }
        finally { setCancelling(null); }
      }},
    ]);
  };

  const upcoming = appointments.filter((a) =>
    ['BOOKED','CHECKED_IN','IN_QUEUE','IN_CONSULTATION','CALLED','PENDING_PAYMENT'].includes(a.status)
  );
  const past = appointments.filter((a) =>
    ['COMPLETED','CANCELLED','NO_SHOW'].includes(a.status)
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>My Appointments</Text>
          <Text style={s.subtitle}>Track and manage your appointments</Text>
        </View>
        <TouchableOpacity
          style={s.bookNewBtn}
          onPress={() => navigation.navigate('DoctorsTab')}
        >
          <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
          <Text style={s.bookNewText}>Book New</Text>
        </TouchableOpacity>
      </View>

      {/* ── Filter tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
        style={s.filterScroll}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[s.filterChip, active && s.filterChipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={active ? f.icon : `${f.icon}-outline`}
                size={14}
                color={active ? '#fff' : colors.textMuted}
              />
              <Text style={[s.filterLabel, active && s.filterLabelActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Content ── */}
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : appointments.length === 0 ? (

        /* ── Empty state ── */
        <View style={s.emptyWrap}>
          <View style={s.emptyIconBox}>
            <Text style={s.emptyEmoji}>📅</Text>
          </View>
          <Text style={s.emptyTitle}>No appointments yet</Text>
          <Text style={s.emptySub}>Book an appointment to get started</Text>
          <TouchableOpacity
            style={s.emptyBtn}
            onPress={() => navigation.navigate('DoctorsTab')}
          >
            <Ionicons name="calendar-outline" size={16} color="#fff" />
            <Text style={s.emptyBtnText}>Book Appointment</Text>
          </TouchableOpacity>
        </View>

      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* ── Upcoming ── */}
          {upcoming.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionRow}>
                <View style={s.sectionDot} />
                <Text style={s.sectionTitle}>Upcoming</Text>
              </View>

              {upcoming.map((appt) => {
                const qi    = queueMap[appt.id];
                const color = specColor(appt.doctor?.specialization);
                const statusLabel =
                  appt.status === 'IN_CONSULTATION' ? 'In Consultation' :
                  appt.status === 'CALLED'          ? '🔔 Called!'      :
                  appt.status === 'IN_QUEUE'        ? 'In Queue'        :
                  appt.status === 'CHECKED_IN'      ? 'Checked In'      : 'Booked';

                return (
                  <TouchableOpacity
                    key={appt.id}
                    style={s.upCard}
                    onPress={() => navigation.navigate('AppointmentDetail', { id: appt.id })}
                    activeOpacity={0.9}
                  >
                    {/* Doctor row */}
                    <View style={s.upTop}>
                      <View style={[s.upAvatar, { backgroundColor: color + '18' }]}>
                        <Text style={[s.upAvatarTxt, { color }]}>
                          {appt.doctor?.user?.name?.charAt(0)?.toUpperCase() || 'D'}
                        </Text>
                      </View>

                      <View style={s.upInfo}>
                        <Text style={s.upName}>Dr. {appt.doctor?.user?.name}</Text>
                        <Text style={[s.upSpec, { color }]}>
                          {appt.doctor?.specialization || 'General Physician'}
                        </Text>
                        <View style={s.upLoc}>
                          <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                          <Text style={s.upLocTxt} numberOfLines={1}>
                            {appt.clinic?.name}{appt.clinic?.city ? `, ${appt.clinic.city}` : ''}
                          </Text>
                        </View>
                        <View style={[s.statusPill, { backgroundColor: color + '18' }]}>
                          <Text style={[s.statusPillTxt, { color }]}>{statusLabel}</Text>
                        </View>
                      </View>

                      <View style={s.upRight}>
                        <Text style={s.upDate}>{fmtDate(appt.appointmentDate)}</Text>
                        {appt.slotTime && (
                          <View style={s.upTimeRow}>
                            <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                            <Text style={s.upTime}>{fmtTime(appt.slotTime)}</Text>
                          </View>
                        )}
                        {appt.queueNumber != null && (
                          <View style={s.tokenBox}>
                            <Text style={s.tokenLbl}>Token</Text>
                            <Text style={[s.tokenNum, { color }]}>#{appt.queueNumber}</Text>
                          </View>
                        )}
                        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginTop: 4 }} />
                      </View>
                    </View>

                    {/* Queue strip */}
                    {qi && (
                      <View style={s.qStrip}>
                        <View style={s.qStripItem}>
                          <Ionicons name="people-outline" size={16} color={colors.primary} />
                          <View>
                            <Text style={s.qStripVal}>
                              <Text style={s.qStripBold}>{qi.position ? `${qi.position}th` : '—'}</Text> in queue
                            </Text>
                          </View>
                        </View>
                        <View style={s.qStripDiv} />
                        <View style={s.qStripItem}>
                          <Ionicons name="timer-outline" size={16} color={colors.primary} />
                          <View>
                            <Text style={s.qStripVal}>Est. wait</Text>
                            <Text style={s.qStripBold}>
                              {qi.estimatedWaitMinutes ? `~${qi.estimatedWaitMinutes} mins` : '—'}
                            </Text>
                          </View>
                        </View>
                        <View style={s.qStripDiv} />
                        <View style={s.qStripItem}>
                          <Ionicons name="notifications-outline" size={16} color={colors.primary} />
                          <Text style={s.qStripVal}>Notify before{'\n'}your turn</Text>
                        </View>
                      </View>
                    )}

                    {/* Cancel */}
                    {['BOOKED','IN_QUEUE'].includes(appt.status) && (
                      <TouchableOpacity
                        style={s.cancelBtn}
                        onPress={() => handleCancel(appt.id)}
                        disabled={cancelling === appt.id}
                      >
                        <Ionicons name="close-circle-outline" size={14} color={colors.danger} />
                        <Text style={s.cancelTxt}>Cancel Appointment</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── Past ── */}
          {past.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Past Appointments</Text>
                <TouchableOpacity style={s.viewAllBtn}>
                  <Text style={s.viewAllTxt}>View All</Text>
                  <Ionicons name="chevron-forward" size={13} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {past.map((appt) => {
                const color      = specColor(appt.doctor?.specialization);
                const isComplete = appt.status === 'COMPLETED';
                return (
                  <TouchableOpacity
                    key={appt.id}
                    style={s.pastCard}
                    onPress={() => navigation.navigate('AppointmentDetail', { id: appt.id })}
                    activeOpacity={0.85}
                  >
                    <View style={[s.pastAvatar, { backgroundColor: color + '18' }]}>
                      <Text style={[s.pastAvatarTxt, { color }]}>
                        {appt.doctor?.user?.name?.charAt(0)?.toUpperCase() || 'D'}
                      </Text>
                    </View>
                    <View style={s.pastInfo}>
                      <Text style={s.pastName}>Dr. {appt.doctor?.user?.name}</Text>
                      <Text style={[s.pastSpec, { color }]}>
                        {appt.doctor?.specialization || 'General Physician'}
                      </Text>
                      <View style={s.pastLoc}>
                        <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                        <Text style={s.pastLocTxt} numberOfLines={1}>
                          {appt.clinic?.name}{appt.clinic?.city ? `, ${appt.clinic.city}` : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={s.pastRight}>
                      <View style={s.pastDateRow}>
                        <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
                        <Text style={s.pastDate}>
                          {new Date(appt.appointmentDate).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </Text>
                      </View>
                      <View style={[s.pastBadge, { backgroundColor: isComplete ? '#D1FAE5' : '#FEE2E2' }]}>
                        <Ionicons
                          name={isComplete ? 'checkmark-circle' : 'close-circle'}
                          size={12}
                          color={isComplete ? '#10B981' : colors.danger}
                        />
                        <Text style={[s.pastBadgeTxt, { color: isComplete ? '#10B981' : colors.danger }]}>
                          {isComplete ? 'Completed' : appt.status === 'CANCELLED' ? 'Cancelled' : 'No Show'}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* No upcoming but has past */}
          {upcoming.length === 0 && past.length > 0 && (
            <View style={s.noUpCard}>
              <Text style={{ fontSize: 32 }}>📅</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.noUpTitle}>No upcoming appointments</Text>
                <Text style={s.noUpSub}>Book a new appointment</Text>
              </View>
              <TouchableOpacity
                style={s.noUpBtn}
                onPress={() => navigation.navigate('DoctorsTab')}
              >
                <Text style={s.noUpBtnTxt}>Book</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#F0F4FF' },
  scroll:           { paddingBottom: 20 },
  loadingWrap:      { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title:            { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle:         { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  bookNewBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, ...shadow.sm },
  bookNewText:      { fontSize: 13, fontWeight: '700', color: colors.primary },

  // Filter tabs
  filterScroll:     { flexGrow: 0, flexShrink: 0 },
  filterRow:        { paddingHorizontal: 20, paddingBottom: 14, gap: 8, alignItems: 'center' },
  filterChip:       { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingHorizontal: 14, borderRadius: radius.full, backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterLabel:      { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  filterLabelActive:{ color: '#fff' },

  // Section
  section:          { paddingHorizontal: 16, marginBottom: 8 },
  sectionRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: 8 },
  sectionTitle:     { fontSize: 16, fontWeight: '800', color: colors.text, flex: 1 },
  viewAllBtn:       { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllTxt:       { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // Upcoming card
  upCard:           { backgroundColor: '#fff', borderRadius: radius.xl, padding: 16, marginBottom: 12, ...shadow.sm },
  upTop:            { flexDirection: 'row', gap: 12, marginBottom: 12 },
  upAvatar:         { width: 64, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  upAvatarTxt:      { fontSize: 26, fontWeight: '800' },
  upInfo:           { flex: 1 },
  upName:           { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 2 },
  upSpec:           { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  upLoc:            { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  upLocTxt:         { fontSize: 11, color: colors.textMuted, flex: 1 },
  statusPill:       { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  statusPillTxt:    { fontSize: 11, fontWeight: '700' },
  upRight:          { alignItems: 'flex-end', minWidth: 88 },
  upDate:           { fontSize: 11, fontWeight: '700', color: colors.primary, textAlign: 'right', marginBottom: 3 },
  upTimeRow:        { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  upTime:           { fontSize: 11, color: colors.textMuted },
  tokenBox:         { alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4, marginTop: 2 },
  tokenLbl:         { fontSize: 9, color: colors.textMuted, fontWeight: '600' },
  tokenNum:         { fontSize: 18, fontWeight: '900' },

  // Queue strip
  qStrip:           { flexDirection: 'row', backgroundColor: '#F0F4FF', borderRadius: radius.lg, padding: 10, gap: 4, marginBottom: 10 },
  qStripItem:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  qStripDiv:        { width: 1, backgroundColor: colors.border, marginHorizontal: 2 },
  qStripVal:        { fontSize: 10, color: colors.textMuted, lineHeight: 14 },
  qStripBold:       { fontSize: 11, fontWeight: '800', color: colors.text },

  // Cancel
  cancelBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: radius.md, backgroundColor: '#FEE2E2' },
  cancelTxt:        { fontSize: 12, fontWeight: '700', color: colors.danger },

  // Past card
  pastCard:         { backgroundColor: '#fff', borderRadius: radius.lg, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, ...shadow.sm },
  pastAvatar:       { width: 48, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  pastAvatarTxt:    { fontSize: 20, fontWeight: '800' },
  pastInfo:         { flex: 1 },
  pastName:         { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 2 },
  pastSpec:         { fontSize: 11, fontWeight: '600', marginBottom: 3 },
  pastLoc:          { flexDirection: 'row', alignItems: 'center', gap: 3 },
  pastLocTxt:       { fontSize: 11, color: colors.textMuted, flex: 1 },
  pastRight:        { alignItems: 'flex-end', gap: 5 },
  pastDateRow:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
  pastDate:         { fontSize: 11, color: colors.textMuted },
  pastBadge:        { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.full },
  pastBadgeTxt:     { fontSize: 11, fontWeight: '700' },

  // No upcoming
  noUpCard:         { marginHorizontal: 16, backgroundColor: '#EFF6FF', borderRadius: radius.xl, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, ...shadow.sm },
  noUpTitle:        { fontSize: 13, fontWeight: '700', color: colors.text },
  noUpSub:          { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  noUpBtn:          { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md },
  noUpBtnTxt:       { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Empty state
  emptyWrap:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIconBox:     { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyEmoji:       { fontSize: 48 },
  emptyTitle:       { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8 },
  emptySub:         { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 28 },
  emptyBtn:         { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: radius.md, ...shadow.md },
  emptyBtnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },
});
