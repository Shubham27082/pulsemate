import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store/authStore';
import { getMyAppointments, getPatientProfile, getLiveQueue } from '../api/patient';
import { colors, shadow, radius } from '../theme';

const QUICK = [
  { icon: 'person-add',  label: 'Find Doctors',   screen: 'Search',          bg: '#EFF6FF', iconColor: colors.primary   },
  { icon: 'calendar',    label: 'Appointments',    tab: 'AppointmentsTab',    bg: '#FFF7ED', iconColor: '#EA580C'        },
  { icon: 'people',      label: 'Live Queue',      action: 'livequeue',       bg: '#ECFDF5', iconColor: '#10B981'        },
  { icon: 'document-text', label: 'Health Records',tab: 'PrescriptionsTab',   bg: '#F5F3FF', iconColor: '#7C3AED'        },
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [activeAppt, setActiveAppt]     = useState(null);
  const [queueInfo, setQueueInfo]       = useState(null);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  const load = useCallback(async () => {
    try {
      const [apptRes] = await Promise.all([
        getMyAppointments({ limit: 20 }),
      ]);
      const all = apptRes.data.data || [];
      setAppointments(all);

      // Find the most recent active appointment
      const active = all.find((a) =>
        ['BOOKED', 'CHECKED_IN', 'IN_QUEUE', 'IN_CONSULTATION', 'CALLED'].includes(a.status)
      );
      setActiveAppt(active || null);

      // Load queue info for active appointment
      if (active) {
        try {
          const qRes = await getLiveQueue(active.id);
          const { queueInfo: qi } = qRes.data.data;
          setQueueInfo(qi);
        } catch { setQueueInfo(null); }
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const upcoming = appointments
    .filter((a) => !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status))
    .slice(0, 3);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const handleQuick = (item) => {
    if (item.action === 'livequeue' && activeAppt) {
      navigation.navigate('LiveQueue', { appointmentId: activeAppt.id });
    } else if (item.tab) {
      navigation.navigate(item.tab);
    } else if (item.screen) {
      navigation.navigate(item.screen);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
        }
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Hello, {firstName} 👋</Text>
            <Text style={s.greetingSub}>Take control of your health</Text>
          </View>
          <TouchableOpacity style={s.bellBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* ── Search bar ── */}
        <TouchableOpacity
          style={s.searchBar}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <Text style={s.searchPlaceholder}>Search doctors, specialities...</Text>
        </TouchableOpacity>

        {/* ── Active Token Card ── */}
        {loading ? (
          <ActivityIndicator color="#fff" style={{ marginHorizontal: 20, marginBottom: 16 }} />
        ) : activeAppt ? (
          <TouchableOpacity
            style={s.tokenCard}
            onPress={() => navigation.navigate('LiveQueue', { appointmentId: activeAppt.id })}
            activeOpacity={0.9}
          >
            <View style={s.tokenLeft}>
              <Text style={s.tokenLabel}>Current Token</Text>
              <Text style={s.tokenNumber}>
                {activeAppt.clinic?.name?.substring(0, 3).toUpperCase() || 'CHC'}-{activeAppt.queueNumber || '—'}
              </Text>
              <Text style={s.tokenClinic}>{activeAppt.clinic?.name}</Text>
              <View style={s.tokenBadge}>
                <Text style={s.tokenBadgeText}>
                  {activeAppt.status === 'IN_CONSULTATION' ? 'In Progress' :
                   activeAppt.status === 'CALLED'          ? 'Called'      :
                   activeAppt.status === 'IN_QUEUE'        ? 'In Queue'    :
                   activeAppt.status === 'CHECKED_IN'      ? 'Checked In'  : 'Booked'}
                </Text>
              </View>
            </View>
            <View style={s.tokenRight}>
              <Text style={s.tokenTurnLabel}>Your Turn in</Text>
              <Text style={s.tokenTurnNum}>{queueInfo?.patientsAhead ?? '—'}</Text>
              <Text style={s.tokenTurnSub}>Patients</Text>
              <Text style={s.tokenWait}>
                {queueInfo?.estimatedWaitMinutes ? `~${queueInfo.estimatedWaitMinutes} mins` : '—'}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.tokenCard, s.tokenCardEmpty]}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.9}
          >
            <View style={s.tokenEmptyContent}>
              <Ionicons name="calendar-outline" size={28} color="rgba(255,255,255,0.8)" />
              <View style={{ marginLeft: 16 }}>
                <Text style={s.tokenEmptyTitle}>No Active Appointment</Text>
                <Text style={s.tokenEmptySub}>Book a doctor to see your queue status here</Text>
              </View>
            </View>
            <View style={s.tokenBookBtn}>
              <Text style={s.tokenBookBtnText}>Book Now</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Quick Actions ── */}
        <View style={s.quickRow}>
          {QUICK.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={s.quickItem}
              onPress={() => handleQuick(item)}
              activeOpacity={0.75}
            >
              <View style={[s.quickIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={24} color={item.iconColor} />
              </View>
              <Text style={s.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Online Consult Banner ── */}
        <TouchableOpacity
          style={s.consultBanner}
          onPress={() => navigation.navigate('Search')}
          activeOpacity={0.9}
        >
          <View style={s.consultLeft}>
            <Text style={s.consultTitle}>Consult Doctors Online</Text>
            <Text style={s.consultSub}>Book video consultation</Text>
            <View style={s.consultBtn}>
              <Text style={s.consultBtnText}>Consult Now</Text>
            </View>
          </View>
          <View style={s.consultRight}>
            <Text style={{ fontSize: 64 }}>👩‍⚕️</Text>
          </View>
        </TouchableOpacity>

        {/* ── Upcoming Appointments ── */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Upcoming Appointment</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AppointmentsTab')}>
              <Text style={s.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : upcoming.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyEmoji}>📅</Text>
              <Text style={s.emptyText}>No upcoming appointments</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Search')}>
                <Text style={s.emptyBtnText}>Find a Doctor</Text>
              </TouchableOpacity>
            </View>
          ) : (
            upcoming.map((appt) => (
              <TouchableOpacity
                key={appt.id}
                style={s.apptCard}
                onPress={() => navigation.navigate('AppointmentsTab', {
                  screen: 'AppointmentDetail', params: { id: appt.id },
                })}
                activeOpacity={0.85}
              >
                {/* Doctor avatar */}
                <View style={s.docAvatar}>
                  <Text style={s.docAvatarText}>
                    {appt.doctor?.user?.name?.charAt(0)?.toUpperCase() || 'D'}
                  </Text>
                </View>

                {/* Info */}
                <View style={s.apptInfo}>
                  <Text style={s.apptDocName}>Dr. {appt.doctor?.user?.name}</Text>
                  <Text style={s.apptSpec}>{appt.doctor?.specialization || 'General Physician'}</Text>
                  <View style={s.apptMeta}>
                    <Text style={s.apptDate}>{formatDate(appt.appointmentDate)}</Text>
                    {appt.slotTime && (
                      <>
                        <View style={s.metaDot} />
                        <Text style={s.apptDate}>{formatTime(appt.slotTime)}</Text>
                      </>
                    )}
                  </View>
                </View>

                {/* Right side */}
                <View style={s.apptRight}>
                  <View style={s.ratingRow}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={s.ratingText}>4.8</Text>
                  </View>
                  <View style={s.visitBadge}>
                    <Text style={s.visitBadgeText}>
                      {appt.appointmentType === 'ONLINE' ? 'Online' : 'Clinic Visit'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: '#F0F4FF' },

  // Header
  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  greeting:          { fontSize: 20, fontWeight: '800', color: colors.text },
  greetingSub:       { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  bellBtn:           { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow.sm },

  // Search
  searchBar:         { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#fff', borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10, ...shadow.sm },
  searchPlaceholder: { fontSize: 14, color: colors.textMuted, flex: 1 },

  // Token card
  tokenCard:         { marginHorizontal: 20, marginBottom: 20, backgroundColor: colors.primary, borderRadius: radius.xl, padding: 20, flexDirection: 'row', justifyContent: 'space-between', ...shadow.lg },
  tokenCardEmpty:    { alignItems: 'center' },
  tokenLeft:         { flex: 1 },
  tokenLabel:        { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginBottom: 4 },
  tokenNumber:       { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1, marginBottom: 2 },
  tokenClinic:       { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  tokenBadge:        { alignSelf: 'flex-start', backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full },
  tokenBadgeText:    { fontSize: 12, fontWeight: '700', color: '#fff' },
  tokenRight:        { alignItems: 'flex-end', justifyContent: 'center' },
  tokenTurnLabel:    { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  tokenTurnNum:      { fontSize: 36, fontWeight: '900', color: '#fff', lineHeight: 40 },
  tokenTurnSub:      { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
  tokenWait:         { fontSize: 16, fontWeight: '700', color: '#fff' },
  tokenEmptyContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  tokenEmptyTitle:   { fontSize: 16, fontWeight: '700', color: '#fff' },
  tokenEmptySub:     { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  tokenBookBtn:      { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 24, paddingVertical: 10, borderRadius: radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  tokenBookBtnText:  { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Quick actions
  quickRow:          { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  quickItem:         { alignItems: 'center', width: '22%' },
  quickIcon:         { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8, ...shadow.sm },
  quickLabel:        { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },

  // Consult banner
  consultBanner:     { marginHorizontal: 20, marginBottom: 20, backgroundColor: '#E8FFF5', borderRadius: radius.xl, padding: 20, flexDirection: 'row', overflow: 'hidden', ...shadow.sm },
  consultLeft:       { flex: 1, justifyContent: 'center' },
  consultTitle:      { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 4 },
  consultSub:        { fontSize: 13, color: colors.textMuted, marginBottom: 14 },
  consultBtn:        { alignSelf: 'flex-start', backgroundColor: '#10B981', paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.full },
  consultBtnText:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  consultRight:      { justifyContent: 'center', alignItems: 'center', width: 80 },

  // Section
  section:           { paddingHorizontal: 20, marginBottom: 8 },
  sectionRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:      { fontSize: 17, fontWeight: '800', color: colors.text },
  viewAll:           { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // Appointment card
  apptCard:          { backgroundColor: '#fff', borderRadius: radius.lg, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, ...shadow.sm },
  docAvatar:         { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  docAvatarText:     { fontSize: 20, fontWeight: '800', color: colors.primary },
  apptInfo:          { flex: 1 },
  apptDocName:       { fontSize: 15, fontWeight: '700', color: colors.text },
  apptSpec:          { fontSize: 12, color: colors.textMuted, marginTop: 2, marginBottom: 6 },
  apptMeta:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
  apptDate:          { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  metaDot:           { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textMuted },
  apptRight:         { alignItems: 'flex-end', gap: 6 },
  ratingRow:         { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText:        { fontSize: 12, fontWeight: '700', color: colors.text },
  visitBadge:        { backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  visitBadgeText:    { fontSize: 11, color: colors.primary, fontWeight: '600' },

  // Empty
  emptyCard:         { backgroundColor: '#fff', borderRadius: radius.lg, padding: 28, alignItems: 'center', ...shadow.sm },
  emptyEmoji:        { fontSize: 40, marginBottom: 10 },
  emptyText:         { fontSize: 14, color: colors.textMuted, marginBottom: 14 },
  emptyBtn:          { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.full },
  emptyBtnText:      { color: '#fff', fontWeight: '700', fontSize: 13 },
});
