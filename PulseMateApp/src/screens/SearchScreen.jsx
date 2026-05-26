import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchDoctors } from '../api/patient';
import { colors, shadow, radius } from '../theme';

const SPECS = [
  { label: 'All\nSpecialities', icon: 'medical',         key: 'All'               },
  { label: 'General\nPhysician', icon: 'person',         key: 'General Physician' },
  { label: 'Cardiologist',       icon: 'heart',          key: 'Cardiologist'      },
  { label: 'Dermatologist',      icon: 'color-palette',  key: 'Dermatologist'     },
  { label: 'Orthopedic',         icon: 'body',           key: 'Orthopedic'        },
  { label: 'Pediatrician',       icon: 'happy',          key: 'Pediatrician'      },
  { label: 'Neurologist',        icon: 'pulse',          key: 'Neurologist'       },
  { label: 'ENT',                icon: 'ear',            key: 'ENT'               },
];

// Accent color per specialization
const SPEC_COLOR = {
  'All':               colors.primary,
  'General Physician': '#6366F1',
  'Cardiologist':      '#EF4444',
  'Dermatologist':     '#F59E0B',
  'Orthopedic':        '#10B981',
  'Pediatrician':      '#EC4899',
  'Neurologist':       '#8B5CF6',
  'ENT':               '#06B6D4',
};

export default function SearchScreen({ navigation }) {
  const [query, setQuery]   = useState('');
  const [spec, setSpec]     = useState('All');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (overrideSpec, overrideQuery) => {
    setLoading(true);
    try {
      const params = {};
      const q = overrideQuery !== undefined ? overrideQuery : query.trim();
      if (q) params.search = q;
      const activeSpec = overrideSpec ?? spec;
      if (activeSpec !== 'All') params.specialization = activeSpec;
      const res = await searchDoctors(params);
      setDoctors(res.data.data?.doctors || res.data.data || []);
    } catch { setDoctors([]); }
    finally { setLoading(false); }
  }, [query, spec]);

  // Load all on mount
  useEffect(() => { search('All', ''); }, []);

  const handleSpec = (key) => {
    setSpec(key);
    search(key, query);
  };

  const accentColor = (doc) => {
    const s = doc.specialization || 'General Physician';
    return SPEC_COLOR[s] || colors.primary;
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={s.headerText}>
          <Text style={s.headerTitle}>Find a Doctor</Text>
          <Text style={s.headerSub}>Book appointments with trusted doctors</Text>
        </View>
        <TouchableOpacity style={s.filterBtn}>
          <Ionicons name="filter-outline" size={16} color={colors.primary} />
          <Text style={s.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search bar ── */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search doctor, clinic, specialty..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => search()}
            returnKeyType="search"
            placeholderTextColor={colors.textMuted}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); search('All', ''); }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={s.searchBtn} onPress={() => search()}>
          <Text style={s.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* ── Specialization chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
      >
        {SPECS.map((item) => {
          const active = spec === item.key;
          const color  = SPEC_COLOR[item.key] || colors.primary;
          return (
            <TouchableOpacity
              key={item.key}
              style={[s.chip, active && { backgroundColor: color, borderColor: color }]}
              onPress={() => handleSpec(item.key)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={active ? '#fff' : color}
                style={s.chipIcon}
              />
              <Text style={[s.chipText, active && s.chipTextActive]} numberOfLines={2}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={[s.chip, s.moreChip]}>
          <Ionicons name="grid-outline" size={18} color={colors.textMuted} />
          <Text style={[s.chipText, { color: colors.textMuted }]}>{'More\n'}</Text>
          <Ionicons name="chevron-down" size={12} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>

      {/* ── List header ── */}
      <View style={s.listHeader}>
        <View>
          <Text style={s.listTitle}>Top Doctors</Text>
          <Text style={s.listSub}>Trusted by thousands of patients</Text>
        </View>
        <TouchableOpacity style={s.sortBtn}>
          <Text style={s.sortText}>Sort by </Text>
          <Text style={s.sortVal}>Popularity</Text>
          <Ionicons name="chevron-down" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Doctor list ── */}
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={s.loadingText}>Finding doctors...</Text>
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(d) => d.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>🔍</Text>
              <Text style={s.emptyTitle}>No doctors found</Text>
              <Text style={s.emptySub}>Try a different name or specialization</Text>
            </View>
          }
          renderItem={({ item: doc }) => {
            const accent = accentColor(doc);
            const clinic = doc.doctorClinics?.[0]?.clinic;
            return (
              <View style={s.card}>
                {/* Top row */}
                <View style={s.cardTop}>
                  {/* Avatar */}
                  <View style={[s.avatar, { backgroundColor: accent + '18' }]}>
                    <Text style={[s.avatarText, { color: accent }]}>
                      {doc.user?.name?.charAt(0)?.toUpperCase() || 'D'}
                    </Text>
                    {/* Available dot */}
                    <View style={s.availDot} />
                  </View>

                  {/* Info */}
                  <View style={s.cardInfo}>
                    <View style={s.nameRow}>
                      <Text style={s.docName} numberOfLines={1}>
                        Dr. {doc.user?.name}
                      </Text>
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
                    </View>
                    <Text style={[s.specText, { color: accent }]}>
                      {doc.specialization || 'General Physician'}
                    </Text>
                    <View style={s.metaRow}>
                      <Ionicons name="briefcase-outline" size={12} color={colors.textMuted} />
                      <Text style={s.metaText}>{doc.experienceYears || 0} yrs Exp.</Text>
                      {doc.offlineAvailable && (
                        <>
                          <Text style={s.metaDot}>·</Text>
                          <Ionicons name="business-outline" size={12} color={colors.textMuted} />
                          <Text style={s.metaText}>In-clinic</Text>
                        </>
                      )}
                      {doc.onlineAvailable && (
                        <>
                          <Text style={s.metaDot}>·</Text>
                          <Ionicons name="videocam-outline" size={12} color={colors.textMuted} />
                          <Text style={s.metaText}>Online</Text>
                        </>
                      )}
                    </View>
                    {clinic && (
                      <View style={s.locationRow}>
                        <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                        <Text style={s.locationText} numberOfLines={1}>
                          {clinic.name}{clinic.city ? `, ${clinic.city}` : ''}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Fee + heart */}
                  <View style={s.feeCol}>
                    <Text style={[s.feeVal, { color: accent }]}>
                      ₹{doc.consultationFee || 0}
                    </Text>
                    <Text style={s.feeLabel}>Consultation Fee</Text>
                    <TouchableOpacity style={s.heartBtn}>
                      <Ionicons name="heart-outline" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Available + stats */}
                <View style={s.statsRow}>
                  <View style={s.availBadge}>
                    <View style={s.availDotInline} />
                    <Text style={s.availText}>Available Today</Text>
                  </View>
                  <View style={s.divider} />
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <Text style={s.ratingText}>4.8</Text>
                  <Text style={s.reviewText}>(32 reviews)</Text>
                  <View style={s.divider} />
                  <Ionicons name="people-outline" size={13} color={colors.textMuted} />
                  <Text style={s.patientsText}>120+ Patients</Text>
                </View>

                {/* Action buttons */}
                <View style={s.btnRow}>
                  <TouchableOpacity
                    style={s.viewBtn}
                    onPress={() => navigation.navigate('DoctorDetail', { doctorId: doc.id })}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="person-outline" size={15} color={accent} />
                    <Text style={[s.viewBtnText, { color: accent }]}>View Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.bookBtn, { backgroundColor: accent }]}
                    onPress={() => navigation.navigate('DoctorDetail', { doctorId: doc.id })}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="calendar-outline" size={15} color="#fff" />
                    <Text style={s.bookBtnText}>Book Appointment</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#F0F4FF' },

  // Header
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 10 },
  backBtn:       { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  headerText:    { flex: 1 },
  headerTitle:   { fontSize: 20, fontWeight: '800', color: colors.text },
  headerSub:     { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  filterBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  filterText:    { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // Search
  searchRow:     { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 14 },
  searchBox:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: 14, borderWidth: 1.5, borderColor: colors.border },
  searchInput:   { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 13 },
  searchBtn:     { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 20, justifyContent: 'center', ...shadow.sm },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Chips
  chips:         { paddingHorizontal: 16, gap: 8, paddingBottom: 14, alignItems: 'flex-start' },
  chip:          { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.lg, backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.border, minWidth: 72, gap: 4 },
  chipIcon:      {},
  chipText:      { fontSize: 11, color: colors.textSecondary, fontWeight: '600', textAlign: 'center', lineHeight: 15 },
  chipTextActive:{ color: '#fff' },
  moreChip:      { flexDirection: 'row', gap: 2 },

  // List header
  listHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  listTitle:     { fontSize: 17, fontWeight: '800', color: colors.text },
  listSub:       { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sortBtn:       { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sortText:      { fontSize: 12, color: colors.textMuted },
  sortVal:       { fontSize: 12, color: colors.primary, fontWeight: '700' },

  // Loading / empty
  loadingWrap:   { flex: 1, alignItems: 'center', paddingTop: 60, gap: 12 },
  loadingText:   { fontSize: 14, color: colors.textMuted },
  list:          { paddingHorizontal: 16, paddingBottom: 40 },
  empty:         { alignItems: 'center', paddingTop: 60 },
  emptyEmoji:    { fontSize: 48, marginBottom: 12 },
  emptyTitle:    { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptySub:      { fontSize: 13, color: colors.textMuted },

  // Doctor card
  card:          { backgroundColor: '#fff', borderRadius: radius.xl, padding: 16, marginBottom: 14, ...shadow.sm },
  cardTop:       { flexDirection: 'row', gap: 12, marginBottom: 12 },

  // Avatar
  avatar:        { width: 80, height: 90, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText:    { fontSize: 32, fontWeight: '800' },
  availDot:      { position: 'absolute', bottom: 6, left: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#fff' },

  // Card info
  cardInfo:      { flex: 1 },
  nameRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  docName:       { fontSize: 15, fontWeight: '800', color: colors.text, flex: 1 },
  specText:      { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  metaRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4, flexWrap: 'wrap' },
  metaText:      { fontSize: 11, color: colors.textMuted },
  metaDot:       { fontSize: 11, color: colors.textMuted },
  locationRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locationText:  { fontSize: 11, color: colors.textMuted, flex: 1 },

  // Fee
  feeCol:        { alignItems: 'flex-end', justifyContent: 'flex-start', gap: 2 },
  feeVal:        { fontSize: 20, fontWeight: '900' },
  feeLabel:      { fontSize: 10, color: colors.textMuted, textAlign: 'right' },
  heartBtn:      { marginTop: 8 },

  // Stats row
  statsRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, marginBottom: 12 },
  availBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  availDotInline:{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
  availText:     { fontSize: 11, color: '#10B981', fontWeight: '600' },
  divider:       { width: 1, height: 14, backgroundColor: colors.border, marginHorizontal: 2 },
  ratingText:    { fontSize: 12, fontWeight: '700', color: colors.text },
  reviewText:    { fontSize: 11, color: colors.textMuted },
  patientsText:  { fontSize: 11, color: colors.textMuted },

  // Buttons
  btnRow:        { flexDirection: 'row', gap: 10 },
  viewBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: '#fff' },
  viewBtnText:   { fontSize: 13, fontWeight: '700' },
  bookBtn:       { flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: radius.md },
  bookBtnText:   { color: '#fff', fontSize: 13, fontWeight: '700' },
});
