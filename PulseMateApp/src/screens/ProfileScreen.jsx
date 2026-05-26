import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getPatientProfile } from '../api/patient';
import { logout, getMyNotifications } from '../api/auth';
import { useAuth } from '../store/authStore';
import { colors, shadow, radius } from '../theme';

const QUICK_LINKS = [
  { icon: 'calendar',      label: 'My\nAppointments', color: '#2563EB', bg: '#EFF6FF', nav: 'AppointmentsTab' },
  { icon: 'receipt',       label: 'My\nPrescriptions',color: '#10B981', bg: '#ECFDF5', nav: 'PrescriptionsTab' },
  { icon: 'heart',         label: 'Health\nRecords',  color: '#EF4444', bg: '#FEF2F2', nav: 'PrescriptionsTab' },
  { icon: 'star',          label: 'Saved\nDoctors',   color: '#F59E0B', bg: '#FFFBEB', nav: 'DoctorsTab'       },
];

const MENU = [
  { icon: 'person-outline',          label: 'Personal Information', color: '#2563EB', action: 'editProfile'   },
  { icon: 'shield-checkmark-outline',label: 'Medical Information',  color: '#10B981', action: 'medicalInfo'   },
  { icon: 'card-outline',            label: 'Payment Methods',      color: '#7C3AED', action: 'payments'      },
  { icon: 'notifications-outline',   label: 'Notifications',        color: '#F59E0B', action: 'notifications' },
  { icon: 'lock-closed-outline',     label: 'Privacy & Security',   color: '#06B6D4', action: 'privacy'       },
  { icon: 'help-circle-outline',     label: 'Help & Support',       color: '#64748B', action: 'help'          },
];

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [profile, setProfile]   = useState(null);

  const [unread, setUnread]     = useState(0);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    try {
      const [profRes, notifRes] = await Promise.all([
        getPatientProfile(),
        getMyNotifications().catch(() => null),
      ]);
      const u = profRes.data.data.user;
      setProfile(u);

      if (notifRes) setUnread(notifRes.data.data?.unreadCount || 0);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

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
      case 'editProfile':
        navigation.navigate('EditProfile', { profile });
        break;
      case 'medicalInfo':
        navigation.navigate('EditProfile', { profile });
        break;
      case 'payments':
        navigation.navigate('Payments');
        break;
      case 'notifications':
        navigation.navigate('Notifications');
        break;
      case 'privacy':
        Alert.alert('Privacy & Security', 'Your data is encrypted and protected.\n\nPulseMate never shares your health data without your consent.');
        break;
      case 'help':
        Alert.alert('Help & Support', 'Email: support@pulsemate.in\nPhone: 1800-XXX-XXXX\n\nApp Version: 1.0.0');
        break;
    }
  };

  const displayName = profile?.name || user?.name || 'User';
  const p   = profile?.patientProfile;
  // Only show location parts that actually exist
  const locParts = [p?.city, p?.city ? 'Maharashtra' : null, 'India'].filter(Boolean);
  const loc = locParts.join(', ');

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>My Profile</Text>
            <Text style={s.subtitle}>Manage your account and health</Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              {unread > 0 && (
                <View style={s.notifBadge}>
                  <Text style={s.notifBadgeTxt}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn}>
              <Ionicons name="settings-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* ── Profile card ── */}
            <View style={s.profileCard}>
              {/* Avatar row */}
              <View style={s.avatarRow}>
                <View style={s.avatarWrap}>
                  <View style={s.avatar}>
                    <Text style={s.avatarTxt}>
                      {displayName?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={s.cameraBtn}
                    onPress={() => navigation.navigate('EditProfile', { profile })}
                  >
                    <Ionicons name="camera" size={13} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Name + info */}
                <View style={s.profileInfo}>
                  <View style={s.nameRow}>
                    <Text style={s.profileName} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginLeft: 4 }} />
                  </View>
                  {profile?.email && (
                    <View style={s.infoRow}>
                      <Ionicons name="mail-outline" size={13} color={colors.textMuted} />
                      <Text style={s.infoTxt} numberOfLines={1}>{profile.email}</Text>
                    </View>
                  )}
                  <View style={s.infoRow}>
                    <Ionicons name="call-outline" size={13} color={colors.textMuted} />
                    <Text style={s.infoTxt}>{profile?.mobile || '—'}</Text>
                  </View>
                  {loc && (
                    <View style={s.infoRow}>
                      <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                      <Text style={s.infoTxt} numberOfLines={1}>{loc}</Text>
                    </View>
                  )}
                </View>

                {/* Edit button */}
                <TouchableOpacity
                  style={s.editBtn}
                  onPress={() => navigation.navigate('EditProfile', { profile })}
                >
                  <Ionicons name="create-outline" size={14} color={colors.primary} />
                  <Text style={s.editBtnTxt}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Quick links ── */}
            <View style={s.quickCard}>
              {QUICK_LINKS.map((q) => (
                <TouchableOpacity
                  key={q.label}
                  style={s.quickItem}
                  onPress={() => navigation.navigate(q.nav)}
                  activeOpacity={0.75}
                >
                  <View style={[s.quickIcon, { backgroundColor: q.bg }]}>
                    <Ionicons name={q.icon} size={22} color={q.color} />
                  </View>
                  <Text style={s.quickLabel}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Menu list ── */}
            <View style={s.menuCard}>
              {MENU.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[s.menuItem, i < MENU.length - 1 && s.menuBorder]}
                  onPress={() => handleMenu(item.action)}
                  activeOpacity={0.7}
                >
                  <View style={[s.menuIcon, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}

              {/* Logout row */}
              <TouchableOpacity
                style={s.menuItem}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View style={[s.menuIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                </View>
                <Text style={[s.menuLabel, { color: colors.danger }]}>Logout</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>

            <Text style={s.version}>PulseMate v1.0.0</Text>
            <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#F0F4FF' },
  scroll:        { paddingBottom: 20 },

  // Header
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  title:         { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle:      { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  headerRight:   { flexDirection: 'row', gap: 8 },
  iconBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  notifBadge:    { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  notifBadgeTxt: { fontSize: 9, fontWeight: '800', color: '#fff' },

  // Profile card
  profileCard:   { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: radius.xl, padding: 16, marginBottom: 12, ...shadow.sm },
  avatarRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  avatarWrap:    { position: 'relative' },
  avatar:        { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#EFF6FF' },
  avatarTxt:     { fontSize: 28, fontWeight: '800', color: '#fff' },
  cameraBtn:     { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  profileInfo:   { flex: 1 },
  nameRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  profileName:   { fontSize: 16, fontWeight: '800', color: colors.text, flex: 1 },
  infoRow:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  infoTxt:       { fontSize: 12, color: colors.textMuted, flex: 1 },
  editBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  editBtnTxt:    { fontSize: 12, fontWeight: '700', color: colors.primary },

  // Stats (removed)

  // Quick links
  quickCard:     { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: radius.xl, padding: 16, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, ...shadow.sm },
  quickItem:     { alignItems: 'center', flex: 1 },
  quickIcon:     { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickLabel:    { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center', lineHeight: 15 },

  // Menu
  menuCard:      { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: radius.xl, overflow: 'hidden', marginBottom: 12, ...shadow.sm },
  menuItem:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 15 },
  menuBorder:    { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon:      { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel:     { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },

  version:       { textAlign: 'center', fontSize: 12, color: colors.textMuted, marginTop: 4 },
});
