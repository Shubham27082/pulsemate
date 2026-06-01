// ─────────────────────────────────────────────────────────────────────────────
//  ProfileWizardScreen — PulseMate Connect  |  6-Step Profile Completion
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  Animated, Easing, Dimensions, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { updatePatientProfile } from '../api/patient';
import { useAuth } from '../store/authStore';

const { width: W } = Dimensions.get('window');

// ── Brand tokens ──────────────────────────────────────────────────────────────
const SKY5  = '#0EA5E9'; const SKY6  = '#0284C7'; const SKY7 = '#0369A1';
const TEAL  = '#2DD4BF'; const WHITE = '#FFFFFF';
const SLATE = '#0F172A'; const MUTED = '#94A3B8'; const BG = '#F0F7FF';
const ROSE  = '#FB7185';

// ── Step config ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, key: 'name',             title: 'Full Name',         subtitle: 'How should doctors address you?',              icon: 'person',                    color: SKY5,     bg: '#E0F2FE', required: true  },
  { id: 2, key: 'gender',           title: 'Gender',            subtitle: 'Helps doctors provide personalised care.',      icon: 'male-female',               color: '#8B5CF6', bg: '#EDE9FE', required: true  },
  { id: 3, key: 'dob',              title: 'Date of Birth',     subtitle: 'Used to calculate your age for medical records.',icon: 'calendar',                  color: '#10B981', bg: '#D1FAE5', required: true  },
  { id: 4, key: 'city',             title: 'Your City',         subtitle: 'Helps us show nearby clinics and doctors.',     icon: 'location',                  color: '#F59E0B', bg: '#FEF3C7', required: true  },
  { id: 5, key: 'emergencyContact', title: 'Emergency Contact', subtitle: 'A number we can reach in case of emergency.',   icon: 'call',                      color: ROSE,     bg: '#FEE2E2', required: true  },
  { id: 6, key: 'medical',          title: 'Medical Details',   subtitle: 'Optional — helps doctors prepare in advance.',  icon: 'medical',                   color: TEAL,     bg: '#CCFBF1', required: false },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDER_OPTIONS = [
  { value: 'MALE',   label: 'Male',   icon: 'male',   emoji: '👨' },
  { value: 'FEMALE', label: 'Female', icon: 'female', emoji: '👩' },
  { value: 'OTHER',  label: 'Other',  icon: 'person', emoji: '🧑' },
];

// ── Animated progress bar ─────────────────────────────────────────────────────
function ProgressBar({ current, total, accent }) {
  const pct    = ((current) / total) * 100;
  const widthA = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthA, {
      toValue: pct,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={pb.wrap}>
      <View style={pb.track}>
        <Animated.View
          style={[pb.fill, {
            width: widthA.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
            backgroundColor: accent,
          }]}
        />
        {/* Glow dot at leading edge */}
        <Animated.View style={[pb.dot, {
          left: widthA.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          backgroundColor: accent,
          shadowColor: accent,
        }]} />
      </View>
      <Text style={[pb.pct, { color: accent }]}>{Math.round(pct)}%</Text>
    </View>
  );
}

const pb = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  track: { flex: 1, height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'visible', position: 'relative' },
  fill:  { height: '100%', borderRadius: 3 },
  dot:   { position: 'absolute', top: -3, width: 12, height: 12, borderRadius: 6, marginLeft: -6, borderWidth: 2, borderColor: WHITE, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4, elevation: 3 },
  pct:   { fontSize: 13, fontWeight: '800', minWidth: 38, textAlign: 'right' },
});

// ── Step indicator dots ───────────────────────────────────────────────────────
function StepDots({ current, total, accent }) {
  return (
    <View style={sd.row}>
      {Array.from({ length: total }).map((_, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <View
            key={i}
            style={[
              sd.dot,
              done  && { backgroundColor: accent, width: 8 },
              active && { backgroundColor: accent, width: 24, borderRadius: 4 },
              !done && !active && { backgroundColor: '#E2E8F0', width: 8 },
            ]}
          />
        );
      })}
    </View>
  );
}

const sd = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { height: 8, borderRadius: 4 },
});

// ── Step 1: Full Name ─────────────────────────────────────────────────────────
function StepName({ value, onChange, accent }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={sw.stepBody}>
      <Text style={sw.fieldLabel}>Your full name</Text>
      <View style={[sw.inputWrap, focused && { borderColor: accent, shadowColor: accent, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 }]}>
        <Ionicons name="person-outline" size={18} color={focused ? accent : MUTED} />
        <TextInput
          style={sw.input}
          value={value}
          onChangeText={onChange}
          placeholder="e.g. Shubham Sharma"
          placeholderTextColor={MUTED}
          autoCapitalize="words"
          autoFocus
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="next"
        />
        {value.trim().length >= 2 && (
          <Ionicons name="checkmark-circle" size={20} color={TEAL} />
        )}
      </View>
      {value.trim().length > 0 && value.trim().length < 2 && (
        <Text style={sw.fieldError}>Name must be at least 2 characters</Text>
      )}
      <View style={sw.hintBox}>
        <Ionicons name="information-circle-outline" size={14} color={accent} />
        <Text style={[sw.hintText, { color: accent }]}>This name appears on your appointment slips and prescriptions.</Text>
      </View>
    </View>
  );
}

// ── Step 2: Gender ────────────────────────────────────────────────────────────
function StepGender({ value, onChange, accent }) {
  return (
    <View style={sw.stepBody}>
      <Text style={sw.fieldLabel}>Select your gender</Text>
      <View style={sw.genderGrid}>
        {GENDER_OPTIONS.map((g) => {
          const active = value === g.value;
          return (
            <TouchableOpacity
              key={g.value}
              style={[sw.genderCard, active && { borderColor: accent, backgroundColor: accent + '12' }]}
              onPress={() => onChange(g.value)}
              activeOpacity={0.8}
            >
              <Text style={sw.genderEmoji}>{g.emoji}</Text>
              <Text style={[sw.genderLabel, active && { color: accent, fontWeight: '800' }]}>{g.label}</Text>
              {active && (
                <View style={[sw.genderCheck, { backgroundColor: accent }]}>
                  <Ionicons name="checkmark" size={10} color={WHITE} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={sw.hintBox}>
        <Ionicons name="shield-checkmark-outline" size={14} color={accent} />
        <Text style={[sw.hintText, { color: accent }]}>This information is private and only shared with your doctor.</Text>
      </View>
    </View>
  );
}

// ── Step 3: Date of Birth ─────────────────────────────────────────────────────
function StepDob({ value, onChange, accent }) {
  const [focused, setFocused] = useState(false);
  const age = value ? Math.floor((new Date() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
  const isValid = value && !isNaN(new Date(value)) && age >= 0 && age <= 120;

  return (
    <View style={sw.stepBody}>
      <Text style={sw.fieldLabel}>Date of birth</Text>
      <View style={[sw.inputWrap, focused && { borderColor: accent, shadowColor: accent, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 }]}>
        <Ionicons name="calendar-outline" size={18} color={focused ? accent : MUTED} />
        <TextInput
          style={sw.input}
          value={value}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={MUTED}
          keyboardType="numeric"
          maxLength={10}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="next"
        />
        {isValid && <Ionicons name="checkmark-circle" size={20} color={TEAL} />}
      </View>
      {isValid && (
        <View style={[sw.ageBadge, { backgroundColor: accent + '15', borderColor: accent + '30' }]}>
          <Ionicons name="person-outline" size={14} color={accent} />
          <Text style={[sw.ageText, { color: accent }]}>Age: {age} years old</Text>
        </View>
      )}
      <View style={sw.hintBox}>
        <Ionicons name="information-circle-outline" size={14} color={accent} />
        <Text style={[sw.hintText, { color: accent }]}>Format: YYYY-MM-DD  (e.g. 1995-08-15)</Text>
      </View>
    </View>
  );
}

// ── Step 4: City ──────────────────────────────────────────────────────────────
const POPULAR_CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'];

function StepCity({ value, onChange, accent }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={sw.stepBody}>
      <Text style={sw.fieldLabel}>Your city</Text>
      <View style={[sw.inputWrap, focused && { borderColor: accent, shadowColor: accent, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 }]}>
        <Ionicons name="location-outline" size={18} color={focused ? accent : MUTED} />
        <TextInput
          style={sw.input}
          value={value}
          onChangeText={onChange}
          placeholder="e.g. Bangalore"
          placeholderTextColor={MUTED}
          autoCapitalize="words"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="next"
        />
        {value.trim().length >= 2 && <Ionicons name="checkmark-circle" size={20} color={TEAL} />}
      </View>
      <Text style={sw.popularLabel}>Popular cities</Text>
      <View style={sw.cityGrid}>
        {POPULAR_CITIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[sw.cityChip, value === c && { backgroundColor: accent, borderColor: accent }]}
            onPress={() => onChange(c)}
            activeOpacity={0.8}
          >
            <Text style={[sw.cityChipText, value === c && { color: WHITE, fontWeight: '700' }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Step 5: Emergency Contact ─────────────────────────────────────────────────
function StepEmergency({ value, onChange, accent }) {
  const [focused, setFocused] = useState(false);
  const isValid = value.replace(/\D/g, '').length >= 10;
  return (
    <View style={sw.stepBody}>
      <Text style={sw.fieldLabel}>Emergency contact number</Text>
      <View style={[sw.inputWrap, focused && { borderColor: accent, shadowColor: accent, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 }]}>
        <View style={sw.dialCode}>
          <Text style={sw.dialFlag}>🇮🇳</Text>
          <Text style={sw.dialNum}>+91</Text>
        </View>
        <View style={sw.inputDivider} />
        <TextInput
          style={sw.input}
          value={value}
          onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 10))}
          placeholder="9876543210"
          placeholderTextColor={MUTED}
          keyboardType="phone-pad"
          maxLength={10}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="next"
        />
        {isValid && <Ionicons name="checkmark-circle" size={20} color={TEAL} />}
      </View>
      <Text style={sw.charCount}>{value.length}/10 digits</Text>
      <View style={[sw.emergencyCard, { borderColor: accent + '30', backgroundColor: accent + '08' }]}>
        <View style={[sw.emergencyIconWrap, { backgroundColor: accent + '20' }]}>
          <Ionicons name="call" size={20} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[sw.emergencyTitle, { color: accent }]}>Why we need this</Text>
          <Text style={sw.emergencyDesc}>This number is only contacted in medical emergencies during your clinic visit. It is never used for marketing.</Text>
        </View>
      </View>
    </View>
  );
}

// ── Step 6: Medical Information ───────────────────────────────────────────────
function StepMedical({ form, onChange, accent }) {
  return (
    <View style={sw.stepBody}>
      {/* Blood group */}
      <Text style={sw.fieldLabel}>Blood group <Text style={sw.optionalTag}>(optional)</Text></Text>
      <View style={sw.bloodGrid}>
        {BLOOD_GROUPS.map((bg) => {
          const active = form.bloodGroup === bg;
          return (
            <TouchableOpacity
              key={bg}
              style={[sw.bloodChip, active && { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
              onPress={() => onChange('bloodGroup', active ? '' : bg)}
              activeOpacity={0.8}
            >
              <Text style={[sw.bloodText, active && { color: '#DC2626', fontWeight: '800' }]}>{bg}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Allergies */}
      <Text style={[sw.fieldLabel, { marginTop: 16 }]}>Known allergies <Text style={sw.optionalTag}>(optional)</Text></Text>
      <TextInput
        style={sw.textArea}
        value={form.allergies}
        onChangeText={(v) => onChange('allergies', v)}
        placeholder="e.g. Penicillin, Dust, Peanuts, Latex..."
        placeholderTextColor={MUTED}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
      />

      {/* Existing conditions */}
      <Text style={[sw.fieldLabel, { marginTop: 8 }]}>Existing conditions <Text style={sw.optionalTag}>(optional)</Text></Text>
      <TextInput
        style={sw.textArea}
        value={form.existingDiseases}
        onChangeText={(v) => onChange('existingDiseases', v)}
        placeholder="e.g. Diabetes Type 2, Hypertension, Asthma..."
        placeholderTextColor={MUTED}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
      />

      {/* Insurance */}
      <Text style={[sw.fieldLabel, { marginTop: 8 }]}>Insurance provider <Text style={sw.optionalTag}>(optional)</Text></Text>
      <View style={sw.inputWrap}>
        <Ionicons name="shield-outline" size={18} color={MUTED} />
        <TextInput
          style={sw.input}
          value={form.insuranceProvider}
          onChangeText={(v) => onChange('insuranceProvider', v)}
          placeholder="e.g. Star Health, HDFC Ergo"
          placeholderTextColor={MUTED}
        />
      </View>

      <View style={[sw.hintBox, { borderColor: accent + '30', backgroundColor: accent + '08' }]}>
        <Ionicons name="lock-closed-outline" size={14} color={accent} />
        <Text style={[sw.hintText, { color: accent }]}>This information is encrypted and only shared with your treating doctor.</Text>
      </View>
    </View>
  );
}

// ── Success overlay ───────────────────────────────────────────────────────────
function SuccessOverlay({ visible }) {
  const scaleA = useRef(new Animated.Value(0)).current;
  const fadeA  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleA, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
        Animated.timing(fadeA,  { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <Animated.View style={[so.overlay, { opacity: fadeA }]}>
      <Animated.View style={[so.card, { transform: [{ scale: scaleA }] }]}>
        <View style={so.circle}>
          <Ionicons name="checkmark" size={52} color={WHITE} />
        </View>
        <Text style={so.title}>Profile Complete!</Text>
        <Text style={so.sub}>Your health profile is set up.{'\n'}Doctors can now provide better care.</Text>
        <View style={so.statsRow}>
          {[['100%', 'Complete'], ['Secure', 'Encrypted'], ['Ready', 'To Book']].map(([val, lbl]) => (
            <View key={lbl} style={so.stat}>
              <Text style={so.statVal}>{val}</Text>
              <Text style={so.statLbl}>{lbl}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const so = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(3,105,161,0.92)', zIndex: 200, alignItems: 'center', justifyContent: 'center', padding: 32 },
  card:    { backgroundColor: WHITE, borderRadius: 28, padding: 32, alignItems: 'center', width: '100%', gap: 12 },
  circle:  { width: 96, height: 96, borderRadius: 48, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', shadowColor: TEAL, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12, marginBottom: 4 },
  title:   { fontSize: 26, fontWeight: '800', color: SLATE, letterSpacing: -0.5 },
  sub:     { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 21 },
  statsRow:{ flexDirection: 'row', gap: 0, width: '100%', marginTop: 8 },
  stat:    { flex: 1, alignItems: 'center', gap: 3 },
  statVal: { fontSize: 16, fontWeight: '800', color: SKY5 },
  statLbl: { fontSize: 11, color: MUTED, fontWeight: '600' },
});

// ── Main ProfileWizardScreen ──────────────────────────────────────────────────
export default function ProfileWizardScreen({ route, navigation }) {
  const { profile } = route?.params || {};
  const { updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const p = profile?.patientProfile;

  const [step,    setStep]    = useState(0);   // 0-indexed
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name:             profile?.name || '',
    gender:           p?.gender || '',
    dob:              p?.dob ? p.dob.split('T')[0] : '',
    city:             p?.city || '',
    emergencyContact: p?.emergencyContact || '',
    bloodGroup:       p?.bloodGroup || '',
    allergies:        p?.allergies || '',
    existingDiseases: p?.existingDiseases || '',
    insuranceProvider:p?.insuranceProvider || '',
  });

  // Slide animation
  const slideA = useRef(new Animated.Value(0)).current;
  const fadeA  = useRef(new Animated.Value(1)).current;
  const prevStep = useRef(0);

  const animateStep = (dir) => {
    Animated.parallel([
      Animated.timing(fadeA,  { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(slideA, { toValue: dir * -30, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      slideA.setValue(dir * 30);
      Animated.parallel([
        Animated.timing(fadeA,  { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(slideA, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
  };

  const setField = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const canProceed = () => {
    const s = STEPS[step];
    switch (s.key) {
      case 'name':             return form.name.trim().length >= 2;
      case 'gender':           return !!form.gender;
      case 'dob':              return !!form.dob && !isNaN(new Date(form.dob));
      case 'city':             return form.city.trim().length >= 2;
      case 'emergencyContact': return form.emergencyContact.replace(/\D/g, '').length >= 10;
      case 'medical':          return true;
      default:                 return true;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;
    if (step < STEPS.length - 1) {
      animateStep(1);
      setStep((s) => s + 1);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      animateStep(-1);
      setStep((s) => s - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updatePatientProfile({
        name:             form.name.trim()             || undefined,
        gender:           form.gender                  || undefined,
        dob:              form.dob                     || undefined,
        city:             form.city.trim()             || undefined,
        emergencyContact: form.emergencyContact        || undefined,
        bloodGroup:       form.bloodGroup,
        allergies:        form.allergies,
        existingDiseases: form.existingDiseases,
        insuranceProvider:form.insuranceProvider,
      });
      updateUser({ name: res.data.data.user.name });
      setSuccess(true);
      // After success: go to ProfileTab so user sees their filled details
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'ProfileTab' }],
        });
      }, 2400);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const current = STEPS[step];
  const accent  = current.color;
  const completedSteps = STEPS.filter((s, i) => {
    if (i >= step) return false;
    switch (s.key) {
      case 'name':             return form.name.trim().length >= 2;
      case 'gender':           return !!form.gender;
      case 'dob':              return !!form.dob;
      case 'city':             return form.city.trim().length >= 2;
      case 'emergencyContact': return form.emergencyContact.replace(/\D/g, '').length >= 10;
      default:                 return true;
    }
  }).length;
  const overallPct = Math.round(((completedSteps + (canProceed() ? 1 : 0)) / STEPS.length) * 100);

  return (
    <View style={wz.root}>
      <StatusBar barStyle="light-content" backgroundColor={SKY7} translucent />

      {/* ── Top header band ── */}
      <View style={[wz.headerBand, { backgroundColor: accent, paddingTop: insets.top + 12 }]}>
        {/* Decorative blobs */}
        <View style={wz.blobTL} />
        <View style={wz.blobBR} />

        {/* Nav row */}
        <View style={wz.navRow}>
          <TouchableOpacity style={wz.backBtn} onPress={handleBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={WHITE} />
          </TouchableOpacity>
          <View style={wz.navCenter}>
            <Text style={wz.navTitle}>Complete Your Profile</Text>
            <Text style={wz.navSub}>Step {step + 1} of {STEPS.length}</Text>
          </View>
          <TouchableOpacity style={wz.skipBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={wz.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={wz.progressWrap}>
          <ProgressBar current={step + (canProceed() ? 1 : 0)} total={STEPS.length} accent={WHITE} />
          <StepDots current={step} total={STEPS.length} accent={WHITE} />
        </View>

        {/* Step icon + title */}
        <View style={wz.stepHero}>
          <View style={[wz.stepIconWrap, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name={current.icon} size={28} color={WHITE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={wz.stepTitle}>{current.title}</Text>
            <Text style={wz.stepSubtitle}>{current.subtitle}</Text>
          </View>
          {current.required ? (
            <View style={wz.requiredBadge}>
              <Text style={wz.requiredText}>Required</Text>
            </View>
          ) : (
            <View style={wz.optionalBadge}>
              <Text style={wz.optionalBadgeText}>Optional</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Scrollable step content ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={wz.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeA, transform: [{ translateY: slideA }] }}>
            {/* Step card */}
            <View style={wz.card}>
              {step === 0 && <StepName     value={form.name}             onChange={(v) => setField('name', v)}             accent={accent} />}
              {step === 1 && <StepGender   value={form.gender}           onChange={(v) => setField('gender', v)}           accent={accent} />}
              {step === 2 && <StepDob      value={form.dob}              onChange={(v) => setField('dob', v)}              accent={accent} />}
              {step === 3 && <StepCity     value={form.city}             onChange={(v) => setField('city', v)}             accent={accent} />}
              {step === 4 && <StepEmergency value={form.emergencyContact} onChange={(v) => setField('emergencyContact', v)} accent={accent} />}
              {step === 5 && <StepMedical  form={form}                   onChange={setField}                               accent={accent} />}
            </View>

            {/* Completed steps summary */}
            {step > 0 && (
              <View style={wz.summaryCard}>
                <Text style={wz.summaryTitle}>Saved so far</Text>
                <View style={wz.summaryGrid}>
                  {STEPS.slice(0, step).map((s) => {
                    const val = s.key === 'medical' ? 'Added' : form[s.key] || '—';
                    const done = val !== '—';
                    return (
                      <View key={s.key} style={wz.summaryItem}>
                        <View style={[wz.summaryIcon, { backgroundColor: done ? s.color + '18' : '#F1F5F9' }]}>
                          <Ionicons name={s.icon} size={13} color={done ? s.color : MUTED} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={wz.summaryLabel}>{s.title}</Text>
                          <Text style={[wz.summaryVal, { color: done ? SLATE : MUTED }]} numberOfLines={1}>
                            {s.key === 'gender' ? (val === 'MALE' ? 'Male' : val === 'FEMALE' ? 'Female' : val === 'OTHER' ? 'Other' : '—') : val}
                          </Text>
                        </View>
                        {done && <Ionicons name="checkmark-circle" size={16} color={TEAL} />}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Sticky bottom bar ── */}
      <View style={[wz.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {/* Back button */}
        {step > 0 && (
          <TouchableOpacity style={wz.prevBtn} onPress={handleBack} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={18} color={accent} />
            <Text style={[wz.prevText, { color: accent }]}>Back</Text>
          </TouchableOpacity>
        )}

        {/* Next / Finish button */}
        <TouchableOpacity
          style={[
            wz.nextBtn,
            { backgroundColor: canProceed() ? accent : '#E2E8F0', shadowColor: accent },
            step === 0 && { flex: 1 },
          ]}
          onPress={handleNext}
          disabled={!canProceed() || saving}
          activeOpacity={0.88}
        >
          {saving ? (
            <ActivityIndicator color={WHITE} size="small" />
          ) : (
            <>
              <Text style={[wz.nextText, { color: canProceed() ? WHITE : MUTED }]}>
                {step === STEPS.length - 1 ? 'Complete Profile' : 'Continue'}
              </Text>
              <Ionicons
                name={step === STEPS.length - 1 ? 'checkmark-circle' : 'arrow-forward'}
                size={18}
                color={canProceed() ? WHITE : MUTED}
              />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Success overlay ── */}
      <SuccessOverlay visible={success} />
    </View>
  );
}

// ── Shared step styles ────────────────────────────────────────────────────────
const sw = StyleSheet.create({
  stepBody:       { gap: 4 },
  fieldLabel:     { fontSize: 14, fontWeight: '700', color: SLATE, marginBottom: 10 },
  optionalTag:    { fontSize: 12, fontWeight: '400', color: MUTED },
  fieldError:     { fontSize: 12, color: '#EF4444', marginTop: 4 },

  // Input
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 16,
    backgroundColor: WHITE, paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  input:          { flex: 1, fontSize: 16, color: SLATE, fontWeight: '500' },
  inputDivider:   { width: 1, height: 24, backgroundColor: '#E2E8F0' },
  dialCode:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dialFlag:       { fontSize: 18 },
  dialNum:        { fontSize: 15, fontWeight: '700', color: SLATE },
  charCount:      { fontSize: 11, color: MUTED, textAlign: 'right', marginTop: 4, marginBottom: 8 },

  // Hint box
  hintBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12,
    borderColor: '#BFDBFE', backgroundColor: '#EFF6FF',
  },
  hintText: { flex: 1, fontSize: 12, lineHeight: 17 },

  // Gender
  genderGrid:   { flexDirection: 'row', gap: 12, marginBottom: 4 },
  genderCard: {
    flex: 1, alignItems: 'center', paddingVertical: 20, borderRadius: 18,
    borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: WHITE, gap: 8, position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  genderEmoji:  { fontSize: 32 },
  genderLabel:  { fontSize: 13, fontWeight: '600', color: '#475569' },
  genderCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  // Age badge
  ageBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 10,
    alignSelf: 'flex-start',
  },
  ageText: { fontSize: 13, fontWeight: '700' },

  // City chips
  popularLabel: { fontSize: 12, fontWeight: '600', color: MUTED, marginTop: 14, marginBottom: 8 },
  cityGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: WHITE,
  },
  cityChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },

  // Emergency card
  emergencyCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 12,
  },
  emergencyIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emergencyTitle:    { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  emergencyDesc:     { fontSize: 12, color: '#475569', lineHeight: 17 },

  // Blood group
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bloodChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: WHITE,
    minWidth: 56, alignItems: 'center',
  },
  bloodText: { fontSize: 14, fontWeight: '700', color: '#475569' },

  // Textarea
  textArea: {
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14,
    padding: 14, fontSize: 14, color: SLATE, backgroundColor: WHITE,
    minHeight: 80, marginBottom: 4,
  },
});

// ── Screen styles ─────────────────────────────────────────────────────────────
const wz = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // Header band
  headerBand:   { paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden' },
  blobTL:       { position: 'absolute', top: -50, left: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.1)' },
  blobBR:       { position: 'absolute', bottom: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' },

  // Nav row
  navRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn:      { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  navCenter:    { flex: 1 },
  navTitle:     { fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: -0.3 },
  navSub:       { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  skipBtn:      { paddingHorizontal: 10, paddingVertical: 6 },
  skipText:     { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },

  // Progress
  progressWrap: { marginBottom: 16 },

  // Step hero
  stepHero:     { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepTitle:    { fontSize: 20, fontWeight: '800', color: WHITE, letterSpacing: -0.4 },
  stepSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3, lineHeight: 17 },
  requiredBadge:{ backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  requiredText: { fontSize: 10, fontWeight: '800', color: WHITE },
  optionalBadge:{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  optionalBadgeText: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },

  // Scroll
  scrollContent: { padding: 18, paddingBottom: 40, gap: 14 },

  // Step card
  card: {
    backgroundColor: WHITE, borderRadius: 24, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 5,
  },

  // Summary card
  summaryCard: {
    backgroundColor: WHITE, borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: MUTED, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryGrid:  { gap: 10 },
  summaryItem:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryIcon:  { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontSize: 11, color: MUTED, fontWeight: '500' },
  summaryVal:   { fontSize: 13, fontWeight: '700' },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 14,
    backgroundColor: WHITE,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 10,
  },
  prevBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 15,
    borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  prevText: { fontSize: 14, fontWeight: '700' },
  nextBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 16,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  nextText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.1 },
});
