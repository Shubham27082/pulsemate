import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAppointmentDetail, cancelAppointment } from '../api/patient';
import StatusBadge from '../components/StatusBadge';
import Card from '../components/Card';
import { colors } from '../theme';

export default function AppointmentDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [appt, setAppt]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAppointmentDetail(id)
      .then((r) => setAppt(r.data.data.appointment))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = () => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try {
          await cancelAppointment(id);
          navigation.goBack();
        } catch (err) {
          Alert.alert('Error', err.response?.data?.message || 'Failed to cancel');
        }
      }},
    ]);
  };

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  if (!appt) return (
    <SafeAreaView style={s.safe}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textMuted }}>Appointment not found</Text>
    </SafeAreaView>
  );

  const isPaid = appt.payment?.status === 'PAID';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={s.backText}>Appointment Details</Text>
        </TouchableOpacity>

        {/* Status banner */}
        <Card style={s.statusCard}>
          <View style={s.statusRow}>
            <Text style={s.statusLabel}>Status</Text>
            <StatusBadge status={appt.status} />
          </View>
          {appt.queueNumber && (
            <View style={s.queueBadge}>
              <Text style={s.queueText}>Queue #{appt.queueNumber}</Text>
            </View>
          )}
        </Card>

        {/* Doctor */}
        <Card>
          <Text style={s.sectionTitle}>Doctor</Text>
          <View style={s.docRow}>
            <View style={s.docAvatar}>
              <Text style={s.docAvatarText}>{appt.doctor?.user?.name?.charAt(0) || 'D'}</Text>
            </View>
            <View style={s.docInfo}>
              <Text style={s.docName}>{appt.doctor?.user?.name}</Text>
              <Text style={s.docSpec}>{appt.doctor?.specialization}</Text>
            </View>
          </View>
        </Card>

        {/* Clinic */}
        <Card>
          <Text style={s.sectionTitle}>Clinic</Text>
          <View style={s.infoRow}>
            <Ionicons name="business-outline" size={16} color={colors.textMuted} />
            <Text style={s.infoText}>{appt.clinic?.name}</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="location-outline" size={16} color={colors.textMuted} />
            <Text style={s.infoText}>{appt.clinic?.address}, {appt.clinic?.city}</Text>
          </View>
        </Card>

        {/* Appointment info */}
        <Card>
          <Text style={s.sectionTitle}>Details</Text>
          <View style={s.grid}>
            <InfoItem label="Date"  value={new Date(appt.appointmentDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
            <InfoItem label="Type"  value={appt.appointmentType === 'OFFLINE' ? 'In-Clinic' : 'Online'} />
            {appt.slotTime && <InfoItem label="Time" value={appt.slotTime} />}
            {appt.estimatedWaitMinutes && <InfoItem label="Est. Wait" value={`${appt.estimatedWaitMinutes} min`} />}
          </View>
          {appt.symptoms && (
            <View style={s.symptomsBox}>
              <Text style={s.symptomsLabel}>Symptoms</Text>
              <Text style={s.symptomsText}>{appt.symptoms}</Text>
            </View>
          )}
          {appt.notes && (
            <View style={[s.symptomsBox, { backgroundColor: '#F0FDF4' }]}>
              <Text style={[s.symptomsLabel, { color: '#166534' }]}>Doctor's Notes</Text>
              <Text style={[s.symptomsText, { color: '#166534' }]}>{appt.notes}</Text>
            </View>
          )}
        </Card>

        {/* Payment */}
        <Card>
          <Text style={s.sectionTitle}>Payment</Text>
          <View style={s.payRow}>
            <Text style={s.payLabel}>Booking Fee</Text>
            <Text style={s.payVal}>₹{appt.payment?.amount || 10}</Text>
          </View>
          <View style={s.payRow}>
            <Text style={s.payLabel}>Status</Text>
            <View style={[s.payStatus, { backgroundColor: isPaid ? '#D1FAE5' : '#FEF3C7' }]}>
              <Text style={[s.payStatusText, { color: isPaid ? '#065F46' : '#92400E' }]}>
                {isPaid ? '✓ Paid' : 'Pending'}
              </Text>
            </View>
          </View>
          {appt.payment?.method && (
            <View style={s.payRow}>
              <Text style={s.payLabel}>Method</Text>
              <Text style={s.payVal}>{appt.payment.method}</Text>
            </View>
          )}
        </Card>

        {/* Follow-up */}
        {appt.prescription?.followUpDate && (
          <Card style={{ backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA' }}>
            <View style={s.followRow}>
              <Ionicons name="calendar-outline" size={18} color="#EA580C" />
              <View>
                <Text style={s.followTitle}>Follow-up Required</Text>
                <Text style={s.followDate}>
                  {new Date(appt.prescription.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Actions */}
        <View style={s.actions}>
          {['IN_QUEUE','BOOKED','CHECKED_IN'].includes(appt.status) && (
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={() => navigation.navigate('LiveQueue', { appointmentId: appt.id })}
            >
              <Ionicons name="radio-outline" size={18} color="#fff" />
              <Text style={s.primaryBtnText}>Track Live Queue</Text>
            </TouchableOpacity>
          )}
          {appt.prescription?.id && (
            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: '#7C3AED' }]}
              onPress={() => navigation.navigate('AppointmentsTab', {
                screen: 'AppointmentDetail', params: { id: appt.id },
              })}
            >
              <Ionicons name="medical-outline" size={18} color="#fff" />
              <Text style={s.primaryBtnText}>View Prescription</Text>
            </TouchableOpacity>
          )}
          {['BOOKED','IN_QUEUE'].includes(appt.status) && (
            <TouchableOpacity style={s.dangerBtn} onPress={handleCancel}>
              <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
              <Text style={s.dangerBtnText}>Cancel Appointment</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoItem = ({ label, value }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 }}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  content:      { padding: 20, paddingBottom: 40 },
  back:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  backText:     { fontSize: 18, fontWeight: '700', color: colors.text },
  statusCard:   { backgroundColor: colors.primaryLight },
  statusRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusLabel:  { fontSize: 14, fontWeight: '600', color: colors.text },
  queueBadge:   { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  queueText:    { color: '#fff', fontWeight: '800', fontSize: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  docRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docAvatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  docAvatarText:{ fontSize: 18, fontWeight: '700', color: colors.primary },
  docInfo:      { flex: 1 },
  docName:      { fontSize: 15, fontWeight: '700', color: colors.text },
  docSpec:      { fontSize: 13, color: colors.primary, marginTop: 2 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText:     { fontSize: 14, color: colors.text, flex: 1 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  symptomsBox:  { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginTop: 8 },
  symptomsLabel:{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  symptomsText: { fontSize: 13, color: colors.text, lineHeight: 20 },
  payRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  payLabel:     { fontSize: 13, color: colors.textMuted },
  payVal:       { fontSize: 14, fontWeight: '600', color: colors.text },
  payStatus:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  payStatusText:{ fontSize: 12, fontWeight: '700' },
  followRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  followTitle:  { fontSize: 14, fontWeight: '700', color: '#EA580C' },
  followDate:   { fontSize: 13, color: '#C2410C', marginTop: 2 },
  actions:      { gap: 10, marginTop: 4 },
  primaryBtn:   { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnText:{ color: '#fff', fontWeight: '700', fontSize: 15 },
  dangerBtn:    { borderWidth: 1.5, borderColor: colors.danger, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dangerBtnText:{ color: colors.danger, fontWeight: '700', fontSize: 15 },
});
