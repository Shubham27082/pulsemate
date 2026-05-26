import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDoctorProfile } from '../api/patient';
import Card from '../components/Card';
import { colors } from '../theme';

export default function DoctorDetailScreen({ route, navigation }) {
  const { doctorId } = route.params;
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoctorProfile(doctorId)
      .then((r) => setDoctor(r.data.data.doctor))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [doctorId]);

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  if (!doctor) return (
    <SafeAreaView style={s.safe}>
      <Text style={{ textAlign: 'center', marginTop: 60, color: colors.textMuted }}>Doctor not found</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>

        {/* Doctor card */}
        <Card style={s.heroCard}>
          <View style={s.heroRow}>
            <View style={s.bigAvatar}>
              <Text style={s.bigAvatarText}>{doctor.user?.name?.charAt(0) || 'D'}</Text>
            </View>
            <View style={s.heroInfo}>
              <Text style={s.heroName}>{doctor.user?.name}</Text>
              <Text style={s.heroSpec}>{doctor.specialization}</Text>
              <Text style={s.heroExp}>{doctor.experienceYears} years experience</Text>
            </View>
          </View>
          {doctor.bio && <Text style={s.bio}>{doctor.bio}</Text>}
          {doctor.education && (
            <View style={s.eduRow}>
              <Ionicons name="school-outline" size={14} color={colors.textMuted} />
              <Text style={s.eduText}>{doctor.education}</Text>
            </View>
          )}
        </Card>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statVal}>₹{doctor.consultationFee || 0}</Text>
            <Text style={s.statLabel}>Consultation Fee</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statVal}>{doctor.avgConsultationMins || 10} min</Text>
            <Text style={s.statLabel}>Avg. Time</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statVal, { color: doctor.offlineAvailable ? colors.secondary : colors.textMuted }]}>
              {doctor.offlineAvailable ? '✓' : '✗'}
            </Text>
            <Text style={s.statLabel}>In-Clinic</Text>
          </View>
        </View>

        {/* Clinics */}
        {doctor.doctorClinics?.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Available At</Text>
            {doctor.doctorClinics.map((dc) => (
              <Card key={dc.id}>
                <View style={s.clinicRow}>
                  <Ionicons name="business-outline" size={20} color={colors.primary} />
                  <View style={s.clinicInfo}>
                    <Text style={s.clinicName}>{dc.clinic?.name}</Text>
                    <Text style={s.clinicCity}>{dc.clinic?.city}</Text>
                    {dc.availableDays?.length > 0 && (
                      <Text style={s.clinicDays}>{dc.availableDays.join(', ')}</Text>
                    )}
                    {dc.startTime && (
                      <Text style={s.clinicTime}>{dc.startTime} – {dc.endTime}</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={s.bookBtn}
                  onPress={() => navigation.navigate('Booking', {
                    doctorId: doctor.id,
                    clinicId: dc.clinic?.id,
                    doctorName: doctor.user?.name,
                    clinicName: dc.clinic?.name,
                    fee: dc.consultationFee || doctor.consultationFee,
                  })}
                >
                  <Ionicons name="calendar-outline" size={16} color="#fff" />
                  <Text style={s.bookBtnText}>Book Appointment</Text>
                </TouchableOpacity>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.bg },
  content:       { padding: 20, paddingBottom: 40 },
  back:          { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText:      { fontSize: 15, color: colors.text, fontWeight: '500' },
  heroCard:      { marginBottom: 12 },
  heroRow:       { flexDirection: 'row', gap: 14, marginBottom: 12 },
  bigAvatar:     { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  bigAvatarText: { fontSize: 26, fontWeight: '700', color: colors.primary },
  heroInfo:      { flex: 1, justifyContent: 'center' },
  heroName:      { fontSize: 18, fontWeight: '800', color: colors.text },
  heroSpec:      { fontSize: 14, color: colors.primary, fontWeight: '600', marginTop: 2 },
  heroExp:       { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  bio:           { fontSize: 13, color: colors.textMuted, lineHeight: 20, marginBottom: 10 },
  eduRow:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eduText:       { fontSize: 12, color: colors.textMuted, flex: 1 },
  statsRow:      { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox:       { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statVal:       { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 4 },
  statLabel:     { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
  clinicRow:     { flexDirection: 'row', gap: 12, marginBottom: 12 },
  clinicInfo:    { flex: 1 },
  clinicName:    { fontSize: 15, fontWeight: '700', color: colors.text },
  clinicCity:    { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  clinicDays:    { fontSize: 12, color: colors.primary, marginTop: 4 },
  clinicTime:    { fontSize: 12, color: colors.textMuted },
  bookBtn:       { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bookBtnText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
});
