import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMyPrescriptions } from '../api/patient';
import Card from '../components/Card';
import { colors } from '../theme';

export default function PrescriptionsScreen({ navigation }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await getMyPrescriptions();
      // API returns { prescriptions, total } inside data
      setPrescriptions(res.data.data?.prescriptions || res.data.data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>My Prescriptions</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={(p) => p.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>💊</Text>
              <Text style={s.emptyTitle}>No prescriptions yet</Text>
              <Text style={s.emptySub}>Prescriptions from completed appointments will appear here</Text>
            </View>
          }
          renderItem={({ item: rx }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('PrescriptionDetail', { id: rx.id })}
              activeOpacity={0.8}
            >
              <Card>
                <View style={s.rxRow}>
                  <View style={s.rxIcon}>
                    <Ionicons name="medical" size={22} color={colors.primary} />
                  </View>
                  <View style={s.rxInfo}>
                    <Text style={s.rxDoctor}>{rx.doctor?.user?.name}</Text>
                    <Text style={s.rxClinic}>{rx.appointment?.clinic?.name}</Text>
                    <Text style={s.rxDate}>
                      {new Date(rx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>

                {rx.diagnosis && (
                  <View style={s.diagBox}>
                    <Text style={s.diagLabel}>Diagnosis</Text>
                    <Text style={s.diagText}>{rx.diagnosis}</Text>
                  </View>
                )}

                <View style={s.rxFooter}>
                  <View style={s.medCount}>
                    <Ionicons name="list-outline" size={13} color={colors.primary} />
                    <Text style={s.medCountText}>{rx.medicines?.length || 0} medicine{rx.medicines?.length !== 1 ? 's' : ''}</Text>
                  </View>
                  {rx.requiresFollowUp && (
                    <View style={s.followBadge}>
                      <Ionicons name="calendar-outline" size={12} color="#EA580C" />
                      <Text style={s.followBadgeText}>Follow-up</Text>
                    </View>
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.bg },
  header:        { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title:         { fontSize: 22, fontWeight: '800', color: colors.text },
  list:          { paddingHorizontal: 20, paddingBottom: 40 },
  rxRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  rxIcon:        { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  rxInfo:        { flex: 1 },
  rxDoctor:      { fontSize: 15, fontWeight: '700', color: colors.text },
  rxClinic:      { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rxDate:        { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  diagBox:       { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, marginBottom: 10 },
  diagLabel:     { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 3 },
  diagText:      { fontSize: 13, color: colors.text },
  rxFooter:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  medCount:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  medCountText:  { fontSize: 12, color: colors.primary, fontWeight: '600' },
  followBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  followBadgeText:{ fontSize: 11, color: '#EA580C', fontWeight: '600' },
  empty:         { alignItems: 'center', paddingTop: 60 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyTitle:    { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptySub:      { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 20 },
});
