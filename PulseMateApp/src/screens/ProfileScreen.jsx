// ─────────────────────────────────────────────────────────────────────────────
//  ProfileScreen — PulseMate Connect  |  Premium Patient Profile
//  Sections: Profile Card · Personal Info · Quick Links
//            Appointments History · Settings Menu · Logout
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Animated, Easing, Dimensions, StatusBar,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getPatientProfile, getMyAppointments, updatePatientProfile } from '../api/patient';
import { logout, getMyNotifications } from '../api/auth';
import { useAuth } from '../store/authStore';

const { width: W } = Dimensions.get('window');

// ── Brand tokens ──────────────────────────────────────────────────────────────
const SKY5   = '#0EA5E9';
const SKY6   = '#0284C7';
const SKY7   = '#0369A1';
const TEAL   = '#2DD4BF';
const GREEN  = '#10B981';
const AMBER  = '#F59E0B';
const RED    = '#EF4444';
const PURPLE = '#8B5CF6';
const WHITE  = '#FFFFFF';
const SLATE  = '#0F172A';
const MUTED  = '#94A3B8';
const BG     = '#F0F7FF';
const BORDER = '#E2E8F0';

const BLOOD_GROUPS   = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDER_OPTIONS = [
  { value: 'MALE',   label: 'Male',   emoji: '👨' },
  { value: 'FEMALE', label: 'Female', emoji: '👩' },
  { value: 'OTHER',  label: 'Other',  emoji: '🧑' },
];
const POPULAR_CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'];

// ── Status color map ──────────────────────────────────────────────────────────
const STATUS_META = {
  BOOKED:          { label: 'Confirmed',   color: SKY5,    bg: '#E0F2FE' },
  CHECKED_IN:      { label: 'Checked In',  color: GREEN,   bg: '#D1FAE5' },
  IN_QUEUE:        { label: 'In Queue',    color: AMBER,   bg: '#FEF3C7' },
  IN_CONSULTATION: { label: 'Consulting',  color: PURPLE,  bg: '#EDE9FE' },
  CALLED:          { label: 'Called',      color: GREEN,   bg: '#D1FAE5' },
  COMPLETED:       { label: 'Completed',   color: '#64748B', bg: '#F1F5F9' },
  CANCELLED:       { label: 'Cancelled',   color: RED,     bg: '#FEE2E2' },
  NO_SHOW:         { label: 'No Show',     color: MUTED,   bg: '#F1F5F9' },
};

const fmtDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, iconBg, iconColor, actionLabel, onAction }) {
  return (
    <View style={pf.sectionHeader}>
      <View style={[pf.sectionIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={15} color={iconColor} />
      </View>
      <Text style={pf.sectionTitle}>{title}</Text>
      {onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7} style={pf.sectionAction}>
          <Text style={pf.sectionActionText}>{actionLabel || 'View all'}</Text>
          <Ionicons name="chevron-forward" size={13} color={SKY5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Inline Edit Sheet (bottom modal — Swiggy/Zomato style) ───────────────────
function EditSheet({ visible, profile, onClose, onSaved }) {
  const insets   = useSafeAreaInsets();
  const slideA   = useRef(new Animated.Value(600)).current;
  const p        = profile?.patientProfile;
  const [saving, setSaving] = useState(false);

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

  // Re-sync form when profile changes (sheet re-opened)
  useEffect(() => {
    if (visible) {
      const pp = profile?.patientProfile;
      setForm({
        name:             profile?.name || '',
        gender:           pp?.gender || '',
        dob:              pp?.dob ? pp.dob.split('T')[0] : '',
        city:             pp?.city || '',
        emergencyContact: pp?.emergencyContact || '',
        bloodGroup:       pp?.bloodGroup || '',
        allergies:        pp?.allergies || '',
        existingDiseases: pp?.existingDiseases || '',
        insuranceProvider:pp?.insuranceProvider || '',
      });
      Animated.spring(slideA, { toValue: 0, friction: 8, tension: 80, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideA, { toValue: 600, duration: 260, useNativeDriver: true }).start();
    }
  }, [visible]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      Alert.alert('Name required', 'Please enter your full name.'); return;
    }
    setSaving(true);
    try {
      const res = await updatePatientProfile({
        name:             form.name.trim()      || undefined,
        gender:           form.gender           || undefined,
        dob:              form.dob              || undefined,
        city:             form.city.trim()      || undefined,
        emergencyContact: form.emergencyContact || undefined,
        bloodGroup:       form.bloodGroup,
        allergies:        form.allergies,
        existingDiseases: form.existingDiseases,
        insuranceProvider:form.insuranceProvider,
      });
      onSaved(res.data.data.user);
      onClose();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity style={es.backdrop} activeOpacity={1} onPress={onClose} />

      {/* Sheet */}
      <Animated.View style={[es.sheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY: slideA }] }]}>
        {/* Handle */}
        <View style={es.handle} />

        {/* Header */}
        <View style={es.sheetHeader}>
          <View style={es.sheetTitleWrap}>
            <View style={es.sheetIconWrap}>
              <Ionicons name="person" size={16} color={SKY6} />
            </View>
            <Text style={es.sheetTitle}>Edit Profile</Text>
          </View>
          <TouchableOpacity style={es.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={18} color={SLATE} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={es.scrollBody} keyboardShouldPersistTaps="handled">

            {/* ── Full Name ── */}
            <Text style={es.label}>Full Name <Text style={es.req}>*</Text></Text>
            <View style={es.inputRow}>
              <Ionicons name="person-outline" size={16} color={MUTED} />
              <TextInput
                style={es.input}
                value={form.name}
                onChangeText={(v) => set('name', v)}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={MUTED}
                autoCapitalize="words"
              />
            </View>

            {/* ── Gender ── */}
            <Text style={es.label}>Gender</Text>
            <View style={es.chipRow}>
              {GENDER_OPTIONS.map((g) => (
                <TouchableOpacity
                  key={g.value}
                  style={[es.chip, form.gender === g.value && es.chipActive]}
                  onPress={() => set('gender', form.gender === g.value ? '' : g.value)}
                  activeOpacity={0.8}
                >
                  <Text style={es.chipEmoji}>{g.emoji}</Text>
                  <Text style={[es.chipText, form.gender === g.value && es.chipTextActive]}>{g.label}</Text>
                  {form.gender === g.value && <Ionicons name="checkmark-circle" size={14} color={SKY5} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Date of Birth ── */}
            <Text style={es.label}>Date of Birth</Text>
            <View style={es.inputRow}>
              <Ionicons name="calendar-outline" size={16} color={MUTED} />
              <TextInput
                style={es.input}
                value={form.dob}
                onChangeText={(v) => set('dob', v)}
                placeholder="YYYY-MM-DD  (e.g. 1995-08-15)"
                placeholderTextColor={MUTED}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            {/* ── City ── */}
            <Text style={es.label}>City</Text>
            <View style={es.inputRow}>
              <Ionicons name="location-outline" size={16} color={MUTED} />
              <TextInput
                style={es.input}
                value={form.city}
                onChangeText={(v) => set('city', v)}
                placeholder="e.g. Bangalore"
                placeholderTextColor={MUTED}
                autoCapitalize="words"
              />
            </View>
            <View style={es.cityChips}>
              {POPULAR_CITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[es.cityChip, form.city === c && es.cityChipActive]}
                  onPress={() => set('city', c)}
                  activeOpacity={0.8}
                >
                  <Text style={[es.cityChipText, form.city === c && { color: WHITE, fontWeight: '700' }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Emergency Contact ── */}
            <Text style={es.label}>Emergency Contact</Text>
            <View style={es.inputRow}>
              <Text style={es.dialCode}>🇮🇳 +91</Text>
              <TextInput
                style={es.input}
                value={form.emergencyContact}
                onChangeText={(v) => set('emergencyContact', v.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                placeholderTextColor={MUTED}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            {/* ── Blood Group ── */}
            <Text style={es.label}>Blood Group</Text>
            <View style={es.chipRow}>
              {BLOOD_GROUPS.map((bg) => (
                <TouchableOpacity
                  key={bg}
                  style={[es.bloodChip, form.bloodGroup === bg && es.bloodChipActive]}
                  onPress={() => set('bloodGroup', form.bloodGroup === bg ? '' : bg)}
                  activeOpacity={0.8}
                >
                  <Text style={[es.bloodChipText, form.bloodGroup === bg && { color: RED, fontWeight: '800' }]}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Allergies ── */}
            <Text style={es.label}>Known Allergies <Text style={es.opt}>(optional)</Text></Text>
            <TextInput
              style={es.textArea}
              value={form.allergies}
              onChangeText={(v) => set('allergies', v)}
              placeholder="e.g. Penicillin, Dust, Peanuts..."
              placeholderTextColor={MUTED}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />

            {/* ── Existing Conditions ── */}
            <Text style={es.label}>Existing Conditions <Text style={es.opt}>(optional)</Text></Text>
            <TextInput
              style={es.textArea}
              value={form.existingDiseases}
              onChangeText={(v) => set('existingDiseases', v)}
              placeholder="e.g. Diabetes, Hypertension, Asthma..."
              placeholderTextColor={MUTED}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />

            {/* ── Insurance ── */}
            <Text style={es.label}>Insurance Provider <Text style={es.opt}>(optional)</Text></Text>
            <View style={es.inputRow}>
              <Ionicons name="shield-outline" size={16} color={MUTED} />
              <TextInput
                style={es.input}
                value={form.insuranceProvider}
                onChangeText={(v) => set('insuranceProvider', v)}
                placeholder="e.g. Star Health, HDFC Ergo"
                placeholderTextColor={MUTED}
              />
            </View>

            {/* ── Save button ── */}
            <TouchableOpacity style={es.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.88}>
              {saving ? (
                <ActivityIndicator color={WHITE} size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={WHITE} />
                  <Text style={es.saveBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const es = StyleSheet.create({
  backdrop:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:         {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: WHITE, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '92%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 20,
  },
  handle:        { width: 44, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  sheetHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  sheetTitleWrap:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheetIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  sheetTitle:    { fontSize: 17, fontWeight: '800', color: SLATE, letterSpacing: -0.3 },
  closeBtn:      { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  scrollBody:    { paddingHorizontal: 20, paddingTop: 16, gap: 4, paddingBottom: 8 },

  label:    { fontSize: 13, fontWeight: '700', color: SLATE, marginBottom: 8, marginTop: 12 },
  req:      { color: RED },
  opt:      { fontSize: 11, fontWeight: '400', color: MUTED },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  input:    { flex: 1, fontSize: 14, color: SLATE, paddingVertical: 0 },
  dialCode: { fontSize: 14, fontWeight: '600', color: SLATE, marginRight: 4 },

  chipRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#F8FAFC' },
  chipActive:{ borderColor: SKY5, backgroundColor: '#EFF6FF' },
  chipEmoji:{ fontSize: 16 },
  chipText: { fontSize: 13, fontWeight: '600', color: SLATE },
  chipTextActive: { color: SKY6, fontWeight: '700' },

  cityChips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  cityChip:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#F8FAFC' },
  cityChipActive:{ backgroundColor: SKY5, borderColor: SKY5 },
  cityChipText: { fontSize: 12, fontWeight: '600', color: SLATE },

  bloodChip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#F8FAFC' },
  bloodChipActive:{ backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  bloodChipText: { fontSize: 13, fontWeight: '600', color: SLATE },

  textArea: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: SLATE, backgroundColor: '#F8FAFC',
    minHeight: 72, textAlignVertical: 'top',
  },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: SKY5, borderRadius: 16, paddingVertical: 16, marginTop: 20,
    shadowColor: SKY5, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: WHITE },
});

// ── Main ProfileScreen ────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const [profile,      setProfile]      = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [unread,       setUnread]       = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [historyOpen,  setHistoryOpen]  = useState(true);
  const [editSheet,    setEditSheet]    = useState(false);

  const enterA = useRef(new Animated.Value(0)).current;
  const slideA = useRef(new Animated.Value(20)).current;

  const load = useCallback(async () => {
    try {
      const [profRes, notifRes, apptRes] = await Promise.all([
        getPatientProfile(),
        getMyNotifications().catch(() => null),
        getMyAppointments({ limit: 5 }).catch(() => null),
      ]);
      setProfile(profRes.data.data.user);
      if (notifRes) setUnread(notifRes.data.data?.unreadCount || 0);
      if (apptRes)  setAppointments(apptRes.data.data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    Animated.parallel([
      Animated.timing(enterA, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideA, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive', onPress: async () => {
          try { await logout(); } catch {}
          signOut();
        },
      },
    ]);
  };

  const handleMenu = (action) => {
    switch (action) {
      case 'editProfile':   setEditSheet(true); break;
      case 'medicalInfo':   setEditSheet(true); break;
      case 'payments':      navigation.navigate('Payments'); break;
      case 'notifications': navigation.navigate('Notifications'); break;
      case 'privacy':
        Alert.alert('Privacy & Security', 'Your data is encrypted and protected.\n\nPulseMate never shares your health data without your consent.');
        break;
      case 'help':
        Alert.alert('Help & Support', 'Email: support@pulsemate.in\nPhone: 1800-XXX-XXXX\n\nApp Version: 1.0.0');
        break;
    }
  };

  // Called by EditSheet after successful save — refresh profile in-place
  const handleProfileSaved = () => {
    getPatientProfile().then((r) => setProfile(r.data.data.user)).catch(() => {});
  };
  const displayName = profile?.name || user?.name || 'User';
  const p           = profile?.patientProfile;
  const patientAge  = p?.dob
    ? Math.floor((new Date() - new Date(p.dob)) / (365.25 * 24 * 60 * 60 * 1000))
    : p?.age;

  const completedAppts = appointments.filter((a) => a.status === 'COMPLETED').length;
  const upcomingAppts  = appointments.filter((a) => ['BOOKED', 'CHECKED_IN', 'IN_QUEUE'].includes(a.status)).length;

  const MENU = [
    { icon: 'person-outline',           label: 'Personal Information', color: SKY6,    action: 'editProfile'   },
    { icon: 'shield-checkmark-outline', label: 'Medical Information',  color: GREEN,   action: 'medicalInfo'   },
    { icon: 'card-outline',             label: 'Payment Methods',      color: PURPLE,  action: 'payments'      },
    { icon: 'notifications-outline',    label: 'Notifications',        color: AMBER,   action: 'notifications' },
    { icon: 'lock-closed-outline',      label: 'Privacy & Security',   color: '#06B6D4', action: 'privacy'     },
    { icon: 'help-circle-outline',      label: 'Help & Support',       color: MUTED,   action: 'help'          },
  ];

  return (
    <View style={pf.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── Sticky header ── */}
      <View style={[pf.topBar, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={pf.topTitle}>My Profile</Text>
          <Text style={pf.topSub}>Manage your account & health</Text>
        </View>
        <View style={pf.topRight}>
          <TouchableOpacity style={pf.iconBtn} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={20} color={SLATE} />
            {unread > 0 && (
              <View style={pf.notifDot}>
                <Text style={pf.notifDotText}>{unread > 9 ? '9+' : unread}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={pf.iconBtn} onPress={() => navigation.navigate('ProfileWizard', { profile })} activeOpacity={0.8}>
            <Ionicons name="settings-outline" size={20} color={SLATE} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={pf.loadingWrap}>
          <ActivityIndicator color={SKY5} size="large" />
          <Text style={pf.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <Animated.ScrollView
          style={{ opacity: enterA, transform: [{ translateY: slideA }] }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[pf.scroll, { paddingBottom: insets.bottom + 32 }]}
        >
          {/* ══════════════════════════════════════════════════════════════════
              PROFILE HERO CARD
          ══════════════════════════════════════════════════════════════════ */}
          <View style={pf.heroCard}>
            {/* Background decoration */}
            <View style={pf.heroBlobTL} />
            <View style={pf.heroBlobBR} />

            {/* Avatar + name */}
            <View style={pf.heroTop}>
              <View style={pf.avatarWrap}>
                <View style={pf.avatar}>
                  <Text style={pf.avatarText}>{displayName?.charAt(0)?.toUpperCase() || 'U'}</Text>
                </View>
                <TouchableOpacity
                  style={pf.cameraBtn}
                  onPress={() => setEditSheet(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={12} color={WHITE} />
                </TouchableOpacity>
              </View>

              <View style={pf.heroInfo}>
                <View style={pf.heroNameRow}>
                  <Text style={pf.heroName} numberOfLines={1}>{displayName}</Text>
                  <Ionicons name="checkmark-circle" size={18} color={TEAL} />
                </View>
                {profile?.mobile && (
                  <View style={pf.heroMetaRow}>
                    <Ionicons name="call-outline" size={12} color="rgba(255,255,255,0.7)" />
                    <Text style={pf.heroMetaText}>+91 {profile.mobile}</Text>
                  </View>
                )}
                {profile?.email && (
                  <View style={pf.heroMetaRow}>
                    <Ionicons name="mail-outline" size={12} color="rgba(255,255,255,0.7)" />
                    <Text style={pf.heroMetaText} numberOfLines={1}>{profile.email}</Text>
                  </View>
                )}
                {p?.city && (
                  <View style={pf.heroMetaRow}>
                    <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.7)" />
                    <Text style={pf.heroMetaText}>{p.city}, India</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={pf.editBtn}
                onPress={() => setEditSheet(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={14} color={SKY5} />
                <Text style={pf.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Health tags */}
            <View style={pf.heroTags}>
              {p?.gender && (
                <View style={pf.heroTag}>
                  <Ionicons name="person-outline" size={11} color="rgba(255,255,255,0.8)" />
                  <Text style={pf.heroTagText}>{p.gender.charAt(0) + p.gender.slice(1).toLowerCase()}</Text>
                </View>
              )}
              {patientAge && (
                <View style={pf.heroTag}>
                  <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.8)" />
                  <Text style={pf.heroTagText}>{patientAge} yrs</Text>
                </View>
              )}
              {p?.bloodGroup && (
                <View style={[pf.heroTag, { backgroundColor: 'rgba(239,68,68,0.3)', borderColor: 'rgba(239,68,68,0.5)' }]}>
                  <Ionicons name="water-outline" size={11} color="#FCA5A5" />
                  <Text style={[pf.heroTagText, { color: '#FCA5A5' }]}>{p.bloodGroup}</Text>
                </View>
              )}
              {p?.city && (
                <View style={pf.heroTag}>
                  <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.8)" />
                  <Text style={pf.heroTagText}>{p.city}</Text>
                </View>
              )}
            </View>

            {/* Stats strip */}
            <View style={pf.heroStats}>
              <View style={pf.heroStat}>
                <Text style={pf.heroStatNum}>{appointments.length}</Text>
                <Text style={pf.heroStatLabel}>Total Visits</Text>
              </View>
              <View style={pf.heroStatSep} />
              <View style={pf.heroStat}>
                <Text style={pf.heroStatNum}>{completedAppts}</Text>
                <Text style={pf.heroStatLabel}>Completed</Text>
              </View>
              <View style={pf.heroStatSep} />
              <View style={pf.heroStat}>
                <Text style={pf.heroStatNum}>{upcomingAppts}</Text>
                <Text style={pf.heroStatLabel}>Upcoming</Text>
              </View>
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════════
              PERSONAL INFORMATION CARD
          ══════════════════════════════════════════════════════════════════ */}
          <View style={pf.card}>
            <SectionHeader
              icon="person"
              title="Personal Information"
              iconBg="#EFF6FF"
              iconColor={SKY6}
              actionLabel="Edit"
              onAction={() => setEditSheet(true)}
            />

            {/* Row helper */}
            {[
              { icon: 'person-outline',      label: 'Full Name',          value: displayName,                                                                  color: SKY6   },
              { icon: 'call-outline',         label: 'Mobile',             value: profile?.mobile ? `+91 ${profile.mobile}` : null,                            color: GREEN  },
              { icon: 'mail-outline',         label: 'Email',              value: profile?.email,                                                               color: PURPLE },
              { icon: 'male-female-outline',  label: 'Gender',             value: p?.gender ? p.gender.charAt(0) + p.gender.slice(1).toLowerCase() : null,     color: '#8B5CF6' },
              { icon: 'calendar-outline',     label: 'Date of Birth',      value: p?.dob ? fmtDate(p.dob) : null,                                              color: GREEN  },
              { icon: 'water-outline',        label: 'Blood Group',        value: p?.bloodGroup,                                                                color: RED    },
              { icon: 'location-outline',     label: 'City',               value: p?.city,                                                                      color: AMBER  },
              { icon: 'call-outline',         label: 'Emergency Contact',  value: p?.emergencyContact ? `+91 ${p.emergencyContact}` : null,                    color: RED    },
              { icon: 'alert-circle-outline', label: 'Allergies',          value: p?.allergies,                                                                 color: AMBER  },
              { icon: 'medical-outline',      label: 'Existing Conditions',value: p?.existingDiseases,                                                          color: '#06B6D4' },
              { icon: 'shield-outline',       label: 'Insurance',          value: p?.insuranceProvider,                                                         color: GREEN  },
            ].map(({ icon, label, value, color }) => {
              if (!value) return null;
              return (
                <View key={label} style={pf.infoRow}>
                  <View style={[pf.infoIconWrap, { backgroundColor: color + '15' }]}>
                    <Ionicons name={icon} size={14} color={color} />
                  </View>
                  <View style={pf.infoContent}>
                    <Text style={pf.infoLabel}>{label}</Text>
                    <Text style={pf.infoValue}>{value}</Text>
                  </View>
                </View>
              );
            })}

            {/* If nothing filled yet */}
            {!p && (
              <TouchableOpacity
                style={pf.infoEmptyBtn}
                onPress={() => navigation.navigate('ProfileWizard', { profile })}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={18} color={SKY5} />
                <Text style={pf.infoEmptyText}>Complete your profile to see details here</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ══════════════════════════════════════════════════════════════════
              QUICK LINKS
          ══════════════════════════════════════════════════════════════════ */}
          <View style={pf.card}>
            <View style={pf.quickGrid}>
              {[
                { icon: 'calendar',     label: 'Appointments', color: SKY6,    bg: '#EFF6FF', nav: 'AppointmentsTab' },
                { icon: 'medical',      label: 'Prescriptions',color: PURPLE,  bg: '#EDE9FE', nav: 'RecordsTab'      },
                { icon: 'heart',        label: 'Health\nRecords', color: RED,  bg: '#FEE2E2', nav: 'RecordsTab'      },
                { icon: 'star',         label: 'Saved\nDoctors',  color: AMBER,bg: '#FEF3C7', nav: 'DoctorsTab'      },
              ].map((q) => (
                <TouchableOpacity
                  key={q.label}
                  style={pf.quickItem}
                  onPress={() => navigation.navigate(q.nav)}
                  activeOpacity={0.75}
                >
                  <View style={[pf.quickIcon, { backgroundColor: q.bg }]}>
                    <Ionicons name={q.icon} size={22} color={q.color} />
                  </View>
                  <Text style={pf.quickLabel}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════════
              APPOINTMENTS HISTORY
          ══════════════════════════════════════════════════════════════════ */}
          <View style={pf.card}>
            <SectionHeader
              icon="time"
              title="Appointments History"
              iconBg="#E0F2FE"
              iconColor={SKY6}
              actionLabel="View all"
              onAction={() => navigation.navigate('AppointmentsTab')}
            />

            {appointments.length === 0 ? (
              <View style={pf.historyEmpty}>
                <Ionicons name="calendar-outline" size={32} color={MUTED} />
                <Text style={pf.historyEmptyText}>No appointments yet</Text>
              </View>
            ) : (
              appointments.slice(0, 4).map((appt) => {
                const meta = STATUS_META[appt.status] || { label: appt.status, color: MUTED, bg: '#F1F5F9' };
                const initial = appt.doctor?.user?.name?.charAt(0)?.toUpperCase() || 'D';
                return (
                  <TouchableOpacity
                    key={appt.id}
                    style={pf.historyRow}
                    onPress={() => navigation.navigate('AppointmentsTab', { screen: 'AppointmentDetail', params: { id: appt.id } })}
                    activeOpacity={0.85}
                  >
                    <View style={[pf.historyAvatar, { backgroundColor: meta.bg }]}>
                      <Text style={[pf.historyAvatarText, { color: meta.color }]}>{initial}</Text>
                    </View>
                    <View style={pf.historyInfo}>
                      <Text style={pf.historyDoctor}>Dr. {appt.doctor?.user?.name || '—'}</Text>
                      <Text style={pf.historySpec}>{appt.doctor?.specialization || 'General Physician'}</Text>
                      <View style={pf.historyMeta}>
                        <Ionicons name="calendar-outline" size={10} color={MUTED} />
                        <Text style={pf.historyDate}>{fmtDate(appt.appointmentDate)}</Text>
                        {appt.clinic?.name && (
                          <>
                            <View style={pf.metaDot} />
                            <Text style={pf.historyDate} numberOfLines={1}>{appt.clinic.name}</Text>
                          </>
                        )}
                      </View>
                    </View>
                    <View style={[pf.historyStatus, { backgroundColor: meta.bg }]}>
                      <Text style={[pf.historyStatusText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            {appointments.length > 4 && (
              <TouchableOpacity
                style={pf.viewAllBtn}
                onPress={() => navigation.navigate('AppointmentsTab')}
                activeOpacity={0.8}
              >
                <Text style={pf.viewAllText}>View all {appointments.length} appointments</Text>
                <Ionicons name="arrow-forward" size={14} color={SKY5} />
              </TouchableOpacity>
            )}
          </View>

          {/* ══════════════════════════════════════════════════════════════════
              SETTINGS MENU
          ══════════════════════════════════════════════════════════════════ */}
          <View style={pf.menuCard}>
            {MENU.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[pf.menuItem, i < MENU.length - 1 && pf.menuBorder]}
                onPress={() => handleMenu(item.action)}
                activeOpacity={0.7}
              >
                <View style={[pf.menuIcon, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={pf.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={15} color={MUTED} />
              </TouchableOpacity>
            ))}
          </View>

          {/* ══════════════════════════════════════════════════════════════════
              LOGOUT
          ══════════════════════════════════════════════════════════════════ */}
          <TouchableOpacity style={pf.logoutBtn} onPress={handleLogout} activeOpacity={0.88}>
            <View style={pf.logoutIcon}>
              <Ionicons name="log-out-outline" size={20} color={RED} />
            </View>
            <Text style={pf.logoutText}>Logout</Text>
            <Ionicons name="chevron-forward" size={15} color={RED} />
          </TouchableOpacity>

          <Text style={pf.version}>PulseMate Connect v1.0.0  ·  Healthcare Platform</Text>
        </Animated.ScrollView>
      )}

      {/* ── Inline Edit Sheet ── */}
      <EditSheet
        visible={editSheet}
        profile={profile}
        onClose={() => setEditSheet(false)}
        onSaved={handleProfileSaved}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const pf = StyleSheet.create({
  root:        { flex: 1, backgroundColor: BG },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: MUTED, fontWeight: '500' },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: BG,
  },
  topTitle:  { fontSize: 22, fontWeight: '800', color: SLATE, letterSpacing: -0.5 },
  topSub:    { fontSize: 12, color: MUTED, marginTop: 2 },
  topRight:  { flexDirection: 'row', gap: 8 },
  iconBtn:   {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  notifDot:  {
    position: 'absolute', top: 7, right: 7,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: RED, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: WHITE,
  },
  notifDotText: { fontSize: 8, fontWeight: '800', color: WHITE },

  scroll: { paddingHorizontal: 16, gap: 12 },

  // ── Hero card ──────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: SKY7, borderRadius: 24,
    overflow: 'hidden',
    shadowColor: SKY7, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 20, elevation: 10,
  },
  heroBlobTL: {
    position: 'absolute', top: -50, left: -50,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroBlobBR: {
    position: 'absolute', bottom: -40, right: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  heroTop:     { flexDirection: 'row', alignItems: 'flex-start', padding: 18, gap: 12 },
  avatarWrap:  { position: 'relative' },
  avatar:      {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText:  { fontSize: 28, fontWeight: '900', color: WHITE },
  cameraBtn:   {
    position: 'absolute', bottom: -2, right: -2,
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: SKY5, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: SKY7,
  },

  heroInfo:    { flex: 1 },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  heroName:    { fontSize: 18, fontWeight: '800', color: WHITE, letterSpacing: -0.3, flex: 1 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  heroMetaText:{ fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: WHITE, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  editBtnText: { fontSize: 12, fontWeight: '700', color: SKY5 },

  heroTags: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 7,
    paddingHorizontal: 18, paddingBottom: 14,
  },
  heroTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  heroTagText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },

  heroStats:   {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 14,
  },
  heroStat:    { flex: 1, alignItems: 'center' },
  heroStatNum: { fontSize: 20, fontWeight: '900', color: WHITE, letterSpacing: -0.5 },
  heroStatLabel:{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2, fontWeight: '500' },
  heroStatSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: WHITE, borderRadius: 20, padding: 16,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },

  // Section header
  sectionHeader:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionIconWrap:  { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:     { fontSize: 15, fontWeight: '800', color: SLATE, flex: 1, letterSpacing: -0.2 },
  sectionAction:    { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionActionText:{ fontSize: 12, fontWeight: '700', color: SKY5 },

  // ── Personal information rows ─────────────────────────────────────────────
  infoRow:      {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  infoIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoContent:  { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel:    { fontSize: 12, color: MUTED, fontWeight: '500' },
  infoValue:    { fontSize: 13, fontWeight: '700', color: SLATE, flex: 1, textAlign: 'right', paddingLeft: 8 },
  infoEmptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, justifyContent: 'center',
  },
  infoEmptyText:{ fontSize: 13, color: SKY5, fontWeight: '600' },

  // ── Quick links ───────────────────────────────────────────────────────────  quickGrid:  { flexDirection: 'row', justifyContent: 'space-between' },
  quickItem:  { alignItems: 'center', flex: 1 },
  quickIcon:  { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  quickLabel: { fontSize: 11, fontWeight: '600', color: SLATE, textAlign: 'center', lineHeight: 15 },

  // ── Appointments history ──────────────────────────────────────────────────
  historyEmpty:     { alignItems: 'center', paddingVertical: 24, gap: 8 },
  historyEmptyText: { fontSize: 13, color: MUTED },

  historyRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  historyAvatar:    { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  historyAvatarText:{ fontSize: 16, fontWeight: '800' },
  historyInfo:      { flex: 1 },
  historyDoctor:    { fontSize: 13, fontWeight: '700', color: SLATE, marginBottom: 2 },
  historySpec:      { fontSize: 11, color: MUTED, marginBottom: 4 },
  historyMeta:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyDate:      { fontSize: 10, color: '#64748B' },
  metaDot:          { width: 3, height: 3, borderRadius: 2, backgroundColor: MUTED },
  historyStatus:    { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  historyStatusText:{ fontSize: 10, fontWeight: '700' },

  viewAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, marginTop: 4,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  viewAllText: { fontSize: 13, fontWeight: '700', color: SKY5 },

  // ── Settings menu ─────────────────────────────────────────────────────────
  menuCard:   {
    backgroundColor: WHITE, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  menuItem:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  menuIcon:   { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel:  { flex: 1, fontSize: 14, fontWeight: '600', color: SLATE },

  // ── Logout ────────────────────────────────────────────────────────────────
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FEF2F2', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  logoutText: { flex: 1, fontSize: 15, fontWeight: '700', color: RED },

  version: { textAlign: 'center', fontSize: 11, color: MUTED, paddingVertical: 8 },
});
