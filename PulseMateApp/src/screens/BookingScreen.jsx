// ─────────────────────────────────────────────────────────────────────────────
//  BookingScreen — PulseMate Connect  |  Appointment Booking
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Animated,
  Easing, Dimensions, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { initiatePayment, verifyPayment, getPatientProfile } from '../api/patient';

const { width: W } = Dimensions.get('window');

// ── Brand tokens ──────────────────────────────────────────────────────────────
const PRIMARY   = '#0EA5E9';   // Sky-500
const PRIMARY_D = '#0284C7';   // Sky-600
const PRIMARY_L = '#E0F2FE';   // Sky-100
const TEAL      = '#2DD4BF';
const PURPLE    = '#8B5CF6';
const PURPLE_L  = '#EDE9FE';
const GREEN     = '#10B981';
const GREEN_L   = '#D1FAE5';
const AMBER     = '#F59E0B';
const RED       = '#EF4444';
const WHITE     = '#FFFFFF';
const SLATE     = '#0F172A';
const SLATE_6   = '#475569';
const MUTED     = '#94A3B8';
const BG        = '#F0F7FF';
const CARD      = '#FFFFFF';
const BORDER    = '#E2E8F0';

// ── Time slots ────────────────────────────────────────────────────────────────
const MORNING_SLOTS   = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const AFTERNOON_SLOTS = ['12:00', '12:30', '13:00', '14:00', '14:30', '15:00'];
const EVENING_SLOTS   = ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];

// ── Symptom quick-picks ───────────────────────────────────────────────────────
const SYMPTOM_CHIPS = [
  'Fever', 'Headache', 'Cough', 'Back Pain',
  'Fatigue', 'Chest Pain', 'Nausea', 'Skin Issue',
  'Joint Pain', 'Dizziness',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr   = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
};

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

// ── Step indicator ────────────────────────────────────────────────────────────
function StepDots({ current, total }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 4,
            width: i === current ? 20 : 6,
            borderRadius: 3,
            backgroundColor: i <= current ? TEAL : 'rgba(255,255,255,0.35)',
          }}
        />
      ))}
    </View>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ icon, title, badge, optional, children }) {
  return (
    <View style={bs.section}>
      <View style={bs.sectionHeader}>
        <View style={bs.sectionIconWrap}>
          <Ionicons name={icon} size={15} color={PRIMARY} />
        </View>
        <Text style={bs.sectionTitle}>{title}</Text>
        {badge ? (
          <View style={bs.sectionBadge}>
            <Text style={bs.sectionBadgeText}>{badge}</Text>
          </View>
        ) : optional ? (
          <Text style={bs.sectionOptional}>Optional</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

// ── Success overlay ───────────────────────────────────────────────────────────
function SuccessOverlay({ visible, doctorName, date, slot, queueNumber, onView }) {
  const scaleA = useRef(new Animated.Value(0)).current;
  const fadeA  = useRef(new Animated.Value(0)).current;
  const checkA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleA, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
          Animated.timing(fadeA,  { toValue: 1, duration: 280, useNativeDriver: true }),
        ]),
        Animated.spring(checkA, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[so.overlay, { opacity: fadeA }]}>
      <Animated.View style={[so.card, { transform: [{ scale: scaleA }] }]}>
        {/* Confetti-like top decoration */}
        <View style={so.topDeco}>
          <View style={[so.decoCircle, { backgroundColor: PRIMARY_L, top: -20, left: 20, width: 60, height: 60 }]} />
          <View style={[so.decoCircle, { backgroundColor: GREEN_L, top: 10, right: 10, width: 40, height: 40 }]} />
          <View style={[so.decoCircle, { backgroundColor: PURPLE_L, top: -10, right: 60, width: 30, height: 30 }]} />
        </View>

        <Animated.View style={[so.checkCircle, { transform: [{ scale: checkA }] }]}>
          <View style={so.checkInner}>
            <Ionicons name="checkmark" size={36} color={WHITE} />
          </View>
        </Animated.View>

        <Text style={so.title}>Booking Confirmed!</Text>
        <Text style={so.sub}>Your appointment has been successfully booked.</Text>

        <View style={so.detailBox}>
          <View style={so.detailRow}>
            <View style={[so.detailIcon, { backgroundColor: PRIMARY_L }]}>
              <Ionicons name="person" size={13} color={PRIMARY} />
            </View>
            <Text style={so.detailLabel}>Doctor</Text>
            <Text style={so.detailVal}>Dr. {doctorName}</Text>
          </View>
          <View style={so.divider} />
          <View style={so.detailRow}>
            <View style={[so.detailIcon, { backgroundColor: GREEN_L }]}>
              <Ionicons name="calendar" size={13} color={GREEN} />
            </View>
            <Text style={so.detailLabel}>Date</Text>
            <Text style={so.detailVal}>{fmtDate(date)}{slot ? ` · ${fmt12(slot)}` : ''}</Text>
          </View>
          {queueNumber && (
            <>
              <View style={so.divider} />
              <View style={so.detailRow}>
                <View style={[so.detailIcon, { backgroundColor: PURPLE_L }]}>
                  <Ionicons name="people" size={13} color={PURPLE} />
                </View>
                <Text style={so.detailLabel}>Queue Token</Text>
                <Text style={[so.detailVal, { color: PURPLE, fontWeight: '800' }]}>#{queueNumber}</Text>
              </View>
            </>
          )}
        </View>

        <TouchableOpacity style={so.btn} onPress={onView} activeOpacity={0.88}>
          <Text style={so.btnText}>View My Appointments</Text>
          <Ionicons name="arrow-forward" size={16} color={WHITE} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const so = StyleSheet.create({
  overlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,132,199,0.93)', zIndex: 200, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:       { backgroundColor: WHITE, borderRadius: 28, padding: 28, alignItems: 'center', width: '100%', overflow: 'hidden' },
  topDeco:    { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
  decoCircle: { position: 'absolute', borderRadius: 999, opacity: 0.7 },
  checkCircle:{ width: 90, height: 90, borderRadius: 45, backgroundColor: GREEN_L, alignItems: 'center', justifyContent: 'center', marginBottom: 18, marginTop: 8 },
  checkInner: { width: 72, height: 72, borderRadius: 36, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', shadowColor: GREEN, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 10 },
  title:      { fontSize: 24, fontWeight: '800', color: SLATE, letterSpacing: -0.5, marginBottom: 6 },
  sub:        { fontSize: 13, color: MUTED, textAlign: 'center', marginBottom: 20, lineHeight: 19 },
  detailBox:  { width: '100%', backgroundColor: BG, borderRadius: 16, padding: 4, marginBottom: 22 },
  detailRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  detailIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  detailLabel:{ fontSize: 12, color: MUTED, flex: 1 },
  detailVal:  { fontSize: 13, fontWeight: '700', color: SLATE },
  divider:    { height: 1, backgroundColor: BORDER, marginHorizontal: 12 },
  btn:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: PRIMARY, borderRadius: 16, paddingHorizontal: 28, paddingVertical: 15, width: '100%', justifyContent: 'center', shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 7 },
  btnText:    { fontSize: 15, fontWeight: '800', color: WHITE },
});

// ── Main BookingScreen ────────────────────────────────────────────────────────
export default function BookingScreen({ route, navigation }) {
  const { doctorId, clinicId, doctorName, clinicName, fee, specialization } = route.params || {};
  const insets = useSafeAreaInsets();

  const [type,       setType]       = useState('OFFLINE');
  const [date,       setDate]       = useState('');
  const [slot,       setSlot]       = useState('');
  const [symptoms,   setSymptoms]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [patient,    setPatient]    = useState(null);
  const [success,    setSuccess]    = useState(false);
  const [bookedAppt, setBookedAppt] = useState(null);
  const [symFocused, setSymFocused] = useState(false);

  const enterA = useRef(new Animated.Value(0)).current;
  const slideA = useRef(new Animated.Value(24)).current;

  // Generate next 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      key:     d.toISOString().split('T')[0],
      weekday: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      day:     d.getDate(),
      month:   d.toLocaleDateString('en-IN', { month: 'short' }),
      isToday: i === 0,
    };
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(enterA, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideA, { toValue: 0, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    getPatientProfile().then((r) => setPatient(r.data.data.user)).catch(() => {});
  }, []);

  const addSymptomChip = (chip) => {
    const current = symptoms.trim();
    if (current.includes(chip)) {
      setSymptoms(current.replace(new RegExp(`,?\\s*${chip}`, 'g'), '').replace(/^,\s*/, '').trim());
    } else {
      setSymptoms(current ? `${current}, ${chip}` : chip);
    }
  };

  const handleBook = async () => {
    if (!date) { Alert.alert('Select Date', 'Please pick an appointment date.'); return; }
    setLoading(true);
    try {
      const initRes = await initiatePayment({
        doctorId, clinicId,
        appointmentType: type,
        appointmentDate: date,
        slotTime:  slot     || undefined,
        symptoms:  symptoms.trim() || undefined,
      });
      const { appointmentId, order, devMode } = initRes.data.data;
      if (devMode || order?.id?.startsWith('order_dev_')) {
        const verifyRes = await verifyPayment({
          appointmentId,
          razorpayOrderId:   order.id,
          razorpayPaymentId: `pay_dev_${Date.now()}`,
          razorpaySignature: 'dev_sig',
        });
        setBookedAppt(verifyRes.data.data.appointment);
        setSuccess(true);
      } else {
        Alert.alert('Payment Required', `Order ID: ${order.id}\nAmount: ₹${(order.amount / 100).toFixed(0)}`);
      }
    } catch (err) {
      Alert.alert('Booking Failed', err.response?.data?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canBook    = !!date && !loading;
  const consultFee = fee || 0;
  const p          = patient?.patientProfile;
  const patientAge = p?.dob
    ? Math.floor((new Date() - new Date(p.dob)) / (365.25 * 24 * 60 * 60 * 1000))
    : p?.age;

  // Determine current step for progress dots
  const step = !date ? 0 : !slot ? 1 : !symptoms ? 2 : 3;

  return (
    <View style={bs.root}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_D} translucent />

      {/* ── Gradient Header Band ── */}
      <View style={[bs.headerBand, { paddingTop: insets.top + 10 }]}>
        <View style={bs.blobTL} />
        <View style={bs.blobBR} />
        <View style={bs.blobMid} />

        {/* Nav row */}
        <View style={bs.navRow}>
          <TouchableOpacity style={bs.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={WHITE} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={bs.navTitle}>Book Appointment</Text>
            <Text style={bs.navSub}>Fill in the details below</Text>
          </View>
          <View style={bs.secureBadge}>
            <Ionicons name="lock-closed" size={10} color={TEAL} />
            <Text style={bs.secureText}>Razorpay</Text>
          </View>
        </View>

        {/* Doctor info card */}
        <View style={bs.docCard}>
          <View style={bs.docAvatarWrap}>
            <Text style={bs.docAvatarText}>{doctorName?.charAt(0)?.toUpperCase() || 'D'}</Text>
            <View style={bs.docOnlineDot} />
          </View>
          <View style={bs.docInfo}>
            <Text style={bs.docName}>Dr. {doctorName || 'Doctor'}</Text>
            <Text style={bs.docSpec}>{specialization || 'General Physician'}</Text>
            <View style={bs.docClinicRow}>
              <Ionicons name="business-outline" size={11} color="rgba(255,255,255,0.65)" />
              <Text style={bs.docClinic}>{clinicName || 'Clinic'}</Text>
            </View>
          </View>
          <View style={bs.docFeeBox}>
            <Text style={bs.docFeeLabel}>Consult Fee</Text>
            <Text style={bs.docFeeVal}>₹{consultFee}</Text>
            <View style={bs.docFeeNote}>
              <Ionicons name="business" size={9} color="rgba(255,255,255,0.55)" />
              <Text style={bs.docFeeNoteText}>at clinic</Text>
            </View>
          </View>
        </View>

        {/* Progress dots */}
        <View style={bs.progressRow}>
          <StepDots current={step} total={4} />
          <Text style={bs.progressText}>Step {step + 1} of 4</Text>
        </View>
      </View>

      {/* ── Scrollable form ── */}
      <Animated.ScrollView
        style={{ opacity: enterA, transform: [{ translateY: slideA }] }}
        contentContainerStyle={[bs.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 1. Appointment Type ── */}
        <Section icon="options-outline" title="Appointment Type">
          <View style={bs.typeRow}>
            {[
              { key: 'OFFLINE', icon: 'business',  label: 'In-Clinic',   sub: 'Visit the clinic',   color: PRIMARY, bg: PRIMARY_L },
              { key: 'ONLINE',  icon: 'videocam',  label: 'Online',      sub: 'Video consultation', color: PURPLE,  bg: PURPLE_L  },
            ].map((t) => {
              const active = type === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[bs.typeCard, active && { borderColor: t.color, backgroundColor: t.bg }]}
                  onPress={() => setType(t.key)}
                  activeOpacity={0.85}
                >
                  <View style={[bs.typeIconWrap, { backgroundColor: active ? t.color : '#F1F5F9' }]}>
                    <Ionicons name={t.icon} size={22} color={active ? WHITE : MUTED} />
                  </View>
                  <Text style={[bs.typeLabel, active && { color: t.color }]}>{t.label}</Text>
                  <Text style={bs.typeSub}>{t.sub}</Text>
                  {active && (
                    <View style={[bs.typeCheck, { backgroundColor: t.color }]}>
                      <Ionicons name="checkmark" size={10} color={WHITE} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* ── 2. Date Picker ── */}
        <Section
          icon="calendar-outline"
          title="Select Date"
          badge={date ? fmtDate(date) : null}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={bs.dateRow}>
            {days.map((d) => {
              const active = date === d.key;
              return (
                <TouchableOpacity
                  key={d.key}
                  style={[
                    bs.dateCard,
                    active && bs.dateCardActive,
                    d.isToday && !active && bs.dateCardToday,
                  ]}
                  onPress={() => setDate(d.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[bs.dateWeekday, active && bs.dateTextActive, d.isToday && !active && { color: PRIMARY }]}>
                    {d.isToday ? 'Today' : d.weekday}
                  </Text>
                  <Text style={[bs.dateDay, active && bs.dateTextActive]}>{d.day}</Text>
                  <Text style={[bs.dateMonth, active && bs.dateTextActive]}>{d.month}</Text>
                  {d.isToday && !active && <View style={bs.todayDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Section>

        {/* ── 3. Time Slot ── */}
        <Section icon="time-outline" title="Preferred Time" optional>
          {[
            { label: 'Morning',   icon: 'sunny-outline',        slots: MORNING_SLOTS   },
            { label: 'Afternoon', icon: 'partly-sunny-outline', slots: AFTERNOON_SLOTS },
            { label: 'Evening',   icon: 'moon-outline',         slots: EVENING_SLOTS   },
          ].map(({ label, icon, slots }) => (
            <View key={label} style={bs.slotGroup}>
              <View style={bs.slotGroupHeader}>
                <Ionicons name={icon} size={13} color={MUTED} />
                <Text style={bs.slotGroupLabel}>{label}</Text>
              </View>
              <View style={bs.slotRow}>
                {slots.map((s) => {
                  const active = slot === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[bs.slotChip, active && bs.slotChipActive]}
                      onPress={() => setSlot(slot === s ? '' : s)}
                      activeOpacity={0.8}
                    >
                      {active && <Ionicons name="time" size={11} color={PRIMARY} style={{ marginRight: 3 }} />}
                      <Text style={[bs.slotText, active && bs.slotTextActive]}>{fmt12(s)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </Section>

        {/* ── 4. Symptoms ── */}
        <Section icon="medical-outline" title="Symptoms / Reason" optional>
          <View style={bs.symChipRow}>
            {SYMPTOM_CHIPS.map((c) => {
              const active = symptoms.includes(c);
              return (
                <TouchableOpacity
                  key={c}
                  style={[bs.symChip, active && bs.symChipActive]}
                  onPress={() => addSymptomChip(c)}
                  activeOpacity={0.8}
                >
                  {active && <Ionicons name="checkmark-circle" size={12} color={PRIMARY} style={{ marginRight: 3 }} />}
                  <Text style={[bs.symChipText, active && bs.symChipTextActive]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={[bs.symInputWrap, symFocused && bs.symInputFocused]}>
            <Ionicons name="create-outline" size={16} color={symFocused ? PRIMARY : MUTED} style={{ marginTop: 2 }} />
            <TextInput
              style={bs.symInput}
              value={symptoms}
              onChangeText={setSymptoms}
              placeholder="Describe your symptoms or reason for visit..."
              placeholderTextColor={MUTED}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              onFocus={() => setSymFocused(true)}
              onBlur={() => setSymFocused(false)}
              maxLength={500}
            />
          </View>
          <Text style={bs.charCount}>{symptoms.length}/500</Text>
        </Section>

        {/* ── 5. Patient Summary ── */}
        {patient && (
          <Section icon="person-outline" title="Patient Details">
            <View style={bs.autoFillBanner}>
              <Ionicons name="checkmark-circle" size={14} color={GREEN} />
              <Text style={bs.autoFillBannerText}>Auto-filled from your profile</Text>
            </View>
            <View style={bs.patientCard}>
              <View style={bs.patientAvatarWrap}>
                <Text style={bs.patientAvatarText}>{patient.name?.charAt(0)?.toUpperCase() || 'P'}</Text>
              </View>
              <View style={bs.patientInfo}>
                <Text style={bs.patientName}>{patient.name || '—'}</Text>
                <View style={bs.patientMetaRow}>
                  {p?.gender && (
                    <View style={bs.patientTag}>
                      <Text style={bs.patientTagText}>{p.gender.charAt(0) + p.gender.slice(1).toLowerCase()}</Text>
                    </View>
                  )}
                  {patientAge && (
                    <View style={bs.patientTag}>
                      <Text style={bs.patientTagText}>{patientAge} yrs</Text>
                    </View>
                  )}
                  {p?.bloodGroup && (
                    <View style={[bs.patientTag, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={[bs.patientTagText, { color: RED }]}>{p.bloodGroup}</Text>
                    </View>
                  )}
                </View>
                {p?.city && (
                  <View style={bs.patientLocRow}>
                    <Ionicons name="location-outline" size={11} color={MUTED} />
                    <Text style={bs.patientLocText}>{p.city}</Text>
                  </View>
                )}
              </View>
              <View style={bs.patientVerifiedBadge}>
                <Ionicons name="shield-checkmark" size={22} color={GREEN} />
                <Text style={bs.patientVerifiedText}>Verified</Text>
              </View>
            </View>
            {p?.emergencyContact && (
              <View style={bs.emergencyRow}>
                <Ionicons name="call-outline" size={13} color={MUTED} />
                <Text style={bs.emergencyText}>Emergency: {p.emergencyContact}</Text>
              </View>
            )}
          </Section>
        )}

        {/* ── 6. Payment Summary ── */}
        <Section icon="card-outline" title="Payment Summary">
          {/* Razorpay trust bar */}
          <View style={bs.rzpBar}>
            <View style={bs.rzpLeft}>
              <View style={bs.rzpIconWrap}>
                <Ionicons name="shield-checkmark" size={16} color={PURPLE} />
              </View>
              <View>
                <Text style={bs.rzpTitle}>Secured by Razorpay</Text>
                <Text style={bs.rzpSub}>256-bit SSL encrypted payment</Text>
              </View>
            </View>
            <View style={bs.rzpMethods}>
              {['UPI', 'Card', 'NB'].map((m) => (
                <View key={m} style={bs.rzpMethod}>
                  <Text style={bs.rzpMethodText}>{m}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Line items */}
          <View style={bs.payLines}>
            <View style={bs.payLine}>
              <View style={bs.payLineLeft}>
                <Ionicons name="phone-portrait-outline" size={14} color={MUTED} />
                <Text style={bs.payLineLabel}>Platform Booking Fee</Text>
              </View>
              <Text style={bs.payLineVal}>₹10</Text>
            </View>

            <View style={bs.payLineDivider} />

            <View style={bs.payLine}>
              <View style={bs.payLineLeft}>
                <Ionicons name="medical-outline" size={14} color={MUTED} />
                <Text style={bs.payLineLabel}>Consultation Fee</Text>
              </View>
              <View style={bs.payAtClinicBadge}>
                <Ionicons name="business-outline" size={10} color={AMBER} />
                <Text style={bs.payAtClinicText}>₹{consultFee} · Pay at clinic</Text>
              </View>
            </View>

            <View style={bs.payLineDivider} />

            <View style={bs.payLine}>
              <View style={bs.payLineLeft}>
                <Ionicons name={type === 'OFFLINE' ? 'business-outline' : 'videocam-outline'} size={14} color={MUTED} />
                <Text style={bs.payLineLabel}>Appointment Type</Text>
              </View>
              <Text style={bs.payLineVal}>{type === 'OFFLINE' ? 'In-Clinic' : 'Online'}</Text>
            </View>

            {date && (
              <>
                <View style={bs.payLineDivider} />
                <View style={bs.payLine}>
                  <View style={bs.payLineLeft}>
                    <Ionicons name="calendar-outline" size={14} color={MUTED} />
                    <Text style={bs.payLineLabel}>Date & Time</Text>
                  </View>
                  <Text style={bs.payLineVal}>{fmtDate(date)}{slot ? ` · ${fmt12(slot)}` : ''}</Text>
                </View>
              </>
            )}
          </View>

          {/* Total row */}
          <View style={bs.payTotal}>
            <View style={bs.payTotalLeft}>
              <Text style={bs.payTotalLabel}>Total to Pay Now</Text>
              <Text style={bs.payTotalSub}>Consultation fee paid separately at clinic</Text>
            </View>
            <View style={bs.payTotalRight}>
              <Text style={bs.payTotalVal}>₹10</Text>
            </View>
          </View>
        </Section>

        {/* ── Info note ── */}
        <View style={bs.infoNote}>
          <View style={bs.infoNoteIcon}>
            <Ionicons name="information-circle" size={16} color={PRIMARY} />
          </View>
          <Text style={bs.infoNoteText}>
            A ₹10 platform fee secures your slot. The consultation fee of ₹{consultFee} is paid directly at the clinic.
          </Text>
        </View>
      </Animated.ScrollView>

      {/* ── Sticky bottom CTA ── */}
      <View style={[bs.stickyBar, { paddingBottom: insets.bottom + 10 }]}>
        <View style={bs.stickyLeft}>
          <Text style={bs.stickyLabel}>Pay Now</Text>
          <View style={bs.stickyAmountRow}>
            <Text style={bs.stickyAmount}>₹10</Text>
            <Text style={bs.stickyAmountNote}> platform fee</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[bs.payBtn, !canBook && bs.payBtnDisabled]}
          onPress={handleBook}
          disabled={!canBook}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <>
              <Ionicons name="card" size={18} color={WHITE} />
              <Text style={bs.payBtnText}>Proceed to Pay</Text>
              <Ionicons name="arrow-forward" size={16} color={WHITE} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Success overlay ── */}
      <SuccessOverlay
        visible={success}
        doctorName={doctorName}
        date={date}
        slot={slot}
        queueNumber={bookedAppt?.queueNumber}
        onView={() => navigation.navigate('AppointmentsTab')}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const bs = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // ── Header band ──────────────────────────────────────────────────────────────
  headerBand: {
    backgroundColor: PRIMARY_D,
    paddingHorizontal: 20,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  blobTL: {
    position: 'absolute', top: -60, left: -60,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  blobBR: {
    position: 'absolute', bottom: -40, right: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  blobMid: {
    position: 'absolute', top: 40, right: 80,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(45,212,191,0.12)',
  },

  // Nav row
  navRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn:    {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  navTitle:   { fontSize: 18, fontWeight: '800', color: WHITE, letterSpacing: -0.3 },
  navSub:     { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  secureBadge:{
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(45,212,191,0.18)', borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(45,212,191,0.35)',
  },
  secureText: { fontSize: 10, fontWeight: '700', color: TEAL },

  // Doctor card
  docCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 18,
    padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  },
  docAvatarWrap: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  docAvatarText: { fontSize: 22, fontWeight: '900', color: WHITE },
  docOnlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: TEAL, borderWidth: 2, borderColor: PRIMARY_D,
  },
  docInfo:    { flex: 1 },
  docName:    { fontSize: 15, fontWeight: '800', color: WHITE, letterSpacing: -0.2 },
  docSpec:    { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  docClinicRow:{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  docClinic:  { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  docFeeBox:  { alignItems: 'flex-end', gap: 2 },
  docFeeLabel:{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  docFeeVal:  { fontSize: 20, fontWeight: '900', color: WHITE, letterSpacing: -0.5 },
  docFeeNote: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  docFeeNoteText: { fontSize: 9, color: 'rgba(255,255,255,0.55)' },

  // Progress
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressText:{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },

  // Scroll
  scroll: { padding: 14, gap: 12 },

  // Section
  section: {
    backgroundColor: CARD, borderRadius: 20, padding: 16,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionIconWrap: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: PRIMARY_L, alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle:    { fontSize: 15, fontWeight: '800', color: SLATE, flex: 1, letterSpacing: -0.2 },
  sectionOptional: { fontSize: 11, color: MUTED, fontWeight: '600' },
  sectionBadge:    {
    backgroundColor: PRIMARY_L, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  sectionBadgeText:{ fontSize: 11, fontWeight: '700', color: PRIMARY_D },

  // ── Appointment type ──────────────────────────────────────────────────────────
  typeRow:     { flexDirection: 'row', gap: 12 },
  typeCard:    {
    flex: 1, alignItems: 'center', padding: 16,
    borderRadius: 16, borderWidth: 2, borderColor: BORDER,
    backgroundColor: CARD, gap: 6, position: 'relative',
  },
  typeIconWrap:{ width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  typeLabel:   { fontSize: 14, fontWeight: '700', color: SLATE },
  typeSub:     { fontSize: 11, color: MUTED, textAlign: 'center' },
  typeCheck:   {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Date picker ───────────────────────────────────────────────────────────────
  dateRow:       { gap: 10, paddingRight: 4 },
  dateCard:      {
    width: 64, borderRadius: 16, backgroundColor: '#F8FAFC',
    alignItems: 'center', paddingVertical: 12,
    borderWidth: 1.5, borderColor: BORDER, gap: 2,
  },
  dateCardActive:{
    backgroundColor: PRIMARY, borderColor: PRIMARY,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  dateCardToday: { borderColor: PRIMARY, borderWidth: 2 },
  dateWeekday:   { fontSize: 10, color: MUTED, fontWeight: '700', textTransform: 'uppercase' },
  dateDay:       { fontSize: 22, fontWeight: '900', color: SLATE },
  dateMonth:     { fontSize: 10, color: MUTED, fontWeight: '600' },
  dateTextActive:{ color: WHITE },
  todayDot:      { width: 5, height: 5, borderRadius: 3, backgroundColor: PRIMARY, marginTop: 2 },

  // ── Slot groups ───────────────────────────────────────────────────────────────
  slotGroup:       { marginBottom: 12 },
  slotGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  slotGroupLabel:  { fontSize: 11, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },
  slotRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip:        {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 13, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#F8FAFC',
  },
  slotChipActive:  {
    borderColor: PRIMARY, backgroundColor: PRIMARY_L,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 4, elevation: 2,
  },
  slotText:        { fontSize: 12, fontWeight: '600', color: SLATE_6 },
  slotTextActive:  { color: PRIMARY_D, fontWeight: '800' },

  // ── Symptoms ──────────────────────────────────────────────────────────────────
  symChipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  symChip:          {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#F8FAFC',
  },
  symChipActive:    { borderColor: PRIMARY, backgroundColor: PRIMARY_L },
  symChipText:      { fontSize: 12, fontWeight: '600', color: SLATE_6 },
  symChipTextActive:{ color: PRIMARY_D, fontWeight: '700' },
  symInputWrap:     {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 14,
    padding: 14, backgroundColor: '#F8FAFC',
  },
  symInputFocused:  {
    borderColor: PRIMARY, backgroundColor: WHITE,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 2,
  },
  symInput:         { flex: 1, fontSize: 14, color: SLATE, minHeight: 72 },
  charCount:        { fontSize: 11, color: MUTED, textAlign: 'right', marginTop: 4 },

  // ── Patient card ──────────────────────────────────────────────────────────────
  autoFillBanner:   {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: GREEN_L, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7, marginBottom: 12,
  },
  autoFillBannerText:{ fontSize: 12, fontWeight: '700', color: '#065F46' },
  patientCard:      {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F8FAFC', borderRadius: 16, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: BORDER,
  },
  patientAvatarWrap:{
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: PRIMARY_L, alignItems: 'center', justifyContent: 'center',
  },
  patientAvatarText:{ fontSize: 20, fontWeight: '800', color: PRIMARY },
  patientInfo:      { flex: 1 },
  patientName:      { fontSize: 14, fontWeight: '800', color: SLATE, marginBottom: 6 },
  patientMetaRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 5 },
  patientTag:       { backgroundColor: PRIMARY_L, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  patientTagText:   { fontSize: 11, fontWeight: '700', color: PRIMARY_D },
  patientLocRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  patientLocText:   { fontSize: 11, color: MUTED },
  patientVerifiedBadge:{ alignItems: 'center', gap: 2 },
  patientVerifiedText: { fontSize: 9, fontWeight: '700', color: GREEN },
  emergencyRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  emergencyText:    { fontSize: 12, color: MUTED },

  // ── Payment summary ───────────────────────────────────────────────────────────
  rzpBar:       {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: PURPLE_L, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14,
    borderWidth: 1, borderColor: '#DDD6FE',
  },
  rzpLeft:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rzpIconWrap:  {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center',
  },
  rzpTitle:     { fontSize: 12, fontWeight: '800', color: PURPLE },
  rzpSub:       { fontSize: 10, color: MUTED, marginTop: 1 },
  rzpMethods:   { flexDirection: 'row', gap: 5 },
  rzpMethod:    {
    backgroundColor: WHITE, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: '#DDD6FE',
  },
  rzpMethodText:{ fontSize: 9, fontWeight: '700', color: PURPLE },

  payLines:     { gap: 0, marginBottom: 14 },
  payLine:      {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 11,
  },
  payLineLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payLineLabel: { fontSize: 13, color: SLATE_6 },
  payLineVal:   { fontSize: 13, fontWeight: '700', color: SLATE },
  payLineDivider:{ height: 1, backgroundColor: '#F1F5F9' },
  payAtClinicBadge:{
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF3C7', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  payAtClinicText:{ fontSize: 11, fontWeight: '700', color: '#92400E' },

  payTotal:     {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: BG, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: PRIMARY_L,
  },
  payTotalLeft: { flex: 1 },
  payTotalLabel:{ fontSize: 14, fontWeight: '800', color: SLATE },
  payTotalSub:  { fontSize: 11, color: MUTED, marginTop: 2 },
  payTotalRight:{ alignItems: 'flex-end' },
  payTotalVal:  { fontSize: 26, fontWeight: '900', color: PRIMARY_D, letterSpacing: -0.5 },

  // ── Info note ─────────────────────────────────────────────────────────────────
  infoNote:     {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: PRIMARY_L, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: '#BAE6FD',
  },
  infoNoteIcon: { marginTop: 1 },
  infoNoteText: { flex: 1, fontSize: 12, color: PRIMARY_D, lineHeight: 18, fontWeight: '500' },

  // ── Sticky bottom bar ─────────────────────────────────────────────────────────
  stickyBar:    {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE,
    paddingHorizontal: 20, paddingTop: 14,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderTopWidth: 1, borderTopColor: BORDER,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 12,
  },
  stickyLeft:   { flex: 1 },
  stickyLabel:  { fontSize: 11, color: MUTED, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  stickyAmountRow:{ flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  stickyAmount: { fontSize: 26, fontWeight: '900', color: SLATE, letterSpacing: -0.5 },
  stickyAmountNote:{ fontSize: 12, color: MUTED, fontWeight: '500' },

  payBtn:       {
    flex: 1.6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: PRIMARY, borderRadius: 16,
    paddingVertical: 16,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
  },
  payBtnDisabled:{ backgroundColor: MUTED, shadowOpacity: 0 },
  payBtnText:   { fontSize: 15, fontWeight: '800', color: WHITE, letterSpacing: -0.2 },
});
