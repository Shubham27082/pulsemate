// ─────────────────────────────────────────────────────────────────────────────
//  WelcomeScreen — PulseMate Connect Onboarding
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, Animated,
  Easing, Dimensions, StatusBar, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';

const LOGO = require('../../assets/logo1.jpeg');

const { width: W, height: H } = Dimensions.get('window');

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const SKY4  = '#38BDF8';
const SKY5  = '#0EA5E9';
const SKY7  = '#0369A1';
const SKY9  = '#0C4A6E';
const TEAL  = '#2DD4BF';
const ROSE  = '#FB7185';
const WHITE = '#FFFFFF';

// ─── Slide data ───────────────────────────────────────────────────────────────
const SLIDES = [
  {
    icon:     'calendar',
    iconBg:   '#DBEAFE',
    iconColor:'#1D4ED8',
    badge:    'Smart Booking',
    heading:  'Book Appointments\nSmarter',
    sub:      'Find top doctors near you, pick a slot and confirm in under 60 seconds.',
    accent:   SKY5,
  },
  {
    icon:     'people',
    iconBg:   '#D1FAE5',
    iconColor:'#065F46',
    badge:    'Live Queue',
    heading:  'Track Your Queue\nin Real Time',
    sub:      'See exactly how many patients are ahead. Get notified the moment you\'re called.',
    accent:   TEAL,
  },
  {
    icon:     'document-text',
    iconBg:   '#EDE9FE',
    iconColor:'#5B21B6',
    badge:    'Digital Records',
    heading:  'Prescriptions &\nRecords, Always Ready',
    sub:      'Access your full medical history, prescriptions and follow-up dates anytime.',
    accent:   '#7C3AED',
  },
];

// ─── Floating blob ────────────────────────────────────────────────────────────
function Blob({ size, top, left, color, opacity }) {
  return (
    <View style={{
      position: 'absolute', top, left,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity,
    }} />
  );
}

// ─── Medical illustration (pure RN) ──────────────────────────────────────────
function MedicalIllustration({ slide, anim }) {
  const floatY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const { icon, iconBg, iconColor, accent } = SLIDES[slide];

  return (
    <Animated.View style={[il.wrap, { transform: [{ translateY: floatY }] }]}>

      {/* Background card */}
      <View style={[il.card, { shadowColor: accent }]}>

        {/* Top bar */}
        <View style={[il.topBar, { backgroundColor: accent }]}>
          <View style={il.topDots}>
            {['rgba(255,255,255,0.5)','rgba(255,255,255,0.35)','rgba(255,255,255,0.2)'].map((c, i) => (
              <View key={i} style={[il.topDot, { backgroundColor: c }]} />
            ))}
          </View>
          <Text style={il.topLabel}>PulseMate Connect</Text>
          <Ionicons name="wifi" size={14} color="rgba(255,255,255,0.8)" />
        </View>

        {/* Doctor figure */}
        <View style={il.scene}>
          {/* Doctor */}
          <View style={il.doctorWrap}>
            {/* Head */}
            <View style={il.doctorHead}>
              <View style={il.doctorFace} />
              {/* Stethoscope */}
              <View style={il.stethoArc} />
              <View style={il.stethoEnd} />
            </View>
            {/* Body */}
            <View style={[il.doctorBody, { backgroundColor: accent }]}>
              <View style={il.coatLine} />
              <View style={il.coatLine2} />
              {/* Badge */}
              <View style={[il.docBadge, { backgroundColor: iconBg }]}>
                <Ionicons name="medical" size={10} color={iconColor} />
              </View>
            </View>
            {/* Legs */}
            <View style={il.legs}>
              <View style={[il.leg, { backgroundColor: '#1E3A5F' }]} />
              <View style={[il.leg, { backgroundColor: '#1E3A5F' }]} />
            </View>
          </View>

          {/* Patient figure */}
          <View style={il.patientWrap}>
            <View style={il.patientHead}>
              <View style={[il.doctorFace, { backgroundColor: '#FBBF24' }]} />
            </View>
            <View style={[il.doctorBody, { backgroundColor: '#E0F2FE', width: 36, height: 44 }]}>
              <View style={[il.coatLine, { backgroundColor: '#BAE6FD' }]} />
            </View>
            <View style={il.legs}>
              <View style={[il.leg, { backgroundColor: '#475569' }]} />
              <View style={[il.leg, { backgroundColor: '#475569' }]} />
            </View>
          </View>

          {/* Floating card — slide-specific */}
          <View style={[il.floatCard, { borderColor: accent + '40' }]}>
            <View style={[il.floatIcon, { backgroundColor: iconBg }]}>
              <Ionicons name={icon} size={14} color={iconColor} />
            </View>
            <View>
              <Text style={il.floatTitle}>{SLIDES[slide].badge}</Text>
              <Text style={il.floatSub}>Active now</Text>
            </View>
            <View style={[il.floatDot, { backgroundColor: TEAL }]} />
          </View>

          {/* ECG strip */}
          <View style={il.ecgStrip}>
            {[0,8,0,-16,12,-10,0,0,6,0].map((h, i) => (
              <View key={i} style={[il.ecgBar, {
                height: Math.abs(h) + 2,
                marginTop: h < 0 ? 0 : Math.abs(h),
                backgroundColor: h !== 0 ? accent : 'rgba(255,255,255,0.3)',
              }]} />
            ))}
          </View>
        </View>
      </View>

      {/* Decorative rings */}
      <View style={[il.ring, { width: 180, height: 180, borderRadius: 90, borderColor: accent + '25' }]} />
      <View style={[il.ring, { width: 230, height: 230, borderRadius: 115, borderColor: accent + '12' }]} />
    </Animated.View>
  );
}

const il = StyleSheet.create({
  wrap:       { alignItems: 'center', justifyContent: 'center', height: H * 0.36 },
  card:       { width: W * 0.78, borderRadius: 24, backgroundColor: WHITE, overflow: 'hidden', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 12 },
  topBar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  topDots:    { flexDirection: 'row', gap: 4, marginRight: 4 },
  topDot:     { width: 7, height: 7, borderRadius: 4 },
  topLabel:   { flex: 1, fontSize: 11, fontWeight: '700', color: WHITE, letterSpacing: 0.3 },
  scene:      { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 16, paddingTop: 12, gap: 16, position: 'relative' },
  doctorWrap: { alignItems: 'center', gap: 2 },
  doctorHead: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FBBF24', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  doctorFace: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FCD34D' },
  stethoArc:  { position: 'absolute', bottom: -6, right: -8, width: 16, height: 10, borderRadius: 8, borderWidth: 2, borderColor: '#94A3B8', borderBottomColor: 'transparent' },
  stethoEnd:  { position: 'absolute', bottom: -10, right: -4, width: 6, height: 6, borderRadius: 3, backgroundColor: '#94A3B8' },
  doctorBody: { width: 44, height: 52, borderRadius: 10, alignItems: 'center', paddingTop: 8, gap: 4 },
  coatLine:   { width: 20, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.5)' },
  coatLine2:  { width: 14, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.35)' },
  docBadge:   { position: 'absolute', bottom: 6, right: 4, width: 18, height: 18, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  legs:       { flexDirection: 'row', gap: 6 },
  leg:        { width: 12, height: 22, borderRadius: 6 },
  patientWrap:{ alignItems: 'center', gap: 2 },
  patientHead:{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FDE68A', alignItems: 'center', justifyContent: 'center' },
  floatCard:  { position: 'absolute', top: 8, right: 12, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: WHITE, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  floatIcon:  { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  floatTitle: { fontSize: 10, fontWeight: '700', color: '#0F172A' },
  floatSub:   { fontSize: 9, color: '#64748B' },
  floatDot:   { width: 7, height: 7, borderRadius: 4 },
  ecgStrip:   { position: 'absolute', bottom: 10, left: 20, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  ecgBar:     { width: 3, borderRadius: 2 },
  ring:       { position: 'absolute', borderWidth: 1 },
});

// ─── Main WelcomeScreen ───────────────────────────────────────────────────────
export default function WelcomeScreen({ navigation }) {
  const [slide, setSlide]   = useState(0);
  const fadeA   = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(30)).current;
  const floatA  = useRef(new Animated.Value(0)).current;
  const barA    = useRef(new Animated.Value(0)).current;
  const btnA    = useRef(new Animated.Value(0)).current;

  // Float loop
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatA, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(floatA, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);

  // Entrance
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeA,  { toValue: 1, duration: 600, delay: 100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 600, delay: 100, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }),
      Animated.timing(btnA,   { toValue: 1, duration: 500, delay: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.timing(barA, { toValue: 1, duration: 4000, delay: 200, easing: Easing.linear, useNativeDriver: false }).start();
  }, []);

  // Auto-advance slides
  useEffect(() => {
    const t = setTimeout(() => {
      setSlide((s) => (s + 1) % SLIDES.length);
    }, 4200);
    return () => clearTimeout(t);
  }, [slide]);

  const current = SLIDES[slide];

  const goLogin      = () => navigation.navigate('Onboarding');
  const goStaffLogin = () => navigation.navigate('Login');

  return (
    <View style={ws.root}>
      <StatusBar barStyle="light-content" backgroundColor={SKY9} translucent />

      {/* ── Background ── */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: SKY9 }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: SKY7, opacity: 0.6 }]} />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.62, backgroundColor: SKY5, opacity: 0.22 }} />

      {/* Blobs */}
      <Blob size={260} top={-90}  left={-90}  color={SKY4} opacity={0.12} />
      <Blob size={180} top={H*0.3} left={W-100} color={TEAL} opacity={0.09} />
      <Blob size={120} top={H*0.55} left={-50} color={SKY4} opacity={0.07} />

      {/* Dot grid */}
      <View style={ws.dotGrid} pointerEvents="none">
        {Array.from({ length: 30 }).map((_, i) => <View key={i} style={ws.dot} />)}
      </View>

      {/* ── Top section (illustration) ── */}
      <Animated.View style={[ws.top, { opacity: fadeA, transform: [{ translateY: slideY }] }]}>
        {/* Status bar spacer */}
        <View style={{ height: 52 }} />

        {/* Logo row */}
        <View style={ws.logoRow}>
          <Image source={LOGO} style={ws.logoImg} resizeMode="cover" />
          <Text style={ws.logoText}>PulseMate Connect</Text>
          <View style={ws.liveBadge}>
            <View style={ws.liveDot} />
            <Text style={ws.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Illustration */}
        <MedicalIllustration slide={slide} anim={floatA} />

        {/* Slide dots */}
        <View style={ws.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setSlide(i)} activeOpacity={0.7}>
              <Animated.View style={[ws.slideDot, i === slide && ws.slideDotActive, { backgroundColor: i === slide ? WHITE : 'rgba(255,255,255,0.35)' }]} />
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* ── Bottom sheet ── */}
      <Animated.View style={[ws.sheet, { opacity: fadeA }]}>

        {/* Accent bar */}
        <View style={[ws.accentBar, { backgroundColor: current.accent }]} />

        {/* Badge */}
        <View style={[ws.badge, { backgroundColor: current.iconBg }]}>
          <Ionicons name={current.icon} size={13} color={current.iconColor} />
          <Text style={[ws.badgeText, { color: current.iconColor }]}>{current.badge}</Text>
        </View>

        {/* Heading */}
        <Text style={ws.heading}>{current.heading}</Text>

        {/* Sub */}
        <Text style={ws.sub}>{current.sub}</Text>

        {/* Progress bar */}
        <View style={ws.progressTrack}>
          <Animated.View style={[ws.progressFill, {
            backgroundColor: current.accent,
            width: barA.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]} />
        </View>

        {/* Feature row */}
        <View style={ws.featureRow}>
          {[
            { icon: 'flash',          label: 'Instant Booking' },
            { icon: 'time',           label: 'Live Queue'      },
            { icon: 'shield-checkmark', label: 'Secure & Private' },
          ].map(({ icon, label }) => (
            <View key={label} style={ws.featureItem}>
              <View style={[ws.featureIcon, { backgroundColor: current.iconBg }]}>
                <Ionicons name={icon} size={14} color={current.iconColor} />
              </View>
              <Text style={ws.featureLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Divider */}
        <View style={ws.divider} />

        {/* CTA buttons */}
        <Animated.View style={[ws.btns, { opacity: btnA, transform: [{ translateY: btnA.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          {/* Get Started */}
          <TouchableOpacity style={[ws.btnPrimary, { backgroundColor: current.accent, shadowColor: current.accent }]} onPress={goLogin} activeOpacity={0.88}>
            <Ionicons name="rocket" size={18} color={WHITE} />
            <Text style={ws.btnPrimaryText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={16} color={WHITE} />
          </TouchableOpacity>

          {/* Sign In */}
          <TouchableOpacity style={ws.btnSecondary} onPress={goLogin} activeOpacity={0.8}>
            <Ionicons name="log-in-outline" size={17} color={SKY7} />
            <Text style={ws.btnSecondaryText}>Sign In to Existing Account</Text>
          </TouchableOpacity>

          {/* Staff Login */}
          <TouchableOpacity style={ws.staffBtn} onPress={goStaffLogin} activeOpacity={0.7}>
            <View style={ws.staffBtnLeft}>
              <View style={ws.staffIcon}>
                <Ionicons name="briefcase-outline" size={14} color={SKY7} />
              </View>
              <Text style={ws.staffBtnText}>Staff / Doctor Login</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={SKY7} />
          </TouchableOpacity>
        </Animated.View>

        {/* Terms */}
        <Text style={ws.terms}>
          By continuing you agree to our{' '}
          <Text style={[ws.termsLink, { color: current.accent }]}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={[ws.termsLink, { color: current.accent }]}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ws = StyleSheet.create({

  root: { flex: 1, backgroundColor: SKY9 },

  // Dot grid
  dotGrid: { position: 'absolute', top: H * 0.04, right: 14, width: 100, flexDirection: 'row', flexWrap: 'wrap', gap: 11, opacity: 0.18 },
  dot:     { width: 3, height: 3, borderRadius: 2, backgroundColor: WHITE },

  // Top
  top: { flex: 1, alignItems: 'center' },

  // Logo row
  logoRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, paddingHorizontal: 24, alignSelf: 'flex-start' },
  logoImg:  { width: 30, height: 30, borderRadius: 9 },
  logoText: { fontSize: 15, fontWeight: '700', color: WHITE, letterSpacing: -0.3 },
  liveBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(45,212,191,0.2)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(45,212,191,0.35)' },
  liveDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: TEAL },
  liveText: { fontSize: 9, fontWeight: '800', color: TEAL, letterSpacing: 1 },

  // Slide dots
  dots:         { flexDirection: 'row', gap: 7, marginTop: 12 },
  slideDot:     { width: 7, height: 7, borderRadius: 4 },
  slideDotActive:{ width: 22, borderRadius: 4 },

  // Bottom sheet
  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 26, paddingTop: 6, paddingBottom: 36,
    ...shadow.lg,
  },

  // Accent bar
  accentBar: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20, marginTop: 10 },

  // Badge
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 14 },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  // Text
  heading: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.8, lineHeight: 34, marginBottom: 10 },
  sub:     { fontSize: 14, color: '#475569', lineHeight: 21, marginBottom: 16 },

  // Progress
  progressTrack: { height: 3, backgroundColor: '#F1F5F9', borderRadius: 2, marginBottom: 18, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 2 },

  // Feature row
  featureRow:  { flexDirection: 'row', gap: 0, justifyContent: 'space-between', marginBottom: 20 },
  featureItem: { alignItems: 'center', gap: 6, flex: 1 },
  featureIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureLabel:{ fontSize: 10, fontWeight: '600', color: '#64748B', textAlign: 'center' },

  // Divider
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 20 },

  // Buttons
  btns: { gap: 12, marginBottom: 16 },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 17,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: 0.2 },
  btnSecondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 15,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5, borderColor: '#BAE6FD',
  },
  btnSecondaryText: { fontSize: 15, fontWeight: '700', color: SKY7 },

  // Terms
  terms:     { fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 17 },
  termsLink: { fontWeight: '700' },

  // Staff login
  staffBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD',
  },
  staffBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  staffIcon:    { width: 28, height: 28, borderRadius: 8, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  staffBtnText: { fontSize: 14, fontWeight: '700', color: SKY7 },
});
