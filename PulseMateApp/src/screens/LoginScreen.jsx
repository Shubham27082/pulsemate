// ─────────────────────────────────────────────────────────────────────────────
//  LoginScreen — PulseMate Connect  |  Mobile number entry
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, Animated, Easing, Dimensions, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendOtp } from '../api/auth';
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

// ─── Animated security shield illustration ───────────────────────────────────
function SecurityIllustration() {
  const pulse  = useRef(new Animated.Value(0)).current;
  const shield = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    Animated.spring(shield, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, []);

  const glowOp = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] });
  const sc     = shield.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <View style={il.wrap}>
      {/* Glow rings */}
      <Animated.View style={[il.ring, il.ring3, { opacity: glowOp }]} />
      <Animated.View style={[il.ring, il.ring2, { opacity: Animated.multiply(glowOp, 1.4) }]} />
      <Animated.View style={[il.ring, il.ring1, { opacity: Animated.multiply(glowOp, 1.8) }]} />

      {/* Shield */}
      <Animated.View style={[il.shieldWrap, { transform: [{ scale: sc }] }]}>
        <View style={il.shieldBody}>
          <View style={il.shieldTop} />
          <View style={il.shieldBottom} />
          <View style={il.shieldInner}>
            {/* Phone icon */}
            <View style={il.phoneIcon}>
              <View style={il.phoneBody}>
                <View style={il.phoneScreen} />
                <View style={il.phoneBtn} />
              </View>
            </View>
            {/* Signal dots */}
            <View style={il.signalRow}>
              {[1, 0.6, 0.3].map((op, i) => (
                <View key={i} style={[il.signalDot, { opacity: op, width: 5 + i * 2, height: 5 + i * 2 }]} />
              ))}
            </View>
          </View>
        </View>
        <View style={il.lockBadge}>
          <Ionicons name="lock-closed" size={12} color={WHITE} />
        </View>
      </Animated.View>

      {/* Floating chips */}
      <View style={[il.chip, il.chipLeft]}>
        <Ionicons name="shield-checkmark" size={11} color={SKY6} />
        <Text style={il.chipText}>256-bit SSL</Text>
      </View>
      <View style={[il.chip, il.chipRight]}>
        <Ionicons name="finger-print" size={11} color={SKY6} />
        <Text style={il.chipText}>OTP Verified</Text>
      </View>
    </View>
  );
}

// ─── Main LoginScreen ─────────────────────────────────────────────────────────
export default function LoginScreen({ navigation }) {
  const [mobile,  setMobile]  = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const enterA = useRef(new Animated.Value(0)).current;
  const slideA = useRef(new Animated.Value(24)).current;
  const sheetA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(enterA, { toValue: 1, duration: 550, delay: 80, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideA, { toValue: 0, duration: 550, delay: 80, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      Animated.timing(sheetA, { toValue: 1, duration: 500, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSendOtp = async () => {
    if (mobile.trim().length < 10) {
      Alert.alert('Invalid Number', 'Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const res = await sendOtp(mobile.trim(), 'LOGIN');
      const devOtp = String(res.data.data?.devOtp || '');
      navigation.navigate('Otp', { mobile: mobile.trim(), devOtp });
    } catch (err) {
      const msg   = err.response?.data?.message || 'Failed to send OTP';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const canSend = mobile.trim().length >= 10 && !loading;

  return (
    <KeyboardAvoidingView style={ls.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={SKY9} translucent />

      {/* ── Background ── */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: SKY9 }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: SKY7, opacity: 0.55 }]} />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.55, backgroundColor: SKY5, opacity: 0.2 }} />
      <View style={ls.blob1} /><View style={ls.blob2} />
      <View style={ls.dotGrid} pointerEvents="none">
        {Array.from({ length: 24 }).map((_, i) => <View key={i} style={ls.dot} />)}
      </View>

      <ScrollView
        contentContainerStyle={ls.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top: logo + illustration ── */}
        <Animated.View style={[ls.top, { opacity: enterA, transform: [{ translateY: slideA }] }]}>
          <View style={{ height: 52 }} />

          {/* Logo row */}
          <View style={ls.logoRow}>
            {navigation?.canGoBack?.() && (
              <TouchableOpacity onPress={() => navigation.goBack()} style={ls.backBtn} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={20} color={WHITE} />
              </TouchableOpacity>
            )}
            <Image source={LOGO} style={ls.logoImg} resizeMode="cover" />
            <View>
              <Text style={ls.logoName}>PulseMate Connect</Text>
              <Text style={ls.logoSub}>Healthcare Platform</Text>
            </View>
            <View style={ls.secureBadge}>
              <Ionicons name="lock-closed" size={10} color={TEAL} />
              <Text style={ls.secureText}>Secure</Text>
            </View>
          </View>

          {/* Security illustration — always mobile step */}
          <SecurityIllustration />
        </Animated.View>

        {/* ── Bottom sheet ── */}
        <Animated.View style={[ls.sheet, {
          opacity: sheetA,
          transform: [{ translateY: sheetA.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
        }]}>
          {/* Header */}
          <View style={ls.sheetHeader}>
            <View style={ls.accentBar} />
            <Text style={ls.welcomeBack}>Welcome Back 👋</Text>
            <Text style={ls.sheetSub}>Enter your mobile number to receive a one-time password</Text>
          </View>

          {/* No-password badge */}
          <View style={ls.noPwdBadge}>
            <Ionicons name="key-outline" size={13} color={SKY6} />
            <Text style={ls.noPwdText}>No password needed — OTP only</Text>
          </View>

          {/* Mobile input */}
          <Text style={ls.label}>Mobile Number</Text>
          <View style={[ls.inputRow, focused && ls.inputRowFocused]}>
            <View style={ls.countryCode}>
              <Text style={ls.flag}>🇮🇳</Text>
              <Text style={ls.dialCode}>+91</Text>
              <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
            </View>
            <View style={ls.inputDivider} />
            <TextInput
              style={ls.mobileInput}
              placeholder="98765 43210"
              keyboardType="phone-pad"
              maxLength={10}
              value={mobile}
              onChangeText={(t) => setMobile(t.replace(/\D/g, '').slice(0, 10))}
              placeholderTextColor={colors.textMuted}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              returnKeyType="done"
              onSubmitEditing={canSend ? handleSendOtp : undefined}
            />
            {mobile.length === 10 && (
              <View style={ls.inputCheck}>
                <Ionicons name="checkmark-circle" size={20} color={TEAL} />
              </View>
            )}
          </View>

          {/* Character count */}
          <Text style={ls.charCount}>{mobile.length}/10 digits</Text>

          {/* Send OTP button */}
          <TouchableOpacity
            style={[ls.btnPrimary, !canSend && ls.btnDisabled]}
            onPress={handleSendOtp}
            disabled={!canSend}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color={WHITE} size="small" />
            ) : (
              <>
                <Ionicons name="send" size={17} color={WHITE} />
                <Text style={ls.btnPrimaryText}>Send OTP</Text>
                <Ionicons name="arrow-forward" size={16} color={WHITE} />
              </>
            )}
          </TouchableOpacity>

          {/* How it works */}
          <View style={ls.howRow}>
            {[
              { icon: 'phone-portrait-outline', label: 'Enter number' },
              { icon: 'arrow-forward',           label: '',             arrow: true },
              { icon: 'chatbubble-outline',       label: 'Get OTP'      },
              { icon: 'arrow-forward',           label: '',             arrow: true },
              { icon: 'checkmark-circle-outline', label: 'Verified'     },
            ].map((item, i) =>
              item.arrow ? (
                <Ionicons key={i} name="arrow-forward" size={12} color={colors.textMuted} />
              ) : (
                <View key={i} style={ls.howItem}>
                  <View style={ls.howIcon}>
                    <Ionicons name={item.icon} size={14} color={SKY6} />
                  </View>
                  <Text style={ls.howLabel}>{item.label}</Text>
                </View>
              )
            )}
          </View>

          {/* Privacy */}
          <View style={ls.privacyBox}>
            <Ionicons name="shield-checkmark-outline" size={15} color={SKY6} />
            <Text style={ls.privacyText}>
              Your number is only used for authentication and is never shared with third parties.
            </Text>
          </View>

          {/* Terms */}
          <Text style={ls.terms}>
            By continuing you agree to our{' '}
            <Text style={ls.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={ls.termsLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Illustration styles ──────────────────────────────────────────────────────
const il = StyleSheet.create({
  wrap:       { height: H * 0.22, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  ring:       { position: 'absolute', borderWidth: 1.5, borderColor: SKY4 },
  ring3:      { width: 160, height: 160, borderRadius: 80 },
  ring2:      { width: 120, height: 120, borderRadius: 60 },
  ring1:      { width: 84,  height: 84,  borderRadius: 42 },
  shieldWrap: { alignItems: 'center', justifyContent: 'center' },
  shieldBody: {
    width: 72, height: 80,
    backgroundColor: SKY6,
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: SKY5, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
    overflow: 'hidden',
  },
  shieldTop:    { position: 'absolute', top: 0, width: 72, height: 36, backgroundColor: SKY5, borderTopLeftRadius: 36, borderTopRightRadius: 36 },
  shieldBottom: { position: 'absolute', bottom: -10, width: 30, height: 30, backgroundColor: SKY6, transform: [{ rotate: '45deg' }] },
  shieldInner:  { alignItems: 'center', gap: 6, zIndex: 2 },
  phoneIcon:    { alignItems: 'center' },
  phoneBody:    { width: 22, height: 34, borderRadius: 5, borderWidth: 2, borderColor: WHITE, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  phoneScreen:  { width: 14, height: 18, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  phoneBtn:     { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  signalRow:    { flexDirection: 'row', gap: 4, alignItems: 'flex-end' },
  signalDot:    { borderRadius: 3, backgroundColor: WHITE },
  lockBadge:    { position: 'absolute', bottom: -10, width: 24, height: 24, borderRadius: 12, backgroundColor: SKY7, borderWidth: 2, borderColor: WHITE, alignItems: 'center', justifyContent: 'center' },
  chip:         { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: WHITE, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  chipLeft:     { left: W * 0.04, top: '30%' },
  chipRight:    { right: W * 0.04, top: '55%' },
  chipText:     { fontSize: 10, fontWeight: '700', color: SKY7 },
});

// ─── Screen styles ────────────────────────────────────────────────────────────
const ls = StyleSheet.create({
  root:   { flex: 1, backgroundColor: SKY9 },
  scroll: { flexGrow: 1 },

  blob1: { position: 'absolute', top: -80, left: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: SKY5, opacity: 0.12 },
  blob2: { position: 'absolute', top: H * 0.25, right: -60, width: 160, height: 160, borderRadius: 80, backgroundColor: TEAL, opacity: 0.08 },

  dotGrid: { position: 'absolute', top: H * 0.04, right: 14, width: 90, flexDirection: 'row', flexWrap: 'wrap', gap: 11, opacity: 0.18 },
  dot:     { width: 3, height: 3, borderRadius: 2, backgroundColor: WHITE },

  top: { alignItems: 'center' },

  logoRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', paddingHorizontal: 22, marginBottom: 4 },
  backBtn:   { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  logoImg:   { width: 32, height: 32, borderRadius: 10 },
  logoName:  { fontSize: 14, fontWeight: '800', color: WHITE, letterSpacing: -0.2 },
  logoSub:   { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  secureBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(45,212,191,0.18)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(45,212,191,0.3)', marginLeft: 'auto' },
  secureText:  { fontSize: 10, fontWeight: '700', color: TEAL },

  sheet: { backgroundColor: WHITE, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40, minHeight: H * 0.58, ...shadow.lg },

  sheetHeader: { marginBottom: 18 },
  accentBar:   { width: 44, height: 4, borderRadius: 2, backgroundColor: SKY5, alignSelf: 'center', marginBottom: 20, marginTop: 10 },
  welcomeBack: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.6, marginBottom: 6 },
  sheetSub:    { fontSize: 14, color: colors.textMuted, lineHeight: 20 },

  noPwdBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 20, borderWidth: 1, borderColor: '#BFDBFE' },
  noPwdText:  { fontSize: 12, fontWeight: '600', color: SKY6 },

  label:    { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 },

  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.bg, marginBottom: 4, overflow: 'hidden' },
  inputRowFocused: { borderColor: SKY5, backgroundColor: WHITE, shadowColor: SKY5, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  countryCode: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 16 },
  flag:        { fontSize: 18 },
  dialCode:    { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  inputDivider:{ width: 1, height: 28, backgroundColor: colors.border },
  mobileInput: { flex: 1, fontSize: 17, fontWeight: '600', color: '#0F172A', paddingHorizontal: 14, paddingVertical: 16, letterSpacing: 0.5 },
  inputCheck:  { paddingRight: 14 },
  charCount:   { fontSize: 11, color: colors.textMuted, textAlign: 'right', marginBottom: 20 },

  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: SKY5, borderRadius: 16, paddingVertical: 17, marginBottom: 20,
    shadowColor: SKY5, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
  },
  btnDisabled:    { opacity: 0.45, shadowOpacity: 0 },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: 0.2 },

  howRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20 },
  howItem: { alignItems: 'center', gap: 4 },
  howIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  howLabel:{ fontSize: 9, fontWeight: '600', color: colors.textMuted },

  privacyBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F0F9FF', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#BAE6FD' },
  privacyText:{ flex: 1, fontSize: 11, color: '#475569', lineHeight: 16 },

  terms:     { fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 17 },
  termsLink: { color: SKY5, fontWeight: '700' },
});
