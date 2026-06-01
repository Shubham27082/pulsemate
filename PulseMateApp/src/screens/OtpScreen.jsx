// ─────────────────────────────────────────────────────────────────────────────
//  OtpScreen — PulseMate Connect  |  Premium OTP verification
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, Animated, Easing, Dimensions, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { verifyOtp, sendOtp } from '../api/auth';
import { useAuth } from '../store/authStore';
import { colors, shadow, radius } from '../theme';

const LOGO = require('../../assets/logo1.jpeg');

const { width: W, height: H } = Dimensions.get('window');

// Brand tokens
const SKY4  = '#38BDF8';
const SKY5  = '#0EA5E9';
const SKY6  = '#0284C7';
const SKY7  = '#0369A1';
const SKY9  = '#0C4A6E';
const TEAL  = '#2DD4BF';
const ROSE  = '#FB7185';
const WHITE = '#FFFFFF';

// ─── Phone + SMS illustration ─────────────────────────────────────────────────
function PhoneIllustration() {
  const bubble1 = useRef(new Animated.Value(0)).current;
  const bubble2 = useRef(new Animated.Value(0)).current;
  const bubble3 = useRef(new Animated.Value(0)).current;
  const pulse   = useRef(new Animated.Value(0)).current;
  const smsBadge = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse glow loop
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    // Message bubbles fade in sequentially
    Animated.sequence([
      Animated.timing(bubble1, { toValue: 1, duration: 400, delay: 300, useNativeDriver: true }),
      Animated.timing(bubble2, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
      Animated.timing(bubble3, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
    ]).start();

    // SMS badge pop in
    Animated.spring(smsBadge, { toValue: 1, friction: 4, tension: 100, delay: 900, useNativeDriver: true }).start();
  }, []);

  const glowOp = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.4] });

  return (
    <View style={ph.wrap}>
      {/* Glow rings */}
      <Animated.View style={[ph.ring, ph.ring3, { opacity: glowOp }]} />
      <Animated.View style={[ph.ring, ph.ring2, { opacity: Animated.multiply(glowOp, 1.5) }]} />

      {/* Phone outline */}
      <View style={ph.phone}>
        {/* Phone top notch */}
        <View style={ph.notch} />
        {/* Screen area with message bubbles */}
        <View style={ph.screen}>
          <Animated.View style={[ph.bubble, ph.bubbleLeft,  { opacity: bubble1, transform: [{ translateX: bubble1.interpolate({ inputRange: [0,1], outputRange: [-10, 0] }) }] }]}>
            <View style={ph.bubbleDot} /><View style={[ph.bubbleDot, { width: 28 }]} /><View style={[ph.bubbleDot, { width: 20 }]} />
          </Animated.View>
          <Animated.View style={[ph.bubble, ph.bubbleRight, { opacity: bubble2, transform: [{ translateX: bubble2.interpolate({ inputRange: [0,1], outputRange: [10, 0] }) }] }]}>
            <View style={[ph.bubbleDot, { width: 32, backgroundColor: SKY4 }]} /><View style={[ph.bubbleDot, { width: 22, backgroundColor: SKY4 }]} />
          </Animated.View>
          <Animated.View style={[ph.bubble, ph.bubbleLeft,  { opacity: bubble3, transform: [{ translateX: bubble3.interpolate({ inputRange: [0,1], outputRange: [-10, 0] }) }] }]}>
            <View style={[ph.bubbleDot, { width: 24 }]} /><View style={[ph.bubbleDot, { width: 16 }]} />
          </Animated.View>
        </View>
        {/* Phone bottom bar */}
        <View style={ph.homeBar} />
      </View>

      {/* Floating SMS badge */}
      <Animated.View style={[ph.smsBadge, { transform: [{ scale: smsBadge }] }]}>
        <Ionicons name="chatbubble-ellipses" size={13} color={SKY6} />
        <Text style={ph.smsText}>SMS</Text>
      </Animated.View>

      {/* Floating chips */}
      <View style={[ph.chip, ph.chipLeft]}>
        <Ionicons name="shield-checkmark" size={11} color={SKY6} />
        <Text style={ph.chipText}>256-bit SSL</Text>
      </View>
      <View style={[ph.chip, ph.chipRight]}>
        <Ionicons name="time-outline" size={11} color={SKY6} />
        <Text style={ph.chipText}>5 min OTP</Text>
      </View>
    </View>
  );
}

// ─── Circular countdown timer ─────────────────────────────────────────────────
function CircularTimer({ cooldown, total = 30 }) {
  const fraction = cooldown / total;
  // Border trick: show arc by selectively coloring border sides
  const borderTopColor    = SKY5;
  const borderRightColor  = fraction > (22 / total) ? SKY5 : 'transparent';
  const borderBottomColor = fraction > (15 / total) ? SKY5 : 'transparent';
  const borderLeftColor   = fraction > (7  / total) ? SKY5 : 'transparent';

  const rotation = `${(1 - fraction) * 360}deg`;

  return (
    <View style={ct.wrap}>
      {/* Background ring */}
      <View style={ct.bgRing} />
      {/* Colored arc overlay */}
      <View style={[ct.arc, {
        borderTopColor,
        borderRightColor,
        borderBottomColor,
        borderLeftColor,
        transform: [{ rotate: rotation }],
      }]} />
      {/* Center text */}
      <View style={ct.center}>
        <Text style={ct.number}>{cooldown}</Text>
        <Text style={ct.unit}>sec</Text>
      </View>
    </View>
  );
}

// ─── Success overlay ──────────────────────────────────────────────────────────
function SuccessOverlay({ visible, successScale }) {
  if (!visible) return null;
  return (
    <Animated.View style={[so.overlay, { opacity: successScale.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }) }]}>
      <Animated.View style={[so.circle, { transform: [{ scale: successScale }] }]}>
        <Ionicons name="checkmark" size={48} color={WHITE} />
      </Animated.View>
      <Text style={so.title}>Verified!</Text>
      <Text style={so.sub}>Welcome to PulseMate Connect</Text>
    </Animated.View>
  );
}

// ─── Main OtpScreen ───────────────────────────────────────────────────────────
export default function OtpScreen({ route, navigation }) {
  const { mobile, devOtp: initialDevOtp } = route.params;
  const { signIn } = useAuth();

  const [digits,       setDigits]       = useState(['', '', '', '', '', '']);
  const [name,         setName]         = useState('');
  const [loading,      setLoading]      = useState(false);
  const [status,       setStatus]       = useState('idle'); // 'idle' | 'success' | 'error'
  const [cooldown,     setCooldown]     = useState(30);
  const [devOtp,       setDevOtp]       = useState(initialDevOtp || '');
  const [focusedIndex, setFocusedIndex] = useState(null);

  const shake        = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const enterA       = useRef(new Animated.Value(0)).current;
  const slideA       = useRef(new Animated.Value(24)).current;
  const sheetA       = useRef(new Animated.Value(0)).current;
  const progressA    = useRef(new Animated.Value(0)).current;

  // 6 individual input refs
  const inputRefs = useRef(Array(6).fill(null).map(() => useRef(null))).current;

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(enterA, { toValue: 1, duration: 550, delay: 80, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideA, { toValue: 0, duration: 550, delay: 80, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      Animated.timing(sheetA, { toValue: 1, duration: 500, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    startCooldown(30);
    // Auto-focus first box
    setTimeout(() => inputRefs[0].current?.focus(), 600);
  }, []);

  // Progress bar animation
  useEffect(() => {
    const filled = digits.filter(Boolean).length;
    Animated.timing(progressA, {
      toValue: filled / 6,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [digits]);

  // Auto-verify when all 6 digits filled
  useEffect(() => {
    if (digits.join('').length === 6 && status === 'idle') {
      handleVerify();
    }
  }, [digits]);

  const startCooldown = (secs) => {
    setCooldown(secs);
    const t = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleDigitChange = (text, index) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    if (digit && index < 5) inputRefs[index + 1].current?.focus();
    if (!digit && index > 0 && !text) inputRefs[index - 1].current?.focus();
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const fillDevOtp = () => {
    if (!devOtp) return;
    const filled = devOtp.slice(0, 6).split('').concat(Array(6).fill('')).slice(0, 6);
    setDigits(filled);
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start(() => setStatus('idle'));
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < 6) return;
    setLoading(true);
    try {
      const res = await verifyOtp(mobile, code, 'LOGIN', name || undefined);
      setStatus('success');
      Animated.spring(successScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }).start();
      setTimeout(() => signIn(res.data.data.accessToken, res.data.data.user), 1800);
    } catch (err) {
      setStatus('error');
      triggerShake();
      Alert.alert('Invalid OTP', err.response?.data?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await sendOtp(mobile, 'LOGIN');
      if (res.data.data?.devOtp) setDevOtp(String(res.data.data.devOtp));
      setDigits(['', '', '', '', '', '']);
      setStatus('idle');
      startCooldown(30);
      setTimeout(() => inputRefs[0].current?.focus(), 100);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  const code       = digits.join('');
  const canVerify  = code.length === 6 && !loading;

  // Box style helper
  const getBoxStyle = (index) => {
    const filled  = digits[index] !== '';
    const focused = focusedIndex === index;
    if (status === 'error')   return [os.box, os.boxError];
    if (status === 'success') return [os.box, os.boxSuccess];
    if (filled)               return [os.box, os.boxFilled];
    if (focused)              return [os.box, os.boxFocused];
    return [os.box];
  };

  return (
    <KeyboardAvoidingView style={os.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={SKY9} translucent />

      {/* ── Background ── */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: SKY9 }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: SKY7, opacity: 0.55 }]} />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.55, backgroundColor: SKY5, opacity: 0.2 }} />
      <View style={os.blob1} /><View style={os.blob2} />
      <View style={os.dotGrid} pointerEvents="none">
        {Array.from({ length: 24 }).map((_, i) => <View key={i} style={os.dot} />)}
      </View>

      {/* Success overlay */}
      <SuccessOverlay visible={status === 'success'} successScale={successScale} />

      <ScrollView
        contentContainerStyle={os.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top zone ── */}
        <Animated.View style={[os.top, { opacity: enterA, transform: [{ translateY: slideA }] }]}>
          <View style={{ height: 52 }} />

          {/* Logo row */}
          <View style={os.logoRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={os.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color={WHITE} />
            </TouchableOpacity>
            <Image source={LOGO} style={os.logoImg} resizeMode="cover" />
            <View>
              <Text style={os.logoName}>PulseMate Connect</Text>
              <Text style={os.logoSub}>Healthcare Platform</Text>
            </View>
            <View style={os.secureBadge}>
              <Ionicons name="lock-closed" size={10} color={TEAL} />
              <Text style={os.secureText}>Secure</Text>
            </View>
          </View>

          {/* Phone illustration */}
          <PhoneIllustration />
        </Animated.View>

        {/* ── White bottom sheet ── */}
        <Animated.View style={[os.sheet, {
          opacity: sheetA,
          transform: [{ translateY: sheetA.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
        }]}>
          {/* Drag handle */}
          <View style={os.dragHandle} />

          {/* Header */}
          <View style={os.sheetHeader}>
            <Text style={os.heading}>Verify Mobile Number</Text>
            <View style={os.sentToRow}>
              <Text style={os.sheetSub}>Enter the 6-digit OTP sent to </Text>
              <View style={os.phoneChip}>
                <Ionicons name="phone-portrait-outline" size={12} color={SKY6} />
                <Text style={os.phoneChipText}>+91 {mobile}</Text>
              </View>
            </View>
          </View>

          {/* Dev OTP banner */}
          {devOtp ? (
            <View style={os.devBanner}>
              <Ionicons name="construct" size={14} color="#92400E" />
              <Text style={os.devLabel}>Dev OTP</Text>
              <Text style={os.devCode}>{devOtp}</Text>
              <TouchableOpacity onPress={fillDevOtp} style={os.devUse} activeOpacity={0.8}>
                <Text style={os.devUseText}>Tap to fill</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* OTP boxes row */}
          <Animated.View style={[os.boxesRow, { transform: [{ translateX: shake }] }]}>
            {digits.map((digit, index) => (
              <TextInput
                key={index}
                ref={inputRefs[index]}
                style={[...getBoxStyle(index), os.boxText]}
                value={digit}
                onChangeText={(text) => handleDigitChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                caretHidden
                textAlign="center"
              />
            ))}
          </Animated.View>

          {/* Progress bar */}
          <View style={os.progressTrack}>
            <Animated.View style={[os.progressFill, {
              width: progressA.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }]} />
          </View>

          {/* Resend section */}
          <View style={os.resendSection}>
            {cooldown > 0 ? (
              <>
                <CircularTimer cooldown={cooldown} total={30} />
                <View style={os.resendTextWrap}>
                  <Text style={os.resendMuted}>Resend OTP in</Text>
                  <Text style={os.resendCountdown}>{cooldown} seconds</Text>
                </View>
              </>
            ) : (
              <>
                <View style={os.resendReadyDot} />
                <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                  <Text style={os.resendLink}>Resend OTP</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Name field */}
          <Text style={os.label}>
            Your Name <Text style={os.optional}>(required for new accounts)</Text>
          </Text>
          <View style={os.nameInputWrap}>
            <Ionicons name="person-outline" size={17} color={colors.textMuted} style={{ marginLeft: 14 }} />
            <TextInput
              style={os.nameInput}
              placeholder="Full name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          {/* Verify button */}
          <TouchableOpacity
            style={[os.btnPrimary, !canVerify && os.btnDisabled]}
            onPress={handleVerify}
            disabled={!canVerify}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color={WHITE} size="small" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={17} color={WHITE} />
                <Text style={os.btnPrimaryText}>Verify & Continue</Text>
                <Ionicons name="checkmark" size={16} color={WHITE} />
              </>
            )}
          </TouchableOpacity>

          {/* Security note */}
          <View style={os.securityNote}>
            <Ionicons name="lock-closed-outline" size={14} color={SKY6} />
            <Text style={os.securityNoteText}>
              OTP expires in 5 minutes. Never share your OTP with anyone, including PulseMate support.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Phone illustration styles ────────────────────────────────────────────────
const ph = StyleSheet.create({
  wrap:      { height: H * 0.22, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  ring:      { position: 'absolute', borderWidth: 1.5, borderColor: SKY4 },
  ring3:     { width: 160, height: 160, borderRadius: 80 },
  ring2:     { width: 110, height: 110, borderRadius: 55 },
  phone: {
    width: 68, height: 110,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: WHITE,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: SKY5, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
  },
  notch:     { width: 24, height: 6, borderRadius: 3, backgroundColor: WHITE, marginTop: 6, opacity: 0.7 },
  screen:    { flex: 1, width: '100%', paddingHorizontal: 6, paddingVertical: 8, gap: 6 },
  bubble:    { borderRadius: 8, padding: 5, gap: 3 },
  bubbleLeft:  { backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start' },
  bubbleRight: { backgroundColor: 'rgba(14,165,233,0.35)', alignSelf: 'flex-end' },
  bubbleDot:   { height: 4, width: 36, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.7)' },
  homeBar:   { width: 28, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  smsBadge:  {
    position: 'absolute', top: '8%', right: W * 0.12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: WHITE, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  smsText:   { fontSize: 11, fontWeight: '800', color: SKY6 },
  chip:      { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: WHITE, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  chipLeft:  { left: W * 0.04, top: '30%' },
  chipRight: { right: W * 0.04, top: '58%' },
  chipText:  { fontSize: 10, fontWeight: '700', color: SKY7 },
});

// ─── Circular timer styles ────────────────────────────────────────────────────
const ct = StyleSheet.create({
  wrap:   { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  bgRing: { position: 'absolute', width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: '#E2E8F0' },
  arc:    { position: 'absolute', width: 56, height: 56, borderRadius: 28, borderWidth: 3 },
  center: { alignItems: 'center' },
  number: { fontSize: 16, fontWeight: '800', color: SKY6, lineHeight: 18 },
  unit:   { fontSize: 8,  fontWeight: '600', color: colors.textMuted },
});

// ─── Success overlay styles ───────────────────────────────────────────────────
const so = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.95)',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  circle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: TEAL,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: TEAL, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  sub:   { fontSize: 14, color: colors.textMuted },
});

// ─── Main screen styles ───────────────────────────────────────────────────────
const os = StyleSheet.create({
  root:   { flex: 1, backgroundColor: SKY9 },
  scroll: { flexGrow: 1 },

  blob1: { position: 'absolute', top: -80, left: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: SKY5, opacity: 0.12 },
  blob2: { position: 'absolute', top: H * 0.25, right: -60, width: 160, height: 160, borderRadius: 80, backgroundColor: TEAL, opacity: 0.08 },

  dotGrid: { position: 'absolute', top: H * 0.04, right: 14, width: 90, flexDirection: 'row', flexWrap: 'wrap', gap: 11, opacity: 0.18 },
  dot:     { width: 3, height: 3, borderRadius: 2, backgroundColor: WHITE },

  top: { alignItems: 'center' },

  logoRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', paddingHorizontal: 22, marginBottom: 4 },
  backBtn:    { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  logoImg:    { width: 32, height: 32, borderRadius: 10 },
  logoName:   { fontSize: 14, fontWeight: '800', color: WHITE, letterSpacing: -0.2 },
  logoSub:    { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  secureBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(45,212,191,0.18)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(45,212,191,0.3)', marginLeft: 'auto' },
  secureText: { fontSize: 10, fontWeight: '700', color: TEAL },

  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40,
    minHeight: H * 0.62,
    ...shadow.lg,
  },

  dragHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: SKY5, alignSelf: 'center', marginBottom: 20, marginTop: 10 },

  sheetHeader: { marginBottom: 20 },
  heading:     { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.6, marginBottom: 8 },
  sheetSub:    { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  sentToRow:   { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  phoneChip:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#BFDBFE' },
  phoneChipText: { fontSize: 13, fontWeight: '700', color: SKY6 },

  devBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#FDE68A' },
  devLabel:  { fontSize: 12, color: '#92400E', fontWeight: '600' },
  devCode:   { flex: 1, fontSize: 18, fontWeight: '800', color: '#92400E', letterSpacing: 6 },
  devUse:    { backgroundColor: '#F59E0B', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  devUseText:{ fontSize: 12, fontWeight: '700', color: WHITE },

  // OTP boxes
  boxesRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 12 },
  box: {
    width: 48, height: 58, borderRadius: 14,
    borderWidth: 2, borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    fontSize: 26, fontWeight: '800',
    textAlign: 'center', color: '#0F172A',
  },
  boxFilled:  { borderColor: SKY5, backgroundColor: '#EFF6FF' },
  boxFocused: {
    borderColor: SKY5, borderWidth: 2.5, backgroundColor: WHITE,
    shadowColor: SKY5, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  boxError:   { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  boxSuccess: { borderColor: TEAL, backgroundColor: '#F0FDFA' },
  boxText:    { fontSize: 26, fontWeight: '800', textAlign: 'center', color: '#0F172A' },

  // Progress bar
  progressTrack: { height: 3, backgroundColor: '#E2E8F0', borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  progressFill:  { height: 3, backgroundColor: SKY5, borderRadius: 2 },

  // Resend
  resendSection:  { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 24 },
  resendTextWrap: { gap: 2 },
  resendMuted:    { fontSize: 12, color: colors.textMuted },
  resendCountdown:{ fontSize: 14, fontWeight: '700', color: SKY6 },
  resendReadyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: TEAL },
  resendLink:     { fontSize: 14, fontWeight: '700', color: SKY5 },

  // Name input
  label:         { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 },
  optional:      { fontWeight: '400', color: colors.textMuted },
  nameInputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.bg, marginBottom: 24 },
  nameInput:     { flex: 1, fontSize: 15, color: '#0F172A', paddingHorizontal: 12, paddingVertical: 14 },

  // Verify button
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: SKY5, borderRadius: 16, paddingVertical: 17, marginBottom: 20,
    shadowColor: SKY5, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
  },
  btnDisabled:    { opacity: 0.45, shadowOpacity: 0 },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: 0.2 },

  // Security note
  securityNote:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F0F9FF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#BAE6FD' },
  securityNoteText: { flex: 1, fontSize: 11, color: '#475569', lineHeight: 16 },
});
