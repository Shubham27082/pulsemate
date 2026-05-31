import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendOtp, verifyOtp } from '../api/auth';
import { useAuth } from '../store/authStore';
import { colors, shadow, radius } from '../theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [step, setStep] = useState('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = (seconds) => {
    setCooldown(seconds);
    const timer = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    const sanitizedMobile = mobile.trim();

    if (sanitizedMobile.length < 10) {
      Alert.alert('Invalid Number', 'Enter a valid mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(sanitizedMobile, 'LOGIN');
      if (res.data.data?.devOtp) setDevOtp(String(res.data.data.devOtp));
      setStep('otp');
      startCooldown(30);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP';
      const match = msg.match(/(\d+) seconds/);

      if (match) {
        const seconds = parseInt(match[1], 10);
        startCooldown(seconds);
        Alert.alert('Please Wait', `You can request a new OTP in ${seconds} seconds`);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      Alert.alert('Invalid OTP', 'Enter the 6-digit OTP sent to your number');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(mobile.trim(), otp, 'LOGIN', name || undefined);
      await signIn(res.data.data.accessToken, res.data.data.user);
    } catch (err) {
      Alert.alert('Verification Failed', err.response?.data?.message || 'Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('mobile');
    setOtp('');
    setDevOtp('');
    setName('');
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <View style={s.logoMark}>
            <View style={s.logoInner}>
              <Ionicons name="heart" size={34} color="#fff" />
            </View>
            <View style={s.logoPulse} />
          </View>
          <Text style={s.appName}>PulseMate</Text>
          <Text style={s.tagline}>Book doctors | Track queue | Stay healthy</Text>

          <View style={s.pills}>
            {['Easy Booking', 'Live Queue', 'Prescriptions'].map((pill) => (
              <View key={pill} style={s.pill}>
                <Text style={s.pillText}>{pill}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.card}>
          {step === 'mobile' ? (
            <>
              <Text style={s.cardTitle}>Get Started</Text>
              <Text style={s.cardSub}>Enter your mobile number to continue</Text>

              <Text style={s.label}>Mobile Number</Text>
              <TextInput
                style={s.input}
                placeholder="9876543210"
                keyboardType="phone-pad"
                maxLength={15}
                value={mobile}
                onChangeText={(text) => setMobile(text.replace(/\D/g, ''))}
                placeholderTextColor={colors.textMuted}
              />

              <TouchableOpacity
                style={[s.btn, loading && s.btnDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={s.btnText}>Send OTP</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              <Text style={s.terms}>
                By continuing, you agree to our{' '}
                <Text style={s.termsLink}>Terms of Service</Text> and{' '}
                <Text style={s.termsLink}>Privacy Policy</Text>
              </Text>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={reset} style={s.backBtn}>
                <Ionicons name="arrow-back" size={18} color={colors.primary} />
                <Text style={s.backText}>Change number</Text>
              </TouchableOpacity>

              <Text style={s.cardTitle}>Verify OTP</Text>
              <Text style={s.cardSub}>
                Sent to <Text style={s.mobileHighlight}>{mobile}</Text>
              </Text>

              {devOtp ? (
                <View style={s.devBanner}>
                  <Ionicons name="construct-outline" size={14} color="#92400E" />
                  <Text style={s.devText}>Dev OTP:</Text>
                  <Text style={s.devOtp}>{devOtp}</Text>
                </View>
              ) : null}

              <Text style={s.label}>Enter 6-digit OTP</Text>
              <TextInput
                style={s.otpInput}
                placeholder="• • • • • •"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                placeholderTextColor={colors.textMuted}
                textAlign="center"
              />

              <Text style={s.label}>
                Your Name <Text style={s.optional}>(required for new users)</Text>
              </Text>
              <TextInput
                style={s.input}
                placeholder="Full name"
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />

              <TouchableOpacity
                style={[s.btn, loading && s.btnDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={s.btnText}>Verify and Continue</Text>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={cooldown > 0 ? null : handleSendOtp}
                style={s.resendRow}
                activeOpacity={cooldown > 0 ? 1 : 0.7}
              >
                <Text style={s.resendText}>Did not receive it? </Text>
                {cooldown > 0 ? (
                  <Text style={[s.resendLink, { color: colors.textMuted }]}>Resend in {cooldown}s</Text>
                ) : (
                  <Text style={s.resendLink}>Resend OTP</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1 },
  hero: { alignItems: 'center', paddingTop: 64, paddingBottom: 36, paddingHorizontal: 24 },
  logoMark: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  logoInner: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoPulse: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  appName: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -1, marginBottom: 8 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  pills: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pillText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 48, flex: 1, minHeight: 420 },
  cardTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
  cardSub: { fontSize: 14, color: colors.textMuted, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  optional: { fontWeight: '400', color: colors.textMuted },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
    marginBottom: 16,
  },
  otpInput: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    backgroundColor: colors.primaryLight,
    marginBottom: 20,
    letterSpacing: 12,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadow.md,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  mobileHighlight: { color: colors.primary, fontWeight: '700' },
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 16,
  },
  devText: { fontSize: 13, color: '#92400E' },
  devOtp: { fontWeight: '800', fontSize: 16, color: '#92400E', letterSpacing: 4 },
  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  resendText: { fontSize: 14, color: colors.textMuted },
  resendLink: { fontSize: 14, color: colors.primary, fontWeight: '700' },
  terms: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 18 },
  termsLink: { color: colors.primary, fontWeight: '600' },
});
