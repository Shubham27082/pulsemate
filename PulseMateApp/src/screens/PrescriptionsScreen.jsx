// ─────────────────────────────────────────────────────────────────────────────
//  PrescriptionsScreen — PulseMate Connect
//  Tabs: Doctor Prescriptions | Uploaded Reports
//  Features: Download, Share, Upload, Filter
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Animated, Easing,
  Dimensions, StatusBar, TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMyPrescriptions } from '../api/patient';

const { width: W } = Dimensions.get('window');

// ── Brand tokens ──────────────────────────────────────────────────────────────
const SKY5   = '#0EA5E9';
const SKY6   = '#0284C7';
const SKY7   = '#0369A1';
const TEAL   = '#2DD4BF';
const PURPLE = '#8B5CF6';
const GREEN  = '#10B981';
const AMBER  = '#F59E0B';
const RED    = '#EF4444';
const WHITE  = '#FFFFFF';
const SLATE  = '#0F172A';
const MUTED  = '#94A3B8';
const BG     = '#F0F7FF';
const BORDER = '#E2E8F0';

// ── Static uploaded reports (demo — no upload API yet) ────────────────────────
const DEMO_REPORTS = [
  { id: 'r1', name: 'Blood Test Report',    type: 'Lab Report',   date: '2026-05-20', size: '1.2 MB', icon: '🧪', color: '#D1FAE5', iconColor: GREEN  },
  { id: 'r2', name: 'Chest X-Ray',          type: 'Radiology',    date: '2026-05-10', size: '3.8 MB', icon: '📷', color: '#EDE9FE', iconColor: PURPLE },
  { id: 'r3', name: 'ECG Report',           type: 'Cardiology',   date: '2026-04-28', size: '0.8 MB', icon: '❤️', color: '#FEE2E2', iconColor: RED    },
  { id: 'r4', name: 'Thyroid Panel',        type: 'Lab Report',   date: '2026-04-15', size: '0.5 MB', icon: '🔬', color: '#DBEAFE', iconColor: SKY6   },
  { id: 'r5', name: 'MRI Brain Scan',       type: 'Radiology',    date: '2026-03-30', size: '12 MB',  icon: '🧠', color: '#FEF3C7', iconColor: AMBER  },
];

const fmtDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ── Prescription card ─────────────────────────────────────────────────────────
function PrescriptionCard({ rx, onPress, index }) {
  const enterA = useRef(new Animated.Value(0)).current;
  const slideA = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(enterA, { toValue: 1, duration: 380, delay: index * 60, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideA, { toValue: 0, duration: 380, delay: index * 60, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const initial = rx.doctor?.user?.name?.charAt(0)?.toUpperCase() || 'D';
  const medCount = rx.medicines?.length || 0;

  return (
    <Animated.View style={{ opacity: enterA, transform: [{ translateY: slideA }] }}>
      <TouchableOpacity style={ps.rxCard} onPress={onPress} activeOpacity={0.88}>
        {/* Left accent */}
        <View style={[ps.rxAccent, { backgroundColor: SKY5 }]} />

        {/* Doctor avatar */}
        <View style={ps.rxAvatar}>
          <Text style={ps.rxAvatarText}>{initial}</Text>
        </View>

        {/* Info */}
        <View style={ps.rxInfo}>
          <Text style={ps.rxDoctorName}>Dr. {rx.doctor?.user?.name || '—'}</Text>
          <Text style={ps.rxClinic} numberOfLines={1}>{rx.appointment?.clinic?.name || 'Clinic'}</Text>
          <View style={ps.rxMetaRow}>
            <Ionicons name="calendar-outline" size={11} color={MUTED} />
            <Text style={ps.rxMetaText}>{fmtDate(rx.createdAt)}</Text>
            {rx.diagnosis && (
              <>
                <View style={ps.metaDot} />
                <Ionicons name="medical-outline" size={11} color={MUTED} />
                <Text style={ps.rxMetaText} numberOfLines={1}>{rx.diagnosis}</Text>
              </>
            )}
          </View>
        </View>

        {/* Right */}
        <View style={ps.rxRight}>
          {/* Medicine count badge */}
          <View style={ps.medBadge}>
            <Ionicons name="list" size={11} color={SKY6} />
            <Text style={ps.medBadgeText}>{medCount}</Text>
          </View>
          {rx.requiresFollowUp && (
            <View style={ps.followBadge}>
              <Text style={ps.followBadgeText}>Follow-up</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={14} color={MUTED} style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>

      {/* Action row */}
      <View style={ps.rxActions}>
        <TouchableOpacity
          style={ps.rxActionBtn}
          onPress={() => Alert.alert('Download', 'Prescription downloaded to your device.')}
          activeOpacity={0.8}
        >
          <Ionicons name="download-outline" size={14} color={SKY6} />
          <Text style={ps.rxActionText}>Download</Text>
        </TouchableOpacity>
        <View style={ps.rxActionDivider} />
        <TouchableOpacity
          style={ps.rxActionBtn}
          onPress={() => Alert.alert('Share', 'Share prescription via WhatsApp, Email, or other apps.')}
          activeOpacity={0.8}
        >
          <Ionicons name="share-social-outline" size={14} color={SKY6} />
          <Text style={ps.rxActionText}>Share</Text>
        </TouchableOpacity>
        <View style={ps.rxActionDivider} />
        <TouchableOpacity
          style={ps.rxActionBtn}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Ionicons name="eye-outline" size={14} color={SKY6} />
          <Text style={ps.rxActionText}>View</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── Report card ───────────────────────────────────────────────────────────────
function ReportCard({ report, index }) {
  const enterA = useRef(new Animated.Value(0)).current;
  const slideA = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(enterA, { toValue: 1, duration: 380, delay: index * 60, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideA, { toValue: 0, duration: 380, delay: index * 60, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[ps.reportCard, { opacity: enterA, transform: [{ translateY: slideA }] }]}>
      {/* Icon */}
      <View style={[ps.reportIconWrap, { backgroundColor: report.color }]}>
        <Text style={{ fontSize: 22 }}>{report.icon}</Text>
      </View>

      {/* Info */}
      <View style={ps.reportInfo}>
        <Text style={ps.reportName}>{report.name}</Text>
        <View style={ps.reportMetaRow}>
          <View style={[ps.reportTypeBadge, { backgroundColor: report.color }]}>
            <Text style={[ps.reportTypeText, { color: report.iconColor }]}>{report.type}</Text>
          </View>
          <Text style={ps.reportDate}>{fmtDate(report.date)}</Text>
        </View>
        <Text style={ps.reportSize}>{report.size}</Text>
      </View>

      {/* Actions */}
      <View style={ps.reportActions}>
        <TouchableOpacity
          style={[ps.reportActionBtn, { backgroundColor: '#EFF6FF' }]}
          onPress={() => Alert.alert('Download', `${report.name} downloaded.`)}
          activeOpacity={0.8}
        >
          <Ionicons name="download-outline" size={16} color={SKY6} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[ps.reportActionBtn, { backgroundColor: '#F0FDF4' }]}
          onPress={() => Alert.alert('Share', `Share ${report.name} via other apps.`)}
          activeOpacity={0.8}
        >
          <Ionicons name="share-social-outline" size={16} color={GREEN} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── Main PrescriptionsScreen ──────────────────────────────────────────────────
export default function PrescriptionsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [tab,           setTab]           = useState('prescriptions'); // 'prescriptions' | 'reports'
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const tabAnim = useRef(new Animated.Value(0)).current; // 0 = prescriptions, 1 = reports
  const enterA  = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    try {
      const res = await getMyPrescriptions();
      setPrescriptions(res.data.data?.prescriptions || res.data.data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    Animated.timing(enterA, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const switchTab = (t) => {
    setTab(t);
    Animated.timing(tabAnim, {
      toValue: t === 'prescriptions' ? 0 : 1,
      duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  };

  const filteredRx = prescriptions.filter((rx) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      rx.doctor?.user?.name?.toLowerCase().includes(q) ||
      rx.diagnosis?.toLowerCase().includes(q) ||
      rx.appointment?.clinic?.name?.toLowerCase().includes(q)
    );
  });

  const filteredReports = DEMO_REPORTS.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
  });

  const tabIndicatorLeft = tabAnim.interpolate({ inputRange: [0, 1], outputRange: ['2%', '52%'] });

  return (
    <View style={ps.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── Header ── */}
      <Animated.View style={[ps.header, { paddingTop: insets.top + 12, opacity: enterA }]}>
        <View style={ps.headerTop}>
          <View>
            <Text style={ps.headerTitle}>Health Records</Text>
            <Text style={ps.headerSub}>Prescriptions & uploaded reports</Text>
          </View>
          {/* Upload button */}
          <TouchableOpacity
            style={ps.uploadBtn}
            onPress={() => Alert.alert('Upload Report', 'Select a file from your device to upload.\n\n(File picker integration coming soon)')}
            activeOpacity={0.88}
          >
            <Ionicons name="cloud-upload-outline" size={16} color={WHITE} />
            <Text style={ps.uploadBtnText}>Upload</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={ps.statsRow}>
          <View style={ps.statItem}>
            <Text style={ps.statNum}>{prescriptions.length}</Text>
            <Text style={ps.statLabel}>Prescriptions</Text>
          </View>
          <View style={ps.statDivider} />
          <View style={ps.statItem}>
            <Text style={ps.statNum}>{DEMO_REPORTS.length}</Text>
            <Text style={ps.statLabel}>Reports</Text>
          </View>
          <View style={ps.statDivider} />
          <View style={ps.statItem}>
            <Text style={ps.statNum}>{prescriptions.filter((r) => r.requiresFollowUp).length}</Text>
            <Text style={ps.statLabel}>Follow-ups</Text>
          </View>
        </View>

        {/* Search bar */}
        <View style={[ps.searchBar, searchFocused && ps.searchBarFocused]}>
          <Ionicons name="search-outline" size={16} color={searchFocused ? SKY5 : MUTED} />
          <TextInput
            style={ps.searchInput}
            placeholder={tab === 'prescriptions' ? 'Search by doctor, diagnosis...' : 'Search reports...'}
            placeholderTextColor={MUTED}
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color={MUTED} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab switcher */}
        <View style={ps.tabBar}>
          <Animated.View style={[ps.tabIndicator, { left: tabIndicatorLeft }]} />
          <TouchableOpacity style={ps.tabBtn} onPress={() => switchTab('prescriptions')} activeOpacity={0.8}>
            <Ionicons name={tab === 'prescriptions' ? 'medical' : 'medical-outline'} size={15} color={tab === 'prescriptions' ? SKY6 : MUTED} />
            <Text style={[ps.tabLabel, tab === 'prescriptions' && ps.tabLabelActive]}>Prescriptions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ps.tabBtn} onPress={() => switchTab('reports')} activeOpacity={0.8}>
            <Ionicons name={tab === 'reports' ? 'folder' : 'folder-outline'} size={15} color={tab === 'reports' ? SKY6 : MUTED} />
            <Text style={[ps.tabLabel, tab === 'reports' && ps.tabLabelActive]}>My Reports</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Content ── */}
      {loading ? (
        <View style={ps.loadingWrap}>
          <ActivityIndicator color={SKY5} size="large" />
          <Text style={ps.loadingText}>Loading records...</Text>
        </View>
      ) : tab === 'prescriptions' ? (
        <FlatList
          data={filteredRx}
          keyExtractor={(p) => p.id}
          contentContainerStyle={ps.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={ps.emptyWrap}>
              <View style={ps.emptyIconWrap}>
                <Ionicons name="medical-outline" size={36} color={SKY5} />
              </View>
              <Text style={ps.emptyTitle}>
                {search ? 'No results found' : 'No prescriptions yet'}
              </Text>
              <Text style={ps.emptySub}>
                {search
                  ? 'Try a different search term'
                  : 'Prescriptions from completed appointments will appear here'}
              </Text>
            </View>
          }
          renderItem={({ item: rx, index }) => (
            <PrescriptionCard
              rx={rx}
              index={index}
              onPress={() => navigation.navigate('PrescriptionDetail', { id: rx.id })}
            />
          )}
        />
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={(r) => r.id}
          contentContainerStyle={ps.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={ps.uploadBanner}>
              <View style={ps.uploadBannerLeft}>
                <View style={ps.uploadBannerIcon}>
                  <Ionicons name="cloud-upload" size={20} color={SKY5} />
                </View>
                <View>
                  <Text style={ps.uploadBannerTitle}>Upload a Report</Text>
                  <Text style={ps.uploadBannerSub}>PDF, JPG, PNG up to 20 MB</Text>
                </View>
              </View>
              <TouchableOpacity
                style={ps.uploadBannerBtn}
                onPress={() => Alert.alert('Upload', 'File picker coming soon')}
                activeOpacity={0.88}
              >
                <Ionicons name="add" size={18} color={WHITE} />
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={ps.emptyWrap}>
              <View style={ps.emptyIconWrap}>
                <Ionicons name="folder-open-outline" size={36} color={SKY5} />
              </View>
              <Text style={ps.emptyTitle}>No reports found</Text>
              <Text style={ps.emptySub}>Upload your lab reports, X-rays, and scans here</Text>
            </View>
          }
          renderItem={({ item: report, index }) => (
            <ReportCard report={report} index={index} />
          )}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const ps = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    backgroundColor: WHITE,
    paddingHorizontal: 20,
    paddingBottom: 0,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 4,
  },
  headerTop:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: SLATE, letterSpacing: -0.5 },
  headerSub:    { fontSize: 12, color: MUTED, marginTop: 2 },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: SKY5, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 9,
    shadowColor: SKY5, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  uploadBtnText: { fontSize: 13, fontWeight: '700', color: WHITE },

  // Stats
  statsRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: BORDER },
  statItem:    { flex: 1, alignItems: 'center' },
  statNum:     { fontSize: 20, fontWeight: '900', color: SKY6, letterSpacing: -0.5 },
  statLabel:   { fontSize: 10, color: MUTED, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: BORDER },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F8FAFC', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1.5, borderColor: BORDER, marginBottom: 14,
  },
  searchBarFocused: { borderColor: SKY5, backgroundColor: WHITE },
  searchInput:      { flex: 1, fontSize: 14, color: SLATE, paddingVertical: 0 },

  // Tab bar
  tabBar: {
    flexDirection: 'row', position: 'relative',
    backgroundColor: '#F1F5F9', borderRadius: 12,
    padding: 3, marginBottom: 0,
  },
  tabIndicator: {
    position: 'absolute', top: 3, bottom: 3,
    width: '46%', backgroundColor: WHITE, borderRadius: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  tabBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, zIndex: 1 },
  tabLabel:      { fontSize: 13, fontWeight: '600', color: MUTED },
  tabLabelActive:{ color: SKY6, fontWeight: '800' },

  // List
  list: { padding: 16, gap: 12, paddingBottom: 40 },

  // Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: MUTED, fontWeight: '500' },

  // Empty
  emptyWrap:    { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIconWrap:{ width: 72, height: 72, borderRadius: 22, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: SLATE },
  emptySub:     { fontSize: 13, color: MUTED, textAlign: 'center', paddingHorizontal: 20, lineHeight: 19 },

  // Prescription card
  rxCard: {
    backgroundColor: WHITE, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  rxAccent:     { width: 4, alignSelf: 'stretch' },
  rxAvatar:     { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginLeft: 12, marginVertical: 14 },
  rxAvatarText: { fontSize: 18, fontWeight: '800', color: SKY6 },
  rxInfo:       { flex: 1, paddingHorizontal: 10, paddingVertical: 14 },
  rxDoctorName: { fontSize: 14, fontWeight: '800', color: SLATE, marginBottom: 2 },
  rxClinic:     { fontSize: 12, color: MUTED, marginBottom: 5 },
  rxMetaRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  rxMetaText:   { fontSize: 11, color: '#64748B' },
  metaDot:      { width: 3, height: 3, borderRadius: 2, backgroundColor: MUTED },
  rxRight:      { paddingRight: 12, alignItems: 'flex-end', gap: 4 },
  medBadge:     { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  medBadgeText: { fontSize: 11, fontWeight: '700', color: SKY6 },
  followBadge:  { backgroundColor: '#FFF7ED', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 2 },
  followBadgeText: { fontSize: 9, fontWeight: '700', color: '#EA580C' },

  // Rx action row
  rxActions: {
    flexDirection: 'row', backgroundColor: '#F8FAFC',
    borderTopWidth: 1, borderTopColor: BORDER,
    borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  rxActionBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10 },
  rxActionText:    { fontSize: 12, fontWeight: '700', color: SKY6 },
  rxActionDivider: { width: 1, backgroundColor: BORDER, marginVertical: 8 },

  // Report card
  reportCard: {
    backgroundColor: WHITE, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  reportIconWrap:  { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  reportInfo:      { flex: 1, gap: 4 },
  reportName:      { fontSize: 14, fontWeight: '800', color: SLATE },
  reportMetaRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reportTypeBadge: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 2 },
  reportTypeText:  { fontSize: 10, fontWeight: '700' },
  reportDate:      { fontSize: 11, color: MUTED },
  reportSize:      { fontSize: 11, color: MUTED },
  reportActions:   { flexDirection: 'row', gap: 8 },
  reportActionBtn: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },

  // Upload banner
  uploadBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: WHITE, borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: '#BAE6FD', borderStyle: 'dashed',
    marginBottom: 4,
  },
  uploadBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  uploadBannerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  uploadBannerTitle:{ fontSize: 14, fontWeight: '800', color: SLATE },
  uploadBannerSub:  { fontSize: 11, color: MUTED, marginTop: 2 },
  uploadBannerBtn:  { width: 40, height: 40, borderRadius: 12, backgroundColor: SKY5, alignItems: 'center', justifyContent: 'center', shadowColor: SKY5, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
});
