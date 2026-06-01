// ─────────────────────────────────────────────────────────────────────────────
//  SearchScreen — PulseMate Connect  |  Premium Doctor Search
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView,
  Animated, Easing, Dimensions, StatusBar, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchDoctors } from '../api/patient';
import { colors, shadow, radius } from '../theme';

const { width: W } = Dimensions.get('window');

// ── Brand tokens ──────────────────────────────────────────────────────────────
const SKY5  = '#0EA5E9'; const SKY6  = '#0284C7'; const SKY7 = '#0369A1';
const TEAL  = '#2DD4BF'; const WHITE = '#FFFFFF';
const SLATE = '#0F172A'; const MUTED = '#94A3B8'; const BG = '#F0F7FF';

// ── Specialization config ─────────────────────────────────────────────────────
const SPECS = [
  { key: 'All',              label: 'All',           icon: 'apps',          color: SKY5,     bg: '#E0F2FE' },
  { key: 'General Physician',label: 'General',       icon: 'medkit',        color: '#6366F1', bg: '#EEF2FF' },
  { key: 'Cardiologist',     label: 'Cardiology',    icon: 'heart',         color: '#EF4444', bg: '#FEE2E2' },
  { key: 'Dermatologist',    label: 'Dermatology',   icon: 'color-palette', color: '#F59E0B', bg: '#FEF3C7' },
  { key: 'Orthopedic',       label: 'Orthopedic',    icon: 'body',          color: '#10B981', bg: '#D1FAE5' },
  { key: 'Pediatrician',     label: 'Pediatrics',    icon: 'happy',         color: '#EC4899', bg: '#FCE7F3' },
  { key: 'Neurologist',      label: 'Neurology',     icon: 'pulse',         color: '#8B5CF6', bg: '#EDE9FE' },
  { key: 'Physiotherapy',    label: 'Physio',        icon: 'fitness',       color: '#0EA5E9', bg: '#E0F2FE' },
  { key: 'Dental',           label: 'Dental',        icon: 'happy-outline', color: '#14B8A6', bg: '#CCFBF1' },
  { key: 'ENT',              label: 'ENT',           icon: 'ear',           color: '#06B6D4', bg: '#CFFAFE' },
];

const CITIES = ['All Cities', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'];
const AVAIL  = ['Any', 'Available Today', 'Online Only', 'In-Clinic Only'];
const SORT   = ['Relevance', 'Experience', 'Fee: Low to High', 'Fee: High to Low', 'Rating'];

// ── Filter bottom sheet ───────────────────────────────────────────────────────
function FilterSheet({ visible, onClose, city, setCity, avail, setAvail, sort, setSort, onApply }) {
  const slideA = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.spring(slideA, {
      toValue: visible ? 0 : 300,
      friction: 8, tension: 80, useNativeDriver: true,
    }).start();
  }, [visible]);

  const Section = ({ title, options, value, onChange }) => (
    <View style={fs.section}>
      <Text style={fs.sectionTitle}>{title}</Text>
      <View style={fs.optionRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[fs.optionChip, value === opt && fs.optionChipActive]}
            onPress={() => onChange(opt)}
            activeOpacity={0.8}
          >
            <Text style={[fs.optionText, value === opt && fs.optionTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (!visible) return null;
  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={fs.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[fs.sheet, { transform: [{ translateY: slideA }] }]}>
        <View style={fs.handle} />
        <View style={fs.sheetHeader}>
          <Text style={fs.sheetTitle}>Filters</Text>
          <TouchableOpacity onPress={() => { setCity('All Cities'); setAvail('Any'); setSort('Relevance'); }} activeOpacity={0.7}>
            <Text style={fs.resetText}>Reset all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Section title="City" options={CITIES} value={city} onChange={setCity} />
          <Section title="Availability" options={AVAIL} value={avail} onChange={setAvail} />
          <Section title="Sort by" options={SORT} value={sort} onChange={setSort} />
        </ScrollView>
        <TouchableOpacity style={fs.applyBtn} onPress={onApply} activeOpacity={0.88}>
          <Ionicons name="checkmark-circle" size={18} color={WHITE} />
          <Text style={fs.applyText}>Apply Filters</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const fs = StyleSheet.create({
  backdrop:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:         { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: WHITE, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingBottom: 36, maxHeight: '80%' },
  handle:        { width: 44, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 10, marginBottom: 16 },
  sheetHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle:    { fontSize: 20, fontWeight: '800', color: SLATE },
  resetText:     { fontSize: 13, color: SKY5, fontWeight: '700' },
  section:       { marginBottom: 22 },
  sectionTitle:  { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  optionRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: WHITE },
  optionChipActive: { borderColor: SKY5, backgroundColor: '#EFF6FF' },
  optionText:    { fontSize: 13, color: '#475569', fontWeight: '600' },
  optionTextActive: { color: SKY6, fontWeight: '700' },
  applyBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: SKY5, borderRadius: 16, paddingVertical: 16, marginTop: 8, shadowColor: SKY5, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
  applyText:     { fontSize: 16, fontWeight: '800', color: WHITE },
});

// ── Doctor card ───────────────────────────────────────────────────────────────
function DoctorCard({ doc, onViewProfile, onBook, index }) {
  const enterA = useRef(new Animated.Value(0)).current;
  const slideA = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(enterA, { toValue: 1, duration: 400, delay: index * 80, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideA, { toValue: 0, duration: 400, delay: index * 80, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const spec   = doc.specialization || 'General Physician';
  const cfg    = SPECS.find((s) => s.key === spec) || SPECS[1];
  const accent = cfg.color;
  const accentBg = cfg.bg;
  const clinic = doc.doctorClinics?.[0]?.clinic;
  const initial = doc.user?.name?.charAt(0)?.toUpperCase() || 'D';
  const fee    = doc.consultationFee ? `₹${doc.consultationFee}` : 'Free';
  const langs  = doc.languagesKnown?.slice(0, 3).join(', ') || 'English';
  const qual   = doc.qualification || 'MBBS';
  const exp    = doc.experienceYears || 0;
  const isOnline  = doc.onlineAvailable;
  const isOffline = doc.offlineAvailable;

  return (
    <Animated.View style={[dc.wrap, { opacity: enterA, transform: [{ translateY: slideA }] }]}>
      {/* Top accent strip */}
      <View style={[dc.topStrip, { backgroundColor: accent }]} />

      <View style={dc.body}>
        {/* ── Left: avatar column ── */}
        <View style={dc.avatarCol}>
          <View style={[dc.avatarRing, { borderColor: accent + '40' }]}>
            <View style={[dc.avatar, { backgroundColor: accentBg }]}>
              <Text style={[dc.avatarInitial, { color: accent }]}>{initial}</Text>
            </View>
            {/* Online indicator */}
            <View style={dc.onlineDot} />
          </View>
          {/* Verified badge */}
          <View style={dc.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={13} color={SKY5} />
            <Text style={dc.verifiedText}>Verified</Text>
          </View>
        </View>

        {/* ── Right: info column ── */}
        <View style={dc.infoCol}>
          {/* Name + heart */}
          <View style={dc.nameRow}>
            <Text style={dc.name} numberOfLines={1}>Dr. {doc.user?.name}</Text>
            <TouchableOpacity style={dc.heartBtn} activeOpacity={0.7}>
              <Ionicons name="heart-outline" size={18} color={MUTED} />
            </TouchableOpacity>
          </View>

          {/* Specialization badge */}
          <View style={[dc.specBadge, { backgroundColor: accentBg }]}>
            <Ionicons name={cfg.icon} size={11} color={accent} />
            <Text style={[dc.specText, { color: accent }]}>{spec}</Text>
          </View>

          {/* Qualification + experience */}
          <View style={dc.metaRow}>
            <View style={dc.metaItem}>
              <Ionicons name="school-outline" size={12} color={MUTED} />
              <Text style={dc.metaText}>{qual}</Text>
            </View>
            <View style={dc.metaDivider} />
            <View style={dc.metaItem}>
              <Ionicons name="briefcase-outline" size={12} color={MUTED} />
              <Text style={dc.metaText}>{exp} yrs exp</Text>
            </View>
          </View>

          {/* Languages */}
          <View style={dc.metaRow}>
            <Ionicons name="chatbubble-ellipses-outline" size={12} color={MUTED} />
            <Text style={dc.metaText} numberOfLines={1}>{langs}</Text>
          </View>

          {/* Clinic location */}
          {clinic && (
            <View style={dc.metaRow}>
              <Ionicons name="location-outline" size={12} color={MUTED} />
              <Text style={dc.metaText} numberOfLines={1}>
                {clinic.name}{clinic.city ? `, ${clinic.city}` : ''}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Stats bar ── */}
      <View style={dc.statsBar}>
        {/* Rating */}
        <View style={dc.statItem}>
          <Ionicons name="star" size={13} color="#F59E0B" />
          <Text style={dc.statVal}>4.8</Text>
          <Text style={dc.statLabel}>(120+)</Text>
        </View>
        <View style={dc.statSep} />
        {/* Patients */}
        <View style={dc.statItem}>
          <Ionicons name="people-outline" size={13} color={MUTED} />
          <Text style={dc.statVal}>500+</Text>
          <Text style={dc.statLabel}>Patients</Text>
        </View>
        <View style={dc.statSep} />
        {/* Consult modes */}
        <View style={dc.statItem}>
          {isOnline  && <Ionicons name="videocam-outline"  size={13} color={SKY5} />}
          {isOffline && <Ionicons name="business-outline"  size={13} color={SKY6} />}
          <Text style={dc.statVal}>{isOnline && isOffline ? 'Both' : isOnline ? 'Online' : 'Clinic'}</Text>
        </View>
        <View style={dc.statSep} />
        {/* Fee */}
        <View style={dc.statItem}>
          <Text style={[dc.feeVal, { color: accent }]}>{fee}</Text>
          <Text style={dc.statLabel}>Consult</Text>
        </View>
      </View>

      {/* ── Available badge + actions ── */}
      <View style={dc.footer}>
        <View style={dc.availBadge}>
          <View style={dc.availDot} />
          <Text style={dc.availText}>Available Today</Text>
        </View>
        <View style={dc.btnRow}>
          <TouchableOpacity style={dc.profileBtn} onPress={onViewProfile} activeOpacity={0.8}>
            <Text style={[dc.profileBtnText, { color: accent }]}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[dc.bookBtn, { backgroundColor: accent, shadowColor: accent }]} onPress={onBook} activeOpacity={0.88}>
            <Ionicons name="calendar" size={14} color={WHITE} />
            <Text style={dc.bookBtnText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Main SearchScreen ─────────────────────────────────────────────────────────
export default function SearchScreen({ navigation }) {
  const [query,   setQuery]   = useState('');
  const [spec,    setSpec]    = useState('All');
  const [city,    setCity]    = useState('All Cities');
  const [avail,   setAvail]   = useState('Any');
  const [sort,    setSort]    = useState('Relevance');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const activeFilters = [
    city  !== 'All Cities' && city,
    avail !== 'Any'        && avail,
    sort  !== 'Relevance'  && sort,
  ].filter(Boolean).length;

  const buildParams = useCallback((overrides = {}) => {
    const q = overrides.query ?? query.trim();
    const s = overrides.spec  ?? spec;
    const c = overrides.city  ?? city;
    const a = overrides.avail ?? avail;
    const params = {};
    if (q) params.name = q;
    if (s !== 'All') params.specialization = s;
    if (c !== 'All Cities') params.city = c;
    if (a === 'Available Today') params.available = 'true';
    if (a === 'Online Only')     params.available = 'true';
    return params;
  }, [query, spec, city, avail]);

  const doSearch = useCallback(async (overrides = {}) => {
    setLoading(true);
    try {
      const res = await searchDoctors(buildParams(overrides));
      let data = res.data.data?.doctors || res.data.data || [];
      // Client-side sort
      const s = overrides.sort ?? sort;
      if (s === 'Experience')          data = [...data].sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0));
      if (s === 'Fee: Low to High')    data = [...data].sort((a, b) => (a.consultationFee || 0) - (b.consultationFee || 0));
      if (s === 'Fee: High to Low')    data = [...data].sort((a, b) => (b.consultationFee || 0) - (a.consultationFee || 0));
      setDoctors(data);
    } catch { setDoctors([]); }
    finally { setLoading(false); }
  }, [buildParams, sort]);

  useEffect(() => { doSearch({ spec: 'All', query: '' }); }, []);

  const handleSpec = (key) => { setSpec(key); doSearch({ spec: key }); };
  const handleApplyFilter = () => { setShowFilter(false); doSearch({ city, avail, sort }); };

  return (
    <SafeAreaView style={ss.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* ── Header ── */}
      <View style={ss.header}>
        <TouchableOpacity style={ss.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={SLATE} />
        </TouchableOpacity>
        <View>
          <Text style={ss.headerTitle}>Find a Doctor</Text>
          <Text style={ss.headerSub}>Book with trusted specialists</Text>
        </View>
        <TouchableOpacity
          style={[ss.filterIconBtn, activeFilters > 0 && ss.filterIconBtnActive]}
          onPress={() => setShowFilter(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={18} color={activeFilters > 0 ? WHITE : SKY6} />
          {activeFilters > 0 && (
            <View style={ss.filterBadge}>
              <Text style={ss.filterBadgeText}>{activeFilters}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Search bar ── */}
      <View style={[ss.searchWrap, focused && ss.searchWrapFocused]}>
        <Ionicons name="search-outline" size={18} color={focused ? SKY5 : MUTED} />
        <TextInput
          ref={inputRef}
          style={ss.searchInput}
          placeholder="Search doctor, speciality, clinic..."
          placeholderTextColor={MUTED}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={() => doSearch()}
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <TouchableOpacity onPress={() => { setQuery(''); doSearch({ query: '' }); }} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={18} color={MUTED} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={ss.micBtn} activeOpacity={0.7}>
            <Ionicons name="mic-outline" size={16} color={SKY6} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Active filter chips ── */}
      {activeFilters > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ss.activeFiltersRow}>
          {city !== 'All Cities' && (
            <TouchableOpacity style={ss.activeChip} onPress={() => { setCity('All Cities'); doSearch({ city: 'All Cities' }); }} activeOpacity={0.8}>
              <Ionicons name="location-outline" size={12} color={SKY6} />
              <Text style={ss.activeChipText}>{city}</Text>
              <Ionicons name="close" size={12} color={SKY6} />
            </TouchableOpacity>
          )}
          {avail !== 'Any' && (
            <TouchableOpacity style={ss.activeChip} onPress={() => { setAvail('Any'); doSearch({ avail: 'Any' }); }} activeOpacity={0.8}>
              <Ionicons name="time-outline" size={12} color={SKY6} />
              <Text style={ss.activeChipText}>{avail}</Text>
              <Ionicons name="close" size={12} color={SKY6} />
            </TouchableOpacity>
          )}
          {sort !== 'Relevance' && (
            <TouchableOpacity style={ss.activeChip} onPress={() => { setSort('Relevance'); doSearch({ sort: 'Relevance' }); }} activeOpacity={0.8}>
              <Ionicons name="swap-vertical-outline" size={12} color={SKY6} />
              <Text style={ss.activeChipText}>{sort}</Text>
              <Ionicons name="close" size={12} color={SKY6} />
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* ── Specialization chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={ss.specRow}
        style={ss.specScroll}
      >
        {SPECS.map((item) => {
          const active = spec === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[ss.specChip, active && { backgroundColor: item.color, borderColor: item.color }]}
              onPress={() => handleSpec(item.key)}
              activeOpacity={0.8}
            >
              <View style={[ss.specChipIcon, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : item.bg }]}>
                <Ionicons name={item.icon} size={14} color={active ? WHITE : item.color} />
              </View>
              <Text style={[ss.specChipText, active && ss.specChipTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Results header ── */}
      <View style={ss.resultsHeader}>
        <View>
          <Text style={ss.resultsCount}>
            {loading ? 'Searching...' : `${doctors.length} Doctor${doctors.length !== 1 ? 's' : ''} Found`}
          </Text>
          {spec !== 'All' && <Text style={ss.resultsSpec}>{spec}</Text>}
        </View>
        <TouchableOpacity style={ss.sortBtn} onPress={() => setShowFilter(true)} activeOpacity={0.8}>
          <Ionicons name="swap-vertical-outline" size={14} color={SKY6} />
          <Text style={ss.sortText}>{sort}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Doctor list ── */}
      {loading ? (
        <View style={ss.loadingWrap}>
          <ActivityIndicator color={SKY5} size="large" />
          <Text style={ss.loadingText}>Finding the best doctors...</Text>
          <Text style={ss.loadingSub}>Please wait a moment</Text>
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(d) => d.id}
          contentContainerStyle={ss.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={ss.emptyWrap}>
              <View style={ss.emptyIconWrap}>
                <Ionicons name="search-outline" size={36} color={SKY5} />
              </View>
              <Text style={ss.emptyTitle}>No doctors found</Text>
              <Text style={ss.emptySub}>Try a different name, speciality or city</Text>
              <TouchableOpacity style={ss.emptyBtn} onPress={() => { setQuery(''); setSpec('All'); doSearch({ spec: 'All', query: '' }); }} activeOpacity={0.85}>
                <Text style={ss.emptyBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item: doc, index }) => (
            <DoctorCard
              doc={doc}
              index={index}
              onViewProfile={() => navigation.navigate('DoctorDetail', { doctorId: doc.id })}
              onBook={() => navigation.navigate('DoctorDetail', { doctorId: doc.id })}
            />
          )}
        />
      )}

      {/* ── Filter sheet ── */}
      <FilterSheet
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        city={city}   setCity={setCity}
        avail={avail} setAvail={setAvail}
        sort={sort}   setSort={setSort}
        onApply={handleApplyFilter}
      />
    </SafeAreaView>
  );
}

// ── Doctor card styles ────────────────────────────────────────────────────────
const dc = StyleSheet.create({
  wrap: {
    backgroundColor: WHITE, borderRadius: 20, marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
  },
  topStrip:      { height: 4 },
  body:          { flexDirection: 'row', padding: 16, gap: 14 },

  // Avatar
  avatarCol:     { alignItems: 'center', gap: 6 },
  avatarRing:    { width: 76, height: 76, borderRadius: 38, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  avatar:        { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 28, fontWeight: '800' },
  onlineDot:     { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2.5, borderColor: WHITE },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  verifiedText:  { fontSize: 9, fontWeight: '700', color: SKY6 },

  // Info
  infoCol:       { flex: 1, gap: 5 },
  nameRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name:          { fontSize: 15, fontWeight: '800', color: SLATE, flex: 1, letterSpacing: -0.2 },
  heartBtn:      { padding: 2 },
  specBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  specText:      { fontSize: 11, fontWeight: '700' },
  metaRow:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaItem:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:      { fontSize: 11, color: '#64748B' },
  metaDivider:   { width: 1, height: 12, backgroundColor: '#E2E8F0' },

  // Stats bar
  statsBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFBFF',
  },
  statItem:  { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
  statVal:   { fontSize: 12, fontWeight: '700', color: SLATE },
  statLabel: { fontSize: 10, color: MUTED },
  statSep:   { width: 1, height: 20, backgroundColor: '#E2E8F0' },
  feeVal:    { fontSize: 14, fontWeight: '800' },

  // Footer
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  availBadge:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  availDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  availText:   { fontSize: 12, fontWeight: '700', color: '#10B981' },
  btnRow:      { flexDirection: 'row', gap: 8 },
  profileBtn:  { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0' },
  profileBtnText: { fontSize: 12, fontWeight: '700' },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  bookBtnText: { fontSize: 12, fontWeight: '800', color: WHITE },
});

// ── Screen styles ─────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: SLATE, letterSpacing: -0.4 },
  headerSub:   { fontSize: 12, color: MUTED, marginTop: 1 },
  filterIconBtn: {
    marginLeft: 'auto', width: 38, height: 38, borderRadius: 19,
    backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  filterIconBtnActive: { backgroundColor: SKY5 },
  filterBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: BG,
  },
  filterBadgeText: { fontSize: 9, fontWeight: '800', color: WHITE },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 18, marginBottom: 12,
    backgroundColor: WHITE, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 13,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  searchWrapFocused: { borderColor: SKY5, shadowColor: SKY5, shadowOpacity: 0.2 },
  searchInput: { flex: 1, fontSize: 14, color: SLATE, paddingVertical: 0 },
  micBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },

  // Active filter chips
  activeFiltersRow: { paddingHorizontal: 18, gap: 8, marginBottom: 10 },
  activeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EFF6FF', borderRadius: 10, borderWidth: 1, borderColor: '#BFDBFE',
    paddingHorizontal: 10, paddingVertical: 6,
  },
  activeChipText: { fontSize: 12, fontWeight: '600', color: SKY6 },

  // Spec chips
  specScroll: { height: 52, flexGrow: 0 },
  specRow: {
    paddingHorizontal: 18,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 0,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 0,
    height: 36,
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  specChipIcon:       { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  specChipText:       { fontSize: 12, fontWeight: '600', color: '#475569' },
  specChipTextActive: { color: WHITE, fontWeight: '700' },

  // Results header
  resultsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, marginTop: 14, marginBottom: 12,
  },
  resultsCount: { fontSize: 15, fontWeight: '800', color: SLATE },
  resultsSpec:  { fontSize: 12, color: MUTED, marginTop: 2 },
  sortBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: WHITE, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: '#E2E8F0' },
  sortText:     { fontSize: 12, fontWeight: '700', color: SKY6 },

  // List
  list: { paddingHorizontal: 18, paddingBottom: 40 },

  // Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  loadingText: { fontSize: 15, fontWeight: '700', color: SLATE },
  loadingSub:  { fontSize: 13, color: MUTED },

  // Empty
  emptyWrap:    { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIconWrap:{ width: 72, height: 72, borderRadius: 22, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:   { fontSize: 17, fontWeight: '800', color: SLATE },
  emptySub:     { fontSize: 13, color: MUTED, textAlign: 'center' },
  emptyBtn:     { marginTop: 8, backgroundColor: SKY5, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: WHITE },
});
