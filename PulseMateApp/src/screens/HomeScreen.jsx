// ─────────────────────────────────────────────────────────────────────────────
//  HomeScreen — PulseMate Connect  |  Premium Healthcare Dashboard
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Animated, Easing,
  Dimensions, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store/authStore';
import { getMyAppointments, getLiveQueue } from '../api/patient';

const { width: W } = Dimensions.get('window');
const LOGO = require('../../assets/logo1.jpeg');

// ── Brand tokens ──────────────────────────────────────────────────────────────
const SKY4 = '#38BDF8'; const SKY5 = '#0EA5E9'; const SKY6 = '#0284C7';
const SKY7 = '#0369A1'; const TEAL = '#2DD4BF'; const WHITE = '#FFFFFF';
const SLATE = '#0F172A'; const MUTED = '#94A3B8'; const BG = '#F0F7FF';

// ── Quick actions ─────────────────────────────────────────────────────────────
const QUICK = [
  { icon: 'calendar',      label: 'Book\nAppointment', bg: '#EFF6FF', ic: SKY6,     action: 'book'         },
  { icon: 'people',        label: 'Live\nQueue',       bg: '#F0FDFA', ic: '#0D9488', action: 'livequeue'    },
  { icon: 'folder-open',   label: 'Reports',           bg: '#F5F3FF', ic: '#7C3AED', action: 'reports'      },
  { icon: 'videocam',      label: 'Video\nConsult',    bg: '#FFF7ED', ic: '#EA580C', action: 'videoconsult' },
];

// ── Specializations ───────────────────────────────────────────────────────────
const SPECS = [
  { icon: 'fitness',        label: 'Physiotherapy', color: '#0EA5E9', bg: '#E0F2FE' },
  { icon: 'happy',          label: 'Dental',        color: '#10B981', bg: '#D1FAE5' },
  { icon: 'body',           label: 'Orthopedic',    color: '#8B5CF6', bg: '#EDE9FE' },
  { icon: 'medkit',         label: 'General',       color: '#F59E0B', bg: '#FEF3C7' },
  { icon: 'heart',          label: 'Pediatrics',    color: '#EF4444', bg: '#FEE2E2' },
  { icon: 'eye',            label: 'Eye Care',      color: '#06B6D4', bg: '#CFFAFE' },
];

// ── Nearby clinics (static demo) ──────────────────────────────────────────────
const CLINICS = [
  { name: 'Apollo Clinic',      area: 'Koramangala',  rating: 4.8, dist: '0.8 km', tag: 'Open Now',  tagColor: '#10B981' },
  { name: 'Fortis Health',      area: 'Indiranagar',  rating: 4.6, dist: '1.4 km', tag: 'Open Now',  tagColor: '#10B981' },
  { name: 'Manipal Hospital',   area: 'Whitefield',   rating: 4.9, dist: '3.2 km', tag: 'Busy',      tagColor: '#F59E0B' },
];

// ── Recommended doctors (static demo) ────────────────────────────────────────
const DOCTORS = [
  { name: 'Dr. Priya Sharma',   spec: 'Cardiologist',      exp: '12 yrs', fee: '₹500', rating: 4.9, avail: 'Today' },
  { name: 'Dr. Rahul Mehta',    spec: 'Orthopedic',        exp: '8 yrs',  fee: '₹400', rating: 4.7, avail: 'Tomorrow' },
  { name: 'Dr. Anita Verma',    spec: 'Pediatrician',      exp: '15 yrs', fee: '₹350', rating: 4.8, avail: 'Today' },
];

// ── Animated pulse dot ────────────────────────────────────────────────────────
function PulseDot({ color = TEAL }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: color, opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] }), transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }] }} />
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, onViewAll }) {
  return (
    <View style={hs.sectionRow}>
      <Text style={hs.sectionTitle}>{title}</Text>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
          <Text style={hs.viewAll}>View all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Upcoming appointment card ─────────────────────────────────────────────────
function AppointmentCard({ appt, onPress }) {
  const statusMeta = {
    BOOKED:          { label: 'Confirmed',   color: SKY5,     bg: '#E0F2FE' },
    CHECKED_IN:      { label: 'Checked In',  color: '#10B981', bg: '#D1FAE5' },
    IN_QUEUE:        { label: 'In Queue',    color: '#F59E0B', bg: '#FEF3C7' },
    IN_CONSULTATION: { label: 'In Progress', color: '#8B5CF6', bg: '#EDE9FE' },
    CALLED:          { label: 'Called',      color: '#EF4444', bg: '#FEE2E2' },
  };
  const meta = statusMeta[appt.status] || { label: appt.status, color: MUTED, bg: '#F1F5F9' };
  const initial = appt.doctor?.user?.name?.charAt(0)?.toUpperCase() || 'D';
  const date = new Date(appt.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <TouchableOpacity style={hs.apptCard} onPress={onPress} activeOpacity={0.88}>
      {/* Left accent bar */}
      <View style={[hs.apptAccent, { backgroundColor: meta.color }]} />

      {/* Avatar */}
      <View style={[hs.apptAvatar, { backgroundColor: meta.bg }]}>
        <Text style={[hs.apptAvatarText, { color: meta.color }]}>{initial}</Text>
      </View>

      {/* Info */}
      <View style={hs.apptInfo}>
        <Text style={hs.apptName}>Dr. {appt.doctor?.user?.name}</Text>
        <Text style={hs.apptSpec}>{appt.doctor?.specialization || 'General Physician'}</Text>
        <View style={hs.apptMetaRow}>
          <Ionicons name="location-outline" size={11} color={MUTED} />
          <Text style={hs.apptMetaText}>{appt.clinic?.name}</Text>
          <View style={hs.metaDot} />
          <Ionicons name="calendar-outline" size={11} color={MUTED} />
          <Text style={hs.apptMetaText}>{date}</Text>
        </View>
      </View>

      {/* Right */}
      <View style={hs.apptRight}>
        <View style={[hs.statusBadge, { backgroundColor: meta.bg }]}>
          <Text style={[hs.statusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        {appt.queueNumber && (
          <Text style={hs.queueNum}>#{appt.queueNumber}</Text>
        )}
        <Ionicons name="chevron-forward" size={14} color={MUTED} style={{ marginTop: 4 }} />
      </View>
    </TouchableOpacity>
  );
}

// ── Main HomeScreen ───────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [activeAppt,   setActiveAppt]   = useState(null);
  const [queueInfo,    setQueueInfo]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  const enterA = useRef(new Animated.Value(0)).current;
  const slideA = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(enterA, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideA, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await getMyAppointments({ limit: 20 });
      const all = res.data.data || [];
      setAppointments(all);
      const active = all.find((a) =>
        ['BOOKED', 'CHECKED_IN', 'IN_QUEUE', 'IN_CONSULTATION', 'CALLED'].includes(a.status)
      );
      setActiveAppt(active || null);
      if (active) {
        try {
          const qRes = await getLiveQueue(active.id);
          setQueueInfo(qRes.data.data?.queueInfo || null);
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
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetIcon = hour < 12 ? '🌤️' : hour < 17 ? '☀️' : '🌙';

  const handleQuick = (action) => {
    if (action === 'book')                navigation.navigate('Search');
    else if (action === 'livequeue' && activeAppt) navigation.navigate('LiveQueue', { appointmentId: activeAppt.id });
    else if (action === 'livequeue')      navigation.navigate('AppointmentsTab');
    else if (action === 'reports')        navigation.navigate('ProfileTab', { screen: 'Profile' });
    else if (action === 'videoconsult')   navigation.navigate('Search');
  };

  return (
    <SafeAreaView style={hs.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={SKY5} />}
      >
        <Animated.View style={{ opacity: enterA, transform: [{ translateY: slideA }] }}>

          {/* ── Header ── */}
          <View style={hs.header}>
            <View style={hs.headerLeft}>
              {/* Logo image + brand name */}
              <Image source={LOGO} style={hs.logoImg} resizeMode="cover" />
              <View>
                <Text style={hs.brandName}>
                  Pulse<Text style={{ color: SKY5 }}>Mate</Text>
                </Text>
                <Text style={hs.greetingSmall}>{greeting} {greetIcon}, {firstName}</Text>
              </View>
            </View>
            <View style={hs.headerRight}>
              <TouchableOpacity style={hs.iconBtn} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.8}>
                <Ionicons name="notifications-outline" size={20} color={SLATE} />
                <View style={hs.notifDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Search bar ── */}
          <TouchableOpacity style={hs.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.85}>
            <View style={hs.searchLeft}>
              <Ionicons name="search-outline" size={18} color={MUTED} />
              <Text style={hs.searchText}>Search doctors, clinics, specialities...</Text>
            </View>
            <View style={hs.filterBtn}>
              <Ionicons name="options-outline" size={16} color={SKY6} />
            </View>
          </TouchableOpacity>

          {/* ── Hero appointment card ── */}
          {loading ? (
            <View style={hs.heroCard}>
              <ActivityIndicator color={WHITE} />
            </View>
          ) : activeAppt ? (
            <TouchableOpacity
              style={hs.heroCard}
              onPress={() => navigation.navigate('LiveQueue', { appointmentId: activeAppt.id })}
              activeOpacity={0.92}
            >
              {/* BG decoration */}
              <View style={hs.heroBlobTL} />
              <View style={hs.heroBlobBR} />

              <View style={hs.heroTop}>
                <View>
                  <View style={hs.heroLiveBadge}>
                    <PulseDot color={TEAL} />
                    <Text style={hs.heroLiveText}>LIVE QUEUE</Text>
                  </View>
                  <Text style={hs.heroClinic}>{activeAppt.clinic?.name}</Text>
                  <Text style={hs.heroDoc}>Dr. {activeAppt.doctor?.user?.name}</Text>
                </View>
                <View style={hs.heroTokenBox}>
                  <Text style={hs.heroTokenLabel}>Token</Text>
                  <Text style={hs.heroTokenNum}>#{activeAppt.queueNumber || '—'}</Text>
                </View>
              </View>

              <View style={hs.heroDivider} />

              <View style={hs.heroBottom}>
                <View style={hs.heroStat}>
                  <Text style={hs.heroStatNum}>{queueInfo?.patientsAhead ?? '—'}</Text>
                  <Text style={hs.heroStatLabel}>Ahead</Text>
                </View>
                <View style={hs.heroStatDivider} />
                <View style={hs.heroStat}>
                  <Text style={hs.heroStatNum}>{queueInfo?.estimatedWaitMinutes ? `${queueInfo.estimatedWaitMinutes}m` : '—'}</Text>
                  <Text style={hs.heroStatLabel}>Est. Wait</Text>
                </View>
                <View style={hs.heroStatDivider} />
                <View style={hs.heroStat}>
                  <Text style={hs.heroStatNum}>{queueInfo?.currentlyServing ? `#${queueInfo.currentlyServing}` : '—'}</Text>
                  <Text style={hs.heroStatLabel}>Serving</Text>
                </View>
                <TouchableOpacity style={hs.heroTrackBtn} activeOpacity={0.85}>
                  <Text style={hs.heroTrackText}>Track</Text>
                  <Ionicons name="arrow-forward" size={13} color={WHITE} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={hs.heroCard} onPress={() => navigation.navigate('Search')} activeOpacity={0.92}>
              <View style={hs.heroBlobTL} />
              <View style={hs.heroBlobBR} />
              <View style={hs.heroEmpty}>
                <View style={hs.heroEmptyIcon}>
                  <Ionicons name="calendar" size={28} color={WHITE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={hs.heroEmptyTitle}>No Active Appointment</Text>
                  <Text style={hs.heroEmptySub}>Book a doctor to track your live queue here</Text>
                </View>
              </View>
              <TouchableOpacity style={hs.heroBookBtn} onPress={() => navigation.navigate('Search')} activeOpacity={0.85}>
                <Ionicons name="add-circle-outline" size={16} color={SKY5} />
                <Text style={hs.heroBookText}>Book Appointment</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          {/* ── Quick Actions ── */}
          <View style={hs.quickGrid}>
            {QUICK.map((item) => (
              <TouchableOpacity key={item.label} style={hs.quickItem} onPress={() => handleQuick(item.action)} activeOpacity={0.8}>
                <View style={[hs.quickIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={22} color={item.ic} />
                </View>
                <Text style={hs.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Specializations ── */}
          <View style={hs.section}>
            <SectionHeader title="Browse by Specialization" onViewAll={() => navigation.navigate('Search')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={hs.specRow}>
              {SPECS.map((sp) => (
                <TouchableOpacity key={sp.label} style={hs.specItem} onPress={() => navigation.navigate('Search')} activeOpacity={0.8}>
                  <View style={[hs.specIcon, { backgroundColor: sp.bg }]}>
                    <Ionicons name={sp.icon} size={22} color={sp.color} />
                  </View>
                  <Text style={hs.specLabel}>{sp.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── Upcoming Appointments ── */}
          <View style={hs.section}>
            <SectionHeader title="Upcoming Appointments" onViewAll={() => navigation.navigate('AppointmentsTab')} />
            {loading ? (
              <ActivityIndicator color={SKY5} style={{ marginVertical: 20 }} />
            ) : upcoming.length === 0 ? (
              <View style={hs.emptyCard}>
                <View style={hs.emptyIconWrap}>
                  <Ionicons name="calendar-outline" size={32} color={SKY5} />
                </View>
                <Text style={hs.emptyTitle}>No upcoming appointments</Text>
                <Text style={hs.emptySub}>Find a doctor and book your first appointment</Text>
                <TouchableOpacity style={hs.emptyBtn} onPress={() => navigation.navigate('Search')} activeOpacity={0.85}>
                  <Ionicons name="search" size={14} color={WHITE} />
                  <Text style={hs.emptyBtnText}>Find a Doctor</Text>
                </TouchableOpacity>
              </View>
            ) : (
              upcoming.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  onPress={() => navigation.navigate('AppointmentsTab', { screen: 'AppointmentDetail', params: { id: appt.id } })}
                />
              ))
            )}
          </View>

          {/* ── Nearby Clinics ── */}
          <View style={hs.section}>
            <SectionHeader title="Nearby Clinics" onViewAll={() => navigation.navigate('Search')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
              {CLINICS.map((c) => (
                <TouchableOpacity key={c.name} style={hs.clinicCard} onPress={() => navigation.navigate('Search')} activeOpacity={0.88}>
                  <View style={hs.clinicIconWrap}>
                    <Ionicons name="business" size={22} color={SKY6} />
                  </View>
                  <Text style={hs.clinicName}>{c.name}</Text>
                  <Text style={hs.clinicArea}>{c.area}</Text>
                  <View style={hs.clinicMeta}>
                    <Ionicons name="star" size={11} color="#F59E0B" />
                    <Text style={hs.clinicRating}>{c.rating}</Text>
                    <View style={hs.metaDot} />
                    <Text style={hs.clinicDist}>{c.dist}</Text>
                  </View>
                  <View style={[hs.clinicTag, { backgroundColor: c.tagColor + '20' }]}>
                    <View style={[hs.clinicTagDot, { backgroundColor: c.tagColor }]} />
                    <Text style={[hs.clinicTagText, { color: c.tagColor }]}>{c.tag}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── Recommended Doctors ── */}
          <View style={hs.section}>
            <SectionHeader title="Recommended Doctors" onViewAll={() => navigation.navigate('DoctorsTab')} />
            {DOCTORS.map((doc) => (
              <TouchableOpacity key={doc.name} style={hs.docCard} onPress={() => navigation.navigate('DoctorsTab')} activeOpacity={0.88}>
                <View style={hs.docAvatar}>
                  <Text style={hs.docAvatarText}>{doc.name.split(' ')[1]?.charAt(0) || 'D'}</Text>
                </View>
                <View style={hs.docInfo}>
                  <Text style={hs.docName}>{doc.name}</Text>
                  <Text style={hs.docSpec}>{doc.spec}  ·  {doc.exp} exp</Text>
                  <View style={hs.docMeta}>
                    <Ionicons name="star" size={11} color="#F59E0B" />
                    <Text style={hs.docRating}>{doc.rating}</Text>
                    <View style={hs.metaDot} />
                    <Ionicons name="time-outline" size={11} color={MUTED} />
                    <Text style={hs.docAvailText}>{doc.avail}</Text>
                  </View>
                </View>
                <View style={hs.docRight}>
                  <Text style={hs.docFee}>{doc.fee}</Text>
                  <Text style={hs.docFeeLabel}>Consult fee</Text>
                  <TouchableOpacity style={hs.docBookBtn} activeOpacity={0.85}>
                    <Text style={hs.docBookText}>Book</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 32 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const hs = StyleSheet.create({

  safe: { flex: 1, backgroundColor: BG },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10,
  },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // Logo image in header
  logoImg: {
    width: 42, height: 42, borderRadius: 12,
    shadowColor: SKY5, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  brandName:     { fontSize: 19, fontWeight: '800', color: SLATE, letterSpacing: -0.4 },
  greetingSmall: { fontSize: 12, color: MUTED, fontWeight: '500', marginTop: 1 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: WHITE,
  },

  // ── Search bar ───────────────────────────────────────────────────────────────
  searchBar: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: WHITE, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  searchLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  searchText:  { fontSize: 14, color: MUTED, flex: 1 },
  filterBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },

  // ── Hero card ────────────────────────────────────────────────────────────────
  heroCard: {
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: SKY5, borderRadius: 24,
    padding: 20, overflow: 'hidden',
    shadowColor: SKY5, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
    minHeight: 130,
  },
  heroBlobTL: {
    position: 'absolute', top: -40, left: -40,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroBlobBR: {
    position: 'absolute', bottom: -30, right: -30,
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  heroLiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  heroLiveText:  { fontSize: 10, fontWeight: '800', color: TEAL, letterSpacing: 1.2 },
  heroClinic:    { fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: -0.3 },
  heroDoc:       { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  heroTokenBox: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  heroTokenLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 2 },
  heroTokenNum:   { fontSize: 24, fontWeight: '900', color: WHITE, letterSpacing: -0.5 },
  heroDivider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 14 },
  heroBottom:     { flexDirection: 'row', alignItems: 'center', gap: 0 },
  heroStat:       { flex: 1, alignItems: 'center' },
  heroStatNum:    { fontSize: 20, fontWeight: '800', color: WHITE, letterSpacing: -0.5 },
  heroStatLabel:  { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2, fontWeight: '500' },
  heroStatDivider:{ width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroTrackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    marginLeft: 8,
  },
  heroTrackText:  { fontSize: 12, fontWeight: '700', color: WHITE },
  heroEmpty:      { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  heroEmptyIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  heroEmptyTitle: { fontSize: 16, fontWeight: '700', color: WHITE },
  heroEmptySub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  heroBookBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: WHITE, borderRadius: 12,
    paddingHorizontal: 18, paddingVertical: 11, alignSelf: 'flex-start',
  },
  heroBookText: { fontSize: 13, fontWeight: '700', color: SKY5 },

  // ── Quick actions ────────────────────────────────────────────────────────────
  quickGrid: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 24,
  },
  quickItem: { alignItems: 'center', width: '22%' },
  quickIcon: {
    width: 58, height: 58, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  quickLabel: { fontSize: 11, fontWeight: '600', color: SLATE, textAlign: 'center', lineHeight: 15 },

  // ── Section ──────────────────────────────────────────────────────────────────
  section:     { paddingHorizontal: 20, marginBottom: 24 },
  sectionRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:{ fontSize: 17, fontWeight: '800', color: SLATE, letterSpacing: -0.3 },
  viewAll:     { fontSize: 13, color: SKY5, fontWeight: '700' },

  // ── Specializations ──────────────────────────────────────────────────────────
  specRow:  { gap: 12, paddingRight: 20 },
  specItem: { alignItems: 'center', gap: 8, width: 72 },
  specIcon: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 5, elevation: 2,
  },
  specLabel: { fontSize: 11, fontWeight: '600', color: SLATE, textAlign: 'center', lineHeight: 14 },

  // ── Appointment card ─────────────────────────────────────────────────────────
  apptCard: {
    backgroundColor: WHITE, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  apptAccent:    { width: 4, alignSelf: 'stretch' },
  apptAvatar: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 12, marginVertical: 14,
  },
  apptAvatarText: { fontSize: 18, fontWeight: '800' },
  apptInfo:       { flex: 1, paddingHorizontal: 12, paddingVertical: 14 },
  apptName:       { fontSize: 14, fontWeight: '700', color: SLATE, marginBottom: 2 },
  apptSpec:       { fontSize: 12, color: MUTED, marginBottom: 6 },
  apptMetaRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  apptMetaText:   { fontSize: 11, color: '#64748B' },
  apptRight:      { paddingRight: 14, alignItems: 'flex-end', gap: 4 },
  statusBadge:    { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText:     { fontSize: 10, fontWeight: '700' },
  queueNum:       { fontSize: 13, fontWeight: '800', color: SLATE },
  metaDot:        { width: 3, height: 3, borderRadius: 2, backgroundColor: MUTED },

  // ── Empty state ──────────────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: WHITE, borderRadius: 20,
    padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  emptyIconWrap: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: SLATE, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 19, marginBottom: 18 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: SKY5, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12,
    shadowColor: SKY5, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },

  // ── Nearby clinics ───────────────────────────────────────────────────────────
  clinicCard: {
    width: 160, backgroundColor: WHITE, borderRadius: 18,
    padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  clinicIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  clinicName:    { fontSize: 13, fontWeight: '700', color: SLATE, marginBottom: 2 },
  clinicArea:    { fontSize: 11, color: MUTED, marginBottom: 8 },
  clinicMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  clinicRating:  { fontSize: 11, fontWeight: '700', color: SLATE },
  clinicDist:    { fontSize: 11, color: MUTED },
  clinicTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start',
  },
  clinicTagDot:  { width: 5, height: 5, borderRadius: 3 },
  clinicTagText: { fontSize: 10, fontWeight: '700' },

  // ── Recommended doctors ──────────────────────────────────────────────────────
  docCard: {
    backgroundColor: WHITE, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    padding: 14, marginBottom: 10, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  docAvatar: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  docAvatarText: { fontSize: 20, fontWeight: '800', color: SKY5 },
  docInfo:       { flex: 1 },
  docName:       { fontSize: 14, fontWeight: '700', color: SLATE, marginBottom: 2 },
  docSpec:       { fontSize: 12, color: MUTED, marginBottom: 6 },
  docMeta:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  docRating:     { fontSize: 11, fontWeight: '700', color: SLATE },
  docAvailText:  { fontSize: 11, color: '#10B981', fontWeight: '600' },
  docRight:      { alignItems: 'flex-end', gap: 4 },
  docFee:        { fontSize: 15, fontWeight: '800', color: SLATE },
  docFeeLabel:   { fontSize: 10, color: MUTED },
  docBookBtn: {
    backgroundColor: SKY5, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7,
    shadowColor: SKY5, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  docBookText: { fontSize: 12, fontWeight: '700', color: WHITE },
});
