// ─────────────────────────────────────────────────────────────────────────────
//  OnboardingScreen — PulseMate Connect  |  4-slide feature walkthrough
//  Shown once after splash, before Login. Skippable.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, Animated,
  Easing, Dimensions, StatusBar, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LOGO = require('../../assets/logo1.jpeg');

const { width: W, height: H } = Dimensions.get('window');

// ── Brand tokens ──────────────────────────────────────────────────────────────
const SKY5  = '#0EA5E9';
const SKY6  = '#0284C7';
const SKY7  = '#0369A1';
const SKY9  = '#0C4A6E';
const TEAL  = '#2DD4BF';
const WHITE = '#FFFFFF';
const SLATE = '#0F172A';
const MUTED = '#94A3B8';

// ── Slide definitions ─────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 0,
    icon:       'calendar',
    iconBg:     '#DBEAFE',
    iconColor:  '#1D4ED8',
    accent:     SKY5,
    accentDark: SKY7,
    badge:      'Smart Booking',
    title:      'Book Appointments\nEasily',
    subtitle:   'Find top-rated doctors near you, pick a convenient slot, and confirm your appointment in under 60 seconds.',
    features: [
      { icon: 'search-outline',    text: 'Search by specialty or doctor name' },
      { icon: 'location-outline',  text: 'Find clinics near your location'    },
      { icon: 'flash-outline',     text: 'Instant confirmation & reminders'   },
    ],
    illustration: 'calendar-booking',
  },
  {
    id: 1,
    icon:       'people',
    iconBg:     '#D1FAE5',
    iconColor:  '#065F46',
    accent:     TEAL,
    accentDark: '#0D9488',
    badge:      'Live Queue',
    title:      'Track Live Clinic\nQueue',
    subtitle:   'See exactly how many patients are ahead of you. Get notified the moment your turn arrives — no more waiting blindly.',
    features: [
      { icon: 'time-outline',          text: 'Real-time queue position updates'  },
      { icon: 'notifications-outline', text: 'Push alert when you\'re called'    },
      { icon: 'navigate-outline',      text: 'Clinic directions built-in'        },
    ],
    illustration: 'live-queue',
  },
  {
    id: 2,
    icon:       'videocam',
    iconBg:     '#EDE9FE',
    iconColor:  '#5B21B6',
    accent:     '#8B5CF6',
    accentDark: '#6D28D9',
    badge:      'Online Consult',
    title:      'Consult Doctors\nOnline',
    subtitle:   'Connect with verified doctors via video, voice, or chat — from the comfort of your home, anytime you need.',
    features: [
      { icon: 'videocam-outline',  text: 'HD video consultations'              },
      { icon: 'chatbubble-outline',text: 'Secure in-app messaging'             },
      { icon: 'shield-checkmark-outline', text: 'HIPAA-compliant & encrypted'  },
    ],
    illustration: 'video-consult',
  },
  {
    id: 3,
    icon:       'document-text',
    iconBg:     '#FEF3C7',
    iconColor:  '#92400E',
    accent:     '#F59E0B',
    accentDark: '#D97706',
    badge:      'Health Records',
    title:      'Store Reports &\nPrescriptions',
    subtitle:   'All your medical records, prescriptions, and lab reports in one secure place — accessible anytime, shareable with any doctor.',
    features: [
      { icon: 'cloud-upload-outline', text: 'Upload & store all health reports' },
      { icon: 'download-outline',     text: 'Download or share prescriptions'   },
      { icon: 'lock-closed-outline',  text: 'End-to-end encrypted storage'      },
    ],
    illustration: 'health-records',
  },
];

// ── Illustration components ───────────────────────────────────────────────────
function CalendarIllustration({ accent }) {
  return (
    <View style={[il.card, { shadowColor: accent }]}>
      <View style={[il.cardHeader, { backgroundColor: accent }]}>
        <Ionicons name="calendar" size={18} color={WHITE} />
        <Text style={il.cardHeaderText}>Book Appointment</Text>
        <View style={il.cardHeaderDot} />
      </View>
      <View style={il.cardBody}>
        {/* Doctor row */}
        <View style={il.docRow}>
          <View style={[il.docAvatar, { backgroundColor: '#DBEAFE' }]}>
            <Text style={{ fontSize: 18 }}>👨‍⚕️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={[il.shimmer, { width: '70%', marginBottom: 5 }]} />
            <View style={[il.shimmer, { width: '45%', height: 8 }]} />
          </View>
          <View style={[il.badge, { backgroundColor: '#D1FAE5' }]}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#065F46' }}>Available</Text>
          </View>
        </View>
        {/* Date chips */}
        <View style={il.dateRow}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => (
            <View key={d} style={[il.dateChip, i === 2 && { backgroundColor: accent }]}>
              <Text style={[il.dateChipText, i === 2 && { color: WHITE }]}>{d}</Text>
              <Text style={[il.dateChipNum, i === 2 && { color: WHITE }]}>{12 + i}</Text>
            </View>
          ))}
        </View>
        {/* Confirm button */}
        <View style={[il.confirmBtn, { backgroundColor: accent }]}>
          <Ionicons name="checkmark-circle" size={14} color={WHITE} />
          <Text style={il.confirmBtnText}>Confirm Booking</Text>
        </View>
      </View>
    </View>
  );
}

function QueueIllustration({ accent }) {
  return (
    <View style={[il.card, { shadowColor: accent }]}>
      <View style={[il.cardHeader, { backgroundColor: accent }]}>
        <View style={il.liveDot} />
        <Text style={il.cardHeaderText}>Live Queue Tracker</Text>
      </View>
      <View style={il.cardBody}>
        {/* Token */}
        <View style={il.tokenRow}>
          <View style={[il.tokenCircle, { borderColor: accent }]}>
            <Text style={il.tokenLabel}>YOUR TOKEN</Text>
            <Text style={[il.tokenNum, { color: accent }]}>07</Text>
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            {[
              { label: 'Ahead of you', val: '3', color: '#F59E0B' },
              { label: 'Now serving',  val: '#04', color: accent   },
              { label: 'Est. wait',    val: '12m', color: '#10B981' },
            ].map((s) => (
              <View key={s.label} style={il.queueStat}>
                <Text style={il.queueStatLabel}>{s.label}</Text>
                <Text style={[il.queueStatVal, { color: s.color }]}>{s.val}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* Progress bar */}
        <View style={il.progressTrack}>
          <View style={[il.progressFill, { width: '55%', backgroundColor: accent }]} />
        </View>
        <Text style={il.progressLabel}>You're almost there!</Text>
      </View>
    </View>
  );
}

function VideoIllustration({ accent }) {
  return (
    <View style={[il.card, { shadowColor: accent }]}>
      <View style={[il.videoScreen, { backgroundColor: '#1E1B4B' }]}>
        {/* Doctor video */}
        <View style={il.videoDocAvatar}>
          <Text style={{ fontSize: 32 }}>👨‍⚕️</Text>
        </View>
        <View style={[il.videoBadge, { backgroundColor: accent }]}>
          <View style={il.videoRecDot} />
          <Text style={il.videoBadgeText}>LIVE</Text>
        </View>
        {/* Controls */}
        <View style={il.videoControls}>
          {['mic', 'videocam', 'call'].map((ic, i) => (
            <View key={ic} style={[il.videoBtn, i === 2 && { backgroundColor: '#EF4444' }]}>
              <Ionicons name={i === 2 ? 'call' : ic} size={14} color={WHITE} />
            </View>
          ))}
        </View>
      </View>
      <View style={il.videoInfo}>
        <Text style={il.videoInfoTitle}>Dr. Priya Sharma</Text>
        <Text style={il.videoInfoSub}>Cardiologist · 12 yrs exp</Text>
      </View>
    </View>
  );
}

function RecordsIllustration({ accent }) {
  const docs = [
    { icon: '🩺', name: 'Prescription', date: 'May 28', color: '#DBEAFE' },
    { icon: '🧪', name: 'Lab Report',   date: 'May 20', color: '#D1FAE5' },
    { icon: '📷', name: 'X-Ray Scan',   date: 'May 10', color: '#EDE9FE' },
  ];
  return (
    <View style={[il.card, { shadowColor: accent }]}>
      <View style={[il.cardHeader, { backgroundColor: accent }]}>
        <Ionicons name="folder" size={16} color={WHITE} />
        <Text style={il.cardHeaderText}>Health Records</Text>
        <View style={[il.badge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: WHITE }}>3 files</Text>
        </View>
      </View>
      <View style={il.cardBody}>
        {docs.map((d) => (
          <View key={d.name} style={il.docFileRow}>
            <View style={[il.docFileIcon, { backgroundColor: d.color }]}>
              <Text style={{ fontSize: 16 }}>{d.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={il.docFileName}>{d.name}</Text>
              <Text style={il.docFileDate}>{d.date}</Text>
            </View>
            <View style={il.docFileActions}>
              <Ionicons name="download-outline" size={14} color={accent} />
              <Ionicons name="share-outline"    size={14} color={MUTED}  />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const il = StyleSheet.create({
  card:           { width: W * 0.78, borderRadius: 22, backgroundColor: WHITE, overflow: 'hidden', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 12 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, gap: 8 },
  cardHeaderText: { flex: 1, fontSize: 12, fontWeight: '700', color: WHITE },
  cardHeaderDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: TEAL },
  cardBody:       { padding: 14, gap: 10 },
  shimmer:        { height: 10, borderRadius: 5, backgroundColor: '#E2E8F0' },
  badge:          { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  liveDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: TEAL },

  // Calendar
  docRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  docAvatar:      { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dateRow:        { flexDirection: 'row', gap: 6 },
  dateChip:       { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  dateChipText:   { fontSize: 9, fontWeight: '600', color: MUTED },
  dateChipNum:    { fontSize: 14, fontWeight: '800', color: SLATE },
  confirmBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 10 },
  confirmBtnText: { fontSize: 13, fontWeight: '700', color: WHITE },

  // Queue
  tokenRow:       { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tokenCircle:    { width: 72, height: 72, borderRadius: 36, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  tokenLabel:     { fontSize: 7, fontWeight: '700', color: MUTED, letterSpacing: 0.5 },
  tokenNum:       { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  queueStat:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  queueStatLabel: { fontSize: 10, color: MUTED },
  queueStatVal:   { fontSize: 13, fontWeight: '800' },
  progressTrack:  { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill:   { height: '100%', borderRadius: 3 },
  progressLabel:  { fontSize: 10, color: MUTED, textAlign: 'center' },

  // Video
  videoScreen:    { height: 110, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  videoDocAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  videoBadge:     { position: 'absolute', top: 8, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  videoRecDot:    { width: 5, height: 5, borderRadius: 3, backgroundColor: WHITE },
  videoBadgeText: { fontSize: 9, fontWeight: '800', color: WHITE },
  videoControls:  { position: 'absolute', bottom: 8, flexDirection: 'row', gap: 10 },
  videoBtn:       { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  videoInfo:      { padding: 12 },
  videoInfoTitle: { fontSize: 13, fontWeight: '700', color: SLATE },
  videoInfoSub:   { fontSize: 11, color: MUTED, marginTop: 2 },

  // Records
  docFileRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  docFileIcon:    { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  docFileName:    { fontSize: 12, fontWeight: '700', color: SLATE },
  docFileDate:    { fontSize: 10, color: MUTED, marginTop: 1 },
  docFileActions: { flexDirection: 'row', gap: 10 },
});

// ── Main OnboardingScreen ─────────────────────────────────────────────────────
export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);

  const fadeA  = useRef(new Animated.Value(1)).current;
  const slideA = useRef(new Animated.Value(0)).current;
  const floatA = useRef(new Animated.Value(0)).current;
  const btnA   = useRef(new Animated.Value(0)).current;

  // Float loop for illustration
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatA, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(floatA, { toValue: 0, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    Animated.timing(btnA, { toValue: 1, duration: 500, delay: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const slide = SLIDES[current];

  const goTo = (idx) => {
    Animated.parallel([
      Animated.timing(fadeA,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideA, { toValue: -20, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setCurrent(idx);
      slideA.setValue(20);
      Animated.parallel([
        Animated.timing(fadeA,  { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(slideA, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (current < SLIDES.length - 1) {
      goTo(current + 1);
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => navigation.replace('Login');

  const floatY = floatA.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  const renderIllustration = () => {
    switch (slide.illustration) {
      case 'calendar-booking': return <CalendarIllustration accent={slide.accent} />;
      case 'live-queue':       return <QueueIllustration    accent={slide.accent} />;
      case 'video-consult':    return <VideoIllustration    accent={slide.accent} />;
      case 'health-records':   return <RecordsIllustration  accent={slide.accent} />;
      default: return null;
    }
  };

  return (
    <View style={ob.root}>
      <StatusBar barStyle="light-content" backgroundColor={SKY9} translucent />

      {/* ── Background ── */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: SKY9 }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: SKY7, opacity: 0.55 }]} />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.55, backgroundColor: slide.accent, opacity: 0.18 }} />

      {/* Blobs */}
      <View style={[ob.blob, { top: -80, left: -80, width: 220, height: 220, backgroundColor: slide.accent, opacity: 0.12 }]} />
      <View style={[ob.blob, { bottom: H * 0.3, right: -60, width: 160, height: 160, backgroundColor: TEAL, opacity: 0.08 }]} />

      {/* Dot grid */}
      <View style={ob.dotGrid} pointerEvents="none">
        {Array.from({ length: 24 }).map((_, i) => <View key={i} style={ob.dot} />)}
      </View>

      {/* ── Top: logo + skip ── */}
      <View style={[ob.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={ob.logoRow}>
          <Image source={LOGO} style={ob.logoImg} resizeMode="cover" />
          <Text style={ob.logoText}>PulseMate Connect</Text>
        </View>
        <TouchableOpacity style={ob.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={ob.skipText}>Skip</Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </View>

      {/* ── Illustration ── */}
      <Animated.View style={[ob.illustrationWrap, { transform: [{ translateY: floatY }] }]}>
        <Animated.View style={{ opacity: fadeA, transform: [{ translateY: slideA }] }}>
          {renderIllustration()}
        </Animated.View>
      </Animated.View>

      {/* ── Slide dots ── */}
      <View style={ob.dotsRow}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
            <Animated.View style={[
              ob.dot2,
              { backgroundColor: i === current ? WHITE : 'rgba(255,255,255,0.3)' },
              i === current && { width: 24 },
            ]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Bottom sheet ── */}
      <View style={ob.sheet}>
        {/* Accent bar */}
        <View style={[ob.accentBar, { backgroundColor: slide.accent }]} />

        <Animated.View style={{ opacity: fadeA, transform: [{ translateY: slideA }] }}>
          {/* Badge */}
          <View style={[ob.badge, { backgroundColor: slide.iconBg }]}>
            <Ionicons name={slide.icon} size={13} color={slide.iconColor} />
            <Text style={[ob.badgeText, { color: slide.iconColor }]}>{slide.badge}</Text>
          </View>

          {/* Title */}
          <Text style={ob.title}>{slide.title}</Text>

          {/* Subtitle */}
          <Text style={ob.subtitle}>{slide.subtitle}</Text>

          {/* Feature list */}
          <View style={ob.featureList}>
            {slide.features.map((f, i) => (
              <View key={i} style={ob.featureRow}>
                <View style={[ob.featureIconWrap, { backgroundColor: slide.iconBg }]}>
                  <Ionicons name={f.icon} size={14} color={slide.iconColor} />
                </View>
                <Text style={ob.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* CTA buttons */}
        <Animated.View style={[ob.btns, { opacity: btnA, paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity
            style={[ob.nextBtn, { backgroundColor: slide.accent, shadowColor: slide.accent }]}
            onPress={handleNext}
            activeOpacity={0.88}
          >
            {current < SLIDES.length - 1 ? (
              <>
                <Text style={ob.nextBtnText}>Next</Text>
                <Ionicons name="arrow-forward" size={18} color={WHITE} />
              </>
            ) : (
              <>
                <Ionicons name="rocket" size={18} color={WHITE} />
                <Text style={ob.nextBtnText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={16} color={WHITE} />
              </>
            )}
          </TouchableOpacity>

          {current < SLIDES.length - 1 && (
            <TouchableOpacity style={ob.skipFullBtn} onPress={handleSkip} activeOpacity={0.7}>
              <Text style={ob.skipFullText}>Skip Onboarding</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const ob = StyleSheet.create({
  root: { flex: 1, backgroundColor: SKY9 },

  blob:    { position: 'absolute', borderRadius: 999 },
  dotGrid: { position: 'absolute', top: H * 0.06, right: 16, width: 90, flexDirection: 'row', flexWrap: 'wrap', gap: 11, opacity: 0.18 },
  dot:     { width: 3, height: 3, borderRadius: 2, backgroundColor: WHITE },

  topBar:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, marginBottom: 8 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImg: { width: 28, height: 28, borderRadius: 8 },
  logoText:{ fontSize: 14, fontWeight: '700', color: WHITE, letterSpacing: -0.2 },
  skipBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 6 },
  skipText:{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },

  illustrationWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },

  dotsRow: { flexDirection: 'row', gap: 7, justifyContent: 'center', marginBottom: 14 },
  dot2:    { height: 6, width: 6, borderRadius: 3 },

  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 26, paddingTop: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 12,
  },
  accentBar: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18, marginTop: 10 },

  badge:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  title:    { fontSize: 26, fontWeight: '800', color: SLATE, letterSpacing: -0.7, lineHeight: 32, marginBottom: 10 },
  subtitle: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 16 },

  featureList: { gap: 10, marginBottom: 20 },
  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1, fontSize: 13, color: '#475569', fontWeight: '500' },

  btns:        { gap: 10, paddingTop: 4 },
  nextBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 16, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: 0.2 },
  skipFullBtn: { alignItems: 'center', paddingVertical: 10 },
  skipFullText:{ fontSize: 14, color: MUTED, fontWeight: '600' },
});
