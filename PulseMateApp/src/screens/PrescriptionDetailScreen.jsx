import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getPrescription } from '../api/patient';
import Card from '../components/Card';
import { colors } from '../theme';

export default function PrescriptionDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [rx, setRx]           = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrescription(id)
      .then((r) => setRx(r.data.data.prescription))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  if (!rx) return (
    <SafeAreaView style={s.safe}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textMuted }}>Prescription not found</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={s.backText}>Prescription</Text>
        </TouchableOpacity>

        {/* Header card */}
        <Card style={s.headerCard}>
          <View style={s.headerRow}>
            <View style={s.rxIcon}>
              <Ionicons name="medical" size={24} color={colors.primary} />
            </View>
            <View style={s.headerInfo}>
              <Text style={s.doctorName}>{rx.doctor?.user?.name}</Text>
              <Text style={s.clinicName}>{rx.appointment?.clinic?.name}</Text>
              <Text style={s.rxDate}>
                {new Date(rx.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </View>
        </Card>

        {/* Diagnosis */}
        {rx.diagnosis && (
          <Card>
            <Text style={s.sectionTitle}>Diagnosis</Text>
            <Text style={s.diagText}>{rx.diagnosis}</Text>
          </Card>
        )}

        {/* Medicines */}
        {rx.medicines?.length > 0 && (
          <Card>
            <Text style={s.sectionTitle}>Medicines ({rx.medicines.length})</Text>
            {rx.medicines.map((med, i) => (
              <View key={i} style={[s.medCard, i < rx.medicines.length - 1 && s.medCardBorder]}>
                <View style={s.medHeader}>
                  <View style={s.medNum}>
                    <Text style={s.medNumText}>{i + 1}</Text>
                  </View>
                  <Text style={s.medName}>{med.name}</Text>
                </View>
                <View style={s.medDetails}>
                  {med.dosage && (
                    <View style={s.medTag}>
                      <Ionicons name="flask-outline" size={12} color={colors.primary} />
                      <Text style={s.medTagText}>{med.dosage}</Text>
                    </View>
                  )}
                  {med.frequency && (
                    <View style={s.medTag}>
                      <Ionicons name="time-outline" size={12} color={colors.primary} />
                      <Text style={s.medTagText}>{med.frequency}</Text>
                    </View>
                  )}
                  {med.duration && (
                    <View style={s.medTag}>
                      <Ionicons name="calendar-outline" size={12} color={colors.primary} />
                      <Text style={s.medTagText}>{med.duration}</Text>
                    </View>
                  )}
                </View>
                {med.notes && (
                  <Text style={s.medNotes}>📝 {med.notes}</Text>
                )}
              </View>
            ))}
          </Card>
        )}

        {/* Instructions */}
        {rx.instructions && (
          <Card>
            <Text style={s.sectionTitle}>Instructions</Text>
            <Text style={s.instructText}>{rx.instructions}</Text>
          </Card>
        )}

        {/* Follow-up */}
        {rx.requiresFollowUp && (
          <Card style={{ backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA' }}>
            <View style={s.followRow}>
              <Ionicons name="calendar" size={20} color="#EA580C" />
              <View>
                <Text style={s.followTitle}>Follow-up Required</Text>
                {rx.followUpDate && (
                  <Text style={s.followDate}>
                    {new Date(rx.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* Patient info */}
        <Card style={{ backgroundColor: '#F8FAFC' }}>
          <Text style={s.sectionTitle}>Patient</Text>
          <Text style={s.patientName}>{rx.patient?.name}</Text>
          <Text style={s.patientMobile}>{rx.patient?.mobile}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  content:      { padding: 20, paddingBottom: 40 },
  back:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  backText:     { fontSize: 18, fontWeight: '700', color: colors.text },
  headerCard:   { backgroundColor: colors.primaryLight },
  headerRow:    { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rxIcon:       { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerInfo:   { flex: 1 },
  doctorName:   { fontSize: 16, fontWeight: '800', color: colors.text },
  clinicName:   { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  rxDate:       { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  diagText:     { fontSize: 15, color: colors.text, lineHeight: 22 },
  medCard:      { paddingVertical: 12 },
  medCardBorder:{ borderBottomWidth: 1, borderBottomColor: colors.border },
  medHeader:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  medNum:       { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  medNumText:   { fontSize: 12, fontWeight: '700', color: colors.primary },
  medName:      { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  medDetails:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  medTag:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  medTagText:   { fontSize: 12, color: colors.primary, fontWeight: '500' },
  medNotes:     { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  instructText: { fontSize: 14, color: colors.text, lineHeight: 22 },
  followRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  followTitle:  { fontSize: 14, fontWeight: '700', color: '#EA580C' },
  followDate:   { fontSize: 13, color: '#C2410C', marginTop: 2 },
  patientName:  { fontSize: 15, fontWeight: '700', color: colors.text },
  patientMobile:{ fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
